"""
WebSocket consumers for real-time notifications
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications
    
    Connects users to their personal notification channel
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        # Get user from scope (set by AuthMiddlewareStack)
        self.user = self.scope.get('user')
        
        # Accept anonymous connections for now, but could enforce auth here
        if self.user and self.user.is_authenticated:
            # Create a unique group name for this user
            self.group_name = f'notifications_{self.user.id}'
            
            # Add this connection to the user's notification group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            
            await self.accept()
            
            # Send welcome message
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Connected to notification service'
            }))
        else:
            # For unauthenticated users, we can still accept but won't add to groups
            await self.accept()
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Connected (unauthenticated)'
            }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if self.user and self.user.is_authenticated:
            # Remove from notification group
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle messages received from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'unknown')
            
            # Handle ping messages for keep-alive
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            
            # Handle mark as read requests
            elif message_type == 'mark_read':
                notification_id = data.get('notification_id')
                if notification_id:
                    await self.mark_notification_read(notification_id)
                    await self.send(text_data=json.dumps({
                        'type': 'marked_read',
                        'notification_id': notification_id
                    }))
        
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def notification_message(self, event):
        """
        Handle notification messages sent to this consumer's group
        This is called when channel_layer.group_send is used
        """
        # Send the notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark a notification as read in the database"""
        from sonic_app.models import NotificationTable
        try:
            notification = NotificationTable.objects.get(
                id=notification_id,
                notification_user=self.user
            )
            notification.notification_read = True
            notification.save()
            return True
        except NotificationTable.DoesNotExist:
            return False


