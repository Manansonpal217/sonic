"""
Tests for OTP-based passwordless login (send_otp, verify_otp).
"""
from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIClient
from django.utils import timezone
from datetime import timedelta

from sonic_app.models import User, OTP, Session


class SendOTPTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.send_otp_url = '/app/send-otp'

    @patch('sonic_app.views.OTPSmsService.send_otp')
    def test_send_otp_valid_phone_returns_200_and_creates_otp(self, mock_send):
        mock_send.return_value = {'success': True, 'message': 'SMS sent'}
        response = self.client.post(
            self.send_otp_url,
            {'phone_number': '9876543210'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('phone_number', response.data)
        self.assertIn('expires_at', response.data)
        self.assertEqual(OTP.objects.filter(phone_number='9876543210').count(), 1)

    def test_send_otp_invalid_phone_returns_400(self):
        response = self.client.post(
            self.send_otp_url,
            {'phone_number': '123'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)

    def test_send_otp_missing_phone_returns_400(self):
        response = self.client.post(
            self.send_otp_url,
            {},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    @patch('sonic_app.views.OTPSmsService.send_otp')
    def test_send_otp_rate_limit_returns_429_after_max_sends(self, mock_send):
        mock_send.return_value = {'success': True}
        from sonic_app.views import MAX_OTP_SENDS_PER_HOUR
        phone = '9999888877'
        for _ in range(MAX_OTP_SENDS_PER_HOUR):
            self.client.post(
                self.send_otp_url,
                {'phone_number': phone},
                format='json',
            )
        response = self.client.post(
            self.send_otp_url,
            {'phone_number': phone},
            format='json',
        )
        self.assertEqual(response.status_code, 429)
        self.assertIn('error', response.data)


class VerifyOTPTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.verify_otp_url = '/app/verify-otp'

    def _create_otp(self, phone_number, otp_code, expires_in_minutes=5):
        expires_at = timezone.now() + timedelta(minutes=expires_in_minutes)
        return OTP.objects.create(
            phone_number=phone_number,
            otp_code=otp_code,
            expires_at=expires_at,
            is_verified=False,
            attempts=0,
        )

    @patch('sonic_app.views.OTPSmsService.send_otp')
    def test_verify_otp_success_returns_token_and_sets_phone_verified(self, mock_send):
        mock_send.return_value = {'success': True}
        phone = '9876543210'
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password=None,
            phone_number=phone,
            is_approved=True,
            is_delete=False,
        )
        user.set_unusable_password()
        user.save()

        self._create_otp(phone, '123456')
        response = self.client.post(
            self.verify_otp_url,
            {'phone_number': phone, 'otp_code': '123456'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        user.refresh_from_db()
        self.assertTrue(user.is_phone_verified)
        otp = OTP.objects.get(phone_number=phone, otp_code='123456')
        self.assertTrue(otp.is_verified)

    def test_verify_otp_invalid_code_returns_400(self):
        phone = '9876543210'
        self._create_otp(phone, '123456')
        User.objects.create_user(
            username='u2',
            email='u2@example.com',
            password=None,
            phone_number=phone,
            is_approved=True,
            is_delete=False,
        )
        response = self.client.post(
            self.verify_otp_url,
            {'phone_number': phone, 'otp_code': '000000'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)

    def test_verify_otp_expired_returns_400(self):
        phone = '9876543210'
        expires_at = timezone.now() - timedelta(minutes=1)
        OTP.objects.create(
            phone_number=phone,
            otp_code='123456',
            expires_at=expires_at,
            is_verified=False,
            attempts=0,
        )
        User.objects.create_user(
            username='u3',
            email='u3@example.com',
            password=None,
            phone_number=phone,
            is_approved=True,
            is_delete=False,
        )
        response = self.client.post(
            self.verify_otp_url,
            {'phone_number': phone, 'otp_code': '123456'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)

    @patch('sonic_app.views.OTPSmsService.send_otp')
    def test_verify_otp_creates_new_user_when_no_user_exists(self, mock_send):
        mock_send.return_value = {'success': True}
        phone = '7777666655'
        self._create_otp(phone, '111222')
        response = self.client.post(
            self.verify_otp_url,
            {'phone_number': phone, 'otp_code': '111222'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)
        user = User.objects.get(phone_number=phone)
        self.assertTrue(user.is_approved)
        self.assertTrue(user.is_phone_verified)
        session = Session.objects.filter(session_user=user).first()
        self.assertIsNotNone(session)
        self.assertEqual(session.auth_token, response.data['token'])

    @patch('sonic_app.views.OTPSmsService.send_otp')
    def test_verify_otp_unapproved_user_returns_403(self, mock_send):
        mock_send.return_value = {'success': True}
        phone = '6666555544'
        user = User.objects.create_user(
            username='unapproved',
            email='u@example.com',
            password=None,
            phone_number=phone,
            is_approved=False,
            is_delete=False,
        )
        user.set_unusable_password()
        user.save()
        self._create_otp(phone, '555666')
        response = self.client.post(
            self.verify_otp_url,
            {'phone_number': phone, 'otp_code': '555666'},
            format='json',
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn('error', response.data)
