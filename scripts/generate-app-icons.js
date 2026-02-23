#!/usr/bin/env node
/**
 * Generates app icon, splash screen, and favicon from InaraLogoWordmark.svg
 * Run: node scripts/generate-app-icons.js
 * Requires: npm install sharp
 */

const fs = require('fs');
const path = require('path');

const SVG_PATH = path.join(__dirname, '../src/assets/logos/InaraLogoWordmark.svg');
const ASSETS_DIR = path.join(__dirname, '../assets');

// White background for icon/splash (#ffffff)
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function generateIcons() {
	let sharp;
	try {
		sharp = require('sharp');
	} catch {
		console.error('sharp is required. Install with: npm install --save-dev sharp');
		process.exit(1);
	}

	const svgBuffer = fs.readFileSync(SVG_PATH);

	// SVG viewBox: 1860 x 325 (wide wordmark)
	const logoAspect = 1860 / 325;

	async function createLogoImage(width, height, logoMaxWidth, bgColor) {
		const logoHeight = Math.round(logoMaxWidth / logoAspect);
		const logoWidth = logoMaxWidth;
		const left = Math.round((width - logoWidth) / 2);
		const top = Math.round((height - logoHeight) / 2);

		const logoPng = await sharp(svgBuffer)
			.resize(logoWidth, logoHeight)
			.png()
			.toBuffer();

		return sharp({
			create: {
				width,
				height,
				channels: 4,
				background: bgColor,
			},
		})
			.composite([{ input: logoPng, left, top }])
			.png();
	}

	try {
		// 1. App icon: 1024x1024
		const icon = await createLogoImage(1024, 1024, 800, WHITE);
		await icon.toFile(path.join(ASSETS_DIR, 'icon.png'));
		console.log('Generated: assets/icon.png (1024x1024)');

		// 2. Adaptive icon (Android): 1024x1024 - same as icon
		const adaptiveIcon = await createLogoImage(1024, 1024, 800, WHITE);
		await adaptiveIcon.toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));
		console.log('Generated: assets/adaptive-icon.png (1024x1024)');

		// 3. Splash screen: 1284x2778 (common phone aspect)
		const splash = await createLogoImage(1284, 2778, 900, WHITE);
		await splash.toFile(path.join(ASSETS_DIR, 'splash.png'));
		console.log('Generated: assets/splash.png (1284x2778)');

		// 4. Favicon: 48x48
		const favicon = await createLogoImage(48, 48, 40, WHITE);
		await favicon.toFile(path.join(ASSETS_DIR, 'favicon.png'));
		console.log('Generated: assets/favicon.png (48x48)');

		console.log('\nAll app icons generated successfully.');
	} catch (err) {
		console.error('Error generating icons:', err.message);
		process.exit(1);
	}
}

generateIcons();
