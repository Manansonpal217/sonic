from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import (
    User, Product, Order, CustomizeOrders, AddToCart,
    Banners, CMS, NotificationType, NotificationTable,
    OrderEmails, Session
)
from .serializers import (
    UserSerializer, UserCreateSerializer, ClientRegistrationSerializer,
    ProductSerializer, OrderSerializer, CustomizeOrdersSerializer, AddToCartSerializer,
    BannersSerializer, CMSSerializer, NotificationTypeSerializer,
    NotificationTableSerializer, OrderEmailsSerializer, SessionSerializer
)


@extend_schema_view(
    list=extend_schema(summary="List all users"),
    create=extend_schema(summary="Create a new user"),
    retrieve=extend_schema(summary="Get user details"),
    update=extend_schema(summary="Update user"),
    partial_update=extend_schema(summary="Partially update user"),
    destroy=extend_schema(summary="Delete user"),
)
class UserViewSet(viewsets.ModelViewSet):
    """User ViewSet with CRUD operations"""
    queryset = User.objects.filter(is_delete=False)
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username', 'email']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_status = self.request.query_params.get('user_status', None)
        if user_status is not None:
            queryset = queryset.filter(user_status=user_status.lower() == 'true')
        return queryset

    @extend_schema(
        summary="Soft delete multiple users",
        description="Soft delete multiple users by providing a list of user IDs.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'user_ids': {
                        'type': 'array',
                        'items': {'type': 'integer'},
                        'description': 'List of user IDs to soft delete'
                    }
                }
            }
        },
    )
    @action(detail=False, methods=['delete'])
    def soft_delete(self, request):
        """Soft delete multiple users"""
        user_ids = request.data.get('user_ids', [])
        User.objects.filter(id__in=user_ids).update(
            is_delete=True,
            deleted_at=timezone.now()
        )
        return Response({'message': 'Users soft deleted successfully'}, status=status.HTTP_200_OK)


