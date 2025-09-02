# 3D Character Admiring Web App

3Dキャラクターとのインタラクティブな対話を楽しむWebアプリケーション（MCP - Minimum Viable Product）

## 🌟 概要

このアプリケーションは、Three.jsとA-Frameを活用した3Dレンダリング技術と、Google Gemini 2.0 Flash AIによる自然な会話機能を組み合わせた、革新的なキャラクター対話システムです。

### 技術スタック

**フロントエンド:**
- HTML5, CSS3, JavaScript (ES6+)
- Three.js (3Dレンダリング)
- A-Frame (VR対応3D表示)
- @pixiv/three-vrm (VRMモデル対応)

**バックエンド:**
- Python 3.9+
- FastAPI (高性能WebAPIフレームワーク)
- SQLAlchemy (ORMとデータベース管理)
- SQLite (開発用データベース)

**AI・認証:**
- Google Gemini 2.0 Flash (主要AI) / Gemini 1.5 Flash (フォールバック)
- JWT認証 + メール2FA
- bcrypt暗号化

## 🚀 現在の機能（MCP フェーズ）

### ✅ 実装完了
- **安全な認証システム**: メールベース2FA認証
- **3Dキャラクター表示**: Three.js + A-Frame デュアルレンダラー
- **AIチャット機能**: Gemini 2.0 Flash による自然な対話
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **リアルタイム感情分析**: キャラクターの感情表現

### 🎯 次期フェーズ予定
- **Phase 2**: 音声対話（AssemblyAI + ElevenLabs TTS）
- **Phase 3**: キャラクターアニメーション
- **Phase 4**: 通貨システム・ショップ機能
- **Phase 5**: UI/UX拡張・最適化

## 📋 セットアップ

### 前提条件
- Python 3.9以上
- Node.js（開発用、Optional）
- Google AI Studio API Key
- Gmail（SMTP送信用）

### 1. リポジトリクローン
```bash
git clone <repository-url>
cd 3DcharacterAdmiring
```

### 2. バックエンドセットアップ
```bash
cd src/mcp/backend

# 仮想環境作成
python -m venv venv

# 仮想環境アクティベート
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 依存関係インストール
pip install -r requirements.txt
```

### 3. 環境変数設定
```bash
# .env.templateをコピーして.envを作成
cp .env.template .env

# .envファイルを編集して以下を設定:
# - GEMINI_API_KEY（Google AI Studioから取得）
# - SMTP設定（Gmail App Passwordを推奨）
# - JWT_SECRET_KEY（32文字以上のランダム文字列）
```

### 4. データベース初期化
```bash
# バックエンドディレクトリで実行
python main.py
# または
uvicorn main:app --reload
```

### 5. フロントエンド起動
```bash
# Live Serverなどでフロントエンドフォルダを起動
# 推奨: VSCode Live Server Extension
# URL: http://localhost:5500 または http://127.0.0.1:5500
```

## 🔧 API設定ガイド

### Google Gemini API Key取得
1. [Google AI Studio](https://ai.google.dev/) にアクセス
2. 新しいAPIキーを作成
3. `.env`の`GEMINI_API_KEY`に設定

### Gmail SMTP設定
1. Googleアカウントで2段階認証を有効化
2. [App Passwords](https://support.google.com/accounts/answer/185833)を生成
3. `.env`のSMTP設定に入力

## 📁 プロジェクト構造

```
3DcharacterAdmiring/
├── README.md
├── document/                    # 設計ドキュメント
├── src/mcp/                    # MCPフェーズコード
│   ├── frontend/               # フロントエンド
│   │   ├── index.html         # ログイン画面
│   │   ├── home.html          # メイン画面
│   │   ├── options.html       # オプション画面
│   │   ├── css/               # スタイルシート
│   │   ├── js/                # JavaScript
│   │   └── assets/            # 静的リソース
│   └── backend/               # バックエンド
│       ├── main.py            # FastAPIメインアプリ
│       ├── models/            # データベースモデル
│       ├── routes/            # APIルート
│       ├── utils/             # ユーティリティ
│       ├── database/          # DB設定
│       └── requirements.txt   # Python依存関係
```

## 🎮 使用方法

### 1. ユーザー登録・ログイン
1. アプリケーションにアクセス
2. メールアドレスとパスワードで新規登録
3. メールで届く6桁のOTPコードを入力

### 2. 3Dキャラクターとの対話
1. ホーム画面で3Dキャラクター「あずさ」を確認
2. チャット欄にメッセージを入力
3. AI による自然な返答を楽しむ
4. Three.js ⇄ A-Frame レンダラー切り替え可能

### 3. オプション設定
- ハンバーガーメニュー → オプション
- ログアウト、デバッグ情報表示等

## 🔒 セキュリティ機能

- **JWT + Email 2FA**: 安全な認証システム
- **bcrypt暗号化**: パスワードの安全な保存
- **Rate Limiting**: API濫用防止（OTP送信制限等）
- **CORS設定**: クロスオリジン制御
- **SQLインジェクション対策**: SQLAlchemyによる安全なDB操作

## 🐛 トラブルシューティング

### よくある問題

**1. メールが届かない**
- SMTP設定を確認
- Gmailの場合、App Passwordを使用
- 開発モードでは、メールはコンソールに表示

**2. 3Dキャラクターが表示されない**
- ブラウザのWebGL対応を確認
- コンソールエラーをチェック
- Three.js/A-Frameのリソース読み込みを確認

**3. AI応答がない**
- Gemini API Keyの設定を確認
- ネットワーク接続をチェック
- バックエンドログでエラー確認

### デバッグ方法
```bash
# バックエンドログ確認
cd src/mcp/backend
python main.py

# フロントエンドデバッグ
# ブラウザ開発者ツール → Console
```

## 📈 パフォーマンス目標

- **応答速度**: <500ms（Gemini API）
- **3D描画**: 60 FPS
- **メモリ使用量**: <100MB（フロントエンド）
- **同時接続**: ~100ユーザー（MCP想定）

## 🛣️ 開発ロードマップ

### Phase 1 (MCP) ✅
- 基本認証・3D表示・テキストチャット

### Phase 2 🔄
- 音声入出力（AssemblyAI + ElevenLabs）
- 基本アニメーション

### Phase 3 📝
- 入力評価・通貨システム・ショップ

### Phase 4 📝
- キャラクターパラメータ・実績システム

### Phase 5 📝
- UI/UX最適化・フル機能実装

## 🤝 コントリビューション

このプロジェクトは学習・研究目的で開発されています。
フィードバックや改善提案は歓迎です。

## 📄 ライセンス

このプロジェクトは教育・研究目的で作成されています。
商用利用については別途ご相談ください。

## 📞 サポート

技術的な質問やサポートが必要な場合は、プロジェクト管理者までお問い合わせください。

---

**Developed with ❤️ using Three.js, A-Frame, FastAPI, and Google Gemini AI**
