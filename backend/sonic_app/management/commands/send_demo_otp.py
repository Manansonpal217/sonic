"""
Send a demo OTP SMS to a phone number (default: 9484796938).
Requires PEARLSMS_API_KEY in .env (e.g. 154b553724394f84bb1a718e3bc90a81).

Usage:
  python manage.py send_demo_otp
  python manage.py send_demo_otp 9876543210
"""
import random
from django.core.management.base import BaseCommand
from sonic_app.services import OTPSmsService


class Command(BaseCommand):
    help = 'Send a demo OTP SMS via Pearl SMS (default number: 9484796938)'

    def add_arguments(self, parser):
        parser.add_argument(
            'number',
            nargs='?',
            default='9484796938',
            help='Phone number to send demo OTP to (default: 9484796938)',
        )

    def handle(self, *args, **options):
        number = str(options['number']).strip()
        otp_code = str(random.randint(100000, 999999))
        message = (
            f"Your OTP is {otp_code}. Use this to verify your mobile number on SONIC JEWELLERS. "
            "Valid for 5 minutes."
        )

        self.stdout.write(f"Sending OTP to {number} ...")
        result = OTPSmsService.send_otp(number, otp_code)

        if result['success']:
            self.stdout.write(self.style.SUCCESS(f'Demo OTP sent to {number}. OTP: {otp_code}'))
        else:
            self.stdout.write(self.style.ERROR(f'Failed: {result.get("message", "Unknown error")}'))
            if result.get('provider_response'):
                self.stdout.write(str(result['provider_response']))
