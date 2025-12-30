import React from 'react';
import { DrawerMenuExpoGo } from './DrawerMenuExpoGo';
import { DrawersItem } from './Drawer';
import { canUseDrawerLayout } from '../../Utils/nativeModules';

export interface DrawerMenuProps {
	isOpen: boolean;
	children: React.ReactNode;
	onGestureStart: () => void;
	onClosePress: () => void;
	onClose: () => void;
}

// Use native drawer if available, otherwise use Expo Go fallback
export const DrawerMenu: React.FC<DrawerMenuProps> = (props) => {
	if (canUseDrawerLayout()) {
		try {
			const { Drawer } = require('react-native-drawer-layout');
			return (
				<Drawer
					open={props.isOpen}
					onOpen={() => {}}
					onClose={props.onClose}
					drawerType="front"
					onGestureStart={props.onGestureStart}
					renderDrawerContent={() => <DrawersItem onClosePress={props.onClosePress} />}
				>
					{props.children}
				</Drawer>
			);
		} catch {
			// Fallback to Expo Go version
		}
	}
	return <DrawerMenuExpoGo {...props} />;
};

