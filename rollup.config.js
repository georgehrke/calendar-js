const { nodeResolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const { getBabelOutputPlugin } = require('@rollup/plugin-babel')
const babelConfig = require('./babel.config.js')

module.exports = {
	input: 'src/index.js',
	output: {
		file: 'dist/dist.js',
		format: 'es',
	},
	plugins: [
		nodeResolve(),
		commonjs(),
		getBabelOutputPlugin(babelConfig),
	],
}
