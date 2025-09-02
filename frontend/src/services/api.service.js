import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  // リクエスト送信前に認証トークンを追加するインターセプター
  setAuthToken(token) {
    this.api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // テキスト入力による対話
  async sendTextMessage(text, sessionId = null) {
    try {
      const response = await this.api.post('/interact', {
        inputType: 'text',
        data: text,
        sessionId: sessionId
      });
      return response.data;
    } catch (error) {
      console.error('API Error (sendTextMessage):', error);
      throw error;
    }
  }

  // 音声入力による対話
  async sendAudioMessage(audioBase64, sessionId = null) {
    try {
      const response = await this.api.post('/interact', {
        inputType: 'audio',
        data: audioBase64,
        sessionId: sessionId
      });
      return response.data;
    } catch (error) {
      console.error('API Error (sendAudioMessage):', error);
      throw error;
    }
  }

  // ヘルスチェック
  async checkHealth() {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

export default new ApiService();
