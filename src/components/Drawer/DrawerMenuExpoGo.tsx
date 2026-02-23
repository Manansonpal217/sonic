import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { DrawersItem } from './Drawer';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.84, 340);

export interface DrawerMenuProps {
	isOpen: boolean;
	children: React.ReactNode;
	onGestureStart: () => void;
	onClosePress: () => void;
	onClose: () => void;
}

// Premium drawer implementation for Expo Go (without native modules)
export const DrawerMenuExpoGo: React.FC<DrawerMenuProps> = ({
	isOpen,
	children,
	onClosePress,
	onClose,
}: DrawerMenuProps) => {
	return (
		<View style={{ flex: 1 }}>
			{children}
			<Modal
				visible={isOpen}
				transparent
				animationType="slide"
				onRequestClose={onClose}
			>
				<TouchableOpacity
					style={styles.overlay}
					activeOpacity={1}
					onPress={onClose}
				>
					<View style={styles.drawer} onStartShouldSetResponder={() => true}>
						<DrawersItem onClosePress={onClosePress} />
					</View>
				</TouchableOpacity>
			</Modal>
		</View>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.45)',
		flexDirection: 'row',
	},
	drawer: {
		width: DRAWER_WIDTH,
		height: '100%',
		backgroundColor: 'white',
		borderTopRightRadius: 0,
		borderBottomRightRadius: 0,
		overflow: 'hidden',
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: -4, height: 0 },
				shadowOpacity: 0.15,
				shadowRadius: 12,
			},
			android: {
				elevation: 16,
			},
		}),
	},
});


