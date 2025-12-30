import React from 'react';
import { Modal, StyleSheet } from 'react-native';
import { Box } from '../Box';
import { Pressable } from '../Pressable';
import { Text } from '../Text';
import { fonts } from '../../style';

export interface LogoutPopupProps {
	Visible: boolean;
	onClose: () => void;
	onLogout: () => void;
	title: string;
	message: string;
	button1Label: string;
	button2Label: string;
	isLogout?: boolean;
}

export const LogoutPopup: React.FC<LogoutPopupProps> = ({
	Visible,
	onClose,
	onLogout,
	button2Label,
	button1Label,
	title,
	message,
	isLogout,
}: LogoutPopupProps) => (
	<Modal animationType="fade" visible={Visible} transparent>
		<Box
			flex={1}
			style={styles.backdrop}
			alignItems="center"
			justifyContent="center"
		>
			<Pressable
				style={StyleSheet.absoluteFill}
				onPress={onClose}
			/>
			<Box
				width="85%"
				maxWidth={400}
				borderRadius={20}
				backgroundColor="white"
				style={styles.modalContainer}
				paddingVertical="lg"
				paddingHorizontal="m"
				overflow="hidden"
			>
				{/* Title */}
				<Text
					fontFamily={fonts.bold}
					fontSize={22}
					color="black"
					textAlign="center"
					marginBottom="s"
				>
					{title}
				</Text>

				{/* Message */}
				<Text
					fontFamily={fonts.regular}
					fontSize={15}
					color="gray"
					textAlign="center"
					marginBottom="lg"
					lineHeight={22}
					marginHorizontal="s"
				>
					{message}
				</Text>

				{/* Buttons Container */}
				<Box 
					flexDirection="row" 
					marginTop="m"
					width="100%"
					alignItems="stretch"
				>
					{/* Cancel Button */}
					<Pressable
						flex={1}
						onPress={onClose}
						style={[styles.button, styles.cancelButton]}
					>
						<Box
							backgroundColor="gray5"
							paddingVertical="m"
							borderRadius={12}
							alignItems="center"
							justifyContent="center"
							style={styles.buttonInner}
						>
							<Text
								fontFamily={fonts.semiBold}
								fontSize={16}
								color="black"
							>
								{button2Label}
							</Text>
						</Box>
					</Pressable>

					{/* Logout/Delete Button */}
					<Pressable
						flex={1}
						onPress={() => {
							onClose();
							onLogout();
						}}
						style={[styles.button, styles.confirmButton]}
					>
						<Box
							paddingVertical="m"
							borderRadius={12}
							alignItems="center"
							justifyContent="center"
							style={[styles.buttonInner, styles.confirmButtonInner]}
						>
							<Text
								fontFamily={fonts.semiBold}
								fontSize={16}
								color="white"
							>
								{button1Label}
							</Text>
						</Box>
					</Pressable>
				</Box>
			</Box>
		</Box>
	</Modal>
);

const styles = StyleSheet.create({
	backdrop: {
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalContainer: {
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 10,
	},
	button: {
		minHeight: 48,
		flex: 1,
	},
	buttonInner: {
		minHeight: 48,
		width: '100%',
	},
	cancelButton: {
		marginRight: 4,
	},
	confirmButton: {
		marginLeft: 4,
	},
	confirmButtonInner: {
		backgroundColor: '#E74C3C', // Bright red color for better visibility
	},
});


