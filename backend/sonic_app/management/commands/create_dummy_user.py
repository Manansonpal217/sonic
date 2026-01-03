"""
Django management command to create a dummy user with sample data
Usage: python manage.py create_dummy_user
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from sonic_app.models import (
    Product, Category, AddToCart, Order, OrderItem, 
    NotificationTable, NotificationType
)
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates a dummy user with sample cart items, orders, and notifications'

    def handle(self, *args, **options):
        # Check if dummy user already exists
        dummy_email = 'demo@sonic.com'
        dummy_username = 'demo_user'
        
        try:
            user = User.objects.get(email=dummy_email, is_delete=False)
            self.stdout.write(
                self.style.WARNING(f'Dummy user already exists: {user.email}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'Username: {dummy_username}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'Email: {dummy_email}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'Password: demo123')
            )
            self.stdout.write(
                self.style.SUCCESS(f'User ID: {user.id}')
            )
            
            # Show existing data counts
            cart_count = AddToCart.objects.filter(cart_user=user, is_delete=False).count()
            order_count = Order.objects.filter(order_user_id=user.id, is_delete=False).count()
            notification_count = NotificationTable.objects.filter(notification_user=user, is_delete=False).count()
            
            self.stdout.write(
                self.style.SUCCESS(f'\nExisting Data:')
            )
            self.stdout.write(f'  Cart Items: {cart_count}')
            self.stdout.write(f'  Orders: {order_count}')
            self.stdout.write(f'  Notifications: {notification_count}')
            
            return
        
        except User.DoesNotExist:
            pass
        
        # Create dummy user
        self.stdout.write('Creating dummy user...')
        user = User.objects.create_user(
            username=dummy_username,
            email=dummy_email,
            password='demo123',
            first_name='Demo',
            last_name='User',
            user_status=True,
            is_active=True,
            phone_number='+1234567890',
            company_name='Demo Company',
            address='123 Demo Street, Demo City'
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'✓ Created user: {user.username} (ID: {user.id})')
        )
        
        # Get active products and categories
        products = Product.objects.filter(is_delete=False, product_status=True)
        categories = Category.objects.filter(is_delete=False, category_status=True)
        
        if not products.exists():
            self.stdout.write(
                self.style.WARNING('No active products found. Please create products first.')
            )
            return
        
        # Create cart items (3-5 random products)
        self.stdout.write('Creating cart items...')
        cart_products = random.sample(list(products), min(5, products.count()))
        for product in cart_products:
            AddToCart.objects.create(
                cart_user=user,
                cart_product=product,
                cart_quantity=random.randint(1, 3),
                cart_status=True
            )
        self.stdout.write(
            self.style.SUCCESS(f'✓ Created {len(cart_products)} cart items')
        )
        
        # Create orders (2-3 orders with order items)
        self.stdout.write('Creating orders...')
        order_statuses = ['pending', 'processing', 'delivered']
        
        for i in range(random.randint(2, 3)):
            # Select random products for this order
            order_products = random.sample(list(products), min(3, products.count()))
            total_price = sum(p.product_price for p in order_products)
            
            order = Order.objects.create(
                order_user_id=user.id,
                order_price=total_price,
                order_total_price=total_price,
                order_status=random.choice(order_statuses),
                order_date=timezone.now() - timezone.timedelta(days=random.randint(1, 30)),
                order_notes=f'Demo order #{i+1}'
            )
            
            # Create order items
            for product in order_products:
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=random.randint(1, 2),
                    price=product.product_price
                )
            
            self.stdout.write(
                self.style.SUCCESS(f'✓ Created order #{order.id} with {len(order_products)} items')
            )
        
        # Create notifications
        self.stdout.write('Creating notifications...')
        
        # Get or create notification types
        notification_type, _ = NotificationType.objects.get_or_create(
            notif_name='Order Update',
            defaults={'notif_status': True}
        )
        
        notification_types = [
            notification_type,
        ]
        
        # Create additional notification types if needed
        if NotificationType.objects.filter(notif_name='Welcome').exists():
            notification_types.append(NotificationType.objects.get(notif_name='Welcome'))
        else:
            welcome_type = NotificationType.objects.create(
                notif_name='Welcome',
                notif_status=True
            )
            notification_types.append(welcome_type)
        
        # Create 3-5 notifications
        notification_titles = [
            'Welcome to Sonic!',
            'Your order has been confirmed',
            'Your order is being processed',
            'Your order has been delivered',
            'New products available'
        ]
        
        notification_messages = [
            'Thank you for joining Sonic. Explore our collection!',
            'Order #12345 has been confirmed and will be processed soon.',
            'Your order is currently being prepared for shipment.',
            'Your order has been successfully delivered. Enjoy!',
            'Check out our latest collection of jewelry.'
        ]
        
        for i in range(random.randint(3, 5)):
            NotificationTable.objects.create(
                notification_user=user,
                notification_type=random.choice(notification_types),
                notification_title=notification_titles[i % len(notification_titles)],
                notification_message=notification_messages[i % len(notification_messages)],
                notification_read=random.choice([True, False])
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'✓ Created notifications')
        )
        
        # Summary
        self.stdout.write(
            self.style.SUCCESS('\n' + '='*50)
        )
        self.stdout.write(
            self.style.SUCCESS('DUMMY USER CREATED SUCCESSFULLY!')
        )
        self.stdout.write(
            self.style.SUCCESS('='*50)
        )
        self.stdout.write(
            self.style.SUCCESS(f'\nCredentials:')
        )
        self.stdout.write(f'  Username: {dummy_username}')
        self.stdout.write(f'  Email: {dummy_email}')
        self.stdout.write(f'  Password: demo123')
        self.stdout.write(f'  User ID: {user.id}')
        
        self.stdout.write(
            self.style.SUCCESS(f'\nSample Data Created:')
        )
        cart_count = AddToCart.objects.filter(cart_user=user, is_delete=False).count()
        order_count = Order.objects.filter(order_user_id=user.id, is_delete=False).count()
        notification_count = NotificationTable.objects.filter(notification_user=user, is_delete=False).count()
        
        self.stdout.write(f'  Cart Items: {cart_count}')
        self.stdout.write(f'  Orders: {order_count}')
        self.stdout.write(f'  Notifications: {notification_count}')
        self.stdout.write('')

