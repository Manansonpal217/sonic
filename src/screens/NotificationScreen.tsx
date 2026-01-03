import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Box, Text, Screen, CommonHeader, StatusBarType } from '../components';
import { getNotificationService, type Notification } from '../services/NotificationService';
import { getHttp } from '../core';
import { BASE_URL } from '../api/EndPoint';
import { goBack } from '../navigation/AppNavigation';
import { fonts } from '../style';

export const NotificationScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);

  const notificationService = getNotificationService();

  const loadNotifications = async () => {
    try {
      const http = getHttp();
      // Use full URL like other endpoints
      const notificationsUrl = `${BASE_URL}/notifications/`;
      console.log('Loading notifications from:', notificationsUrl);
      const result = await http.get<any>(notificationsUrl);
      
      console.log('Notifications API response:', {
        isSuccess: result.isSuccess,
        hasData: !!result.data,
        dataType: typeof result.data,
        error: result.error,
      });
      
      if (result.isSuccess && result.data) {
        const notificationList = result.data.results || result.data || [];
        console.log('Raw notifications:', notificationList);
        console.log('Number of notifications:', notificationList.length);
        
        // Map API response to Notification interface
        // Backend fields: notification_title, notification_message, notification_read, notification_type_name
        const mappedNotifications = notificationList.map((notif: any) => ({
          id: notif.id,
          title: notif.notification_title || notif.title || 'Notification',
          message: notif.notification_message || notif.message || '',
          type: notif.notification_type_name || notif.notification_type?.notif_name || notif.type || 'general',
          read: notif.notification_read !== undefined ? notif.notification_read : (notif.read !== undefined ? notif.read : false),
          created_at: notif.created_at || new Date().toISOString(),
        }));
        
        console.log('Mapped notifications:', mappedNotifications);
        setNotifications(mappedNotifications);
      } else {
        console.warn('Failed to load notifications:', result.error);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Connect to WebSocket
    notificationService.connect();

    // Subscribe to new notifications
    const unsubscribeNotification = notificationService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    // Subscribe to connection status
    const unsubscribeConnection = notificationService.onConnectionChange((isConnected) => {
      setConnected(isConnected);
    });

    // Cleanup
    return () => {
      unsubscribeNotification();
      unsubscribeConnection();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      try {
        // Mark as read via API
        const http = getHttp();
        const markReadUrl = `${BASE_URL}/notifications/${notification.id}/mark_read/`;
        const result = await http.patch<any>(markReadUrl, {});
        
        if (result && result.isSuccess) {
          // Also mark via WebSocket if connected
          notificationService.markAsRead(notification.id);
          
          // Update local state
          setNotifications(prev =>
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
          );
        }
      } catch (error: any) {
        console.warn('Error marking notification as read:', error?.message);
        // Still update local state even if API call fails
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      }
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <Box
        backgroundColor={item.read ? 'white' : 'gray5'}
        borderRadius={12}
        marginHorizontal="m"
        marginBottom="m"
        padding="m"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Box flexDirection="row" justifyContent="space-between" marginBottom="xs">
          <Text fontSize={16} fontFamily={fonts.bold} flex={1}>
            {item.title}
          </Text>
          {!item.read && (
            <Box
              width={8}
              height={8}
              borderRadius={4}
              backgroundColor="red3"
              marginLeft="s"
            />
          )}
        </Box>
        
        {item.message && (
          <Text fontSize={14} fontFamily={fonts.regular} color="gray" marginBottom="xs">
            {item.message}
          </Text>
        )}
        
        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text fontSize={12} fontFamily={fonts.regular} color="gray">
            {item.type}
          </Text>
          <Text fontSize={12} fontFamily={fonts.regular} color="gray">
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </Box>
      </Box>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
        <CommonHeader
          label="Notifications"
          onBackPress={goBack}
        />
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color="#842B25" />
        </Box>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
      <CommonHeader
        label="Notifications"
        onBackPress={goBack}
      />
      <Box flex={1} backgroundColor="white">
        <Box padding="m" backgroundColor="white">
          <Box flexDirection="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Text fontSize={12} fontFamily={fonts.regular} color="gray" marginTop="xs">
                {notifications.filter(n => !n.read).length} unread
              </Text>
            </Box>
            <Box
              width={10}
              height={10}
              borderRadius={5}
              backgroundColor={connected ? 'red3' : 'gray'}
            />
          </Box>
        </Box>

        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#842B25']}
            />
          }
          ListEmptyComponent={
            <Box padding="xl" alignItems="center">
              <Text fontSize={14} fontFamily={fonts.regular} color="gray">
                No notifications yet
              </Text>
            </Box>
          }
        />
      </Box>
    </Screen>
  );
};


