from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Category, CategoryField, User, Product, ProductVariant, ProductFieldValue, ProductLead,
    Order, OrderItem, CustomizeOrders, AddToCart,
    Banners, CMS, NotificationType, NotificationTable,
    OrderEmails, Session, OTP
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['category_name', 'category_status', 'display_order', 'created_at']
    list_filter = ['category_status', 'created_at']
    search_fields = ['category_name', 'category_description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['display_order', '-created_at']


@admin.register(CategoryField)
class CategoryFieldAdmin(admin.ModelAdmin):
    list_display = ['field_label', 'category', 'field_type', 'is_required', 'is_variant_dimension', 'variant_order', 'display_order', 'created_at']
    list_filter = ['category', 'field_type', 'is_required', 'is_variant_dimension', 'created_at']
    search_fields = ['field_name', 'field_label']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['category', 'display_order']


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'variant_value_1', 'variant_value_2', 'display_order', 'created_at']
    list_filter = ['product', 'created_at']
    search_fields = ['product__product_name', 'variant_value_1', 'variant_value_2']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['product', 'display_order']


@admin.register(ProductFieldValue)
class ProductFieldValueAdmin(admin.ModelAdmin):
    list_display = ['product', 'category_field', 'field_value', 'created_at']
    list_filter = ['category_field', 'created_at']
    search_fields = ['product__product_name', 'field_value']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'user_status', 'is_active', 'is_approved', 'created_at']
    list_filter = ['user_status', 'is_active', 'is_approved', 'is_staff', 'is_superuser', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone_number']
    readonly_fields = ['created_at', 'updated_at', 'date_joined', 'last_login', 'approved_at', 'approved_by']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'product_category', 'product_price', 'product_status', 'product_is_parent', 'created_at']
    list_filter = ['product_category', 'product_status', 'product_is_parent', 'created_at']
    search_fields = ['product_name', 'product_description']
    readonly_fields = ['created_at', 'updated_at']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['product', 'product_variant']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'order_user', 'order_total_price', 'order_status', 'order_date', 'created_at']
    list_filter = ['order_status', 'created_at', 'order_date']
    search_fields = ['order_user__username', 'order_notes']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'product', 'quantity', 'price', 'created_at']
    list_filter = ['created_at']
    search_fields = ['order__id', 'product__product_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CustomizeOrders)
class CustomizeOrdersAdmin(admin.ModelAdmin):
    list_display = ['id', 'customize_user', 'order_status', 'order_date', 'created_at']
    list_filter = ['order_status', 'created_at']
    search_fields = ['customize_user__username', 'order_description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ProductLead)
class ProductLeadAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'company_name', 'phone_number', 'submitted_by', 'created_at']
    list_filter = ['created_at']
    search_fields = ['company_name', 'phone_number', 'user_name', 'email', 'product__product_name']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['product', 'submitted_by']


@admin.register(AddToCart)
class AddToCartAdmin(admin.ModelAdmin):
    list_display = ['id', 'cart_user', 'cart_product', 'cart_quantity', 'cart_status', 'created_at']
    list_filter = ['cart_status', 'created_at']
    search_fields = ['cart_user__username', 'cart_product__product_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Banners)
class BannersAdmin(admin.ModelAdmin):
    list_display = ['banner_title', 'banner_status', 'banner_order', 'created_at']
    list_filter = ['banner_status', 'created_at']
    search_fields = ['banner_title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CMS)
class CMSAdmin(admin.ModelAdmin):
    list_display = ['cms_title', 'cms_slug', 'cms_status', 'created_at']
    list_filter = ['cms_status', 'created_at']
    search_fields = ['cms_title', 'cms_slug', 'cms_content']
    readonly_fields = ['created_at', 'updated_at']
    prepopulated_fields = {'cms_slug': ('cms_title',)}


@admin.register(NotificationType)
class NotificationTypeAdmin(admin.ModelAdmin):
    list_display = ['notif_name', 'notif_status', 'created_at']
    list_filter = ['notif_status', 'created_at']
    search_fields = ['notif_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(NotificationTable)
class NotificationTableAdmin(admin.ModelAdmin):
    list_display = ['notification_title', 'notification_user', 'notification_type', 'notification_read', 'created_at']
    list_filter = ['notification_read', 'notification_type', 'created_at']
    search_fields = ['notification_title', 'notification_message', 'notification_user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(OrderEmails)
class OrderEmailsAdmin(admin.ModelAdmin):
    list_display = ['mail_subject', 'mail_to', 'mail_from', 'mail_status', 'created_at']
    list_filter = ['mail_status', 'created_at']
    search_fields = ['mail_subject', 'mail_to', 'mail_from']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['session_key', 'session_user', 'device_type', 'expire_date', 'created_at']
    list_filter = ['device_type', 'created_at', 'expire_date']
    search_fields = ['session_key', 'session_user__username', 'fcm_token']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ['phone_number', 'otp_code', 'is_verified', 'attempts', 'expires_at', 'created_at']
    list_filter = ['is_verified', 'created_at', 'expires_at']
    search_fields = ['phone_number', 'otp_code']
    readonly_fields = ['created_at', 'verified_at']

