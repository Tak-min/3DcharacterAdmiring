class AudioRecorderService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
  }

  // 録音を開始する
  async startRecording() {
    try {
      // ユーザーのマイクにアクセス
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      // データが利用可能になったときのイベントハンドラ
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // 録音開始
      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  // 録音を停止し、結果を返す
  stopRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        // 録音データをBlob形式で取得
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        
        // BlobをBase64に変換
        const base64Audio = await this.blobToBase64(audioBlob);
        
        // トラックを停止してリソースを解放
        this.stream.getTracks().forEach(track => track.stop());
        
        resolve(base64Audio);
      };

      this.mediaRecorder.stop();
    });
  }

  // BlobをBase64に変換するヘルパー関数
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // data:audio/wav;base64, の部分を削除
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export default new AudioRecorderService();
