import { createTheme } from '@shopify/restyle';
import { palette } from './Palette';

const theme = createTheme({
	colors: {
		primary: palette.primary,
		red3: palette.red3,
		black: palette.black,
		gray: palette.gray,
		gray5: palette.gray5,
		white: palette.white,
		white4: palette.white4,
		white6: palette.white6,
	},
	spacing: {
		xs: 4,
		sm: 8,
		md: 16,
		lg: 24,
		xl: 32,
		es: 8,
		s: 8,
		m: 16,
		r: 16,
	},
	breakpoints: {
		phone: 0,
		tablet: 768,
	},
});

export type Theme = typeof theme;
export default theme;

