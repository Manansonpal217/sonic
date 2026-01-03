from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import (
    Category, CategoryField, User, Product, ProductFieldValue, Order, OrderItem, CustomizeOrders, AddToCart,
    Banners, CMS, NotificationType, NotificationTable,
    OrderEmails, Session
)


class CategorySerializer(serializers.ModelSerializer):
    """Category serializer for jewelry categories"""
    products_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'category_name', 'category_description', 'category_image',
            'category_status', 'display_order', 'products_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_products_count(self, obj):
        """Get count of active products in this category"""
        return obj.products.filter(is_delete=False, product_status=True).count()

    def to_representation(self, instance):
        """Convert relative image URLs to absolute URLs"""
        representation = super().to_representation(instance)
        if representation.get('category_image'):
            request = self.context.get('request')
            if request:
                representation['category_image'] = request.build_absolute_uri(representation['category_image'])
            else:
                from django.conf import settings
                image_url = representation['category_image']
                if image_url and not image_url.startswith('http'):
                    base_url = getattr(settings, 'BASE_URL', 'http://localhost:8000')
                    representation['category_image'] = f"{base_url.rstrip('/')}{image_url}"
        return representation


class CategoryFieldSerializer(serializers.ModelSerializer):
    """Category field serializer for dynamic fields"""
    category_name = serializers.CharField(source='category.category_name', read_only=True)

    class Meta:
        model = CategoryField
        fields = [
            'id', 'category', 'category_name', 'field_name', 'field_label',
            'field_type', 'field_options', 'is_required', 'display_order',
            'placeholder', 'help_text', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductFieldValueSerializer(serializers.ModelSerializer):
    """Product field value serializer"""
    field_name = serializers.CharField(source='category_field.field_name', read_only=True)
    field_label = serializers.CharField(source='category_field.field_label', read_only=True)
    field_type = serializers.CharField(source='category_field.field_type', read_only=True)

    class Meta:
        model = ProductFieldValue
        fields = [
            'id', 'product', 'category_field', 'field_name', 'field_label',
            'field_type', 'field_value', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """User serializer"""
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'first_name', 'last_name',
            'user_status', 'is_active', 'is_staff', 'is_superuser',
            'date_joined', 'last_login', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'created_at', 'updated_at']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserCreateSerializer(serializers.ModelSerializer):
    """User creation serializer with password"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class ProductSerializer(serializers.ModelSerializer):
    """Product serializer"""
    product_parent_name = serializers.CharField(source='product_parent_id.product_name', read_only=True)
    product_category_name = serializers.CharField(source='product_category.category_name', read_only=True)
    child_products = serializers.SerializerMethodField()
    field_values = ProductFieldValueSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'product_name', 'product_description', 'product_price',
            'product_image', 'product_form_response', 'product_category',
            'product_category_name', 'product_is_parent',
            'product_parent_id', 'product_parent_name', 'product_status',
            'created_at', 'updated_at', 'child_products', 'field_values'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        """Convert relative image URLs to absolute URLs"""
        representation = super().to_representation(instance)
        if representation.get('product_image'):
            request = self.context.get('request')
            if request:
                representation['product_image'] = request.build_absolute_uri(representation['product_image'])
            else:
                # Fallback: construct URL manually if request is not available
                from django.conf import settings
                image_url = representation['product_image']
                if image_url and not image_url.startswith('http'):
                    # Construct absolute URL from relative URL
                    base_url = getattr(settings, 'BASE_URL', 'http://localhost:8000')
                    representation['product_image'] = f"{base_url.rstrip('/')}{image_url}"
        return representation

    def get_child_products(self, obj):
        if obj.product_is_parent:
            children = Product.objects.filter(product_parent_id=obj, is_delete=False)
            return ProductSerializer(children, many=True, context=self.context).data
        return []


class OrderItemSerializer(serializers.ModelSerializer):
    """Order item serializer"""
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_image = serializers.ImageField(source='product.product_image', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'order', 'product', 'product_name', 'product_image',
            'quantity', 'price', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        """Convert relative image URLs to absolute URLs"""
        representation = super().to_representation(instance)
        if representation.get('product_image'):
            request = self.context.get('request')
            if request:
                representation['product_image'] = request.build_absolute_uri(representation['product_image'])
            else:
                from django.conf import settings
                image_url = representation['product_image']
                if image_url and not image_url.startswith('http'):
                    base_url = getattr(settings, 'BASE_URL', 'http://localhost:8000')
                    representation['product_image'] = f"{base_url.rstrip('/')}{image_url}"
        return representation


class OrderSerializer(serializers.ModelSerializer):
    """Order serializer"""
    order_user_username = serializers.CharField(source='order_user.username', read_only=True)
    order_product_name = serializers.CharField(source='order_product.product_name', read_only=True)
    order_items = OrderItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_user', 'order_user_username', 'order_product',
            'order_product_name', 'order_quantity', 'order_price',
            'order_total_price', 'order_status', 'order_date', 'order_notes',
            'order_items', 'items_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_items_count(self, obj):
        """Get count of items in this order"""
        return obj.order_items.count()


class CustomizeOrdersSerializer(serializers.ModelSerializer):
    """Customize Orders serializer"""
    customize_user_username = serializers.CharField(source='customize_user.username', read_only=True)

    class Meta:
        model = CustomizeOrders
        fields = [
            'id', 'customize_user', 'customize_user_username',
            'order_image', 'order_audio', 'order_date',
            'order_description', 'order_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        """Convert relative image URLs to absolute URLs"""
        representation = super().to_representation(instance)
        if representation.get('order_image'):
            request = self.context.get('request')
            if request:
                representation['order_image'] = request.build_absolute_uri(representation['order_image'])
            else:
                from django.conf import settings
                image_url = representation['order_image']
                if image_url and not image_url.startswith('http'):
                    base_url = getattr(settings, 'BASE_URL', 'http://localhost:8000')
                    representation['order_image'] = f"{base_url.rstrip('/')}{image_url}"
        return representation


class AddToCartSerializer(serializers.ModelSerializer):
    """Add to Cart serializer"""
    cart_user_username = serializers.CharField(source='cart_user.username', read_only=True)
    cart_product_name = serializers.CharField(source='cart_product.product_name', read_only=True)
    cart_product_price = serializers.DecimalField(source='cart_product.product_price', max_digits=10, decimal_places=2, read_only=True)
    cart_product_image = serializers.ImageField(source='cart_product.product_image', read_only=True)

    class Meta:
        model = AddToCart
        fields = [
            'id', 'cart_user', 'cart_user_username', 'cart_product',
            'cart_product_name', 'cart_product_price', 'cart_product_image',
            'cart_quantity', 'cart_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        """Convert relative image URLs to absolute URLs"""
        representation = super().to_representation(instance)
        if representation.get('cart_product_image'):
            request = self.context.get('request')
            if request:
                representation['cart_product_image'] = request.build_absolute_uri(representation['cart_product_image'])
            else:
                from django.conf import settings
                image_url = representation['cart_product_image']
                if image_url and not image_url.startswith('http'):
                    base_url = getattr(settings, 'BASE_URL', 'http://localhost:8000')
                    representation['cart_product_image'] = f"{base_url.rstrip('/')}{image_url}"
        return representation


class BannersSerializer(serializers.ModelSerializer):
    """Banners serializer"""
    banner_product_name = serializers.CharField(source='banner_product_id.product_name', read_only=True)

    class Meta:
        model = Banners
        fields = [
            'id', 'banner_title', 'banner_image', 'banner_product_id',
            'banner_product_name', 'banner_status', 'banner_order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        """Convert relative image URLs to absolute URLs"""
        representation = super().to_representation(instance)
        if representation.get('banner_image'):
            request = self.context.get('request')
            if request:
                representation['banner_image'] = request.build_absolute_uri(representation['banner_image'])
            else:
                from django.conf import settings
                image_url = representation['banner_image']
                if image_url and not image_url.startswith('http'):
                    base_url = getattr(settings, 'BASE_URL', 'http://localhost:8000')
                    representation['banner_image'] = f"{base_url.rstrip('/')}{image_url}"
        return representation


class CMSSerializer(serializers.ModelSerializer):
    """CMS serializer"""

    class Meta:
        model = CMS
        fields = [
            'id', 'cms_title', 'cms_slug', 'cms_content',
            'cms_status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotificationTypeSerializer(serializers.ModelSerializer):
    """Notification Type serializer"""

    class Meta:
        model = NotificationType
        fields = [
            'notif_id', 'notif_name', 'notif_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['notif_id', 'created_at', 'updated_at']


class NotificationTableSerializer(serializers.ModelSerializer):
    """Notification Table serializer"""
    notification_user_username = serializers.CharField(source='notification_user.username', read_only=True)
    notification_type_name = serializers.CharField(source='notification_type.notif_name', read_only=True)

    class Meta:
        model = NotificationTable
        fields = [
            'id', 'notification_user', 'notification_user_username',
            'notification_type', 'notification_type_name',
            'notification_title', 'notification_message', 'notification_read',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OrderEmailsSerializer(serializers.ModelSerializer):
    """Order Emails serializer"""

    class Meta:
        model = OrderEmails
        fields = [
            'mail_id', 'mail_from', 'mail_to', 'mail_subject',
            'mail_content', 'mail_user', 'mail_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['mail_id', 'created_at', 'updated_at']


class SessionSerializer(serializers.ModelSerializer):
    """Session serializer"""
    session_user_username = serializers.CharField(source='session_user.username', read_only=True)

    class Meta:
        model = Session
        fields = [
            'id', 'session_user', 'session_user_username', 'session_key',
            'fcm_token', 'device_type', 'created_at', 'updated_at', 'expire_date'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

