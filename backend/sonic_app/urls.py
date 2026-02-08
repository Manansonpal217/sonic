from django.urls import path, include
from django.views.decorators.csrf import csrf_exempt
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, CategoryFieldViewSet, UserViewSet, ProductViewSet,
    ProductFieldValueViewSet, OrderViewSet,
    CustomizeOrdersViewSet, AddToCartViewSet, BannersViewSet,
    CMSViewSet, NotificationTypeViewSet, NotificationTableViewSet,
    OrderEmailsViewSet, SessionViewSet, client_login, client_registration,
    send_otp, verify_otp, update_location, health
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'category-fields', CategoryFieldViewSet, basename='category-field')
router.register(r'users', UserViewSet, basename='user')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'product-field-values', ProductFieldValueViewSet, basename='product-field-value')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'customize-orders', CustomizeOrdersViewSet, basename='customize-order')
router.register(r'cart', AddToCartViewSet, basename='cart')
router.register(r'banners', BannersViewSet, basename='banner')
router.register(r'cms', CMSViewSet, basename='cms')
router.register(r'notification-types', NotificationTypeViewSet, basename='notification-type')
router.register(r'notifications', NotificationTableViewSet, basename='notification')
router.register(r'order-emails', OrderEmailsViewSet, basename='order-email')
router.register(r'sessions', SessionViewSet, basename='session')

urlpatterns = [
    path('', include(router.urls)),
    path('health', health, name='health'),
    path('client-login', csrf_exempt(client_login), name='client-login'),
    path('client-registration', csrf_exempt(client_registration), name='client-registration'),
    path('send-otp', csrf_exempt(send_otp), name='send-otp'),
    path('verify-otp', csrf_exempt(verify_otp), name='verify-otp'),
    path('update-location', update_location, name='update-location'),
]

