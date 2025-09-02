import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import CharacterScene from '../components/CharacterScene';
import InputControls from '../components/InputControls';
import MessageDisplay from '../components/MessageDisplay';
import useStore from '../store/store';
import apiService from '../services/api.service';

const ChatPage = () => {
  const { getAccessTokenSilently, logout, user } = useAuth0();
  const { setError, resetState } = useStore();

  // コンポーネント初期化時にAuth0トークンを設定
  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Auth0からアクセストークンを取得
        const token = await getAccessTokenSilently();
        
        // APIサービスに認証トークンを設定
        apiService.setAuthToken(token);
        
        // APIの健全性チェック
        await apiService.checkHealth();
      } catch (error) {
        console.error('Auth setup error:', error);
        setError('認証またはAPIの初期化中にエラーが発生しました。');
      }
    };
    
    setupAuth();
    
    // クリーンアップ
    return () => {
      resetState();
    };
  }, [getAccessTokenSilently, setError, resetState]);

  // ログアウト処理
  const handleLogout = () => {
    logout({ returnTo: window.location.origin });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-title">3Dキャラクター対話</div>
        <div className="user-info">
          {user?.name && <span className="user-name">👤 {user.name}</span>}
          <button className="logout-button" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </div>
      
      <CharacterScene />
      
      <MessageDisplay />
      
      <InputControls />
    </div>
  );
};

export default ChatPage;
