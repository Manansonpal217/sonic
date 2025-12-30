import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { fonts } from '../style';
import { Box } from './Box';

export interface CommonHeaderProps {
	label: string;
	onBackPress?: () => void;
}

export const CommonHeader: React.FC<CommonHeaderProps> = ({
	label,
	onBackPress,
}) => {
	const insets = useSafeAreaInsets();
	const topPadding = Math.max(insets.top + 8, 24);
	
	return (
		<Box
			flexDirection="row"
			alignItems="center"
			paddingHorizontal="md"
			paddingBottom="md"
			backgroundColor="white"
			style={{ paddingTop: topPadding }}
		>
			{onBackPress && (
				<TouchableOpacity
					onPress={onBackPress}
					style={styles.backButton}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<Text fontSize={24}>←</Text>
				</TouchableOpacity>
			)}
			<Text
				fontSize={20}
				fontFamily={fonts.bold}
				color="black"
				flex={1}
				textAlign="center"
			>
				{label}
			</Text>
			{onBackPress && <View style={{ width: 40 }} />}
		</Box>
	);
};

const styles = StyleSheet.create({
	backButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

