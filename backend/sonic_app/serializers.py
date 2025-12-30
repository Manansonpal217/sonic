from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import (
    User, Product, Order, CustomizeOrders, AddToCart,
    Banners, CMS, NotificationType, NotificationTable,
    OrderEmails, Session
)


class UserSerializer(serializers.ModelSerializer):
    """User serializer"""
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'first_name', 'last_name',
            'phone_number', 'company_name', 'gst', 'address',
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


class ClientLoginSerializer(serializers.Serializer):
    """Client login serializer"""
    user_email = serializers.EmailField(required=True)
    user_password = serializers.CharField(write_only=True, required=True)
    remember_me = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        email = attrs.get('user_email')
        password = attrs.get('user_password')
        
        if email and password:
            from django.contrib.auth import authenticate
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # Try to authenticate with email as username first
            user = authenticate(username=email, password=password)
            
            # If that fails, try to find user by email and authenticate with username
            if not user:
                try:
                    user_obj = User.objects.get(email=email)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass
            
            if not user:
                raise serializers.ValidationError({"user_email": "Invalid email or password."})
            if not user.is_active:
                raise serializers.ValidationError({"user_email": "User account is disabled."})
            attrs['user'] = user
        return attrs


class ClientRegistrationSerializer(serializers.Serializer):
    """Client registration serializer that accepts frontend field names"""
    user_name = serializers.CharField(required=True, max_length=255)
    user_email = serializers.EmailField(required=True)
    user_phone_number = serializers.CharField(required=False, max_length=20, allow_blank=True)
    user_company_name = serializers.CharField(required=False, max_length=255, allow_blank=True)
    user_gst = serializers.CharField(required=False, max_length=50, allow_blank=True)
    user_address = serializers.CharField(required=False, allow_blank=True)
    user_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['user_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"user_password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        # Map frontend field names to model fields
        password = validated_data.pop('user_password')
        validated_data.pop('confirm_password')
        
        # Extract user_name and split into first_name and last_name
        user_name = validated_data.pop('user_name', '')
        name_parts = user_name.strip().split(' ', 1)
        first_name = name_parts[0] if name_parts else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        # Get email before popping
        user_email = validated_data.pop('user_email')
        
        # Map frontend fields to model fields
        user_data = {
            'username': user_email,  # Use email as username
            'email': user_email,
            'first_name': first_name,
            'last_name': last_name,
            'phone_number': validated_data.pop('user_phone_number', None) or None,
            'company_name': validated_data.pop('user_company_name', None) or None,
            'gst': validated_data.pop('user_gst', None) or None,
            'address': validated_data.pop('user_address', None) or None,
        }
        
        user = User.objects.create_user(password=password, **user_data)
        return user


class ProductSerializer(serializers.ModelSerializer):
    """Product serializer"""
    product_parent_name = serializers.CharField(source='product_parent_id.product_name', read_only=True)
    child_products = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'product_name', 'product_description', 'product_price',
            'product_image', 'product_form_response', 'product_is_parent',
            'product_parent_id', 'product_parent_name', 'product_status',
            'created_at', 'updated_at', 'child_products'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_child_products(self, obj):
        if obj.product_is_parent:
            children = Product.objects.filter(product_parent_id=obj, is_delete=False)
            return ProductSerializer(children, many=True).data
        return []


class OrderSerializer(serializers.ModelSerializer):
    """Order serializer"""
    order_user_username = serializers.CharField(source='order_user.username', read_only=True)
    order_product_name = serializers.CharField(source='order_product.product_name', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_user', 'order_user_username', 'order_product',
            'order_product_name', 'order_quantity', 'order_price',
            'order_status', 'order_date', 'order_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


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


class AddToCartSerializer(serializers.ModelSerializer):
    """Add to Cart serializer"""
    cart_user_username = serializers.CharField(source='cart_user.username', read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = AddToCart
        fields = [
            'id', 'cart_user', 'cart_user_username', 'cart_product',
            'cart_quantity', 'cart_status', 'product_image',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_product_image(self, obj):
        """Try to get product image from cart_product field"""
        try:
            # If cart_product is a product ID (numeric string), try to get the product
            if obj.cart_product and obj.cart_product.isdigit():
                from .models import Product
                product = Product.objects.filter(id=int(obj.cart_product), is_delete=False).first()
                if product and product.product_image:
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(product.product_image.url)
                    return product.product_image.url
        except (ValueError, AttributeError):
            pass
        return None


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
