# Development Build Instructions

## Problem
The app uses native modules (`react-native-reanimated`, `react-native-gesture-handler`, `react-native-device-info`) that require a custom development build. These don't work in Expo Go.

## Solution: Create a Development Build

### Option 1: Using EAS Build (Recommended - Cloud Build)

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Create a development build**:
   ```bash
   eas build --profile development --platform android
   ```
   or for iOS:
   ```bash
   eas build --profile development --platform ios
   ```

4. **Install the build on your device**:
   - Android: Download the APK from the EAS build page and install it
   - iOS: Install via TestFlight or direct download

5. **Start the development server**:
   ```bash
   npx expo start --dev-client
   ```

### Option 2: Local Development Build

1. **Generate native projects**:
   ```bash
   npx expo prebuild
   ```

2. **Run on Android**:
   ```bash
   npx expo run:android
   ```

3. **Run on iOS**:
   ```bash
   npx expo run:ios
   ```

### Option 3: Temporary Workaround (Remove Native Dependencies)

If you need to test quickly in Expo Go, you can temporarily remove or conditionally use native modules, but this will disable animations and some features.

## Notes

- Development builds take 10-20 minutes to build
- You only need to build once, then you can use `expo start --dev-client` for hot reloading
- The development build includes all native modules and works like a custom Expo app


