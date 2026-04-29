import * as vscode from 'vscode';
import { registerSecretFileEditor } from './secretFileEditorProvider';
import { registerDynamicFileWatcher } from './dynamicFileWatcher';

// セッション内で確認済みのファイル URI を保持する Set。
// ユーザが一度「はい」を選択したファイルは、VS Code を再起動するまで再警告しない。
const confirmedFiles = new Set<string>();

export const activate = (context: vscode.ExtensionContext): void => {
  context.subscriptions.push(registerSecretFileEditor(context, confirmedFiles));
  registerDynamicFileWatcher(context, confirmedFiles);
};

export const deactivate = (): void => {
  confirmedFiles.clear();
};
