const babelConfig = require('@nextcloud/babel-config')

// Prevent babel error regarding exceeding max size
babelConfig.compact = false

module.exports = babelConfig
