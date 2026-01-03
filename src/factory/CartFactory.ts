import { getHttp } from '../core/Http';
import { CART_LIST, CART_CLEAR, BASE_URL } from '../api/EndPoint';
import {
	CartListApiResponse,
	CartApiResponse,
	AddToCartApiParams,
	UpdateCartItemApiParams,
	ClearCartApiParams,
	ClearCartApiResponse,
} from '../api/CartApi';
import { authStore } from '../stores/AuthStore';

class CartFactory {
	/**
	 * Get cart list for the logged-in user
	 */
	async getCartListApi(): Promise<{
		isSuccess: boolean;
		data?: CartListApiResponse;
		error?: string;
	}> {
		try {
			const user = authStore?.loginData?.user;
			if (!user) {
				return {
					isSuccess: false,
					error: 'User not logged in',
				};
			}

			// Get user ID from user object (check multiple possible field names)
			let userId = user?.id || user?.user_id || user?.pk || user?.userId;
			
			// If user ID is not found, try to fetch it using email or username
			if (!userId) {
				try {
					const http = getHttp();
					const userEmail = user?.email || user?.userEmail;
					const userName = user?.username || user?.userName;
					
					if (userEmail || userName) {
						const searchParam = userEmail ? `email=${userEmail}` : `username=${userName}`;
						// Use full URL like other endpoints
						const usersUrl = `${BASE_URL}/users/?${searchParam}`;
						const userResult = await http.get<any>(usersUrl);
						
						if (userResult && userResult.isSuccess && userResult.data) {
							const users = userResult.data.results || userResult.data || [];
							if (users.length > 0) {
								userId = users[0].id;
							}
						}
					}
				} catch (error: any) {
					// Silently handle errors
					if (error?.message && !error.message.includes('timeout')) {
						console.warn('Failed to fetch user ID:', error?.message);
					}
				}
			}
			
			// If still no userId, return empty cart instead of error
			if (!userId) {
				return {
					isSuccess: true,
					data: {
						count: 0,
						next: null,
						previous: null,
						results: [],
					},
				};
			}

			const http = getHttp();
			// CART_LIST() returns full URL, append query params
			const url = `${CART_LIST()}?user_id=${userId}`;
			
			console.log('Fetching cart from URL:', url);
			const result = await http.get<CartListApiResponse>(url);
			
			console.log('Cart API Response:', {
				isSuccess: result.isSuccess,
				hasData: !!result.data,
				error: result.error,
			});

			return {
				isSuccess: result.isSuccess,
				data: result.data,
				error: result.error,
			};
		} catch (error: any) {
			return {
				isSuccess: false,
				error: error?.message || 'Failed to fetch cart items',
			};
		}
	}

	/**
	 * Get all cart items for user (including inactive ones)
	 * This is used to check for duplicates before adding
	 * Note: The backend filters by cart_status=True when using user_id,
	 * so we use cart_user filter to get ALL items regardless of status
	 */
	private async getAllCartItemsApi(userId: number): Promise<CartItem[]> {
		try {
			const http = getHttp();
			// Use cart_user filter to get ALL items (not filtered by status)
			// The user_id filter only returns cart_status=True items
			const url = `${CART_LIST()}?cart_user=${userId}`;
			const result = await http.get<CartListApiResponse>(url);
			
			if (result.isSuccess && result.data) {
				const items = result.data.results || [];
				console.log(`Found ${items.length} cart items for user ${userId} (all statuses)`);
				return items;
			}
			
			return [];
		} catch (error: any) {
			console.warn('Failed to fetch all cart items:', error);
			return [];
		}
	}

