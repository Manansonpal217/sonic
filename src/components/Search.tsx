import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { Box } from './Box';
import { fonts } from '../style';

export interface SearchProps {
	value: string;
	onChangeText: (text: string) => void;
	placeholder?: string;
}

export const Search: React.FC<SearchProps> = ({
	value,
	onChangeText,
	placeholder = 'Search...',
}) => {
	return (
		<Box
			backgroundColor="gray5"
			borderRadius={8}
			paddingHorizontal="s"
			height={44}
			justifyContent="center"
		>
			<TextInput
				style={styles.input}
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor="#9D9D9D"
			/>
		</Box>
	);
};

const styles = StyleSheet.create({
	input: {
		fontFamily: fonts.regular,
		fontSize: 15,
		color: '#000000',
		padding: 0,
	},
});


