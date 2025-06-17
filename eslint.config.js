// ESLint配置 - 最简版本，仅做基本检查
export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'build/**',
      '*.log',
      'logs/**',
      'backups/**',
      '.env*',
      'config.json',
      'coverage/**',
      '*.d.ts',
      // 暂时忽略所有TypeScript文件，只检查基本JavaScript
      '**/*.ts',
      '**/*.tsx'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-debugger': 'warn',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
];
