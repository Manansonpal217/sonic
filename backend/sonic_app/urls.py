from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, CategoryFieldViewSet, UserViewSet, ProductViewSet,
    ProductFieldValueViewSet, OrderViewSet,
    CustomizeOrdersViewSet, AddToCartViewSet, BannersViewSet,
    CMSViewSet, NotificationTypeViewSet, NotificationTableViewSet,
    OrderEmailsViewSet, SessionViewSet, client_login
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
    path('client-login', client_login, name='client-login'),
]

