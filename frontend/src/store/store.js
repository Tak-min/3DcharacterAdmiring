import { create } from 'zustand';

const useStore = create((set) => ({
  // 対話の状態
  messages: [], // 会話履歴
  currentMessage: '', // 現在のメッセージ入力
  isProcessing: false, // APIリクエスト処理中
  sessionId: null, // セッションID
  error: null, // エラーメッセージ

  // 音声関連の状態
  isRecording: false, // 録音中かどうか
  audioResponse: null, // 音声応答データ

  // アニメーション関連の状態
  currentAnimation: 'Idle_Neutral', // 現在再生中のアニメーション
  
  // アクション
  setCurrentMessage: (message) => set({ currentMessage: message }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setError: (error) => set({ error }),
  setSessionId: (sessionId) => set({ sessionId }),
  
  // メッセージを追加する
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  // 応答を処理する
  handleResponse: (response) => set({
    audioResponse: response.audioContent,
    currentAnimation: response.animationName,
    sessionId: response.sessionId,
    isProcessing: false,
  }),
  
  // 状態をリセットする
  resetState: () => set({
    messages: [],
    currentMessage: '',
    isProcessing: false,
    sessionId: null,
    error: null,
    isRecording: false,
    audioResponse: null,
    currentAnimation: 'Idle_Neutral',
  }),
}));

export default useStore;