	/**
	 * Add item to cart
	 */
	async addToCartApi(params: AddToCartApiParams): Promise<{
		isSuccess: boolean;
		data?: CartApiResponse;
		error?: string;
	}> {
		try {
			// First, check if item already exists (including inactive items)
			// The unique constraint includes cart_status, so we need to check all items
			const user = authStore?.loginData?.user;
			let userId: number | undefined;
			
			if (user) {
				userId = user?.id || user?.user_id || user?.pk || user?.userId;
			}
			
			// Also get userId from params if not available from user object
			if (!userId && params.cart_user) {
				userId = params.cart_user;
			}
			
			// Normalize product ID for comparison
			const paramProductId = typeof params.cart_product === 'object'
				? params.cart_product?.id?.toString()
				: params.cart_product?.toString();
			
			console.log('Adding to cart - Product ID:', paramProductId, 'User ID:', userId, 'Params cart_user:', params.cart_user);
			
			// Pre-check for existing items
			if (userId && params.cart_user === userId) {
				const allCartItems = await this.getAllCartItemsApi(userId);
				console.log('Pre-check: Found', allCartItems.length, 'cart items');
				
					const existingItem = allCartItems.find((item: any) => {
						// cart_product can be an object (ForeignKey) or a number/string
						let itemProductId: string;
						if (typeof item.cart_product === 'object' && item.cart_product !== null) {
							itemProductId = item.cart_product?.id?.toString() || item.cart_product?.toString();
						} else {
							itemProductId = item.cart_product?.toString();
						}
						
						// Check if product matches AND if it has the same status we're trying to create
						// OR if it exists with any status (we'll update it)
						const productMatches = itemProductId === paramProductId;
						const userMatches = item.cart_user === userId || item.cart_user?.id === userId;
						
						if (productMatches && userMatches) {
							console.log('Found existing cart item:', {
								id: item.id,
								status: item.cart_status,
								quantity: item.cart_quantity,
								productId: itemProductId,
								targetProductId: paramProductId
							});
						}
						
						return productMatches && userMatches;
					});
				
				if (existingItem) {
					// Item exists (could be active or inactive), update it instead
					console.log('Updating existing cart item instead of creating new one');
					const newQuantity = (existingItem.cart_quantity || 0) + (params.cart_quantity || 1);
					const updateResult = await this.updateCartItemApi(existingItem.id, {
						cart_quantity: newQuantity,
						cart_status: true, // Reactivate if it was inactive
					});
					
					if (updateResult.isSuccess) {
						console.log('Successfully updated existing cart item');
						return {
							isSuccess: true,
							data: updateResult.data,
							error: undefined,
						};
					} else {
						console.warn('Failed to update existing item:', updateResult.error);
					}
				}
			}

			// If no existing item found, try to add new one
			console.log('No existing item found, attempting to create new cart item');
			const http = getHttp();
			const result = await http.post<CartApiResponse>(CART_LIST(), params);

			// If error is about duplicate item, try to update existing item instead
			if (!result.isSuccess && result.error) {
				const isDuplicateError = result.error.includes('unique') || 
					result.error.includes('already in your cart') ||
					result.error.includes('unique set') ||
					result.error.includes('must make a unique');
				
				if (isDuplicateError) {
					console.log('Duplicate error detected, attempting to find and update existing item');
					console.log('Error details:', result.error);
					console.log('Params:', { cart_user: params.cart_user, cart_product: params.cart_product, cart_status: params.cart_status });
					
					// Try to find and update the existing cart item
					try {
						// Ensure we have userId - use params.cart_user as fallback
						const recoveryUserId = userId || params.cart_user;
						if (recoveryUserId) {
							console.log('Fetching all cart items for error recovery, userId:', recoveryUserId);
							const allCartItems = await this.getAllCartItemsApi(recoveryUserId);
							console.log('Error recovery: Found', allCartItems.length, 'cart items');
							
							// Log all items for debugging
							allCartItems.forEach((item: any, index: number) => {
								const itemProductId = typeof item.cart_product === 'object' 
									? item.cart_product?.id?.toString()
									: item.cart_product?.toString();
								console.log(`Cart item ${index}:`, {
									id: item.id,
									productId: itemProductId,
									targetProductId: paramProductId,
									userId: item.cart_user,
									targetUserId: recoveryUserId,
									status: item.cart_status,
									quantity: item.cart_quantity
								});
							});
							
							// Try direct API query with exact parameters
							const http = getHttp();
							const directQueryUrl = `${CART_LIST()}?cart_user=${recoveryUserId}&cart_product=${paramProductId}`;
							console.log('Trying direct query:', directQueryUrl);
							const directResult = await http.get<CartListApiResponse>(directQueryUrl);
							
							if (directResult.isSuccess && directResult.data) {
								const directItems = directResult.data.results || [];
								console.log('Direct query found', directItems.length, 'items');
								directItems.forEach((item: any) => {
									console.log('Direct query item:', {
										id: item.id,
										product: item.cart_product,
										user: item.cart_user,
										status: item.cart_status,
										quantity: item.cart_quantity
									});
								});
								
								// Use direct query results if available
								const existingItem = directItems.find((item: any) => {
									const itemProductId = typeof item.cart_product === 'object' 
										? item.cart_product?.id?.toString()
										: item.cart_product?.toString();
									const productMatches = itemProductId === paramProductId;
									const userMatches = item.cart_user === recoveryUserId || item.cart_user?.id === recoveryUserId;
									const statusMatches = item.cart_status === params.cart_status;
									
									console.log('Direct query check:', {
										itemId: item.id,
										itemProductId,
										paramProductId,
										productMatches,
										userMatches,
										statusMatches,
										matches: productMatches && userMatches
									});
									
									return productMatches && userMatches;
								}) || allCartItems.find((item: any) => {
									// cart_product can be an object (ForeignKey) or a number/string
									let itemProductId: string;
									if (typeof item.cart_product === 'object' && item.cart_product !== null) {
										itemProductId = item.cart_product?.id?.toString() || item.cart_product?.toString();
									} else {
										itemProductId = item.cart_product?.toString();
									}
									
									const productMatches = itemProductId === paramProductId;
									const userMatches = item.cart_user === recoveryUserId || item.cart_user?.id === recoveryUserId;
									
									return productMatches && userMatches;
								});
								
								if (existingItem) {
									console.log('Found existing item in error recovery:', {
										id: existingItem.id,
										status: existingItem.cart_status,
										quantity: existingItem.cart_quantity
									});
									const newQuantity = (existingItem.cart_quantity || 0) + (params.cart_quantity || 1);
									console.log('Updating quantity from', existingItem.cart_quantity, 'to', newQuantity);
									
									const updateResult = await this.updateCartItemApi(existingItem.id, {
										cart_quantity: newQuantity,
										cart_status: true, // Reactivate if it was inactive
									});
									
									if (updateResult.isSuccess) {
										console.log('Successfully recovered by updating existing item');
										return {
											isSuccess: true,
											data: updateResult.data,
											error: undefined,
										};
									} else {
										console.warn('Failed to update in error recovery:', updateResult.error);
									}
								} else {
									console.warn('Duplicate error but could not find existing item even with direct query');
									console.warn('Searched', allCartItems.length, 'items from getAllCartItemsApi and', directItems.length, 'from direct query');
								}
							} else {
								console.warn('Direct query failed:', directResult.error);
							}
						} else {
							console.warn('No userId available for error recovery');
						}
					} catch (updateError) {
						// If update fails, return the original error
						console.error('Error in duplicate recovery:', updateError);
					}
				}
			}

			return {
				isSuccess: result.isSuccess,
				data: result.data,
				error: result.error,
			};
		} catch (error: any) {
			console.error('Exception in addToCartApi:', error);
			return {
				isSuccess: false,
				error: error?.message || 'Failed to add item to cart',
			};
		}
	}

