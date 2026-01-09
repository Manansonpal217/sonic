import React from 'react';
import { Modal, View } from 'react-native';
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
		<View
			style={{
				flex: 1,
				backgroundColor: 'rgba(0,0,0,0.5)',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Box 
				width="85%"
				borderRadius={16}
				backgroundColor="white"
				paddingVertical="m"
			>
				<Box paddingHorizontal="m">
					<Text
						fontFamily={fonts.bold}
						fontSize={18}
						color="black"
						textAlign="center"
						marginTop="s"
					>
						{title}
					</Text>

					<Text
						fontFamily={fonts.regular}
						fontSize={15}
						color="black"
						textAlign="center"
						marginTop="m"
						marginBottom="lg"
					>
						{message}
					</Text>
					
					<Box 
						flexDirection="row" 
						justifyContent="space-between"
						marginTop="m"
					>
						<Box flex={1} marginRight="xs">
							<Pressable
								onPress={() => {
									onClose();
								}}
							>
								<Box
									backgroundColor="gray5"
									paddingVertical="s"
									paddingHorizontal="m"
									borderRadius={8}
									alignItems="center"
									justifyContent="center"
								>
									<Text
										fontFamily={fonts.semiBold}
										fontSize={15}
										color="black"
										textAlign="center"
									>
										{button2Label}
									</Text>
								</Box>
							</Pressable>
						</Box>
						<Box flex={1} marginLeft="xs">
							<Pressable
								onPress={() => {
									onClose();
									onLogout();
								}}
							>
								<Box
									backgroundColor="red3"
									paddingVertical="s"
									paddingHorizontal="m"
									borderRadius={8}
									alignItems="center"
									justifyContent="center"
								>
									<Text
										fontFamily={fonts.semiBold}
										fontSize={15}
										color="white"
										textAlign="center"
									>
										{button1Label}
									</Text>
								</Box>
							</Pressable>
						</Box>
					</Box>
				</Box>
			</Box>
		</View>
	</Modal>
);


