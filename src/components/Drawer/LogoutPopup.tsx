import React from 'react';
import { Modal } from 'react-native';
import { Box } from '../Box';
import { Pressable } from '../Pressable';
import { DeviceHelper } from '../../helper/DeviceHelper';
import { Text } from '../Text';
import { fonts } from '../../style';
import { Button } from '../Button';

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
			backgroundColor="transparent"
			alignItems="center"
			justifyContent="center"
		>
			<Box height={isLogout ? '27%' : '30%'}>
				<Box
					flex={1}
					borderRadius={16}
					backgroundColor="white4"
				>
					<Box>
						<Text
							fontFamily={fonts.bold}
							fontSize={16}
							color="black"
							textAlign="center"
							marginTop="m"
						>
							{title}
						</Text>

						<Text
							fontFamily={fonts.regular}
							fontSize={16}
							color="black"
							textAlign="center"
							marginHorizontal="m"
							marginTop="m"
						>
							{message}
						</Text>
						<Box height={DeviceHelper.calculateHeightRatio(37)} />
						<Box flexDirection="row" justifyContent="center">
							<Button
								label={button1Label}
								onPress={() => {
									onClose();
									onLogout();
								}}
							/>
							<Button
								label={button2Label}
								onPress={() => {
									onClose();
								}}
								variant="secondary"
							/>
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	</Modal>
);


