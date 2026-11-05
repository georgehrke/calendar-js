import { recommended } from '@nextcloud/eslint-config'

export default [
	...recommended,
	{
		files: ['**/*.js'],
		plugins: {},
		rules: {
			'perfectionist/sort-imports': 'off',
		},
	},
	{
		files: ['src/**/*.js'],
		ignores: ['**/__mocks__/**'],
		rules: {
			// Generators need a return type for TypeScript, as it does not read @yields
			'jsdoc/require-returns-check': ['warn', { exemptGenerators: true }],
		},
	},
]
