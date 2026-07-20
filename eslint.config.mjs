import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import jest from 'eslint-plugin-jest'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
	{
		ignores: [
			'**/node_modules/', 'dist-server/', 'client/dist/', 'client/build/', 'client/.react-router/', 'docs/'
		]
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		rules: {
			'consistent-return': 'off',
			'no-console': 'off',
			'no-multi-assign': 'error',
			'no-unneeded-ternary': 'error',
			'no-use-before-define': 'error',
			'no-useless-return': 'error',
			'no-var': 'error',
			'prefer-const': 'error'
		}
	},
	{
		files: ['server/**', 'jest.config.js', '*.config.{js,mjs,cjs}', 'client/*.config.{js,mjs,cjs}'],
		languageOptions: {
			globals: {
				...globals.node
			}
		}
	},
	{
		files: ['jest.config.js', '**/*.cjs'],
		languageOptions: {
			sourceType: 'commonjs'
		}
	},
	{
		files: ['server/**/tests/**'],
		...jest.configs['flat/recommended']
	},
	{
		files: ['client/src/**/*.{js,jsx,ts,tsx}'],
		...react.configs.flat.recommended,
		languageOptions: {
			...react.configs.flat.recommended.languageOptions,
			globals: {
				...globals.browser
			}
		},
		settings: {
			react: {
				version: 'detect'
			}
		},
		rules: {
			...react.configs.flat.recommended.rules,
			'react/prop-types': 'off',
			'react/react-in-jsx-scope': 'off'
		}
	},
	{
		files: ['client/src/**/*.{js,jsx,ts,tsx}'],
		...reactHooks.configs.flat.recommended
	},
	{
		files: ['client/src/ui/**/*.{js,jsx,ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['**/features/*', '**/features/**'],
							message: 'ui/ components must not depend on feature code'
						}
					]
				}
			]
		}
	},
	prettier
)
