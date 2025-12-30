"""
Django management command to create a comprehensive test user with data in all tables.
Usage: python manage.py create_test_user
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from PIL import Image
import io
import random
from datetime import timedelta

from sonic_app.models import (
    Product, Order, CustomizeOrders, AddToCart, Banners, CMS,
    NotificationType, NotificationTable, OrderEmails, Session
)

User = get_user_model()


def create_dummy_image(width=800, height=600, color=None):
    """Create a dummy image file"""
    if color is None:
        color = (
            random.randint(200, 255),  # Gold-like colors
            random.randint(180, 220),
            random.randint(0, 50)
        )
    
    img = Image.new('RGB', (width, height), color=color)
    img_io = io.BytesIO()
    img.save(img_io, format='JPEG')
    img_io.seek(0)
    return ContentFile(img_io.read(), name=f'test_{random.randint(1000, 9999)}.jpg')


def create_dummy_audio():
    """Create a dummy audio file"""
    audio_content = b'\x00' * 1024
    return ContentFile(audio_content, name=f'test_audio_{random.randint(1000, 9999)}.mp3')


class Command(BaseCommand):
    help = 'Create a comprehensive test user with data in all tables'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating test user with complete data...'))

        # Test user credentials
        TEST_EMAIL = 'testuser@sonic.com'
        TEST_PASSWORD = 'Test@123'
        TEST_USERNAME = 'testuser'

        # 1. Create or get test user
        self.stdout.write('Creating test user...')
        user, created = User.objects.get_or_create(
            username=TEST_USERNAME,
            defaults={
                'email': TEST_EMAIL,
                'first_name': 'Test',
                'last_name': 'User',
                'phone_number': '+919876543299',
                'company_name': 'Test Gold Store',
                'gst': 'GST27TEST0000T1Z9',
                'address': '123 Test Street, Test City, Test State 123456',
                'user_status': True,
                'is_active': True,
            }
        )
        
        if created:
            user.set_password(TEST_PASSWORD)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Created new test user: {TEST_EMAIL}'))
        else:
            # Update existing user
            user.email = TEST_EMAIL
            user.first_name = 'Test'
            user.last_name = 'User'
            user.phone_number = '+919876543299'
            user.company_name = 'Test Gold Store'
            user.gst = 'GST27TEST0000T1Z9'
            user.address = '123 Test Street, Test City, Test State 123456'
            user.user_status = True
            user.is_active = True
            user.set_password(TEST_PASSWORD)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Updated existing test user: {TEST_EMAIL}'))

        # 2. Get or create products
        self.stdout.write('Setting up products...')
        products = Product.objects.filter(is_delete=False, product_status=True)[:5]
        if not products.exists():
            # Create a test product if none exist
            product = Product.objects.create(
                product_name='22K Gold Test Necklace',
                product_description='Test gold necklace for testing purposes',
                product_price=150000.00,
                product_image=create_dummy_image(color=(255, 215, 0)),
                product_status=True,
            )
            products = [product]
        else:
            products = list(products)

        # 3. Create Orders for test user
        self.stdout.write('Creating orders...')
        Order.objects.filter(order_user=user).delete()  # Clear existing orders
        for i in range(3):
            Order.objects.create(
                order_user=user,
                order_product=random.choice(products),
                order_quantity=random.randint(1, 2),
                order_price=float(random.choice(products).product_price * random.randint(1, 2)),
                order_status=random.choice(['pending', 'processing', 'delivered']),
                order_date=timezone.now() - timedelta(days=random.randint(1, 15)),
                order_notes=f'Test order {i+1}',
            )
        self.stdout.write(self.style.SUCCESS('✅ Created 3 orders'))

        # 4. Create CustomizeOrders for test user
        self.stdout.write('Creating customize orders...')
        CustomizeOrders.objects.filter(customize_user=user).delete()
        for i in range(2):
            CustomizeOrders.objects.create(
                customize_user=user,
                order_image=create_dummy_image(width=1200, height=800, color=(255, 215, 0)),
                order_audio=create_dummy_audio() if i == 0 else None,
                order_date=timezone.now() - timedelta(days=random.randint(1, 10)),
                order_description=f'Test custom order {i+1}: Custom gold jewelry design',
                order_status=random.choice(['pending', 'reviewing', 'in_progress']),
            )
        self.stdout.write(self.style.SUCCESS('✅ Created 2 customize orders'))

        # 5. Create AddToCart items for test user
        self.stdout.write('Creating cart items...')
        AddToCart.objects.filter(cart_user=user).delete()
        for i in range(3):
            AddToCart.objects.create(
                cart_user=user,
                cart_product=random.choice(products).product_name,
                cart_quantity=random.randint(1, 2),
                cart_status=True,
            )
        self.stdout.write(self.style.SUCCESS('✅ Created 3 cart items'))

        # 6. Get or create NotificationTypes
        self.stdout.write('Setting up notifications...')
        notification_types = []
        type_names = ['Order Update', 'Gold Rate Alert', 'New Collection', 'Account Activity', 'Jewelry Recommendation']
        for name in type_names:
            notif_type, _ = NotificationType.objects.get_or_create(
                notif_name=name,
                defaults={'notif_status': True}
            )
            notification_types.append(notif_type)

        # Create NotificationTable entries for test user
        NotificationTable.objects.filter(notification_user=user).delete()
        for i in range(5):
            NotificationTable.objects.create(
                notification_user=user,
                notification_type=random.choice(notification_types),
                notification_title=f'Test Notification {i+1}',
                notification_message=f'This is a test notification message {i+1} for the test user.',
                notification_read=random.choice([True, False]),
            )
        self.stdout.write(self.style.SUCCESS('✅ Created 5 notifications'))

        # 7. Create OrderEmails for test user
        self.stdout.write('Creating order emails...')
        OrderEmails.objects.filter(mail_to=TEST_EMAIL).delete()
        for i in range(3):
            OrderEmails.objects.create(
                mail_from='noreply@sonicgold.com',
                mail_to=TEST_EMAIL,
                mail_subject=f'Test Order Confirmation #{random.randint(1000, 9999)}',
                mail_content=f'Test order email {i+1} for testing purposes.',
                mail_user=TEST_USERNAME,
                mail_status=True,
            )
        self.stdout.write(self.style.SUCCESS('✅ Created 3 order emails'))

        # 8. Create Session for test user
        self.stdout.write('Creating session...')
        Session.objects.filter(session_user=user).delete()
        Session.objects.create(
            session_user=user,
            session_key=f'test_session_{random.randint(100000, 999999)}',
            fcm_token=f'test_fcm_token_{random.randint(100000, 999999)}',
            device_type='iOS',
            expire_date=timezone.now() + timedelta(days=30),
        )
        self.stdout.write(self.style.SUCCESS('✅ Created 1 session'))

        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('✅ TEST USER CREATED SUCCESSFULLY!'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(self.style.SUCCESS(f'\n📧 Email: {TEST_EMAIL}'))
        self.stdout.write(self.style.SUCCESS(f'🔑 Password: {TEST_PASSWORD}'))
        self.stdout.write(self.style.SUCCESS(f'\n📊 Data Summary:'))
        self.stdout.write(f'  - User: {user.username} (ID: {user.id})')
        self.stdout.write(f'  - Orders: {Order.objects.filter(order_user=user).count()}')
        self.stdout.write(f'  - Customize Orders: {CustomizeOrders.objects.filter(customize_user=user).count()}')
        self.stdout.write(f'  - Cart Items: {AddToCart.objects.filter(cart_user=user).count()}')
        self.stdout.write(f'  - Notifications: {NotificationTable.objects.filter(notification_user=user).count()}')
        self.stdout.write(f'  - Order Emails: {OrderEmails.objects.filter(mail_to=TEST_EMAIL).count()}')
        self.stdout.write(f'  - Sessions: {Session.objects.filter(session_user=user).count()}')
        self.stdout.write(self.style.SUCCESS('\n✅ Test user is ready for testing!'))

