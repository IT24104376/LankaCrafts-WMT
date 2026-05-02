const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package.json "exports" field resolution so Metro picks up
// the react-native build of @firebase/auth (needed for getReactNativePersistence)
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
