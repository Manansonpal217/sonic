const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
	...config.transformer,
	babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver = {
	...config.resolver,
	assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
	sourceExts: [...config.resolver.sourceExts, 'svg', 'jsx', 'js', 'ts', 'tsx'],
};

// Configure Metro port. Host binding is controlled via --host flag or adb reverse for USB connections.
config.server = {
	...config.server,
	port: 3000,
};

// Disable Fast Refresh if it's causing issues (uncomment if needed)
// config.server = {
//   ...config.server,
//   enhanceMiddleware: (middleware) => {
//     return (req, res, next) => {
//       // Skip Fast Refresh for certain files
//       if (req.url && req.url.includes('AppEntry')) {
//         return next();
//       }
//       return middleware(req, res, next);
//     };
//   },
// };

module.exports = config;


