from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class Category(models.Model):
    """Product category model for jewelry types (Necklace, Rings, etc.)"""
    category_name = models.CharField(max_length=255)
    category_description = models.TextField(null=True, blank=True)
    category_image = models.ImageField(upload_to='categories/', null=True, blank=True)
    category_status = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_delete = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sonic_app_category'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['display_order', '-created_at']

    def soft_delete(self):
        """Soft delete the category"""
        self.is_delete = True
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return self.category_name


class User(AbstractUser):
    """Custom User model extending Django's AbstractUser"""
    user_status = models.BooleanField(default=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    company_name = models.CharField(max_length=255, null=True, blank=True)
    gst = models.CharField(max_length=50, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_delete = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sonic_app_users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def soft_delete(self):
        """Soft delete the user"""
        self.is_delete = True
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return self.username


class CategoryField(models.Model):
    """Dynamic field definitions for categories"""
    FIELD_TYPE_CHOICES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('decimal', 'Decimal'),
        ('select', 'Select'),
        ('boolean', 'Boolean'),
        ('textarea', 'Text Area'),
    ]

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='fields'
    )
    field_name = models.CharField(max_length=255)
    field_label = models.CharField(max_length=255)
    field_type = models.CharField(max_length=50, choices=FIELD_TYPE_CHOICES, default='text')
    field_options = models.TextField(null=True, blank=True, help_text='JSON array of options for select type')
    is_required = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    placeholder = models.CharField(max_length=255, null=True, blank=True)
    help_text = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_delete = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sonic_app_category_field'
        verbose_name = 'Category Field'
        verbose_name_plural = 'Category Fields'
        ordering = ['category', 'display_order', 'field_name']
        unique_together = ['category', 'field_name']

    def soft_delete(self):
        """Soft delete the category field"""
        self.is_delete = True
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return f"{self.category.category_name} - {self.field_label}"


class Product(models.Model):
    """Product catalog model"""
    product_name = models.CharField(max_length=255)
    product_description = models.TextField(null=True, blank=True)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    product_image = models.ImageField(upload_to='products/', null=True, blank=True)
    product_form_response = models.CharField(max_length=500, null=True, blank=True)
    product_category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )
    product_is_parent = models.BooleanField(default=False)
    product_parent_id = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='child_products'
    )
    product_status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_delete = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sonic_app_product'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['-created_at']

    def soft_delete(self):
        """Soft delete the product"""
        self.is_delete = True
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return self.product_name


class ProductFieldValue(models.Model):
    """Dynamic field values for products"""
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='field_values'
    )
    category_field = models.ForeignKey(
        CategoryField,
        on_delete=models.CASCADE,
        related_name='values'
    )
    field_value = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sonic_app_product_field_value'
        verbose_name = 'Product Field Value'
        verbose_name_plural = 'Product Field Values'
        unique_together = ['product', 'category_field']

    def __str__(self):
        return f"{self.product.product_name} - {self.category_field.field_label}: {self.field_value}"


class Order(models.Model):
    """Order model"""
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    order_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    order_product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='orders', null=True, blank=True)
    order_quantity = models.IntegerField(default=1)
    order_price = models.DecimalField(max_digits=10, decimal_places=2)
    order_total_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    order_status = models.CharField(max_length=50, choices=ORDER_STATUS_CHOICES, default='pending')
    order_date = models.DateTimeField(null=True, blank=True)
    order_notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_delete = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sonic_app_order'
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        ordering = ['-created_at']

    def soft_delete(self):
        """Soft delete the order"""
        self.is_delete = True
        self.deleted_at = timezone.now()
        self.save()

    def calculate_total_price(self):
        """Calculate total price from order items"""
        total = sum(item.price * item.quantity for item in self.order_items.all())
        return total

    def __str__(self):
        return f"Order #{self.id} - {self.order_user.username}"


