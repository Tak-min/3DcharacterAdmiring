# 🔐 セキュアAPIキー管理システム セットアップガイド

このガイドでは、APIキーを安全に管理するためのプロキシサーバーシステムのセットアップ方法を説明します。

## 📋 概要

従来の問題：
- ❌ APIキーがクライアントサイド（ブラウザ）に露出
- ❌ GitHubにAPIキーがコミットされるリスク
- ❌ セキュリティ上の脆弱性

新しいアーキテクチャ：
- ✅ APIキーをサーバーサイドで安全に管理
- ✅ プロキシサーバー経由でAPI呼び出し
- ✅ APIキーがクライアントに露出しない
- ✅ 環境変数による設定管理

## 🏗️ アーキテクチャ

```
[ブラウザ] → [プロキシサーバー] → [外部API]
             (APIキーを安全に管理)    (Gemini, VOICEVOX, にじボイス)
```

## 🚀 ローカル開発環境のセットアップ

### 1. 必要なパッケージのインストール

```bash
cd cors-proxy
npm install
```

### 2. 環境変数ファイルの作成

```bash
# .env.exampleファイルを.envにコピー
cp .env.example .env
```

### 3. APIキーの設定

`.env`ファイルを編集して、実際のAPIキーを設定：

```env
# Gemini API Key (Google AI Studio から取得)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# VOICEVOX API Key (deprecatedapis.tts.quest から取得)
VOICEVOX_API_KEY=your_actual_voicevox_api_key_here

# Nijivoice API Key (api.nijivoice.com から取得)
NIJIVOICE_API_KEY=your_actual_nijivoice_api_key_here
```

### 4. プロキシサーバーの起動

```bash
cd cors-proxy
npm start
```

サーバーが `http://localhost:3001` で起動します。

### 5. アプリケーションの起動

```bash
# メインディレクトリでローカルサーバーを起動
python -m http.server 3000
# または
npx serve -s . -p 3000
```

アプリケーションが `http://localhost:3000` でアクセス可能になります。

## ☁️ Cloudflare Pages での本番デプロイ

### 1. GitHubリポジトリの準備

```bash
# .gitignoreにより.envファイルは除外されます
git add .
git commit -m "Add secure API proxy system"
git push origin main
```

### 2. Cloudflare Pages プロジェクトの作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. "Pages" → "Create a project" → "Connect to Git"
3. GitHubリポジトリを選択
4. ビルド設定：
   - **Build command**: (空欄)
   - **Build output directory**: (空欄)
   - **Root directory**: `/`

### 3. 環境変数の設定

Cloudflare Pages の設定画面で以下の環境変数を追加：

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
VOICEVOX_API_KEY=your_actual_voicevox_api_key_here
NIJIVOICE_API_KEY=your_actual_nijivoice_api_key_here
```

### 4. Functions の有効化

Cloudflare Pages Functions は自動的に有効になります。以下のエンドポイントが利用可能：

- `https://your-domain.pages.dev/api/proxy/gemini`
- `https://your-domain.pages.dev/api/proxy/voicevox/speakers`
- `https://your-domain.pages.dev/api/proxy/voicevox/audio`
- `https://your-domain.pages.dev/api/proxy/nijivoice/voice-actors`
- `https://your-domain.pages.dev/api/proxy/nijivoice/generate-voice/:id`

## 🔧 設定の確認方法

### ローカル環境

1. ブラウザで `http://localhost:3000` にアクセス
2. 開発者ツールのコンソールで以下を実行：

```javascript
// APIステータスの確認
checkApiStatus()

// プロキシサーバーのヘルスチェック
fetch('http://localhost:3001/api/health').then(r => r.json()).then(console.log)
```

### 本番環境

1. デプロイされたサイトにアクセス
2. 開発者ツールのコンソールで以下を実行：

```javascript
// APIステータスの確認
checkApiStatus()

// フォールバック無しでプロキシのみ使用確認
window.secureApiClient.isProxyAvailable
```

## 🐛 トラブルシューティング

### プロキシサーバーに接続できない

**症状**: "🔴 Secure API Proxy: Not available"

**解決策**:
1. プロキシサーバーが起動しているか確認
2. ポート3001が使用可能か確認
3. ファイアウォール設定を確認

### APIキーエラー

**症状**: "API key not configured"

**解決策**:
1. `.env`ファイルにAPIキーが正しく設定されているか確認
2. プロキシサーバーを再起動
3. Cloudflare Pages の環境変数設定を確認

### CORS エラー

**症状**: Cross-origin request blocked

**解決策**:
1. プロキシサーバーが正常に動作しているか確認
2. ブラウザのキャッシュをクリア
3. `cors-proxy/server.js` の CORS 設定を確認

## 📚 APIエンドポイント一覧

### ローカル開発環境

- **ベースURL**: `http://localhost:3001`
- **Gemini**: `POST /api/proxy/gemini`
- **VOICEVOX話者**: `GET /api/proxy/voicevox/speakers`
- **VOICEVOX音声**: `GET /api/proxy/voicevox/audio?text=...&speaker=...`
- **にじボイス話者**: `GET /api/proxy/nijivoice/voice-actors`
- **にじボイス音声**: `POST /api/proxy/nijivoice/generate-voice/{id}`
- **ヘルスチェック**: `GET /api/health`

### 本番環境 (Cloudflare Pages)

- **ベースURL**: `https://your-domain.pages.dev`
- エンドポイントは同様

## 🔒 セキュリティベストプラクティス

1. **環境変数の管理**
   - 本番環境でのみ実際のAPIキーを使用
   - 開発環境では制限されたキーを使用

2. **アクセス制御**
   - CORS設定で許可するオリジンを制限
   - 必要に応じてレート制限を実装

3. **ログ管理**
   - APIキーをログに出力しない
   - エラーログで機密情報を漏洩させない

4. **定期的な更新**
   - APIキーの定期的なローテーション
   - 依存関係の脆弱性チェック

## 📞 サポート

問題が発生した場合：

1. ブラウザの開発者ツールでエラーを確認
2. プロキシサーバーのログを確認
3. APIキーの有効性を確認
4. ネットワーク接続を確認

## 🎯 次のステップ

1. 本番デプロイ後のパフォーマンス監視
2. レート制限やキャッシュの実装検討
3. 追加のセキュリティ機能の実装
4. ユーザー認証システムの統合検討
