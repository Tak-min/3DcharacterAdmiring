/**
 * VRMモデルの基本的なモーション制御を管理するクラス
 * 感情表現とアイドルモーションのみをサポートします
 */
class MotionController {
    constructor(vrmController) {
        this.vrmController = vrmController;
        this.currentMotion = null;
        this.motionQueue = [];
        this.isPlaying = false;
        this.idleMotionInterval = null;
        
        // モーション設定
        this.motionConfig = {
            emotion: {
                duration: 3000, // 3秒
                intensity: 0.8
            },
            idle: {
                interval: 8000, // 8秒間隔
                variations: ['breathe', 'lookAround', 'blink']
            }
        };
        
        this.init();
    }
    
    /**
     * 初期化処理
     */
    init() {
        console.log('MotionController: 初期化中...');
        
        // アイドルモーションの開始
        this.startIdleMotion();
        
        // VRMモデル読み込み完了時のイベントリスナー
        document.addEventListener('vrmLoaded', () => {
            console.log('MotionController: VRMモデル読み込み完了、モーション機能を有効化');
            this.resetAllMotions();
        });
    }
    
    /**
     * 感情表現モーションを実行
     * @param {string} emotion - 感情の種類
     * @param {number} intensity - 強度 (0-1)
     */
    async playEmotion(emotion, intensity = 0.8) {
        console.log(`MotionController: 感情表現実行 - ${emotion}`);
        
        const motion = {
            type: 'emotion',
            emotion,
            intensity,
            duration: this.motionConfig.emotion.duration
        };
        
        return this.executeMotion(motion);
    }
    
    /**
     * モーションを実行
     * @param {Object} motion - モーション設定
     */
    async executeMotion(motion) {
        return new Promise((resolve) => {
            // 現在再生中の場合はキューに追加
            if (this.isPlaying) {
                this.motionQueue.push({ motion, resolve });
                return;
            }
            
            this.isPlaying = true;
            this.currentMotion = motion;
            
            // 感情表現を実行
            if (motion.type === 'emotion') {
                this.executeEmotion(motion);
            }
            
            // 指定時間後にモーション終了
            setTimeout(() => {
                this.endMotion();
                resolve();
                
                // キューに待機中のモーションがあれば実行
                if (this.motionQueue.length > 0) {
                    const { motion: nextMotion, resolve: nextResolve } = this.motionQueue.shift();
                    this.executeMotion(nextMotion).then(nextResolve);
                }
            }, motion.duration);
        });
    }
    
    /**
     * 感情表現を実行
     * @param {Object} motion - 感情モーション設定
     */
    executeEmotion(motion) {
        const { emotion, intensity } = motion;
        
        // VRMControllerの感情表現機能を使用
        if (this.vrmController) {
            this.vrmController.setEmotion(emotion, intensity);
        }
    }
    
    /**
     * アイドルモーション開始
     */
    startIdleMotion() {
        if (this.idleMotionInterval) {
            clearInterval(this.idleMotionInterval);
        }
        
        this.idleMotionInterval = setInterval(() => {
            if (!this.isPlaying && this.vrmController.currentVrm) {
                // ランダムなアイドルモーションを実行
                const variations = this.motionConfig.idle.variations;
                const randomMotion = variations[Math.floor(Math.random() * variations.length)];
                
                switch (randomMotion) {
                    case 'breathe':
                        this.performBreathingMotion();
                        break;
                    case 'lookAround':
                        this.performLookAroundMotion();
                        break;
                    case 'blink':
                        // まばたきは既にVRMControllerで実装済み
                        break;
                }
            }
        }, this.motionConfig.idle.interval);
    }
    
    /**
     * 呼吸モーション
     */
    performBreathingMotion() {
        if (!this.vrmController.currentVrm) return;
        
        // 胸の微細な動きでブリージングを表現
        console.log('MotionController: ブリージングモーション実行');
    }
    
    /**
     * 見回しモーション
     */
    performLookAroundMotion() {
        if (!this.vrmController.currentVrm) return;
        
        console.log('MotionController: 見回しモーション実行');
        
        // ランダムな方向を見る
        const randomX = (Math.random() - 0.5) * 2;
        const randomY = 1.0 + (Math.random() - 0.5) * 0.4;  // 1.0を中心に±0.2の範囲
        const randomZ = (Math.random() - 0.5) * 2;
        
        const target = new THREE.Vector3(randomX, randomY, randomZ);
        this.vrmController.lookAt(target);
        
        // 2秒後に正面に戻す
        setTimeout(() => {
            this.vrmController.lookAt(new THREE.Vector3(0, 1.2, 0));
        }, 2000);
    }
    
    /**
     * モーション終了処理
     */
    endMotion() {
        this.isPlaying = false;
        this.currentMotion = null;
        
        // 表情をリセット（感情表現の場合）
        if (this.currentMotion?.type === 'emotion') {
            setTimeout(() => {
                if (this.vrmController) {
                    this.vrmController.resetEmotions();
                }
            }, 500);
        }
    }
    
    /**
     * 全てのモーションをリセット
     */
    resetAllMotions() {
        this.isPlaying = false;
        this.currentMotion = null;
        this.motionQueue = [];
        
        if (this.vrmController) {
            this.vrmController.resetEmotions();
        }
        
        console.log('MotionController: 全てのモーションをリセットしました');
    }
    
    /**
     * アイドルモーション停止
     */
    stopIdleMotion() {
        if (this.idleMotionInterval) {
            clearInterval(this.idleMotionInterval);
            this.idleMotionInterval = null;
        }
    }
    
    /**
     * モーションコントローラーの破棄
     */
    dispose() {
        this.stopIdleMotion();
        this.resetAllMotions();
        console.log('MotionController: 破棄されました');
    }
}

// グローバルアクセス用
window.MotionController = MotionController;
