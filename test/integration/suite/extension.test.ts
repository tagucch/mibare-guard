import * as assert from 'assert';
import * as vscode from 'vscode';

describe('拡張の有効化', () => {
  it('拡張がインストール済みでアクティベートできる', async () => {
    const ext = vscode.extensions.getExtension('tagucch.secret-file-cautioner');
    assert.ok(ext, 'Extension tagucch.secret-file-cautioner が見つかる');
    await ext.activate();
    assert.strictEqual(ext.isActive, true, 'アクティベーション後に isActive === true');
  });

  it('package.json で Custom Editor を contribute している', () => {
    const ext = vscode.extensions.getExtension('tagucch.secret-file-cautioner');
    assert.ok(ext);
    const editors = ext.packageJSON.contributes?.customEditors;
    assert.ok(Array.isArray(editors) && editors.length > 0, 'customEditors が存在する');
    assert.strictEqual(editors[0].viewType, 'secretFileCautioner.warningEditor');
  });

  it('Custom Editor の selector に期待するパターンが含まれる', () => {
    const ext = vscode.extensions.getExtension('tagucch.secret-file-cautioner');
    const editors = ext!.packageJSON.contributes.customEditors;
    const patterns: string[] = editors[0].selector.map(
      (s: { filenamePattern: string }) => s.filenamePattern,
    );
    for (const expected of ['.env', '.env.*', '*.pem', '*.key', 'id_rsa', '.npmrc']) {
      assert.ok(patterns.includes(expected), `${expected} が selector に含まれる`);
    }
  });
});
