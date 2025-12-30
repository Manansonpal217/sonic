from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Product, Order, CustomizeOrders, AddToCart,
    Banners, CMS, NotificationType, NotificationTable,
    OrderEmails, Session
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'user_status', 'is_active', 'created_at']
    list_filter = ['user_status', 'is_active', 'is_staff', 'is_superuser', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    readonly_fields = ['created_at', 'updated_at', 'date_joined', 'last_login']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'product_price', 'product_status', 'product_is_parent', 'created_at']
    list_filter = ['product_status', 'product_is_parent', 'created_at']
    search_fields = ['product_name', 'product_description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'order_user', 'order_product', 'order_quantity', 'order_price', 'order_status', 'created_at']
    list_filter = ['order_status', 'created_at']
    search_fields = ['order_user__username', 'order_product__product_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CustomizeOrders)
class CustomizeOrdersAdmin(admin.ModelAdmin):
    list_display = ['id', 'customize_user', 'order_status', 'order_date', 'created_at']
    list_filter = ['order_status', 'created_at']
    search_fields = ['customize_user__username', 'order_description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AddToCart)
class AddToCartAdmin(admin.ModelAdmin):
    list_display = ['id', 'cart_user', 'cart_product', 'cart_quantity', 'cart_status', 'created_at']
    list_filter = ['cart_status', 'created_at']
    search_fields = ['cart_user__username', 'cart_product']
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

