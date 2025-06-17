// ESLint配置 - 适用于生产环境的配置
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
      'config.json'
    ]
  }
];
