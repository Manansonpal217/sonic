from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .services import NotificationService, OTPSmsService, normalize_phone

from .models import (
    Category, CategoryField, User, Product, ProductVariant, ProductFieldValue, ProductLead,
    Order, OrderItem, CustomizeOrders, AddToCart,
    Banners, CMS, NotificationType, NotificationTable,
    OrderEmails, Session, OTP
)
from .serializers import (
    CategorySerializer, CategoryFieldSerializer, UserSerializer, UserCreateSerializer, ProductSerializer,
    ProductVariantSerializer, ProductFieldValueSerializer, ProductLeadSerializer,
    OrderSerializer, OrderItemSerializer, CustomizeOrdersSerializer, AddToCartSerializer,
    BannersSerializer, CMSSerializer, NotificationTypeSerializer,
    NotificationTableSerializer, OrderEmailsSerializer, SessionSerializer, ClientRegistrationSerializer, OTPSerializer,
    SendOTPSerializer, VerifyOTPSerializer,
)

# OTP rate limits
MAX_OTP_SENDS_PER_HOUR = 5
MAX_OTP_VERIFY_ATTEMPTS = 5


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    """Health check for load balancers and monitoring. Returns 200 when backend is running."""
    return Response(
        {'status': 'ok', 'message': 'Backend is healthy'},
        status=status.HTTP_200_OK,
    )


@extend_schema_view(
    list=extend_schema(summary="List all categories"),
    create=extend_schema(summary="Create a new category"),
    retrieve=extend_schema(summary="Get category details"),
    update=extend_schema(summary="Update category"),
    partial_update=extend_schema(summary="Partially update category"),
    destroy=extend_schema(summary="Delete category"),
)
class CategoryViewSet(viewsets.ModelViewSet):
    """Category ViewSet with CRUD operations"""
    queryset = Category.objects.filter(is_delete=False)
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category_status']
    search_fields = ['category_name', 'category_description']
    ordering_fields = ['display_order', 'created_at', 'category_name']
    ordering = ['display_order', '-created_at']

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active categories"""
        categories = self.queryset.filter(category_status=True)
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get products in this category"""
        category = self.get_object()
        products = Product.objects.filter(
            product_category=category,
            is_delete=False,
            product_status=True
        )
        from .serializers import ProductSerializer
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['delete'])
    def soft_delete(self, request):
        """Soft delete multiple categories"""
        category_ids = request.data.get('category_ids', [])
        Category.objects.filter(id__in=category_ids).update(
            is_delete=True,
            deleted_at=timezone.now()
        )
        return Response({'message': 'Categories soft deleted successfully'}, status=status.HTTP_200_OK)


@extend_schema_view(
    list=extend_schema(summary="List all category fields"),
    create=extend_schema(summary="Create a new category field"),
    retrieve=extend_schema(summary="Get category field details"),
    update=extend_schema(summary="Update category field"),
    partial_update=extend_schema(summary="Partially update category field"),
    destroy=extend_schema(summary="Delete category field"),
)
class CategoryFieldViewSet(viewsets.ModelViewSet):
    """Category Field ViewSet with CRUD operations"""
    queryset = CategoryField.objects.filter(is_delete=False)
    serializer_class = CategoryFieldSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'field_type', 'is_required', 'is_variant_dimension']
    search_fields = ['field_name', 'field_label']
    ordering_fields = ['display_order', 'created_at', 'field_name', 'variant_order']
    ordering = ['category', 'display_order']

    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category_id', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

    @action(detail=False, methods=['delete'])
    def soft_delete(self, request):
        """Soft delete multiple category fields"""
        field_ids = request.data.get('field_ids', [])
        CategoryField.objects.filter(id__in=field_ids).update(
            is_delete=True,
            deleted_at=timezone.now()
        )
        return Response({'message': 'Category fields soft deleted successfully'}, status=status.HTTP_200_OK)