class CustomizeOrders(models.Model):
    """Customized order requests model"""
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewing', 'Reviewing'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]

    customize_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customize_orders')
    order_image = models.ImageField(upload_to='customize_orders/', null=True, blank=True)
    order_audio = models.FileField(upload_to='customize_orders/audio/', null=True, blank=True)
    order_date = models.DateTimeField(null=True, blank=True)
    order_description = models.TextField(null=True, blank=True)
    order_status = models.CharField(max_length=50, choices=ORDER_STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_delete = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sonic_app_customizeorders'
        verbose_name = 'Customize Order'
        verbose_name_plural = 'Customize Orders'
        ordering = ['-created_at']

    def soft_delete(self):
        """Soft delete the customize order"""
        self.is_delete = True
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return f"Custom Order #{self.id} - {self.customize_user.username}"


class OrderItem(models.Model):
    """Order items model for multiple products per order"""
    order = models.ForeignKey(
        'Order',
        on_delete=models.CASCADE,
        related_name='order_items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='order_items'
    )
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sonic_app_order_item'
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.order.id} - {self.product.product_name} x{self.quantity}"


class AddToCart(models.Model):
    """Shopping cart model"""
    cart_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    cart_product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='cart_items')
    cart_quantity = models.IntegerField(default=1)
    cart_status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_delete = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sonic_app_addtocart'
        verbose_name = 'Cart Item'
        verbose_name_plural = 'Cart Items'
        ordering = ['-created_at']
        unique_together = ['cart_user', 'cart_product', 'cart_status']

    def soft_delete(self):
        """Soft delete the cart item"""
        self.is_delete = True
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return f"Cart Item #{self.id} - {self.cart_user.username}"


class Banners(models.Model):
    """Promotional banners model"""
    banner_title = models.CharField(max_length=255)
    banner_image = models.ImageField(upload_to='banners/', null=True, blank=True)
    banner_product_id = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='banners'
    )
    banner_status = models.BooleanField(default=True)
    banner_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_delete = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sonic_app_banners'
        verbose_name = 'Banner'
        verbose_name_plural = 'Banners'
        ordering = ['banner_order', '-created_at']

    def soft_delete(self):
        """Soft delete the banner"""
        self.is_delete = True
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return self.banner_title


class CMS(models.Model):
    """Content Management System pages model"""
    cms_title = models.CharField(max_length=255)
    cms_slug = models.SlugField(max_length=255, unique=True)
    cms_content = models.TextField(null=True, blank=True)
    cms_status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_delete = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sonic_app_cms'
        verbose_name = 'CMS Page'
        verbose_name_plural = 'CMS Pages'
        ordering = ['-created_at']

    def soft_delete(self):
        """Soft delete the CMS page"""
        self.is_delete = True
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return self.cms_title


class NotificationType(models.Model):
    """Notification type definitions model"""
    notif_id = models.AutoField(primary_key=True)
    notif_name = models.CharField(max_length=150)
    notif_status = models.BooleanField(default=True)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    is_delete = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sonic_app_notification_type'
        verbose_name = 'Notification Type'
        verbose_name_plural = 'Notification Types'
        ordering = ['notif_name']

    def soft_delete(self):
        """Soft delete the notification type"""
        self.is_delete = True
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return self.notif_name


class NotificationTable(models.Model):
    """User notifications model"""
    notification_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.ForeignKey(
        NotificationType,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_title = models.CharField(max_length=255)
    notification_message = models.TextField(null=True, blank=True)
    notification_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_delete = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sonic_app_notificationtable'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def soft_delete(self):
        """Soft delete the notification"""
        self.is_delete = True
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return f"{self.notification_title} - {self.notification_user.username}"


class OrderEmails(models.Model):
    """Order-related email records model"""
    mail_id = models.AutoField(primary_key=True)
    mail_from = models.EmailField(max_length=254)
    mail_to = models.EmailField(max_length=254)
    mail_subject = models.CharField(max_length=250)
    mail_content = models.CharField(max_length=500)
    mail_user = models.CharField(max_length=255, null=True, blank=True)
    mail_status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_delete = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sonic_app_orderemails'
        verbose_name = 'Order Email'
        verbose_name_plural = 'Order Emails'
        ordering = ['-created_at']

    def soft_delete(self):
        """Soft delete the order email"""
        self.is_delete = True
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return f"{self.mail_subject} - {self.mail_to}"


class Session(models.Model):
    """User session management with FCM tokens model"""
    session_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    fcm_token = models.CharField(max_length=255, null=True, blank=True)
    device_type = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expire_date = models.DateTimeField()

    class Meta:
        db_table = 'sonic_app_session'
        verbose_name = 'Session'
        verbose_name_plural = 'Sessions'
        ordering = ['-created_at']

    def __str__(self):
        return f"Session {self.session_key} - {self.session_user.username}"

