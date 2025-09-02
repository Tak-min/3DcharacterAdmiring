import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';

const LoginPage = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="login-container">
      <h1>3Dキャラクター対話アプリ</h1>
      <p>感情を理解するAIコンパニオンとの対話を始めましょう</p>
      <button 
        className="login-button" 
        onClick={() => loginWithRedirect()}
      >
        ログインして始める
      </button>
    </div>
  );
};

export default LoginPage;
