import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'out/test/integration/suite/**/*.test.js',
  workspaceFolder: './test/integration/fixtures',
  mocha: {
    ui: 'bdd',
    timeout: 20000,
  },
});
