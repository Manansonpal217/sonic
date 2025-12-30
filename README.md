# Sonic Todo App

A production-ready, cross-platform mobile todo application built with React Native and Expo, compatible with both iOS and Android.

## Features

- ✅ Add, complete, and delete todos
- 💾 Persistent storage using AsyncStorage
- 🎨 Modern, clean UI with smooth animations
- 📱 Fully responsive design for iOS and Android
- ⚡ Fast performance with optimized rendering
- 🛡️ Error handling and loading states
- 🔒 Type-safe with TypeScript

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- For iOS development: [Xcode](https://developer.apple.com/xcode/) (macOS only)
- For Android development: [Android Studio](https://developer.android.com/studio)

## Installation

1. Clone or navigate to the project directory:
```bash
cd Sonic
```

2. Install dependencies:
```bash
npm install
```

## Running the App

### Development Mode

Start the Expo development server:
```bash
npm start
```

This will open the Expo DevTools. You can then:
- Press `i` to open iOS simulator (macOS only)
- Press `a` to open Android emulator
- Scan the QR code with Expo Go app on your physical device

### Platform-Specific Commands

- **iOS**: `npm run ios`
- **Android**: `npm run android`
- **Web**: `npm run web`

## Building for Production

### Using EAS Build (Recommended)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to your Expo account:
```bash
eas login
```

3. Configure your project:
```bash
eas build:configure
```

4. Build for production:

**Android APK:**
```bash
npm run build:android
```

**iOS:**
```bash
npm run build:ios
```

**Both platforms:**
```bash
npm run build:all
```

### Build Options

- **Development**: For testing with development client
- **Preview**: Internal distribution (APK for Android)
- **Production**: App store ready builds

## Project Structure

```
Sonic/
├── App.tsx              # Main application component
├── app.json             # Expo configuration
├── eas.json             # EAS Build configuration
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── babel.config.js      # Babel configuration
└── README.md           # This file
```

## Configuration

### App Information

Edit `app.json` to customize:
- App name and slug
- Bundle identifier (iOS) / Package name (Android)
- Icons and splash screens
- Permissions

### Environment Variables

Create a `.env` file for environment-specific variables (not included in git for security).

## Code Quality

- **TypeScript**: Full type safety
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Proper loading indicators
- **Code Organization**: Modular and maintainable structure

## Deployment

### Android

1. Build production APK/AAB:
```bash
eas build --platform android --profile production
```

2. Submit to Google Play Store:
```bash
eas submit --platform android
```

### iOS

1. Build production app:
```bash
eas build --platform ios --profile production
```

2. Submit to App Store:
```bash
eas submit --platform ios
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `expo start -c`
2. **Build failures**: Check `eas.json` configuration
3. **iOS simulator not opening**: Ensure Xcode is properly installed
4. **Android emulator issues**: Verify Android Studio and emulator setup

### Clearing Cache

```bash
expo start -c
```

## Contributing

1. Follow the existing code style
2. Ensure TypeScript types are properly defined
3. Test on both iOS and Android before submitting
4. Add error handling for new features

## License

This project is open source and available for use.

## Support

For issues related to:
- **Expo**: Check [Expo Documentation](https://docs.expo.dev/)
- **React Native**: Check [React Native Documentation](https://reactnative.dev/)
- **EAS Build**: Check [EAS Build Documentation](https://docs.expo.dev/build/introduction/)



# sonic