@extend_schema_view(
    list=extend_schema(summary="List all product field values"),
    create=extend_schema(summary="Create a new product field value"),
    retrieve=extend_schema(summary="Get product field value details"),
    update=extend_schema(summary="Update product field value"),
    partial_update=extend_schema(summary="Partially update product field value"),
    destroy=extend_schema(summary="Delete product field value"),
)
class ProductFieldValueViewSet(viewsets.ModelViewSet):
    """Product Field Value ViewSet with CRUD operations"""
    queryset = ProductFieldValue.objects.all()
    serializer_class = ProductFieldValueSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['product', 'category_field']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product_id', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create or update product field values"""
        product_id = request.data.get('product_id')
        field_values = request.data.get('field_values', [])
        
        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        created = []
        updated = []
        
        for fv in field_values:
            category_field_id = fv.get('category_field')
            field_value = fv.get('field_value')
            
            if category_field_id and field_value is not None:
                obj, is_created = ProductFieldValue.objects.update_or_create(
                    product_id=product_id,
                    category_field_id=category_field_id,
                    defaults={'field_value': field_value}
                )
                if is_created:
                    created.append(obj.id)
                else:
                    updated.append(obj.id)
        
        return Response({
            'message': 'Field values saved successfully',
            'created': created,
            'updated': updated
        }, status=status.HTTP_200_OK)


@extend_schema_view(
    list=extend_schema(summary="List product variants"),
    create=extend_schema(summary="Create a product variant"),
    retrieve=extend_schema(summary="Get product variant details"),
    update=extend_schema(summary="Update product variant"),
    partial_update=extend_schema(summary="Partially update product variant"),
    destroy=extend_schema(summary="Delete product variant"),
)
class ProductVariantViewSet(viewsets.ModelViewSet):
    """Product Variant ViewSet with CRUD operations"""
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['product']
    ordering_fields = ['display_order', 'id']
    ordering = ['display_order', 'id']


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
        is_approved = self.request.query_params.get('is_approved', None)
        if user_status is not None:
            queryset = queryset.filter(user_status=user_status.lower() == 'true')
        if is_approved is not None:
            queryset = queryset.filter(is_approved=is_approved.lower() == 'true')
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

    @action(detail=True, methods=['patch'])
    @extend_schema(
        summary="Approve User",
        description="Approve a user for app access",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'approved': {'type': 'boolean'}
                }
            }
        },
        responses={
            200: {'description': 'User approval status updated'},
            400: {'description': 'Invalid request'}
        }
    )
    def approve(self, request, pk=None):
        """Approve or reject user"""
        user = self.get_object()
        approved = request.data.get('approved', True)
        
        user.is_approved = approved
        if approved:
            user.approved_at = timezone.now()
            user.approved_by = request.user if request.user.is_authenticated else None
        else:
            user.approved_at = None
            user.approved_by = None
        user.save()
        
        serializer = UserSerializer(user)
        return Response({
            'message': f'User {"approved" if approved else "rejected"} successfully',
            'user': serializer.data
        }, status=status.HTTP_200_OK)


