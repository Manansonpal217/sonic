#!/usr/bin/env node
/**
 * Copies expo-module-gradle-plugin from expo-modules-core@3.0.28 into
 * expo-modules-core@1.12 so Android build can resolve the plugin (Expo 51).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const corePath = path.join(rootDir, 'node_modules', 'expo-modules-core');
const pluginInCore = path.join(corePath, 'expo-module-gradle-plugin');
const configPath = path.join(corePath, 'expo-module.config.json');

if (!fs.existsSync(corePath)) {
  console.log('copy-expo-gradle-plugin: expo-modules-core not found, skipping.');
  process.exit(0);
}

// Already have plugin and patched config
if (fs.existsSync(pluginInCore) && fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (config.android?.gradlePlugins?.length) {
    console.log('copy-expo-gradle-plugin: plugin already present, skipping.');
    process.exit(0);
  }
}

const os = require('os');
const tmpDir = path.join(os.tmpdir(), `expo-mc-${Date.now()}`);
fs.mkdirSync(tmpDir, { recursive: true });

try {
  execSync(`npm pack expo-modules-core@3.0.28 --pack-destination="${tmpDir}"`, {
    cwd: rootDir,
    stdio: 'pipe',
  });
  const tgz = fs.readdirSync(tmpDir).find((f) => f.endsWith('.tgz'));
  if (!tgz) throw new Error('tgz not found');
  execSync(`tar -xzf "${path.join(tmpDir, tgz)}" -C "${tmpDir}"`, {
    stdio: 'pipe',
  });
  const pkgDir = path.join(tmpDir, 'package');
  const pluginSrc = path.join(pkgDir, 'expo-module-gradle-plugin');
  if (!fs.existsSync(pluginSrc)) {
    throw new Error('expo-module-gradle-plugin not in tarball');
  }
  if (fs.existsSync(pluginInCore)) {
    fs.rmSync(pluginInCore, { recursive: true });
  }
  fs.cpSync(pluginSrc, pluginInCore, { recursive: true });
  console.log('copy-expo-gradle-plugin: copied expo-module-gradle-plugin.');

  // Patch plugin to use public Gradle API (Gradle 8.8 compatibility)
  const patchRemoves = 'import org.gradle.internal.extensions.core.extra';
  const files = [
    'src/main/kotlin/expo/modules/plugin/ExpoModulesGradlePlugin.kt',
    'src/main/kotlin/expo/modules/plugin/ProjectConfiguration.kt',
    'src/main/kotlin/expo/modules/plugin/gradle/ExpoModuleExtension.kt',
  ];
  for (const f of files) {
    const filePath = path.join(pluginInCore, f);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(patchRemoves)) {
        content = content.replace(/\n?import org\.gradle\.internal\.extensions\.core\.extra\n?/g, '\n');
        fs.writeFileSync(filePath, content);
      }
    }
  }
  // ExpoModuleExtension.kt has an extra blank line after the removed import
  const extPath = path.join(pluginInCore, 'src/main/kotlin/expo/modules/plugin/gradle/ExpoModuleExtension.kt');
  if (fs.existsSync(extPath)) {
    let c = fs.readFileSync(extPath, 'utf8');
    c = c.replace(/\n\n+import expo\.modules\.plugin\.safeGet\n\n\/\*\*\n/g, '\nimport expo.modules.plugin.safeGet\n\n/**\n');
    fs.writeFileSync(extPath, c);
  }
  console.log('copy-expo-gradle-plugin: patched plugin for Gradle 8.8.');
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Patch expo-module.config.json to declare the plugin
let config = {};
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (_) {
  config = { platforms: ['apple', 'android'], apple: { podspecPath: './ExpoModulesCore.podspec' } };
}
config.android = config.android || {};
config.android.gradlePlugins = [
  { id: 'expo-module-gradle-plugin', group: 'expo.modules', sourceDir: 'expo-module-gradle-plugin' },
];
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
console.log('copy-expo-gradle-plugin: patched expo-module.config.json.');
process.exit(0);
