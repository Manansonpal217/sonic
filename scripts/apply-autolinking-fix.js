#!/usr/bin/env node
/**
 * Apply autolinking fix to android/settings.gradle so project.android.packageName
 * is correctly set (expo-modules-autolinking instead of @react-native-community/cli).
 */
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../android/settings.gradle');
let content = fs.readFileSync(settingsPath, 'utf8');

const expoAutolinkingBlock = `if (getRNMinorVersion() >= 75) {
  extensions.configure(com.facebook.react.ReactSettingsExtension) { ex ->
    def command = [
      'node',
      '--no-warnings',
      '--eval',
      'require(require.resolve(\\'expo-modules-autolinking\\', { paths: [require.resolve(\\'expo/package.json\\')] }))(process.argv.slice(1))',
      'react-native-config',
      '--json',
      '--platform',
      'android'
    ].toList()
    ex.autolinkLibrariesFromCommand(command)
  }
}`;

// Match from "if (getRNMinorVersion() >= 75)" to the closing brace of the outer if
// (handles both EXPO_UNSTABLE_CORE_AUTOLINKING conditional and simple autolinkLibrariesFromCommand())
const startMarker = 'if (getRNMinorVersion() >= 75) {';
const endMarker = '  }';

const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
  if (content.includes('expo-modules-autolinking') && content.includes('react-native-config')) {
    console.log('apply-autolinking-fix: Already applied.');
  } else {
    console.warn('apply-autolinking-fix: Could not find block. Build may fail.');
  }
  process.exit(0);
  return;
}

// Find matching closing brace for the if block (scan for brace depth)
let depth = 0;
let endIdx = startIdx + startMarker.length;
for (let i = endIdx; i < content.length; i++) {
  if (content[i] === '{') depth++;
  else if (content[i] === '}') {
    depth--;
    if (depth === 0) {
      endIdx = i + 1;
      break;
    }
  }
}

content = content.slice(0, startIdx) + expoAutolinkingBlock + content.slice(endIdx);
fs.writeFileSync(settingsPath, content);
console.log('apply-autolinking-fix: Applied.');