	/**
	 * Update cart item (quantity, status, etc.)
	 */
	async updateCartItemApi(
		cartId: number,
		params: UpdateCartItemApiParams
	): Promise<{
		isSuccess: boolean;
		data?: CartApiResponse;
		error?: string;
	}> {
		try {
			const http = getHttp();
			const result = await http.patch<CartApiResponse>(
				`${CART_LIST()}${cartId}/`,
				params
			);

			return {
				isSuccess: result.isSuccess,
				data: result.data,
				error: result.error,
			};
		} catch (error: any) {
			return {
				isSuccess: false,
				error: error?.message || 'Failed to update cart item',
			};
		}
	}

	/**
	 * Delete cart item
	 */
	async deleteCartItemApi(cartId: number): Promise<{
		isSuccess: boolean;
		error?: string;
	}> {
		try {
			const http = getHttp();
			const result = await http.delete(`${CART_LIST()}${cartId}/`);

			return {
				isSuccess: result.isSuccess,
				error: result.error,
			};
		} catch (error: any) {
			return {
				isSuccess: false,
				error: error?.message || 'Failed to delete cart item',
			};
		}
	}

	/**
	 * Clear entire cart for user
	 */
	async clearCartApi(): Promise<{
		isSuccess: boolean;
		data?: ClearCartApiResponse;
		error?: string;
	}> {
		try {
			const user = authStore?.loginData?.user;
			if (!user) {
				return {
					isSuccess: false,
					error: 'User not logged in',
				};
			}

			// Get user ID from user object (check multiple possible field names)
			let userId = user?.id || user?.user_id || user?.pk || user?.userId;
			
			// If user ID is not found, try to fetch it using email or username
			if (!userId) {
				try {
					const http = getHttp();
					const userEmail = user?.email || user?.userEmail;
					const userName = user?.username || user?.userName;
					
					if (userEmail || userName) {
						const searchParam = userEmail ? `email=${userEmail}` : `username=${userName}`;
						// Use full URL like other endpoints
						const usersUrl = `${BASE_URL}/users/?${searchParam}`;
						const userResult = await http.get<any>(usersUrl);
						
						if (userResult && userResult.isSuccess && userResult.data) {
							const users = userResult.data.results || userResult.data || [];
							if (users.length > 0) {
								userId = users[0].id;
							}
						}
					}
				} catch (error: any) {
					// Silently handle errors
					if (error?.message && !error.message.includes('timeout')) {
						console.warn('Failed to fetch user ID:', error?.message);
					}
				}
			}
			
			if (!userId) {
				return {
					isSuccess: false,
					error: 'User ID not found',
				};
			}

			const params: ClearCartApiParams = {
				user_id: userId,
			};

			const http = getHttp();
			const result = await http.post<ClearCartApiResponse>(
				CART_CLEAR(),
				params
			);

			return {
				isSuccess: result.isSuccess,
				data: result.data,
				error: result.error,
			};
		} catch (error: any) {
			return {
				isSuccess: false,
				error: error?.message || 'Failed to clear cart',
			};
		}
	}
}

export const cartFactory = new CartFactory();
