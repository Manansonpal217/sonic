#!/bin/bash
# Build a production APK without expo-dev-client (which causes standalone apps to crash on launch).
# Development builds should use: npm run android (includes dev client for Metro).

set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "Building production APK (excluding expo-dev-client)..."

# 1. Temporarily remove expo-dev-client so prebuild generates native code without it
echo "Temporarily removing expo-dev-client..."
node -e "
const pkg = require('./package.json');
const dc = pkg.dependencies['expo-dev-client'];
if (!dc) { console.log('expo-dev-client not in dependencies'); process.exit(0); }
delete pkg.dependencies['expo-dev-client'];
pkg.__saved_expo_dev_client = dc;
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('Saved expo-dev-client version:', dc);
"

# 2. Reinstall (removes expo-dev-client from node_modules)
npm install

# 3. Regenerate android with prebuild (no dev client in native code)
echo "Running expo prebuild --clean..."
npx expo prebuild --platform android --clean

# 3b. Apply autolinking fix (expo-modules-autolinking for packageName - required for Expo projects)
echo "Applying autolinking fix..."
node scripts/apply-autolinking-fix.js

# 3c. Ensure local.properties exists (prebuild --clean removes it)
if [ ! -f android/local.properties ]; then
  SDK_DIR="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
  if [ -d "$SDK_DIR" ]; then
    echo "sdk.dir=$SDK_DIR" > android/local.properties
    echo "Created android/local.properties"
  else
    echo "Error: Android SDK not found. Set ANDROID_HOME or install Android Studio."
    exit 1
  fi
fi

# 4. Build release APK
echo "Building release APK..."
cd android
./gradlew assembleRelease
cd ..

# 5. Restore expo-dev-client
echo "Restoring expo-dev-client..."
node -e "
const pkg = require('./package.json');
const saved = pkg.__saved_expo_dev_client;
if (saved) {
  pkg.dependencies['expo-dev-client'] = saved;
  delete pkg.__saved_expo_dev_client;
}
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"

npm install

echo ""
echo "Production APK built: android/app/build/outputs/apk/release/app-release.apk"
echo "Install and test on your device."