class ProductViewSet(viewsets.ModelViewSet):
    """Product ViewSet with CRUD operations"""
    queryset = Product.objects.filter(is_delete=False)
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['product_status', 'product_is_parent', 'product_parent_id']
    search_fields = ['product_name', 'product_description']
    ordering_fields = ['created_at', 'product_price', 'product_name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        
        if min_price:
            queryset = queryset.filter(product_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(product_price__lte=max_price)
        
        return queryset

    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """Get child products"""
        product = self.get_object()
        children = Product.objects.filter(product_parent_id=product, is_delete=False)
        serializer = self.get_serializer(children, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['delete'])
    def soft_delete(self, request):
        """Soft delete multiple products"""
        product_ids = request.data.get('product_ids', [])
        Product.objects.filter(id__in=product_ids).update(
            is_delete=True,
            deleted_at=timezone.now()
        )
        return Response({'message': 'Products soft deleted successfully'}, status=status.HTTP_200_OK)


class OrderViewSet(viewsets.ModelViewSet):
    """Order ViewSet with CRUD operations"""
    queryset = Order.objects.filter(is_delete=False)
    serializer_class = OrderSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['order_status', 'order_user', 'order_product']
    ordering_fields = ['created_at', 'order_date', 'order_price']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(order_user_id=user_id)
        return queryset

    @action(detail=False, methods=['delete'])
    def soft_delete(self, request):
        """Soft delete multiple orders"""
        order_ids = request.data.get('order_ids', [])
        Order.objects.filter(id__in=order_ids).update(
            is_delete=True,
            deleted_at=timezone.now()
        )
        return Response({'message': 'Orders soft deleted successfully'}, status=status.HTTP_200_OK)


class CustomizeOrdersViewSet(viewsets.ModelViewSet):
    """Customize Orders ViewSet with CRUD operations"""
    queryset = CustomizeOrders.objects.filter(is_delete=False)
    serializer_class = CustomizeOrdersSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['order_status', 'customize_user']
    search_fields = ['order_description']
    ordering_fields = ['created_at', 'order_date']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(customize_user_id=user_id)
        return queryset

    @action(detail=False, methods=['delete'])
    def soft_delete(self, request):
        """Soft delete multiple customize orders"""
        order_ids = request.data.get('order_ids', [])
        CustomizeOrders.objects.filter(id__in=order_ids).update(
            is_delete=True,
            deleted_at=timezone.now()
        )
        return Response({'message': 'Customize orders soft deleted successfully'}, status=status.HTTP_200_OK)


class AddToCartViewSet(viewsets.ModelViewSet):
    """Add to Cart ViewSet with CRUD operations"""
    queryset = AddToCart.objects.filter(is_delete=False)
    serializer_class = AddToCartSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['cart_status', 'cart_user']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(cart_user_id=user_id, cart_status=True)
        return queryset

    @action(detail=False, methods=['delete'])
    def soft_delete(self, request):
        """Soft delete multiple cart items"""
        cart_ids = request.data.get('cart_ids', [])
        AddToCart.objects.filter(id__in=cart_ids).update(
            is_delete=True,
            deleted_at=timezone.now()
        )
        return Response({'message': 'Cart items soft deleted successfully'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def clear_cart(self, request):
        """Clear user's cart"""
        user_id = request.data.get('user_id')
        if user_id:
            AddToCart.objects.filter(cart_user_id=user_id, cart_status=True).update(
                is_delete=True,
                deleted_at=timezone.now()
            )
            return Response({'message': 'Cart cleared successfully'}, status=status.HTTP_200_OK)
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)


class BannersViewSet(viewsets.ModelViewSet):
    """Banners ViewSet with CRUD operations"""
    queryset = Banners.objects.filter(is_delete=False)
    serializer_class = BannersSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['banner_status', 'banner_product_id']
    search_fields = ['banner_title']
    ordering_fields = ['banner_order', 'created_at']
    ordering = ['banner_order', '-created_at']

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active banners"""
        banners = self.queryset.filter(banner_status=True)
        serializer = self.get_serializer(banners, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['delete'])
    def soft_delete(self, request):
        """Soft delete multiple banners"""
        banner_ids = request.data.get('banner_ids', [])
        Banners.objects.filter(id__in=banner_ids).update(
            is_delete=True,
            deleted_at=timezone.now()
        )
        return Response({'message': 'Banners soft deleted successfully'}, status=status.HTTP_200_OK)


class CMSViewSet(viewsets.ModelViewSet):
    """CMS ViewSet with CRUD operations"""
    queryset = CMS.objects.filter(is_delete=False)
    serializer_class = CMSSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['cms_status']
    search_fields = ['cms_title', 'cms_content', 'cms_slug']
    ordering_fields = ['created_at', 'cms_title']
    ordering = ['-created_at']
    lookup_field = 'cms_slug'

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active CMS pages"""
        pages = self.queryset.filter(cms_status=True)
        serializer = self.get_serializer(pages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['delete'])
    def soft_delete(self, request):
        """Soft delete multiple CMS pages"""
        cms_ids = request.data.get('cms_ids', [])
        CMS.objects.filter(id__in=cms_ids).update(
            is_delete=True,
            deleted_at=timezone.now()
        )
        return Response({'message': 'CMS pages soft deleted successfully'}, status=status.HTTP_200_OK)


class NotificationTypeViewSet(viewsets.ModelViewSet):
    """Notification Type ViewSet with CRUD operations"""
    queryset = NotificationType.objects.filter(is_delete=False)
    serializer_class = NotificationTypeSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['notif_status']
    search_fields = ['notif_name']
    ordering_fields = ['notif_name', 'created_at']
    ordering = ['notif_name']

    @action(detail=False, methods=['delete'])
    def soft_delete(self, request):
        """Soft delete multiple notification types"""
        type_ids = request.data.get('type_ids', [])
        NotificationType.objects.filter(notif_id__in=type_ids).update(
            is_delete=True,
            deleted_at=timezone.now()
        )
        return Response({'message': 'Notification types soft deleted successfully'}, status=status.HTTP_200_OK)


class NotificationTableViewSet(viewsets.ModelViewSet):
    """Notification Table ViewSet with CRUD operations"""
    queryset = NotificationTable.objects.filter(is_delete=False)
    serializer_class = NotificationTableSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['notification_read', 'notification_user', 'notification_type']
    search_fields = ['notification_title', 'notification_message']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.query_params.get('user_id', None)
        read_status = self.request.query_params.get('read', None)
        
        if user_id:
            queryset = queryset.filter(notification_user_id=user_id)
        if read_status is not None:
            queryset = queryset.filter(notification_read=read_status.lower() == 'true')
        
        return queryset

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.notification_read = True
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for a user"""
        user_id = request.data.get('user_id')
        if user_id:
            NotificationTable.objects.filter(
                notification_user_id=user_id,
                notification_read=False
            ).update(notification_read=True)
            return Response({'message': 'All notifications marked as read'}, status=status.HTTP_200_OK)
        return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['delete'])
    def soft_delete(self, request):
        """Soft delete multiple notifications"""
        notification_ids = request.data.get('notification_ids', [])
        NotificationTable.objects.filter(id__in=notification_ids).update(
            is_delete=True,
            deleted_at=timezone.now()
        )
        return Response({'message': 'Notifications soft deleted successfully'}, status=status.HTTP_200_OK)


class OrderEmailsViewSet(viewsets.ModelViewSet):
    """Order Emails ViewSet with CRUD operations"""
    queryset = OrderEmails.objects.filter(is_delete=False)
    serializer_class = OrderEmailsSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['mail_status', 'mail_to', 'mail_from']
    search_fields = ['mail_subject', 'mail_content']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    @action(detail=False, methods=['delete'])
    def soft_delete(self, request):
        """Soft delete multiple order emails"""
        email_ids = request.data.get('email_ids', [])
        OrderEmails.objects.filter(mail_id__in=email_ids).update(
            is_delete=True,
            deleted_at=timezone.now()
        )
        return Response({'message': 'Order emails soft deleted successfully'}, status=status.HTTP_200_OK)


class SessionViewSet(viewsets.ModelViewSet):
    """Session ViewSet with CRUD operations"""
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['session_user', 'device_type']
    search_fields = ['session_key', 'fcm_token']
    ordering_fields = ['created_at', 'expire_date']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(session_user_id=user_id)
        return queryset

    @action(detail=False, methods=['post'])
    def update_fcm_token(self, request):
        """Update FCM token for a session"""
        session_key = request.data.get('session_key')
        fcm_token = request.data.get('fcm_token')
        device_type = request.data.get('device_type')
        
        if session_key and fcm_token:
            session, created = Session.objects.get_or_create(
                session_key=session_key,
                defaults={
                    'session_user_id': request.data.get('user_id'),
                    'fcm_token': fcm_token,
                    'device_type': device_type,
                    'expire_date': timezone.now() + timezone.timedelta(days=30)
                }
            )
            if not created:
                session.fcm_token = fcm_token
                if device_type:
                    session.device_type = device_type
                session.save()
            
            serializer = self.get_serializer(session)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response({'error': 'session_key and fcm_token are required'}, status=status.HTTP_400_BAD_REQUEST)


from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema


@extend_schema(
    summary="Client registration",
    description="Register a new client with all required fields",
    request=ClientRegistrationSerializer,
    responses={201: UserSerializer}
)
class ClientRegistrationView(APIView):
    """Custom registration endpoint for client signup"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ClientRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            response_serializer = UserSerializer(user)
            return Response({
                'message': 'Registration successful',
                'user': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

