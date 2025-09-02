import React, { useRef, useEffect } from 'react';
import useStore from '../store/store';

const MessageDisplay = () => {
  const messages = useStore(state => state.messages);
  const containerRef = useRef(null);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // 感情アイコンのマッピング
  const getEmotionIcon = (emotion) => {
    if (!emotion) return '';
    
    const icons = {
      'joy': '😊',
      'sadness': '😢',
      'agreement': '👍',
      'surprise': '😲',
      'neutral': '😐',
      'anger': '😠',
      'curiosity': '🤔',
      'thoughtful': '💭'
    };
    
    return icons[emotion.emotion] || '';
  };

  return (
    <div className="message-display" ref={containerRef}>
      {messages.length === 0 ? (
        <p className="empty-message">会話を始めてください</p>
      ) : (
        messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.type === 'user' ? 'user-message' : 'ai-message'}`}
          >
            <span className="message-prefix">
              {message.type === 'user' ? '👤 あなた: ' : '🤖 AI: '}
              {message.type === 'ai' && message.emotion && getEmotionIcon(message.emotion)}
            </span>
            <span className="message-content">{message.content}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default MessageDisplay;
