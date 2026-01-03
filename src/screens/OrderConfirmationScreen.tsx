import React from 'react';
import { ScrollView } from 'react-native';
import { Box, Text, Button, Screen, Pressable } from '../components';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fonts } from '../style';

export const OrderConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { order } = route.params as any;

  const handleContinueShopping = () => {
    navigation.navigate('Dashboard' as never);
  };

  const handleViewOrders = () => {
    navigation.navigate('Orders' as never);
  };

  return (
      <Screen>
      <ScrollView>
        <Box padding="m" backgroundColor="gray5" flex={1}>
          <Box
            backgroundColor="white"
            borderRadius="lg"
            padding="xl"
            alignItems="center"
            marginBottom="m"
          >
            <Box
              width={80}
              height={80}
              borderRadius="full"
              backgroundColor="red3"
              justifyContent="center"
              alignItems="center"
              marginBottom="m"
            >
              <Text variant="title" color="white">✓</Text>
            </Box>
            
            <Text variant="title" textAlign="center" marginBottom="s">
              Order Placed Successfully!
            </Text>
            
            <Text variant="body" color="gray" textAlign="center" marginBottom="m">
              Your order has been received and is being processed
            </Text>
            
            <Box
              backgroundColor="gray5"
              borderRadius="m"
              padding="m"
              width="100%"
            >
              <Box flexDirection="row" justifyContent="space-between" marginBottom="s">
                <Text variant="body" color="gray">Order Number:</Text>
                <Text variant="body" fontWeight="bold">#{order?.id}</Text>
              </Box>
              
              <Box flexDirection="row" justifyContent="space-between" marginBottom="s">
                <Text variant="body" color="gray">Total Amount:</Text>
                <Text variant="body" fontWeight="bold" color="primary">
                  ₹{order?.order_total_price || order?.order_price}
                </Text>
              </Box>
              
              <Box flexDirection="row" justifyContent="space-between">
                <Text variant="body" color="gray">Status:</Text>
                <Text variant="body" fontWeight="bold" color="red3">
                  {order?.order_status || 'Pending'}
                </Text>
              </Box>
            </Box>
          </Box>

          <Box backgroundColor="white" borderRadius="lg" padding="m" marginBottom="m">
            <Text variant="header" marginBottom="m">What's Next?</Text>
            <Text variant="body" color="gray" marginBottom="s">
              • You will receive a confirmation notification
            </Text>
            <Text variant="body" color="gray" marginBottom="s">
              • Our team will contact you for delivery details
            </Text>
            <Text variant="body" color="gray">
              • Track your order status in your profile
            </Text>
          </Box>

          <Box marginTop="m" paddingHorizontal="m" marginBottom="xl">
            {/* Continue Shopping Button - Primary */}
            <Pressable onPress={handleContinueShopping}>
              <Box
                backgroundColor="red3"
                borderRadius={12}
                paddingVertical="m"
                paddingHorizontal="m"
                alignItems="center"
                justifyContent="center"
                marginBottom="m"
                style={{
                  shadowColor: '#842B25',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Text
                  fontSize={16}
                  fontFamily={fonts.bold}
                  color="white"
                  letterSpacing={0.5}
                >
                  Continue Shopping
                </Text>
              </Box>
            </Pressable>
            
            {/* View My Orders Button - Secondary/Outline */}
            <Pressable onPress={handleViewOrders}>
              <Box
                backgroundColor="white"
                borderRadius={12}
                paddingVertical="m"
                paddingHorizontal="m"
                alignItems="center"
                justifyContent="center"
                style={{
                  borderWidth: 2,
                  borderColor: '#842B25',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Text
                  fontSize={16}
                  fontFamily={fonts.bold}
                  color="red3"
                  letterSpacing={0.5}
                >
                  View My Orders
                </Text>
              </Box>
            </Pressable>
          </Box>
        </Box>
      </ScrollView>
    </Screen>
  );
};


