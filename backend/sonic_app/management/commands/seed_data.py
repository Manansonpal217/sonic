"""
Django management command to populate all tables with dummy data including images.
Usage: python manage.py seed_data
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
            random.randint(0, 255),
            random.randint(0, 255),
            random.randint(0, 255)
        )
    
    img = Image.new('RGB', (width, height), color=color)
    img_io = io.BytesIO()
    img.save(img_io, format='JPEG')
    img_io.seek(0)
    return ContentFile(img_io.read(), name=f'dummy_{random.randint(1000, 9999)}.jpg')


def create_dummy_audio():
    """Create a dummy audio file (empty MP3-like file)"""
    # Create a minimal dummy audio file
    audio_content = b'\x00' * 1024  # 1KB dummy audio data
    return ContentFile(audio_content, name=f'dummy_audio_{random.randint(1000, 9999)}.mp3')


class Command(BaseCommand):
    help = 'Populate all database tables with dummy data including images'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            # Clear data in reverse order of dependencies
            Session.objects.all().delete()
            OrderEmails.objects.all().delete()
            NotificationTable.objects.all().delete()
            NotificationType.objects.all().delete()
            AddToCart.objects.all().delete()
            Order.objects.all().delete()
            CustomizeOrders.objects.all().delete()
            Banners.objects.all().delete()
            Product.objects.all().delete()
            CMS.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS('Existing data cleared.'))

        self.stdout.write(self.style.SUCCESS('Starting to seed data...'))

        # 1. Create Users
        self.stdout.write('Creating users...')
        users = []
        user_data = [
            {'username': 'priya_sharma', 'email': 'priya@example.com', 'first_name': 'Priya', 'last_name': 'Sharma',
             'phone_number': '+919876543210', 'company_name': 'Sharma Jewelers', 'gst': 'GST27AAAAA0000A1Z5',
             'address': '123 MG Road, Mumbai, Maharashtra 400001', 'password': 'password123'},
            {'username': 'raj_kumar', 'email': 'raj@example.com', 'first_name': 'Raj', 'last_name': 'Kumar',
             'phone_number': '+919876543211', 'company_name': 'Kumar Gold House', 'gst': 'GST27BBBBB0000B2Z6',
             'address': '456 Commercial Street, Delhi, Delhi 110001', 'password': 'password123'},
            {'username': 'anita_patel', 'email': 'anita@example.com', 'first_name': 'Anita', 'last_name': 'Patel',
             'phone_number': '+919876543212', 'company_name': 'Patel Ornaments', 'gst': 'GST27CCCCC0000C3Z7',
             'address': '789 Jewelry Lane, Surat, Gujarat 395001', 'password': 'password123'},
            {'username': 'vijay_singh', 'email': 'vijay@example.com', 'first_name': 'Vijay', 'last_name': 'Singh',
             'phone_number': '+919876543213', 'company_name': 'Singh Gold Palace', 'gst': 'GST27DDDDD0000D4Z8',
             'address': '321 Gold Market, Jaipur, Rajasthan 302001', 'password': 'password123'},
            {'username': 'meera_reddy', 'email': 'meera@example.com', 'first_name': 'Meera', 'last_name': 'Reddy',
             'phone_number': '+919876543214', 'company_name': 'Reddy Precious Metals', 'gst': 'GST27EEEEE0000E5Z9',
             'address': '654 Ornament Street, Hyderabad, Telangana 500001', 'password': 'password123'},
            {'username': 'demo', 'email': 'demo@sonic.com', 'first_name': 'Demo', 'last_name': 'User',
             'phone_number': '+919876543215', 'company_name': 'Sonic Gold Store', 'gst': 'GST27FFFFF0000F6Z0',
             'address': '100 Demo Street, Bangalore, Karnataka 560001', 'password': 'demo123'},
        ]
        
        for data in user_data:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'phone_number': data['phone_number'],
                    'company_name': data['company_name'],
                    'gst': data['gst'],
                    'address': data['address'],
                    'user_status': True,
                }
            )
            if created:
                user.set_password(data['password'])
                user.save()
            users.append(user)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(users)} users.'))

        # 2. Create Products (with images) - Gold Ornaments
        self.stdout.write('Creating products...')
        products = []
        # Gold color variations: (R, G, B) - gold tones range from (255, 215, 0) to (255, 223, 0)
        product_data = [
            {'name': '22K Gold Necklace Set', 'description': 'Exquisite 22 karat gold necklace set with matching earrings. Traditional design with intricate patterns. Weight: 50 grams.',
             'price': 250000.00, 'color': (255, 215, 0)},  # Gold
            {'name': '24K Gold Mangalsutra', 'description': 'Traditional 24 karat gold mangalsutra with black beads. Sacred design perfect for married women. Weight: 30 grams.',
             'price': 180000.00, 'color': (255, 223, 0)},  # Bright Gold
            {'name': '22K Gold Bangles Set', 'description': 'Set of 4 heavy gold bangles with traditional kadas design. Perfect for weddings and festivals. Weight: 80 grams.',
             'price': 400000.00, 'color': (255, 200, 0)},  # Deep Gold
            {'name': '22K Gold Ring - Solitaire', 'description': 'Elegant 22 karat gold ring with solitaire diamond. Classic design suitable for daily wear. Weight: 8 grams.',
             'price': 45000.00, 'color': (255, 218, 50)},  # Light Gold
            {'name': '22K Gold Chain - Rope', 'description': 'Heavy 22 karat gold rope chain. Unisex design, perfect for gifting. Weight: 40 grams.',
             'price': 200000.00, 'color': (255, 210, 0)},  # Medium Gold
            {'name': '22K Gold Earrings - Jhumkas', 'description': 'Traditional 22 karat gold jhumkas with intricate filigree work. Perfect for traditional occasions. Weight: 20 grams.',
             'price': 100000.00, 'color': (255, 220, 0)},  # Golden Yellow
            {'name': '22K Gold Pendant Set', 'description': 'Beautiful 22 karat gold pendant set with chain. Modern design with traditional touch. Weight: 25 grams.',
             'price': 125000.00, 'color': (255, 205, 0)},  # Rich Gold
            {'name': '22K Gold Bracelet - Kada', 'description': 'Heavy 22 karat gold kada bracelet with engraved patterns. Unisex design. Weight: 35 grams.',
             'price': 175000.00, 'color': (255, 212, 0)},  # Warm Gold
            {'name': '22K Gold Nose Pin', 'description': 'Delicate 22 karat gold nose pin with diamond. Traditional Indian design. Weight: 2 grams.',
             'price': 15000.00, 'color': (255, 225, 0)},  # Bright Yellow Gold
            {'name': '22K Gold Toe Ring Set', 'description': 'Set of 2 traditional 22 karat gold toe rings. Perfect for traditional wear. Weight: 4 grams.',
             'price': 20000.00, 'color': (255, 217, 0)},  # Soft Gold
            {'name': '22K Gold Anklet', 'description': 'Beautiful 22 karat gold anklet with bells. Traditional design with modern finish. Weight: 30 grams.',
             'price': 150000.00, 'color': (255, 208, 0)},  # Medium Bright Gold
        ]
        
        for data in product_data:
            product = Product.objects.create(
                product_name=data['name'],
                product_description=data['description'],
                product_price=data['price'],
                product_image=create_dummy_image(color=data['color']),
                product_status=True,
                product_is_parent=False,
            )
            products.append(product)
        
        # Create some parent-child product relationships (Jewelry Sets)
        parent_product = Product.objects.create(
            product_name='22K Gold Wedding Set',
            product_description='Complete wedding jewelry set including necklace, earrings, bangles, and ring. Perfect for brides.',
            product_price=850000.00,
            product_image=create_dummy_image(color=(255, 215, 0)),
            product_status=True,
            product_is_parent=True,
        )
        products.append(parent_product)
        
        # Make some products children of the parent (wedding set components)
        for child in products[:3]:
            child.product_parent_id = parent_product
            child.save()
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(products)} products.'))

        # 3. Create Orders
        self.stdout.write('Creating orders...')
        order_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        orders = []
        for i in range(20):
            product = random.choice(products)
            quantity = random.randint(1, 2)  # Usually 1-2 pieces for jewelry
            order_price = float(product.product_price * quantity)
            order = Order.objects.create(
                order_user=random.choice(users),
                order_product=product,
                order_quantity=quantity,
                order_price=order_price,
                order_status=random.choice(order_statuses),
                order_date=timezone.now() - timedelta(days=random.randint(0, 30)),
                order_notes=f'Order note {i+1}: Please ensure proper packaging and authenticity certificate' if i % 3 == 0 else None,
            )
            orders.append(order)
        self.stdout.write(self.style.SUCCESS(f'Created {len(orders)} orders.'))

        # 4. Create CustomizeOrders (with images and audio)
        self.stdout.write('Creating customize orders...')
        customize_statuses = ['pending', 'reviewing', 'in_progress', 'completed', 'rejected']
        customize_descriptions = [
            'Custom gold necklace with specific design pattern as per reference image',
            'Personalized gold ring with name engraving and custom stone setting',
            'Custom gold bangles with family initials and traditional motifs',
            'Bespoke gold pendant with religious symbol and custom size',
            'Custom gold earrings matching with existing necklace set',
            'Personalized gold chain with specific length and weight requirements',
            'Custom gold mangalsutra with unique design and specific bead pattern',
            'Bespoke gold bracelet with custom width and engraved patterns',
            'Custom gold anklet with bells and specific design elements',
            'Personalized gold jewelry set for wedding with custom specifications',
        ]
        customize_orders = []
        # Gold color variations for custom orders
        gold_colors = [(255, 215, 0), (255, 223, 0), (255, 200, 0), (255, 218, 50), (255, 210, 0)]
        for i in range(10):
            customize_order = CustomizeOrders.objects.create(
                customize_user=random.choice(users),
                order_image=create_dummy_image(width=1200, height=800, color=random.choice(gold_colors)),
                order_audio=create_dummy_audio() if i % 2 == 0 else None,
                order_date=timezone.now() - timedelta(days=random.randint(0, 20)),
                order_description=customize_descriptions[i],
                order_status=random.choice(customize_statuses),
            )
            customize_orders.append(customize_order)
        self.stdout.write(self.style.SUCCESS(f'Created {len(customize_orders)} customize orders.'))

        # 5. Create AddToCart
        self.stdout.write('Creating cart items...')
        cart_items = []
        for i in range(15):
            cart_item = AddToCart.objects.create(
                cart_user=random.choice(users),
                cart_product=random.choice(products).product_name,
                cart_quantity=random.randint(1, 3),
                cart_status=True,
            )
            cart_items.append(cart_item)
        self.stdout.write(self.style.SUCCESS(f'Created {len(cart_items)} cart items.'))

        # 6. Create Banners (with images)
        self.stdout.write('Creating banners...')
        banners = []
        # Gold and warm colors for jewelry banners
        banner_data = [
            {'title': 'Diwali Gold Sale', 'product': products[0], 'order': 1, 'color': (255, 215, 0)},  # Gold
            {'title': 'New Collection 2024', 'product': products[1], 'order': 2, 'color': (255, 200, 0)},  # Deep Gold
            {'title': 'Wedding Special', 'product': products[2], 'order': 3, 'color': (255, 223, 0)},  # Bright Gold
            {'title': 'Festival Offer', 'product': products[3], 'order': 4, 'color': (255, 210, 0)},  # Medium Gold
            {'title': 'Best Selling Jewelry', 'product': products[4], 'order': 5, 'color': (255, 218, 50)},  # Light Gold
        ]
        
        for data in banner_data:
            banner = Banners.objects.create(
                banner_title=data['title'],
                banner_image=create_dummy_image(width=1920, height=600, color=data['color']),
                banner_product_id=data['product'],
                banner_status=True,
                banner_order=data['order'],
            )
            banners.append(banner)
        self.stdout.write(self.style.SUCCESS(f'Created {len(banners)} banners.'))

        # 7. Create CMS Pages
        self.stdout.write('Creating CMS pages...')
        cms_pages = []
        cms_data = [
            {'title': 'About Us', 'slug': 'about-us', 'content': 'We are a trusted gold ornaments retailer with over 50 years of experience in the jewelry industry. We specialize in 22K and 24K gold jewelry, offering authentic, certified gold ornaments for all occasions. Our commitment to quality and customer satisfaction has made us a preferred choice for gold jewelry across India.'},
            {'title': 'Privacy Policy', 'slug': 'privacy-policy', 'content': 'Your privacy is important to us. We are committed to protecting your personal information and ensuring secure transactions. All payment details are encrypted and we never share your personal data with third parties without your consent.'},
            {'title': 'Terms of Service', 'slug': 'terms-of-service', 'content': 'By using our service, you agree to our terms and conditions. All gold jewelry comes with BIS hallmark certification. Prices are based on current gold rates and may vary. Custom orders require advance payment and are non-refundable once production begins.'},
            {'title': 'Shipping Information', 'slug': 'shipping', 'content': 'We offer secure and insured shipping for all gold jewelry orders. Standard delivery takes 5-7 business days. Express delivery available for urgent orders. All items are packed securely with proper insurance coverage. Tracking information will be provided upon shipment.'},
            {'title': 'Returns & Refunds', 'slug': 'returns', 'content': 'We accept returns within 7 days of delivery for standard items in original condition with all certificates. Custom orders are non-refundable. All returns must include original packaging, certificates, and tags. Refunds will be processed within 10-15 business days after inspection.'},
        ]
        
        for data in cms_data:
            cms, created = CMS.objects.get_or_create(
                cms_slug=data['slug'],
                defaults={
                    'cms_title': data['title'],
                    'cms_content': data['content'],
                    'cms_status': True,
                }
            )
            cms_pages.append(cms)
        self.stdout.write(self.style.SUCCESS(f'Created {len(cms_pages)} CMS pages.'))

        # 8. Create NotificationType
        self.stdout.write('Creating notification types...')
        notification_types = []
        type_data = ['Order Update', 'Gold Rate Alert', 'New Collection', 'Account Activity', 'Jewelry Recommendation']
        
        for name in type_data:
            notif_type, created = NotificationType.objects.get_or_create(
                notif_name=name,
                defaults={'notif_status': True}
            )
            notification_types.append(notif_type)
        self.stdout.write(self.style.SUCCESS(f'Created {len(notification_types)} notification types.'))

        # 9. Create NotificationTable
        self.stdout.write('Creating notifications...')
        notifications = []
        notification_titles = [
            'Your gold jewelry order has been shipped',
            'New gold collection available',
            'Special Diwali discount on gold ornaments',
            'Your gold order delivered successfully',
            'Gold rate update - Prices have changed',
            'Custom jewelry order ready for pickup',
            'Festival sale - Up to 20% off on gold jewelry',
            'Your gold jewelry is being crafted',
        ]
        
        for i in range(25):
            notification = NotificationTable.objects.create(
                notification_user=random.choice(users),
                notification_type=random.choice(notification_types),
                notification_title=random.choice(notification_titles),
                notification_message=f'This is a notification message {i+1} with important information.',
                notification_read=random.choice([True, False]),
            )
            notifications.append(notification)
        self.stdout.write(self.style.SUCCESS(f'Created {len(notifications)} notifications.'))

        # 10. Create OrderEmails
        self.stdout.write('Creating order emails...')
        order_emails = []
        email_subjects = [
            'Order Confirmation - Gold Jewelry Purchase',
            'Gold Order Shipped - Track Your Package',
            'Gold Order Delivered - Please Confirm',
            'Custom Gold Jewelry Order Update',
            'Gold Rate Alert - Best Time to Buy',
        ]
        for i in range(15):
            user = random.choice(users)
            order_email = OrderEmails.objects.create(
                mail_from='noreply@sonicgold.com',
                mail_to=user.email,
                mail_subject=f'{random.choice(email_subjects)} #{random.randint(1000, 9999)}',
                mail_content=f'Thank you for your gold jewelry order. Your order has been received and is being processed. All items come with BIS hallmark certification and authenticity guarantee.',
                mail_user=user.username,
                mail_status=True,
            )
            order_emails.append(order_email)
        self.stdout.write(self.style.SUCCESS(f'Created {len(order_emails)} order emails.'))

        # 11. Create Sessions
        self.stdout.write('Creating sessions...')
        sessions = []
        device_types = ['iOS', 'Android', 'Web']
        for i in range(10):
            user = random.choice(users)
            session = Session.objects.create(
                session_user=user,
                session_key=f'session_key_{random.randint(100000, 999999)}',
                fcm_token=f'fcm_token_{random.randint(100000, 999999)}' if i % 2 == 0 else None,
                device_type=random.choice(device_types),
                expire_date=timezone.now() + timedelta(days=30),
            )
            sessions.append(session)
        self.stdout.write(self.style.SUCCESS(f'Created {len(sessions)} sessions.'))

        self.stdout.write(self.style.SUCCESS('\n✅ Successfully seeded all tables with dummy data!'))
        self.stdout.write(self.style.SUCCESS(f'\nSummary:'))
        self.stdout.write(f'  - Users: {len(users)}')
        self.stdout.write(f'  - Products: {len(products)} (with images)')
        self.stdout.write(f'  - Orders: {len(orders)}')
        self.stdout.write(f'  - Customize Orders: {len(customize_orders)} (with images and audio)')
        self.stdout.write(f'  - Cart Items: {len(cart_items)}')
        self.stdout.write(f'  - Banners: {len(banners)} (with images)')
        self.stdout.write(f'  - CMS Pages: {len(cms_pages)}')
        self.stdout.write(f'  - Notification Types: {len(notification_types)}')
        self.stdout.write(f'  - Notifications: {len(notifications)}')
        self.stdout.write(f'  - Order Emails: {len(order_emails)}')
        self.stdout.write(f'  - Sessions: {len(sessions)}')

