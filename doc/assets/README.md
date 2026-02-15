# Assets Directory — Ivara app

This directory contains the app assets for **Ivara app**.

## Required Assets

1. **icon.png** (1024×1024px)
   - App icon for iOS and Android
   - Square image, no transparency

2. **splash.png** (1284×2778px recommended)
   - Splash screen when the app launches

3. **adaptive-icon.png** (1024×1024px)
   - Android adaptive icon foreground (same as icon or simplified mark)

4. **favicon.png** (48×48px)
   - Web favicon (optional)

## Ivara branding

To use the **Inara** logo as the app icon:

- Source: `src/assets/logos/InaraLogo.svg`
- Export a 1024×1024 PNG (e.g. from Figma, Illustrator, or [CloudConvert](https://cloudconvert.com/svg-to-png))
- Replace `icon.png` and `adaptive-icon.png` with that file (or a cropped/centered version)
- Adaptive icon background is set to `#EFE2D9` (Inara cream) in `app.json`

## Generating assets

- [Expo Asset Generator](https://www.npmjs.com/package/@expo/asset-generator)
- [App Icon Generator](https://www.appicon.co/)
- Figma, Sketch, or Adobe XD









