import React, { useState, useEffect } from 'react';
import useStore from '../store/store';
import apiService from '../services/api.service';
import audioRecorderService from '../services/audio-recorder.service';

const InputControls = () => {
  const { 
    currentMessage, 
    setCurrentMessage, 
    isProcessing, 
    setIsProcessing,
    isRecording,
    setIsRecording,
    setError,
    addMessage,
    handleResponse,
    sessionId
  } = useStore();

  // 音声録音の開始
  const startRecording = async () => {
    try {
      const started = await audioRecorderService.startRecording();
      if (started) {
        setIsRecording(true);
      } else {
        setError('マイクへのアクセスが許可されていません。');
      }
    } catch (error) {
      console.error('Recording error:', error);
      setError('録音の開始中にエラーが発生しました。');
    }
  };

  // 音声録音の停止と送信
  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      
      const audioBase64 = await audioRecorderService.stopRecording();
      if (!audioBase64) {
        setIsProcessing(false);
        return;
      }

      // 録音内容をメッセージとして追加
      addMessage({
        type: 'user',
        content: '🎤 [音声メッセージ]',
        timestamp: new Date().toISOString()
      });

      // APIにオーディオデータを送信
      const response = await apiService.sendAudioMessage(audioBase64, sessionId);
      
      // レスポンスを処理
      addMessage({
        type: 'ai',
        content: response.responseText,
        timestamp: new Date().toISOString(),
        emotion: response.emotionData
      });
      
      handleResponse(response);
      
      // 音声を再生
      if (response.audioContent) {
        playAudioResponse(response.audioContent);
      }
      
    } catch (error) {
      console.error('Audio processing error:', error);
      setError('音声処理中にエラーが発生しました。');
      setIsProcessing(false);
    }
  };

  // テキストメッセージの送信
  const sendTextMessage = async (e) => {
    e.preventDefault();
    
    if (!currentMessage.trim() || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // ユーザーメッセージを追加
      addMessage({
        type: 'user',
        content: currentMessage,
        timestamp: new Date().toISOString()
      });
      
      // APIにテキストを送信
      const response = await apiService.sendTextMessage(currentMessage, sessionId);
      
      // レスポンスを処理
      addMessage({
        type: 'ai',
        content: response.responseText,
        timestamp: new Date().toISOString(),
        emotion: response.emotionData
      });
      
      handleResponse(response);
      setCurrentMessage('');
      
      // 音声を再生
      if (response.audioContent) {
        playAudioResponse(response.audioContent);
      }
      
    } catch (error) {
      console.error('Text message error:', error);
      setError('メッセージの送信中にエラーが発生しました。');
      setIsProcessing(false);
    }
  };

  // 音声応答の再生
  const playAudioResponse = (base64Audio) => {
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('音声の再生中にエラーが発生しました。');
    }
  };

  return (
    <div className="chat-controls">
      <form onSubmit={sendTextMessage} className="input-container">
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder="メッセージを入力..."
          disabled={isProcessing || isRecording}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={isProcessing || isRecording || !currentMessage.trim()}
        >
          送信
        </button>
      </form>
      
      <button
        className={`voice-button ${isRecording ? 'microphone-active' : ''}`}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing && !isRecording}
      >
        {isRecording ? '録音停止' : '音声入力'}
      </button>
    </div>
  );
};

export default InputControls;
