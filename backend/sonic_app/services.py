"""
Service utilities for sonic_app
"""
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import NotificationTable, User, NotificationType


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


