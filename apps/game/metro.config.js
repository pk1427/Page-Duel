const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Block .env.staging.local from being processed as a module
config.resolver.blockList = [...(config.resolver.blockList || []), /\.env\.staging\.local$/];

module.exports = config;
