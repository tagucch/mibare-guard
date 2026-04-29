import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  closeAllEditors,
  ensureExtensionActivated,
  resetConfig,
  sleep,
  waitFor,
} from './helpers';

describe('DynamicFileWatcher', () => {
  let fixturesDir: string;
  let originalShowWarning: typeof vscode.window.showWarningMessage;

  before(async () => {
    await ensureExtensionActivated();
    const folders = vscode.workspace.workspaceFolders;
    assert.ok(folders && folders.length > 0);
    fixturesDir = folders[0].uri.fsPath;

    // モーダルをブロックしないよう、showWarningMessage をスタブして "いいえ" を返す
    originalShowWarning = vscode.window.showWarningMessage;
    (vscode.window as unknown as { showWarningMessage: unknown }).showWarningMessage =
      async () => 'いいえ';
  });

  after(async () => {
    (vscode.window as unknown as { showWarningMessage: unknown }).showWarningMessage =
      originalShowWarning;
    await closeAllEditors();
    await resetConfig();
  });

  beforeEach(async () => {
    await closeAllEditors();
    await resetConfig();
  });

  it('ユーザ定義パターンにマッチするファイルはタブが閉じられる', async () => {
    await vscode.workspace
      .getConfiguration('secretFileCautioner')
      .update('filePatterns', ['.custom'], vscode.ConfigurationTarget.Workspace);

    const uri = vscode.Uri.file(path.join(fixturesDir, 'secret.custom'));
    await vscode.commands.executeCommand('vscode.open', uri);

    // 動的ウォッチャーがタブを閉じるのを待つ
    await waitFor(
      () => {
        const allTabs = vscode.window.tabGroups.all.flatMap((g) => g.tabs);
        return !allTabs.some(
          (t) =>
            t.input instanceof vscode.TabInputText &&
            t.input.uri.toString() === uri.toString(),
        );
      },
      { timeoutMs: 5000 },
    );
  });

  it('対象外のファイル (regular.txt) はそのまま開かれたままになる', async () => {
    await vscode.workspace
      .getConfiguration('secretFileCautioner')
      .update('filePatterns', ['.custom'], vscode.ConfigurationTarget.Workspace);

    const uri = vscode.Uri.file(path.join(fixturesDir, 'regular.txt'));
    await vscode.commands.executeCommand('vscode.open', uri);

    // ウォッチャーが処理しないことを確認 (少し待って残っているはず)
    await sleep(500);
    const allTabs = vscode.window.tabGroups.all.flatMap((g) => g.tabs);
    const stillOpen = allTabs.some(
      (t) =>
        t.input instanceof vscode.TabInputText &&
        t.input.uri.toString() === uri.toString(),
    );
    assert.strictEqual(stillOpen, true, 'regular.txt のタブは残っている');
  });
});
