const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  "@book-people/book-data": "<rootDir>/../../packages/book-data/src",
  "@book-people/game-core": "<rootDir>/../../packages/game-core/src",
};

module.exports = config;