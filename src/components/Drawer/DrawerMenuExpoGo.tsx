import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { DrawersItem } from './Drawer';

const { width } = Dimensions.get('window');

export interface DrawerMenuProps {
	isOpen: boolean;
	children: React.ReactNode;
	onGestureStart: () => void;
	onClosePress: () => void;
	onClose: () => void;
}

// Simple drawer implementation for Expo Go (without native modules)
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
					<View style={styles.drawer}>
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
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		flexDirection: 'row',
	},
	drawer: {
		width: width * 0.8,
		height: '100%',
		backgroundColor: 'white',
	},
});


