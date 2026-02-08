const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prevent constant rebundling by ignoring certain file patterns
config.watchFolders = [];
config.transformer = {
	...config.transformer,
	babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver = {
	...config.resolver,
	assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
	sourceExts: [...config.resolver.sourceExts, 'svg', 'jsx', 'js', 'ts', 'tsx'],
};

// Configure server to use port 3000
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


