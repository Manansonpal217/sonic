import React from 'react';
import { StatusBar, StatusBarStyle, ColorValue, Platform } from 'react-native';
import { Box } from './Box';
import { Theme } from '../style/Theme';
import { useTheme } from '@shopify/restyle';

export enum StatusBarType {
	Light,
	Dark = 1,
}

export interface ScreenProps {
	children: React.ReactNode;
	statusBarType?: StatusBarType;
	backgroundColor?: keyof Theme['colors'];
	hideStatusBar?: boolean;
	translucent?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
	children,
	statusBarType = StatusBarType.Dark,
	backgroundColor = 'white',
	hideStatusBar = false,
	translucent = false,
}) => {
	const theme = useTheme<Theme>();

	const statusBarColor = (): ColorValue => {
		switch (statusBarType) {
			case StatusBarType.Light:
				return theme.colors.primary;
			case StatusBarType.Dark:
				return theme.colors.red3;
			default:
				return theme.colors.primary;
		}
	};

	const statusBarStyles = (): StatusBarStyle => {
		switch (statusBarType) {
			case StatusBarType.Light:
				return 'dark-content';
			case StatusBarType.Dark:
				return Platform.OS === 'android' ? 'light-content' : 'dark-content';
			default:
				return 'default';
		}
	};

	return (
		<Box
			flex={1}
			style={{
				paddingTop: translucent && Platform.OS === 'android' ? StatusBar.currentHeight : 0,
			}}
			backgroundColor={backgroundColor}
		>
			<StatusBar
				hidden={hideStatusBar}
				animated
				backgroundColor={statusBarColor()}
				barStyle={statusBarStyles()}
				translucent={translucent}
			/>
			{children}
		</Box>
	);
};


