import * as vscode from 'vscode';
import { escapeHtml } from './htmlEscape';

const VIEW_TYPE = 'mibareGuard.warningEditor';

export const registerSecretFileEditor = (
  _context: vscode.ExtensionContext,
  confirmedFiles: Set<string>,
): vscode.Disposable => {
  const provider: vscode.CustomTextEditorProvider = {
    resolveCustomTextEditor: async (document, webviewPanel, _token) => {
      const config = vscode.workspace.getConfiguration('mibareGuard');
      const enabled = config.get<boolean>('enabled', true);

      // 拡張が無効 — デフォルトのテキストエディタで即座に開く
      if (!enabled) {
        await vscode.commands.executeCommand('vscode.openWith', document.uri, 'default');
        webviewPanel.dispose();
        return;
      }

      // このセッションで既に確認済み — デフォルトのテキストエディタで即座に開く
      if (confirmedFiles.has(document.uri.toString())) {
        await vscode.commands.executeCommand('vscode.openWith', document.uri, 'default');
        webviewPanel.dispose();
        return;
      }

      const warningMessage = config.get<string>(
        'warningMessage',
        'このファイルには公開すると危険な値が書かれている可能性があります。開きますか？',
      );

      webviewPanel.webview.options = { enableScripts: true };
      webviewPanel.webview.html = buildWarningHtml(document.fileName, warningMessage);

      webviewPanel.webview.onDidReceiveMessage(async (message: { command: string }) => {
        if (message.command === 'confirm') {
          confirmedFiles.add(document.uri.toString());
          await vscode.commands.executeCommand('vscode.openWith', document.uri, 'default');
          webviewPanel.dispose();
        } else if (message.command === 'deny') {
          webviewPanel.dispose();
        }
      });
    },
  };

  return vscode.window.registerCustomEditorProvider(
    VIEW_TYPE,
    provider,
    { webviewOptions: { retainContextWhenHidden: false } },
  );
};

const buildWarningHtml = (filePath: string, warningMessage: string): string => {
  const fileName = filePath.split('/').pop() ?? filePath;
  const escapedFileName = escapeHtml(fileName);
  const escapedMessage = escapeHtml(warningMessage);

  return /* html */ `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .container {
      max-width: 480px;
      width: 100%;
      background-color: var(--vscode-editorWidget-background, var(--vscode-editor-background));
      border: 1px solid var(--vscode-editorWidget-border, var(--vscode-panel-border));
      border-radius: 6px;
      padding: 32px;
      text-align: center;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .filename {
      font-family: var(--vscode-editor-font-family);
      font-size: 0.9em;
      color: var(--vscode-descriptionForeground);
      background-color: var(--vscode-textCodeBlock-background);
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 20px;
      display: inline-block;
      word-break: break-all;
    }
    .message {
      line-height: 1.6;
      margin-bottom: 28px;
      color: var(--vscode-editor-foreground);
    }
    .buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    button {
      padding: 8px 24px;
      border: none;
      border-radius: 4px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      cursor: pointer;
      min-width: 80px;
    }
    .btn-confirm {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .btn-confirm:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    .btn-deny {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .btn-deny:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <div class="filename">${escapedFileName}</div>
    <p class="message">${escapedMessage}</p>
    <div class="buttons">
      <button id="btn-confirm" class="btn-confirm">はい</button>
      <button id="btn-deny" class="btn-deny">いいえ</button>
    </div>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('btn-confirm').addEventListener('click', () => {
      vscode.postMessage({ command: 'confirm' });
    });
    document.getElementById('btn-deny').addEventListener('click', () => {
      vscode.postMessage({ command: 'deny' });
    });
  </script>
</body>
</html>`;
};

