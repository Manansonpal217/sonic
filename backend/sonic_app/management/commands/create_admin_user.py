"""
Create or reset the admin panel user (admin@sonic.com / Admin@123).
Usage: python manage.py create_admin_user

Run this against your production DB (e.g. on DigitalOcean run command, or locally with DATABASE_URL set)
to ensure the Inara Admin login works.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

ADMIN_EMAIL = "admin@sonic.com"
ADMIN_USERNAME = "admin@sonic.com"
ADMIN_PASSWORD = "Admin@123"


class Command(BaseCommand):
    help = "Creates or resets the admin panel user (admin@sonic.com)"

    def handle(self, *args, **options):
        user = User.objects.filter(email=ADMIN_EMAIL, is_delete=False).first()
        created = False
        if user:
            user.username = ADMIN_USERNAME
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True
            user.is_delete = False
        else:
            user = User(
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                is_active=True,
                is_staff=True,
                is_superuser=True,
            )
            created = True
        user.set_password(ADMIN_PASSWORD)
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created admin user: {ADMIN_EMAIL}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Reset password for existing admin: {ADMIN_EMAIL}"))
        self.stdout.write(self.style.SUCCESS(f"  Email: {ADMIN_EMAIL}"))
        self.stdout.write(self.style.SUCCESS(f"  Password: {ADMIN_PASSWORD}"))
