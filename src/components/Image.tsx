import React from 'react';
import { Image as RNImage, ImageProps as RNImageProps, ImageSourcePropType } from 'react-native';

export interface ImageProps {
	source: ImageSourcePropType;
	width?: number | string;
	height?: number | string;
	resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
	borderRadius?: number;
	style?: RNImageProps['style'];
}

export const Image: React.FC<ImageProps> = ({
	source,
	width,
	height,
	resizeMode = 'cover',
	borderRadius,
	style,
	...props
}) => {
	const imageStyle: any = {};
	
	if (width === '100%') {
		imageStyle.width = '100%';
	} else if (typeof width === 'number') {
		imageStyle.width = width;
	}
	
	if (height === '100%') {
		imageStyle.height = '100%';
	} else if (typeof height === 'number') {
		imageStyle.height = height;
	}

	if (borderRadius !== undefined) {
		imageStyle.borderRadius = borderRadius;
		imageStyle.overflow = 'hidden';
	}

	return (
		<RNImage
			source={source}
			style={[imageStyle, style]}
			resizeMode={resizeMode}
		/>
	);
};

