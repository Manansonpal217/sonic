#!/usr/bin/env node
/**
 * Patches expo-dev-launcher and expo-dev-menu to use legacy Compose compiler
 * (composeOptions.kotlinCompilerExtensionVersion) instead of the Kotlin 2.0+
 * Compose Gradle plugin, which is not available for Kotlin 1.9.x (Expo 51).
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function patchDevLauncher() {
  const p = path.join(rootDir, 'node_modules', 'expo-dev-launcher', 'android', 'build.gradle');
  if (!fs.existsSync(p)) return false;
  let c = fs.readFileSync(p, 'utf8');
  if (!c.includes('org.jetbrains.kotlin.plugin.compose')) return false;
  c = c.replace(
    /classpath\("org\.jetbrains\.kotlin\.plugin\.compose:org\.jetbrains\.kotlin\.plugin\.compose\.gradle\.plugin:\$\{kotlinVersion\}"\)\n\s*/g,
    ''
  );
  c = c.replace(/\napply plugin: 'org\.jetbrains\.kotlin\.plugin\.compose'\n/g, '\n');
  if (!c.includes('composeOptions {')) {
    c = c.replace(
      /(buildFeatures \{\s*buildConfig true\s*viewBinding true\s*compose true\s*\})/,
      "$1\n  composeOptions {\n    kotlinCompilerExtensionVersion = '1.5.14'\n  }"
    );
  }
  fs.writeFileSync(p, c);
  return true;
}

function patchDevMenu() {
  const p = path.join(rootDir, 'node_modules', 'expo-dev-menu', 'android', 'build.gradle');
  if (!fs.existsSync(p)) return false;
  let c = fs.readFileSync(p, 'utf8');
  if (!c.includes('org.jetbrains.kotlin.plugin.compose')) return false;
  c = c.replace(
    /classpath\("org\.jetbrains\.kotlin\.plugin\.compose:org\.jetbrains\.kotlin\.plugin\.compose\.gradle\.plugin:\$\{kotlinVersion\}"\)\n?/g,
    ''
  );
  c = c.replace(/\napply plugin: 'org\.jetbrains\.kotlin\.plugin\.compose'\n/g, '\n');
  if (!c.includes('composeOptions {')) {
    c = c.replace(
      /(buildFeatures \{\s*compose true\s*buildConfig true\s*\})/,
      "$1\n  composeOptions {\n    kotlinCompilerExtensionVersion = '1.5.14'\n  }"
    );
  }
  fs.writeFileSync(p, c);
  return true;
}

let n = 0;
if (patchDevLauncher()) {
  console.log('patch-expo-compose-plugin: patched expo-dev-launcher');
  n++;
}
if (patchDevMenu()) {
  console.log('patch-expo-compose-plugin: patched expo-dev-menu');
  n++;
}
if (n === 0) console.log('patch-expo-compose-plugin: no patches needed.');
process.exit(0);
