import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Box, Text, Image, Screen } from '../components';
import { categoryApi, type Category } from '../api/CategoryApi';
import { useNavigation } from '@react-navigation/native';

export const CategoriesScreen = () => {
  const navigation = useNavigation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = async () => {
    try {
      const result = await categoryApi.getActiveCategories();
      if (result.isSuccess && result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const handleCategoryPress = (category: Category) => {
    // Navigate to products screen with category filter
    navigation.navigate('Products' as never, { categoryId: category.id, categoryName: category.category_name } as never);
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <Box
        backgroundColor="white"
        borderRadius="lg"
        marginHorizontal="m"
        marginBottom="m"
        padding="m"
        flexDirection="row"
        alignItems="center"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {item.category_image ? (
          <Image
            source={{ uri: `${process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '')}/media/${item.category_image}` }}
            style={{ width: 80, height: 80, borderRadius: 8 }}
          />
        ) : (
          <Box
            width={80}
            height={80}
            backgroundColor="gray"
            borderRadius="m"
            justifyContent="center"
            alignItems="center"
          >
            <Text variant="body" color="white">No Image</Text>
          </Box>
        )}
        
        <Box flex={1} marginLeft="m">
          <Text variant="header" marginBottom="xs">
            {item.category_name}
          </Text>
          {item.category_description && (
            <Text variant="body" color="gray" numberOfLines={2} marginBottom="xs">
              {item.category_description}
            </Text>
          )}
          <Text variant="caption" color="primary">
            {item.products_count} {item.products_count === 1 ? 'product' : 'products'}
          </Text>
        </Box>
        
        <Text variant="header" color="primary">›</Text>
      </Box>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <Screen>
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color="#842B25" />
        </Box>
      </Screen>
    );
  }

  return (
      <Screen>
      <Box flex={1} backgroundColor="gray5">
        <Box padding="m" backgroundColor="white">
          <Text variant="title">Categories</Text>
          <Text variant="body" color="gray" marginTop="xs">
            Browse jewelry by category
          </Text>
        </Box>

        <FlatList
          data={categories}
          renderItem={renderCategory}
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
              <Text variant="body" color="gray">
                No categories available
              </Text>
            </Box>
          }
        />
      </Box>
    </Screen>
  );
};


