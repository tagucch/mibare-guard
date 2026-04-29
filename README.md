# Secret File Cautioner

機密情報が含まれる可能性のあるファイル (例: `.env`) を VS Code で開く際に、事前に警告ダイアログを表示する拡張機能です。画面共有中などに誤って機密情報を表示してしまう事故を防ぎます。

## 特徴

- `.env` / `.env.*` ファイルを開く際に、内容を表示する前に警告ダイアログを出す
- ユーザが任意のファイルパターン (部分一致 or 正規表現) を追加で指定可能
- 一度「はい」を選択したファイルは、同一セッション中は再度警告を表示しない (VS Code を再起動すると再び警告される)
- 警告メッセージのカスタマイズが可能
- 拡張全体のオン/オフ切り替えが可能

## 使い方

対象ファイルを開くと、ファイルの内容ではなく以下のような警告画面が表示されます:

```
⚠️
.env
このファイルには公開すると危険な値が書かれている可能性があります。開きますか？

  [ はい ]  [ いいえ ]
```

- **はい** を押すとデフォルトのテキストエディタで開きます
- **いいえ** を押すとタブが閉じ、ファイルは表示されません

## 仕組み

このプロダクトでは、ファイルパターンに応じて2つの方式を使い分けています:

### Custom Editor (静的パターン)

以下のパターンは `package.json` の `contributes.customEditors` で Custom Editor が登録されており、VS Code がファイルを開くタイミングで直接警告画面 (Webview) に差し替えます。ファイルの内容が一切描画されないため最も確実です:

| パターン | 対象 |
| --- | --- |
| `.env`, `.env.*` | 環境変数ファイル |
| `*.pem` | PEM 形式の秘密鍵・証明書 |
| `*.key` | 汎用的な秘密鍵ファイル |
| `*.p12`, `*.pfx` | PKCS12 証明書 (秘密鍵を含むことが多い) |
| `id_rsa`, `id_ed25519`, `id_ecdsa`, `id_dsa` | SSH 秘密鍵 |
| `credentials.json` | AWS / GCP / 汎用クレデンシャル |
| `.npmrc` | npm 認証トークン |
| `.netrc` | FTP / HTTP 認証情報 |

### Dynamic File Watcher (動的パターン)

ユーザが `secretFileCautioner.filePatterns` に追加したパターンは、`onDidOpenTextDocument` イベントで検知し、タブを閉じたうえでモーダルダイアログを表示する方式で処理しています。

> 注: 動的パターンの場合、VS Code API の制約により、ファイル内容が一瞬だけ表示されてからタブが閉じる挙動になります。完全に内容を隠したい場合は、上記の Custom Editor 側 (静的パターン) に追加することを推奨します。

## 設定項目

| キー | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `secretFileCautioner.enabled` | `boolean` | `true` | 拡張機能の有効/無効 |
| `secretFileCautioner.filePatterns` | `string[]` | `[".env"]` | 動的ウォッチャーが警告対象とするファイルパターン |
| `secretFileCautioner.warningMessage` | `string` | `このファイルには公開すると危険な値が書かれている可能性があります。開きますか？` | 警告ダイアログに表示するメッセージ |

### ファイルパターンの書式

`secretFileCautioner.filePatterns` は以下の2通りの書式をサポートします:

- **部分一致**: 通常の文字列 (例: `.env`, `secret`, `credentials`)。ファイル名にその文字列が含まれていればマッチ
- **正規表現**: スラッシュで囲む (例: `/^\.env.*/`, `/.*\.pem$/`)。内部で `RegExp` としてコンパイルされ、ファイル名に対して `test()` される

設定例 (`settings.json`):

```json
{
  "secretFileCautioner.filePatterns": [
    ".env",
    "credentials",
    "/^secret\\..+/",
    "/.*\\.pem$/"
  ]
}
```

> 注: `.env` / `.env.*` は Custom Editor 側で常に処理されるため、`filePatterns` から外しても警告は表示されます。

## 開発

### セットアップ

```sh
npm install
```

### ビルド

```sh
# 1回ビルド
npm run compile

# ファイル変更を監視して自動ビルド
npm run watch

# 型チェックのみ (src + test 両方)
npm run check-types

# 配布用ビルド (minify 有効)
npm run package
```

ビルド成果物は `dist/extension.js` に出力されます (esbuild を使用)。

### テスト

単体テスト (Vitest) と、実際の VS Code を起動する統合テスト (Mocha + @vscode/test-electron) の2種類があります。

```sh
# 単体テストのみ (Vitest)
npm run test:unit

# 単体テストを watch モードで
npm run test:unit:watch

# 統合テストのみ (VS Code をダウンロードして起動)
npm run test:integration

# すべて (単体 → 統合)
npm test
```

- 単体テスト: `test/unit/` — 純粋関数 (`filePatternMatcher`, `htmlEscape`) を対象
- 統合テスト: `test/integration/suite/` — 拡張の有効化、Custom Editor 発火、Dynamic Watcher のタブクローズ等を実 VS Code 上で検証

### 拡張機能のデバッグ

1. VS Code でこのプロジェクトを開く
2. `F5` で Extension Development Host を起動
3. 起動したウィンドウで `.env` ファイルを開くと警告ダイアログを確認できる

### ディレクトリ構成

```
src/
├── extension.ts                 # エントリポイント (activate / deactivate)
├── secretFileEditorProvider.ts  # .env 用の Custom Editor (Webview 警告画面)
├── dynamicFileWatcher.ts        # ユーザ定義パターン用の動的ウォッチャー
├── filePatternMatcher.ts        # パターンマッチングユーティリティ
└── htmlEscape.ts                # HTML エスケープユーティリティ

test/
├── unit/                        # Vitest による単体テスト
└── integration/
    ├── fixtures/                # 統合テスト用のサンプルファイル
    └── suite/                   # Mocha による統合テスト
```
