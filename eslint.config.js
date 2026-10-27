import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'vendor/**',
            'node_modules/**',
            'public/**',
            'bootstrap/ssr/**',
            'storage/**',
            'chrome-extension/**',
            'test-results/**',
            'playwright-report/**',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    {
        files: ['**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
            },
        },
    },
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
            },
        },
    },
    {
        files: ['**/*.{ts,vue}'],
        rules: {
            // TypeScript already checks for undefined names, and knows about globals
            // declared in env.d.ts (Ziggy's `route`), which no-undef doesn't.
            'no-undef': 'off',
        },
    },
    {
        rules: {
            // Match .editorconfig (4 spaces) instead of the rule's default of 2.
            'vue/html-indent': ['error', 4],
            // Layout-only rules that disagree with how the templates are written
            // (short inline elements, several attributes per line). Enforcing them
            // would reflow nearly every template without catching anything.
            'vue/singleline-html-element-content-newline': 'off',
            'vue/max-attributes-per-line': 'off',
            // The templates write void elements as `<meta ... />`; keep that.
            'vue/html-self-closing': ['error', { html: { void: 'always', normal: 'always', component: 'always' } }],
        },
    },
    {
        files: ['resources/js/Pages/**/*.vue'],
        rules: {
            // Page props come straight from Laravel controllers as snake_case keys.
            'vue/prop-name-casing': 'off',
        },
    },
    {
        files: ['tests/e2e/**', '*.config.{js,ts}'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
);
