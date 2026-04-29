import * as vscode from 'vscode';
import { matchesAnyPattern } from './filePatternMatcher';

// package.json の Custom Editor で静的に処理されるパターン。
// これらにマッチするファイルは Custom Editor が先に割り込むため、
// 動的ウォッチャー側ではスキップして二重処理を避ける。
// package.json の contributes.customEditors.selector と同期を保つこと。
const STATIC_CUSTOM_EDITOR_PATTERNS = [
  '/^\\.env$/',
  '/^\\.env\\..+$/',
  '/\\.pem$/',
  '/\\.key$/',
  '/\\.p12$/',
  '/\\.pfx$/',
  '/^id_rsa$/',
  '/^id_ed25519$/',
  '/^id_ecdsa$/',
  '/^id_dsa$/',
  '/^credentials\\.json$/',
  '/^\\.npmrc$/',
  '/^\\.netrc$/',
];

const closeTab = async (uri: vscode.Uri): Promise<void> => {
  const uriStr = uri.toString();
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      if (tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === uriStr) {
        await vscode.window.tabGroups.close(tab);
        return;
      }
    }
  }
};

export const registerDynamicFileWatcher = (
  context: vscode.ExtensionContext,
  confirmedFiles: Set<string>,
): void => {
  const handleDocumentOpen = async (document: vscode.TextDocument): Promise<void> => {
    if (document.uri.scheme !== 'file') {
      return;
    }

    const config = vscode.workspace.getConfiguration('secretFileCautioner');
    if (!config.get<boolean>('enabled', true)) {
      return;
    }

    if (confirmedFiles.has(document.uri.toString())) {
      return;
    }

    const fileName = document.fileName.split('/').pop() ?? document.fileName;

    // Custom Editor (静的パターン) が処理済みの場合はスキップ
    if (matchesAnyPattern(fileName, STATIC_CUSTOM_EDITOR_PATTERNS)) {
      return;
    }

    const userPatterns = config.get<string[]>('filePatterns', ['.env']);
    if (!matchesAnyPattern(fileName, userPatterns)) {
      return;
    }

    // ダイアログ表示前にタブを即座に閉じる
    await closeTab(document.uri);

    const warningMessage = config.get<string>(
      'warningMessage',
      'このファイルには公開すると危険な値が書かれている可能性があります。開きますか？',
    );

    const result = await vscode.window.showWarningMessage(
      warningMessage,
      { modal: true },
      'はい',
      'いいえ',
    );

    if (result === 'はい') {
      confirmedFiles.add(document.uri.toString());
      await vscode.window.showTextDocument(document.uri);
    }
  };

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      handleDocumentOpen(document).catch(() => {
        // エラーは握り潰す — バックグラウンドで動く安全機能のため
      });
    }),
  );
};
