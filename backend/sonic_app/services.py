"""
Service utilities for sonic_app
"""
import logging
import requests
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import NotificationTable, User, NotificationType

logger = logging.getLogger(__name__)


def normalize_phone(phone: str) -> str:
    """Normalize phone number to digits only for consistent storage and lookup."""
    if not phone:
        return ""
    s = str(phone).strip().replace(" ", "").replace("-", "")
    return "".join(c for c in s if c.isdigit()) or ""


# OTP SMS message template. {#var#} is replaced with the actual OTP code.
OTP_MESSAGE_TEMPLATE = (
    "Hello, customer your OTP for your login at Sonic Jewellers app {#var#}, thank you."
)


class OTPSmsService:
    """Send OTP via Pearl SMS API."""

    BASE_URL = "http://sms.pearlsms.com/public/sms/send"

    @classmethod
    def send_otp(cls, phone_number: str, otp_code: str) -> dict:
        """
        Send OTP SMS to the given phone number using Pearl SMS.

        Args:
            phone_number: Recipient number (digits only, e.g. 9484796938)
            otp_code: 6-digit OTP string

        Returns:
            dict: {'success': bool, 'message': str, 'provider_response': dict or None}
        """
        api_key = getattr(settings, 'PEARLSMS_API_KEY', None) or ''
        sender = getattr(settings, 'PEARLSMS_SENDER', 'SPPLFW')
        base_url = getattr(settings, 'PEARLSMS_BASE_URL', cls.BASE_URL)

        if not api_key:
            logger.warning("PEARLSMS_API_KEY not set; OTP SMS skipped (check server logs for OTP in dev).")
            return {'success': False, 'message': 'SMS not configured', 'provider_response': None}

        # Normalize number: strip spaces and ensure string
        numbers = str(phone_number).strip().replace(' ', '')
        message = OTP_MESSAGE_TEMPLATE.replace('{#var#}', otp_code)

        params = {
            'sender': sender,
            'smstype': 'TRANS',
            'numbers': numbers,
            'message': message,
            'unicode': 'no',
            'apikey': api_key,
        }

        try:
            # Use 8s timeout so background send does not hang; caller may run in a thread
            resp = requests.post(base_url, params=params, timeout=8)
            data = {}
            try:
                data = resp.json()
            except Exception:
                data = {'raw': resp.text}

            if resp.status_code == 200 and data.get('status') in ('OK', 'SUCCESS'):
                return {'success': True, 'message': 'SMS sent', 'provider_response': data}
            err_msg = data.get('errormsg', data.get('message', resp.text))
            logger.warning("Pearl SMS error: %s", err_msg)
            return {'success': False, 'message': str(err_msg), 'provider_response': data}
        except requests.RequestException as e:
            logger.exception("Pearl SMS request failed: %s", e)
            return {'success': False, 'message': str(e), 'provider_response': None}


class NotificationService:
    """Service for sending notifications via WebSocket and storing in database"""
    
    @staticmethod
    def send_notification(user_ids, notification_type_id, title, message):
        """
        Send notification to specified users via WebSocket and store in database
        
        Args:
            user_ids (list): List of user IDs to send notification to
            notification_type_id (int): ID of the notification type
            title (str): Notification title
            message (str): Notification message
            
        Returns:
            dict: Dictionary with success status and created notification IDs
        """
        channel_layer = get_channel_layer()
        created_notifications = []
        
        try:
            notification_type = NotificationType.objects.get(notif_id=notification_type_id)
        except NotificationType.DoesNotExist:
            return {
                'success': False,
                'error': 'Notification type not found'
            }
        
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                
                # Create notification in database
                notification = NotificationTable.objects.create(
                    notification_user=user,
                    notification_type=notification_type,
                    notification_title=title,
                    notification_message=message,
                    notification_read=False
                )
                
                created_notifications.append(notification.id)
                
                # Send via WebSocket
                group_name = f'notifications_{user_id}'
                notification_data = {
                    'id': notification.id,
                    'title': title,
                    'message': message,
                    'type': notification_type.notif_name,
                    'read': False,
                    'created_at': notification.created_at.isoformat()
                }
                
                # Send to WebSocket group
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        'type': 'notification_message',
                        'notification': notification_data
                    }
                )
                
            except User.DoesNotExist:
                continue
        
        return {
            'success': True,
            'notifications_created': len(created_notifications),
            'notification_ids': created_notifications
        }
    
    @staticmethod
    def send_notification_to_all(notification_type_id, title, message, exclude_ids=None):
        """
        Send notification to all active users
        
        Args:
            notification_type_id (int): ID of the notification type
            title (str): Notification title
            message (str): Notification message
            exclude_ids (list, optional): List of user IDs to exclude
            
        Returns:
            dict: Dictionary with success status and created notification IDs
        """
        exclude_ids = exclude_ids or []
        active_users = User.objects.filter(
            is_active=True,
            is_delete=False
        ).exclude(id__in=exclude_ids)
        
        user_ids = list(active_users.values_list('id', flat=True))
        
        return NotificationService.send_notification(
            user_ids=user_ids,
            notification_type_id=notification_type_id,
            title=title,
            message=message
        )
    
    @staticmethod
    def mark_notification_read(notification_id, user_id):
        """
        Mark a notification as read
        
        Args:
            notification_id (int): ID of the notification
            user_id (int): ID of the user
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            notification = NotificationTable.objects.get(
                id=notification_id,
                notification_user_id=user_id
            )
            notification.notification_read = True
            notification.save()
            return True
        except NotificationTable.DoesNotExist:
            return False