class ProductViewSet(viewsets.ModelViewSet):
    """Product ViewSet with CRUD operations"""
    queryset = Product.objects.filter(is_delete=False)
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['product_status', 'product_is_parent', 'product_parent_id', 'product_category']
    search_fields = ['product_name', 'product_description']
    ordering_fields = ['created_at', 'product_price', 'product_name', '-created_at', '-product_price', '-product_name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        # One product per catalog entry: exclude child products from list
        queryset = queryset.filter(product_parent_id__isnull=True)
        
        # Price range filtering
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        
        if min_price:
            try:
                queryset = queryset.filter(product_price__gte=float(min_price))
            except (ValueError, TypeError):
                pass
        if max_price:
            try:
                queryset = queryset.filter(product_price__lte=float(max_price))
            except (ValueError, TypeError):
                pass
        
        # Status filtering (default to active products only for public API)
        status = self.request.query_params.get('status', None)
        if status is not None:
            if status.lower() == 'true' or status == '1':
                queryset = queryset.filter(product_status=True)
            elif status.lower() == 'false' or status == '0':
                queryset = queryset.filter(product_status=False)
        else:
            # Default to active products for better UX
            queryset = queryset.filter(product_status=True)
        
        # Category filtering
        category_id = self.request.query_params.get('category', None)
        if category_id:
            try:
                queryset = queryset.filter(product_category_id=int(category_id))
            except (ValueError, TypeError):
                pass
        
        return queryset

    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """Get child products"""
        product = self.get_object()
        children = Product.objects.filter(product_parent_id=product, is_delete=False)
        serializer = self.get_serializer(children, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='variants/bulk')
    def bulk_create_variants(self, request, pk=None):
        """Bulk create product variants. Body: { "variants": [ {"variant_value_1": "20", "variant_value_2": "9"}, ... ] }"""
        product = self.get_object()
        variants_data = request.data.get('variants', [])
        if not isinstance(variants_data, list):
            return Response({'error': 'variants must be a list'}, status=status.HTTP_400_BAD_REQUEST)
        created = 0
        for i, v in enumerate(variants_data):
            val1 = v.get('variant_value_1')
            val2 = v.get('variant_value_2') if v.get('variant_value_2') not in (None, '') else None
            if not val1:
                continue
            _, was_created = ProductVariant.objects.get_or_create(
                product=product,
                variant_value_1=str(val1).strip(),
                variant_value_2=str(val2).strip() if val2 else None,
                defaults={'display_order': i}
            )
            if was_created:
                created += 1
        serializer = ProductSerializer(product, context=self.get_serializer_context())
        return Response({'message': f'Created {created} variant(s)', 'product': serializer.data}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete'])
    def soft_delete(self, request):
        """Soft delete multiple products"""
        product_ids = request.data.get('product_ids', [])
        Product.objects.filter(id__in=product_ids).update(
            is_delete=True,
            deleted_at=timezone.now()
        )
        return Response({'message': 'Products soft deleted successfully'}, status=status.HTTP_200_OK)


class ProductLeadViewSet(viewsets.ModelViewSet):
    """Product leads from QR scan. Only staff can create (from app); any authenticated user can list (e.g. admin panel)."""
    serializer_class = ProductLeadSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post']

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return ProductLead.objects.none()
        return ProductLead.objects.all().select_related('product', 'product_variant', 'submitted_by').order_by('-created_at')

    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff (sales) users can submit product leads.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)


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

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        """Convert cart items to order. Supports product-wise checkout with cart_item_ids."""
        user_id = request.data.get('user_id')
        order_notes = request.data.get('order_notes', '')
        cart_item_ids = request.data.get('cart_item_ids', None)  # Optional: list of cart item IDs for product-wise checkout
        
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get active cart items for user
        cart_items_query = AddToCart.objects.filter(
            cart_user_id=user_id,
            cart_status=True,
            is_delete=False
        )
        
        # If cart_item_ids provided, filter to only those items (product-wise checkout)
        if cart_item_ids:
            try:
                # Ensure cart_item_ids is a list
                if not isinstance(cart_item_ids, list):
                    cart_item_ids = [cart_item_ids]
                # Filter to only the specified cart items and ensure they belong to the user
                cart_items_query = cart_items_query.filter(id__in=cart_item_ids)
            except (ValueError, TypeError):
                return Response({'error': 'Invalid cart_item_ids format'}, status=status.HTTP_400_BAD_REQUEST)
        
        cart_items = cart_items_query
        
        if not cart_items.exists():
            error_msg = 'No items found to checkout' if cart_item_ids else 'Cart is empty'
            return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate total price (variant price or product price; 0 if neither set - price not shown in app)
        def _item_price(item):
            if item.cart_variant_id and getattr(item.cart_variant, 'price', None) is not None:
                return (item.cart_variant.price or 0) * item.cart_quantity
            return (getattr(item.cart_product, 'product_price', None) or 0) * item.cart_quantity
        total_price = sum(_item_price(item) for item in cart_items)
        
        # Create order
        order = Order.objects.create(
            order_user_id=user_id,
            order_price=total_price,
            order_total_price=total_price,
            order_status='pending',
            order_date=timezone.now(),
            order_notes=order_notes
        )
        
        # Create order items from cart items
        for cart_item in cart_items:
            unit_price = None
            if cart_item.cart_variant_id and getattr(cart_item.cart_variant, 'price', None) is not None:
                unit_price = cart_item.cart_variant.price
            else:
                unit_price = getattr(cart_item.cart_product, 'product_price', None)
            OrderItem.objects.create(
                order=order,
                product=cart_item.cart_product,
                product_variant=cart_item.cart_variant,
                quantity=cart_item.cart_quantity,
                price=unit_price
            )
        
        # Clear cart (soft delete cart items that were checked out)
        cart_items.update(is_delete=True, deleted_at=timezone.now())
        
        # Serialize and return order with items
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

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

    def create(self, request, *args, **kwargs):
        """Override create to handle duplicate items gracefully, including soft-deleted ones. Supports cart_variant."""
        cart_user = request.data.get('cart_user')
        cart_product = request.data.get('cart_product')
        cart_variant = request.data.get('cart_variant')  # optional
        cart_status = request.data.get('cart_status', True)
        cart_quantity = int(request.data.get('cart_quantity', 1))
        
        # Build lookup: same user, product, variant, status (variant can be null)
        lookup = dict(
            cart_user_id=cart_user,
            cart_product_id=cart_product,
            cart_status=cart_status,
            is_delete=False
        )
        if cart_variant not in (None, '', []):
            lookup['cart_variant_id'] = cart_variant
        else:
            lookup['cart_variant_id__isnull'] = True
        
        try:
            existing_item = AddToCart.objects.get(**lookup)
            # Item exists and is active, update quantity instead
            existing_item.cart_quantity += cart_quantity
            existing_item.cart_status = True  # Ensure it's active
            existing_item.save()
            
            serializer = self.get_serializer(existing_item)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except AddToCart.DoesNotExist:
            soft_lookup = dict(
                cart_user_id=cart_user,
                cart_product_id=cart_product,
                cart_status=cart_status,
                is_delete=True
            )
            if cart_variant not in (None, '', []):
                soft_lookup['cart_variant_id'] = cart_variant
            else:
                soft_lookup['cart_variant_id__isnull'] = True
            try:
                soft_deleted_item = AddToCart.objects.get(**soft_lookup)
                # Restore and update the soft-deleted item
                soft_deleted_item.is_delete = False
                soft_deleted_item.deleted_at = None
                soft_deleted_item.cart_quantity = cart_quantity  # Use new quantity (or add: += cart_quantity)
                soft_deleted_item.cart_status = True
                soft_deleted_item.save()
                
                serializer = self.get_serializer(soft_deleted_item)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except AddToCart.DoesNotExist:
                pass
            # Item doesn't exist at all, create new one
            return super().create(request, *args, **kwargs)
        except AddToCart.MultipleObjectsReturned:
            existing_item = AddToCart.objects.filter(**lookup).first()
            
            if existing_item:
                existing_item.cart_quantity += cart_quantity
                existing_item.cart_status = True
                existing_item.save()
                serializer = self.get_serializer(existing_item)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                soft_lookup2 = dict(
                    cart_user_id=cart_user,
                    cart_product_id=cart_product,
                    cart_status=cart_status,
                    is_delete=True
                )
                if cart_variant not in (None, '', []):
                    soft_lookup2['cart_variant_id'] = cart_variant
                else:
                    soft_lookup2['cart_variant_id__isnull'] = True
                soft_deleted_item = AddToCart.objects.filter(**soft_lookup2).first()
                if soft_deleted_item:
                    soft_deleted_item.is_delete = False
                    soft_deleted_item.deleted_at = None
                    soft_deleted_item.cart_quantity = cart_quantity
                    soft_deleted_item.cart_status = True
                    soft_deleted_item.save()
                    serializer = self.get_serializer(soft_deleted_item)
                    return Response(serializer.data, status=status.HTTP_200_OK)
            
            return super().create(request, *args, **kwargs)

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

    @action(detail=False, methods=['post'])
    def send_notification(self, request):
        """Send notification to specific users via WebSocket and store in database"""
        user_ids = request.data.get('user_ids', [])
        notification_type_id = request.data.get('notification_type_id')
        title = request.data.get('title', '')
        message = request.data.get('message', '')
        send_to_all = request.data.get('send_to_all', False)
        
        if not notification_type_id or not title:
            return Response(
                {'error': 'notification_type_id and title are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if send_to_all:
            result = NotificationService.send_notification_to_all(
                notification_type_id=notification_type_id,
                title=title,
                message=message
            )
        elif user_ids:
            result = NotificationService.send_notification(
                user_ids=user_ids,
                notification_type_id=notification_type_id,
                title=title,
                message=message
            )
        else:
            return Response(
                {'error': 'Either user_ids or send_to_all must be provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if result['success']:
            return Response(result, status=status.HTTP_201_CREATED)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

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


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@extend_schema(
    summary="Client Login",
    description="Authenticate user with email and password for admin panel",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'user_email': {'type': 'string', 'format': 'email'},
                'user_password': {'type': 'string'},
                'remember_me': {'type': 'boolean'}
            },
            'required': ['user_email', 'user_password']
        }
    },
    responses={
        200: {
            'description': 'Login successful',
            'type': 'object',
            'properties': {
                'message': {'type': 'string'},
                'user': {'type': 'object'}
            }
        },
        400: {'description': 'Invalid credentials'}
    }
)
def client_login(request):
    """Client login endpoint for admin panel"""
    user_email = request.data.get('user_email')
    user_password = request.data.get('user_password')
    
    if not user_email or not user_password:
        return Response(
            {'error': 'user_email and user_password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Try to find user by email first, then by username
    try:
        user = User.objects.get(email=user_email, is_delete=False, is_active=True)
        username = user.username
    except User.DoesNotExist:
        try:
            user = User.objects.get(username=user_email, is_delete=False, is_active=True)
            username = user.username
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Authenticate using username and password
    authenticated_user = authenticate(request, username=username, password=user_password)
    
    if authenticated_user is None:
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create session for the authenticated user
    login(request, authenticated_user)
    
    # Serialize user data
    serializer = UserSerializer(authenticated_user)
    
    return Response({
        'message': 'Login successful',
        'user': serializer.data
    }, status=status.HTTP_200_OK)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@extend_schema(
    summary="Client Registration",
    description="Register a new user (requires admin approval)",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'user_name': {'type': 'string'},
                'user_email': {'type': 'string', 'format': 'email'},
                'user_phone_number': {'type': 'string'},
                'user_company_name': {'type': 'string'},
                'user_gst': {'type': 'string'},
                'user_address': {'type': 'string'},
                'user_password': {'type': 'string'},
                'confirm_password': {'type': 'string'}
            },
            'required': ['user_name', 'user_email', 'user_phone_number', 'user_company_name', 'user_gst', 'user_address', 'user_password', 'confirm_password']
        }
    },
    responses={
        201: {'description': 'Registration successful, pending approval'},
        400: {'description': 'Validation error'}
    }
)
def client_registration(request):
    """Client registration endpoint for mobile app"""
    serializer = ClientRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user_serializer = UserSerializer(user)
        return Response({
            'message': 'Registration successful. Your account is pending admin approval.',
            'user': user_serializer.data,
            'is_approved': False
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@extend_schema(
    summary="Send OTP",
    description="Send OTP code to phone number",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'phone_number': {'type': 'string'}
            },
            'required': ['phone_number']
        }
    },
    responses={
        200: {'description': 'OTP sent successfully'},
        400: {'description': 'Invalid phone number'}
    }
)
def send_otp(request):
    """Send OTP to phone number."""
    import random
    from django.conf import settings

    serializer = SendOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'error': serializer.errors.get('phone_number', ['Invalid request'])[0] if serializer.errors else 'Invalid request'},
            status=status.HTTP_400_BAD_REQUEST
        )
    phone_number = serializer.validated_data['phone_number']

    # Only allow OTP for registered users; new numbers must sign up first
    if not User.objects.filter(phone_number=phone_number, is_delete=False).exists():
        return Response(
            {'error': 'This phone number is not registered. Please sign up first.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Rate limit: max sends per hour per phone
    since = timezone.now() - timezone.timedelta(hours=1)
    recent_count = OTP.objects.filter(phone_number=phone_number, created_at__gte=since).count()
    if recent_count >= MAX_OTP_SENDS_PER_HOUR:
        return Response(
            {'error': 'Too many OTP requests. Please try again later.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )

    otp_code = str(random.randint(100000, 999999))
    expires_at = timezone.now() + timezone.timedelta(minutes=5)

    OTP.objects.filter(phone_number=phone_number, is_verified=False).update(is_verified=True)
    OTP.objects.create(
        phone_number=phone_number,
        otp_code=otp_code,
        expires_at=expires_at,
        is_verified=False,
        attempts=0,
    )

    # Send SMS in background so the API responds immediately and does not time out
    import threading
    def send_sms_async():
        try:
            OTPSmsService.send_otp(phone_number, otp_code)
        except Exception as e:
            import logging
            logging.getLogger(__name__).exception("Background OTP SMS failed: %s", e)
    threading.Thread(target=send_sms_async, daemon=True).start()

    response_data = {
        'message': 'OTP sent successfully',
        'phone_number': phone_number,
        'expires_at': expires_at.isoformat(),
    }
    if getattr(settings, 'DEBUG', False):
        response_data['otp_code'] = otp_code
    return Response(response_data, status=status.HTTP_200_OK)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@extend_schema(
    summary="Verify OTP",
    description="Verify OTP code and login",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'phone_number': {'type': 'string'},
                'otp_code': {'type': 'string'}
            },
            'required': ['phone_number', 'otp_code']
        }
    },
    responses={
        200: {'description': 'OTP verified and login successful'},
        400: {'description': 'Invalid OTP or user not approved'}
    }
)
def verify_otp(request):
    """Verify OTP code and login user (passwordless)."""
    from django.conf import settings
    from django.contrib.auth import login as django_login
    import secrets

    serializer = VerifyOTPSerializer(data=request.data)
    if not serializer.is_valid():
        errors = serializer.errors
        msg = errors.get('phone_number', errors.get('otp_code', ['Invalid request']))[0]
        return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

    phone_number = serializer.validated_data['phone_number']
    otp_code = serializer.validated_data['otp_code']
    fcm_token = serializer.validated_data.get('fcm_token') or ''
    latitude = serializer.validated_data.get('latitude')
    longitude = serializer.validated_data.get('longitude')
    address = serializer.validated_data.get('address') or ''

    try:
        otp = OTP.objects.filter(
            phone_number=phone_number,
            is_verified=False,
        ).order_by('-created_at').first()

        if not otp:
            return Response(
                {'error': 'No OTP found for this phone number. Please request a new OTP.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp.attempts >= MAX_OTP_VERIFY_ATTEMPTS:
            otp.is_verified = True
            otp.save()
            return Response(
                {'error': 'Too many failed attempts. Please request a new OTP.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp.is_expired():
            otp.is_verified = True
            otp.save()
            return Response(
                {'error': 'OTP has expired. Please request a new OTP.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp.otp_code != otp_code:
            otp.attempts += 1
            otp.save()
            return Response(
                {'error': 'Invalid OTP code'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(phone_number=phone_number, is_delete=False, is_active=True)
        except User.DoesNotExist:
            return Response(
                {'error': 'No account found for this phone number. Please sign up first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Allow login for unapproved users; app will show "Approval Pending" and restrict access
        otp.is_verified = True
        otp.verified_at = timezone.now()
        otp.save()

        user.is_phone_verified = True
        user.save(update_fields=['is_phone_verified'])

        django_login(request, user)

        token = secrets.token_urlsafe(32)
        # Django session may have no key for API requests (e.g. mobile); use token as fallback
        session_key = request.session.session_key
        if not session_key:
            request.session.save()
            session_key = request.session.session_key
        if not session_key:
            session_key = token[:40]  # Session.session_key max_length=40
        session, created = Session.objects.get_or_create(
            session_key=session_key,
            defaults={
                'session_user': user,
                'auth_token': token,
                'expire_date': timezone.now() + timezone.timedelta(days=30),
            }
        )
        if not created:
            session.session_user = user
            session.auth_token = token
            session.expire_date = timezone.now() + timezone.timedelta(days=30)
            session.save()
        if fcm_token:
            session.fcm_token = fcm_token
        if latitude is not None:
            session.latitude = latitude
        if longitude is not None:
            session.longitude = longitude
        if address:
            session.address = address
        session.save()

        user_serializer = UserSerializer(user)
        return Response({
            'message': 'OTP verified and login successful',
            'token': token,
            'user': user_serializer.data,
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@extend_schema(
    summary="Update Location",
    description="Update device location",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'latitude': {'type': 'number'},
                'longitude': {'type': 'number'},
                'address': {'type': 'string'}
            },
            'required': ['latitude', 'longitude']
        }
    },
    responses={
        200: {'description': 'Location updated successfully'},
        400: {'description': 'Invalid location data'}
    }
)
def update_location(request):
    """Update device location (supports Bearer token or session auth)."""
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    address = request.data.get('address', '')

    if latitude is None or longitude is None:
        return Response(
            {'error': 'latitude and longitude are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    session = getattr(request, 'auth', None)
    if isinstance(session, Session):
        session.latitude = latitude
        session.longitude = longitude
        if address:
            session.address = address
        session.save()
        serializer = SessionSerializer(session)
        return Response({
            'message': 'Location updated successfully',
            'session': serializer.data
        }, status=status.HTTP_200_OK)

    session_key = request.session.session_key
    if not session_key:
        return Response(
            {'error': 'No active session found'},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        session = Session.objects.get(session_key=session_key)
        session.latitude = latitude
        session.longitude = longitude
        if address:
            session.address = address
        session.save()
        serializer = SessionSerializer(session)
        return Response({
            'message': 'Location updated successfully',
            'session': serializer.data
        }, status=status.HTTP_200_OK)
    except Session.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@extend_schema(
    summary="Delete Account",
    description="Soft-delete the authenticated user's account and log them out.",
    responses={200: {'description': 'Account deleted'}, 401: {'description': 'Not authenticated'}},
)
def account_delete(request):
    user = request.user
    user.is_delete = True
    user.is_active = False
    user.deleted_at = timezone.now()
    user.save()
    logout(request)
    return Response({'message': 'Account deleted successfully'}, status=status.HTTP_200_OK)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@extend_schema(
    summary="Delete Account by OTP (Web)",
    description="Verify OTP and delete account. For users who uninstalled the app.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'phone_number': {'type': 'string'},
                'otp_code': {'type': 'string'},
            },
            'required': ['phone_number', 'otp_code'],
        }
    },
    responses={
        200: {'description': 'Account deleted'},
        400: {'description': 'Invalid OTP or phone number'},
    },
)
def account_delete_by_otp(request):
    """Verify OTP and delete account. For web-based deletion without the app."""
    serializer = VerifyOTPSerializer(data=request.data)
    if not serializer.is_valid():
        errors = serializer.errors
        msg = errors.get('phone_number', errors.get('otp_code', ['Invalid request']))[0]
        return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

    phone_number = serializer.validated_data['phone_number']
    otp_code = serializer.validated_data['otp_code']

    try:
        otp = OTP.objects.filter(
            phone_number=phone_number,
            is_verified=False,
        ).order_by('-created_at').first()

        if not otp:
            return Response(
                {'error': 'No OTP found. Please request a new OTP first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp.attempts >= MAX_OTP_VERIFY_ATTEMPTS:
            otp.is_verified = True
            otp.save()
            return Response(
                {'error': 'Too many failed attempts. Please request a new OTP.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp.is_expired():
            otp.is_verified = True
            otp.save()
            return Response(
                {'error': 'OTP has expired. Please request a new OTP.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp.otp_code != otp_code:
            otp.attempts += 1
            otp.save()
            return Response(
                {'error': 'Invalid OTP code'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(phone_number=phone_number, is_delete=False).first()
        if not user:
            return Response(
                {'error': 'No account found for this phone number.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp.is_verified = True
        otp.save()

        user.is_delete = True
        user.is_active = False
        user.deleted_at = timezone.now()
        user.save()

        return Response({'message': 'Account deleted successfully'}, status=status.HTTP_200_OK)

    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("Account delete by OTP failed: %s", e)
        return Response(
            {'error': 'An error occurred. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

