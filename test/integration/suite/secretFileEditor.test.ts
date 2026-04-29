import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  closeAllEditors,
  ensureExtensionActivated,
  resetConfig,
  waitFor,
} from './helpers';

describe('SecretFileEditor (Custom Editor)', () => {
  let fixturesDir: string;

  before(async () => {
    await ensureExtensionActivated();
    const folders = vscode.workspace.workspaceFolders;
    assert.ok(folders && folders.length > 0, 'workspace folder が開かれている');
    fixturesDir = folders[0].uri.fsPath;
  });

  beforeEach(async () => {
    await closeAllEditors();
    await resetConfig();
  });

  after(async () => {
    await closeAllEditors();
    await resetConfig();
  });

  it('.env を開くと Custom Editor の viewType でタブが生成される', async () => {
    const uri = vscode.Uri.file(path.join(fixturesDir, '.env'));
    await vscode.commands.executeCommand('vscode.open', uri);

    await waitFor(() => {
      const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
      return (
        tab?.input instanceof vscode.TabInputCustom &&
        tab.input.viewType === 'secretFileCautioner.warningEditor'
      );
    });
  });

  it('*.pem ファイルも Custom Editor で開かれる', async () => {
    const uri = vscode.Uri.file(path.join(fixturesDir, 'test.pem'));
    await vscode.commands.executeCommand('vscode.open', uri);

    await waitFor(() => {
      const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
      return (
        tab?.input instanceof vscode.TabInputCustom &&
        tab.input.viewType === 'secretFileCautioner.warningEditor'
      );
    });
  });

  it('enabled=false のとき、.env は default text editor で開かれる', async () => {
    await vscode.workspace
      .getConfiguration('secretFileCautioner')
      .update('enabled', false, vscode.ConfigurationTarget.Workspace);

    const uri = vscode.Uri.file(path.join(fixturesDir, '.env'));
    await vscode.commands.executeCommand('vscode.open', uri);

    // Custom Editor は一瞬描画された後 vscode.openWith('default') で text editor に差し替わる
    await waitFor(
      () => {
        const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
        return tab?.input instanceof vscode.TabInputText;
      },
      { timeoutMs: 5000 },
    );
  });
});
