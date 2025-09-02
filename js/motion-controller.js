/**
 * VRMモデルのモーション制御を管理するクラス
 * 感情表現、ジェスチャー、アイドルモーションなどを制御します
 */
class MotionController {
    constructor(vrmController) {
        this.vrmController = vrmController;
        this.currentMotion = null;
        this.motionQueue = [];
        this.isPlaying = false;
        this.idleMotionInterval = null;
        this.gestureAnimations = new Map();
        
        // モーション設定
        this.motionConfig = {
            gesture: {
                duration: 2000, // 2秒
                intensity: 1.0
            },
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
     * ジェスチャーモーションを実行
     * @param {string} gestureType - ジェスチャーの種類
     * @param {number} intensity - 強度 (0-1)
     */
    async playGesture(gestureType, intensity = 1.0) {
        console.log(`MotionController: ジェスチャー実行 - ${gestureType}`);
        
        const motion = {
            type: 'gesture',
            gestureType,
            intensity,
            duration: this.motionConfig.gesture.duration
        };
        
        return this.executeMotion(motion);
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
            
            // モーションタイプに応じて実行
            switch (motion.type) {
                case 'gesture':
                    this.executeGesture(motion);
                    break;
                case 'emotion':
                    this.executeEmotion(motion);
                    break;
                default:
                    console.warn('MotionController: 未知のモーションタイプ:', motion.type);
                    break;
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
     * ジェスチャーを実行
     * @param {Object} motion - ジェスチャーモーション設定
     */
    executeGesture(motion) {
        const { gestureType, intensity } = motion;
        
        switch (gestureType) {
            case 'wave':
                this.performWaveGesture(intensity);
                break;
            case 'nod':
                this.performNodGesture(intensity);
                break;
            case 'shake':
                this.performShakeGesture(intensity);
                break;
            case 'point':
                this.performPointGesture(intensity);
                break;
            case 'thumbsUp':
                this.performThumbsUpGesture(intensity);
                break;
            case 'clap':
                this.performClapGesture(intensity);
                break;
            default:
                console.warn('MotionController: 未対応のジェスチャー:', gestureType);
                break;
        }
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
     * 手を振るジェスチャー
     * @param {number} intensity - 強度
     */
    performWaveGesture(intensity) {
        console.log('MotionController: 手を振るジェスチャーを実行');
        
        if (!this.vrmController.currentVrm) return;
        
        // 手を振るアニメーション（ボーンアニメーション）
        const vrm = this.vrmController.currentVrm;
        
        if (vrm.scene) {
            // 右腕のボーンを探す
            let rightArmBone = null;
            let rightForeArmBone = null;
            
            vrm.scene.traverse((object) => {
                if (object.isBone) {
                    const name = object.name.toLowerCase();
                    if (name.includes('rightarm') || name.includes('right_arm') || name.includes('arm_r')) {
                        rightArmBone = object;
                    }
                    if (name.includes('rightforearm') || name.includes('right_forearm') || name.includes('forearm_r')) {
                        rightForeArmBone = object;
                    }
                }
            });
            
            if (rightArmBone || rightForeArmBone) {
                // 手を振るアニメーション
                this.animateWave(rightArmBone, rightForeArmBone, intensity);
            }
        }
    }
    
    /**
     * うなずきジェスチャー
     * @param {number} intensity - 強度
     */
    performNodGesture(intensity) {
        console.log('MotionController: うなずきジェスチャーを実行');
        
        if (!this.vrmController.currentVrm) return;
        
        const vrm = this.vrmController.currentVrm;
        
        if (vrm.scene) {
            // 頭のボーンを探す
            let headBone = null;
            
            vrm.scene.traverse((object) => {
                if (object.isBone) {
                    const name = object.name.toLowerCase();
                    if (name.includes('head') || name.includes('首') || name.includes('頭')) {
                        headBone = object;
                    }
                }
            });
            
            if (headBone) {
                this.animateNod(headBone, intensity);
            }
        }
    }
    
    /**
     * 首を振るジェスチャー
     * @param {number} intensity - 強度
     */
    performShakeGesture(intensity) {
        console.log('MotionController: 首を振るジェスチャーを実行');
        
        if (!this.vrmController.currentVrm) return;
        
        const vrm = this.vrmController.currentVrm;
        
        if (vrm.scene) {
            // 頭のボーンを探す
            let headBone = null;
            
            vrm.scene.traverse((object) => {
                if (object.isBone) {
                    const name = object.name.toLowerCase();
                    if (name.includes('head') || name.includes('首') || name.includes('頭')) {
                        headBone = object;
                    }
                }
            });
            
            if (headBone) {
                this.animateShake(headBone, intensity);
            }
        }
    }
    
    /**
     * 指差しジェスチャー
     * @param {number} intensity - 強度
     */
    performPointGesture(intensity) {
        console.log('MotionController: 指差しジェスチャーを実行');
        // 指差しポーズの実装
        // 右腕を前に伸ばし、人差し指を立てるポーズ
    }
    
    /**
     * サムズアップジェスチャー
     * @param {number} intensity - 強度
     */
    performThumbsUpGesture(intensity) {
        console.log('MotionController: サムズアップジェスチャーを実行');
        // 親指を立てるポーズの実装
    }
    
    /**
     * 拍手ジェスチャー
     * @param {number} intensity - 強度
     */
    performClapGesture(intensity) {
        console.log('MotionController: 拍手ジェスチャーを実行');
        // 拍手アニメーションの実装
    }
    
    /**
     * 手を振るアニメーション
     * @param {THREE.Bone} armBone - 腕のボーン
     * @param {THREE.Bone} foreArmBone - 前腕のボーン
     * @param {number} intensity - 強度
     */
    animateWave(armBone, foreArmBone, intensity) {
        if (!armBone && !foreArmBone) return;
        
        // 元の回転を保存
        const originalRotations = new Map();
        if (armBone) {
            originalRotations.set(armBone, armBone.rotation.clone());
        }
        if (foreArmBone) {
            originalRotations.set(foreArmBone, foreArmBone.rotation.clone());
        }
        
        // アニメーションパラメータ
        const duration = this.motionConfig.gesture.duration;
        const startTime = performance.now();
        
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 波のような動きを作成
            const wavePhase = Math.sin(progress * Math.PI * 4) * intensity;
            
            if (armBone) {
                // 腕を上げる
                armBone.rotation.z = originalRotations.get(armBone).z + (Math.PI / 3) * intensity;
                armBone.rotation.x = originalRotations.get(armBone).x + wavePhase * 0.3;
            }
            
            if (foreArmBone) {
                // 前腕を振る
                foreArmBone.rotation.y = originalRotations.get(foreArmBone).y + wavePhase * 0.5;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 元の位置に戻す
                originalRotations.forEach((rotation, bone) => {
                    bone.rotation.copy(rotation);
                });
            }
        };
        
        animate();
    }
    
    /**
     * うなずきアニメーション
     * @param {THREE.Bone} headBone - 頭のボーン
     * @param {number} intensity - 強度
     */
    animateNod(headBone, intensity) {
        if (!headBone) return;
        
        const originalRotation = headBone.rotation.clone();
        const duration = this.motionConfig.gesture.duration;
        const startTime = performance.now();
        
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // うなずきの動き
            const nodPhase = Math.sin(progress * Math.PI * 2) * intensity;
            headBone.rotation.x = originalRotation.x + nodPhase * 0.3;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                headBone.rotation.copy(originalRotation);
            }
        };
        
        animate();
    }
    
    /**
     * 首振りアニメーション
     * @param {THREE.Bone} headBone - 頭のボーン
     * @param {number} intensity - 強度
     */
    animateShake(headBone, intensity) {
        if (!headBone) return;
        
        const originalRotation = headBone.rotation.clone();
        const duration = this.motionConfig.gesture.duration;
        const startTime = performance.now();
        
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 首振りの動き
            const shakePhase = Math.sin(progress * Math.PI * 3) * intensity;
            headBone.rotation.y = originalRotation.y + shakePhase * 0.4;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                headBone.rotation.copy(originalRotation);
            }
        };
        
        animate();
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
        const randomY = 1.3 + (Math.random() - 0.5) * 0.6;
        const randomZ = (Math.random() - 0.5) * 2;
        
        const target = new THREE.Vector3(randomX, randomY, randomZ);
        this.vrmController.lookAt(target);
        
        // 2秒後に正面に戻す
        setTimeout(() => {
            this.vrmController.lookAt(new THREE.Vector3(0, 1.5, 0));
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
        this.gestureAnimations.clear();
        console.log('MotionController: 破棄されました');
    }
}

// グローバルアクセス用
window.MotionController = MotionController;
