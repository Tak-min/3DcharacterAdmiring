# 3D AI Companion - Full Stack Application

このプロジェクトは、感情認識機能を持つ3D AIコンパニオンを特徴とするフルスタックWebアプリケーションです。アプリケーションはAIサービスを使用してユーザー入力を理解し、文脈的かつ感情的に適切な応答を生成し、感情コンテキストに基づいて3Dキャラクターをアニメーション化します。

## プロジェクト構造

```
/app                      # バックエンドAPI (FastAPI)
|-- /api
|   |-- /routes
|   |   `-- interact.py   # メインの対話エンドポイント
|-- /core
|   |-- config.py         # 環境変数管理
|   |-- security.py       # Auth0トークン検証
|   `-- animation_mapper.py # 感情からアニメーションへのマッピング
|-- /services
|   |-- assemblyai_service.py # 音声からテキストへの変換サービス
|   |-- gemini_service.py     # 言語生成と感情分析
|   `-- elevenlabs_service.py # テキストから音声への変換サービス
|-- /models
|   `-- schemas.py        # APIのI/O用Pydanticモデル
`-- main.py               # FastAPIアプリのエントリーポイント

/frontend                 # フロントエンドReactアプリケーション
|-- /public
|   |-- /models           # 3Dモデルファイル (.glb)
|-- /src
|   |-- /components       # Reactコンポーネント
|   |-- /pages            # ページコンポーネント
|   |-- /services         # APIと音声サービス
|   |-- /store            # Zustandを使用した状態管理
|   |-- App.js            # メインアプリケーションコンポーネント
|   `-- index.js          # アプリケーションのエントリーポイント

.dockerignore
Dockerfile
pyproject.toml
README.md
```

## セットアップと導入

### 1. 前提条件
- Python 3.11+
- 依存関係管理用のPoetry
- コンテナ化用のDocker
- Node.js 18+（フロントエンド用）

### 2. 環境変数

バックエンド用の`.env`ファイルをルートディレクトリに作成し、以下の変数を追加します。これらは外部サービスに接続するために不可欠です。

```
# Auth0の設定
AUTH0_DOMAIN="YOUR_AUTH0_DOMAIN"
AUTH0_API_AUDIENCE="YOUR_AUTH0_API_AUDIENCE"

# AIサービスのAPIキー
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
ASSEMBLYAI_API_KEY="YOUR_ASSEMBLYAI_API_KEY"
ELEVENLABS_API_KEY="YOUR_ELEVENLABS_API_KEY"

# フロントエンドのURLをCORS用に設定
CLIENT_ORIGIN_URL="http://localhost:3000" # またはデプロイされたフロントエンドのURL
```

フロントエンド用の`.env.local`ファイルを`frontend`ディレクトリに作成し、以下の変数を追加します：

```
# Auth0の設定
REACT_APP_AUTH0_DOMAIN=your-auth0-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-auth0-client-id
REACT_APP_AUTH0_AUDIENCE=https://your-api-identifier

# バックエンドAPIのURL
REACT_APP_API_URL=http://localhost:8000/api
```

### 3. 依存関係のインストール

バックエンド：Poetryを使用して、必要なすべてのPythonパッケージをインストールします：

```bash
poetry install
```

フロントエンド：必要なすべてのJavaScriptパッケージをインストールします：

```bash
cd frontend
npm install
```

## アプリケーションの実行

### ローカル開発

バックエンド：ローカル開発環境でサーバーを実行するには（ホットリロードあり）：

```bash
poetry run uvicorn app.main:app --reload
```

APIは `http://localhost:8000` で利用可能になります。

フロントエンド：ローカル開発サーバーを実行するには：

```bash
cd frontend
npm start
```

フロントエンドアプリケーションは `http://localhost:3000` で利用可能になります。

### Dockerを使用する

バックエンドをDockerを使用して構築・実行するには：

1.  **Dockerイメージをビルドする：**
    ```bash
    docker build -t ai-companion-backend .
    ```

2.  **Dockerコンテナを実行する：**
    ```bash
    docker run -p 8000:8000 --env-file .env ai-companion-backend
    ```

APIは `http://localhost:8000` で利用可能になります。

## APIエンドポイント

-   `POST /api/interact`: ユーザーのテキストまたは音声入力を処理するメインエンドポイント。Auth0認証が必要です。
-   `GET /health`: シンプルなヘルスチェックエンドポイント。

詳細なリクエストとレスポンスのモデルについては、`app/models/schemas.py`を参照してください。

## デプロイメント

### バックエンド

このアプリケーションは、以下のようなDockerをサポートするPlatform-as-a-Service（PaaS）上でDockerコンテナとしてデプロイされるように設計されています：
- Google Cloud Run
- AWS App Runner
- Heroku
- Render

デプロイ時には、プロバイダーのダッシュボードで`.env`ファイルにリストされている環境変数を必ず設定してください。また、CORSが正しく機能するように、`CLIENT_ORIGIN_URL`がデプロイされたフロントエンドのドメインと一致するようにしてください。

### フロントエンド

フロントエンドは以下のようなプラットフォームにデプロイできます：
- Cloudflare Pages（要件で指定されている）
- Netlify
- Vercel
- GitHub Pages

デプロイ時には、環境変数をプロバイダーのダッシュボードで設定してください。特に、`REACT_APP_API_URL`がデプロイされたバックエンドAPIのURLを指すように注意してください。

## 3Dモデルについて

フロントエンドは、`/public/models/`ディレクトリにある3Dモデル（.glbファイル）を使用します。アプリケーションを実行する前に、適切な3Dモデルをこのディレクトリに配置してください。モデルには、以下のようなアニメーションが含まれている必要があります：

- Idle_Neutral
- Idle_Happy
- Idle_Sad
- Laugh
- Nod_Head_Yes
- Shake_Head_No
- Look_Around_Surprised
- Thinking_Pose

これらのアニメーション名は`app/core/animation_mapper.py`で設定されており、感情に基づいて適切なアニメーションを選択するために使用されます。
