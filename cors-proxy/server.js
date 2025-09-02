const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// CORSを許可
app.use(cors({ origin: '*' }));

// プロキシの設定
app.use('/voicevox', createProxyMiddleware({
  target: 'http://localhost:50021',
  changeOrigin: true,
  pathRewrite: {
    '^/voicevox': '', // '/voicevox' を '' に置換する
  },
  onProxyRes: function(proxyRes, req, res) {
    // CORSヘッダーを追加
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, PATCH, DELETE';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'X-Requested-With,content-type,Accept';
  },
  onError: function(err, req, res) {
    console.error('プロキシエラー:', err);
    res.status(500).send('プロキシエラーが発生しました');
  }
}));

// サーバー起動
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`ローカルCORSプロキシサーバーが起動しました: http://localhost:${PORT}`);
  console.log(`VOICEVOXへのリクエスト例: http://localhost:${PORT}/voicevox/speakers`);
});
