/**
 * VRMモデルのロードと制御を担当するクラス
 */
class VRMController {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentVrm = null;
        this.mixer = null;
        this.clock = new THREE.Clock();
        this.blinkInterval = null;
        this.lookAtTarget = new THREE.Vector3(0, 1.5, 0);
        
        this.init();
    }
    
    /**
     * Three.jsシーンの初期化
     */
    init() {
        // シーンの作成
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f2f5);
        
        // カメラの設定
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 20);
        this.camera.position.set(0, 1.3, 1.5);
        
        // レンダラーの設定
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);
        
        // カメラコントロールの設定
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1.3, 0);
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = 0.6;
        this.controls.maxDistance = 5.0;
        this.controls.update();
        
        // ライトの設定
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(-1, 1, 1);
        this.scene.add(directionalLight);
        
        // ウィンドウリサイズ対応
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // アニメーションループ開始
        this.animate();
    }
    
    /**
     * VRMモデルのロード
     * @param {File|string} source - VRMファイルまたはURL
     * @returns {Promise} ロード完了時に解決するPromise
     */
    loadVRM(source) {
        return new Promise((resolve, reject) => {
            // 既存のVRMがあれば削除
            if (this.currentVrm) {
                this.scene.remove(this.currentVrm.scene);
                if (this.blinkInterval) {
                    clearInterval(this.blinkInterval);
                }
            }
            
            const loader = new THREE.GLTFLoader();
            
            // VRMローダーの設定
            try {
                // Three-VRM 0.6.11を使用した正しいローダー登録
                loader.register((parser) => {
                    return new THREE.VRMLoaderPlugin(parser);
                });
            } catch (error) {
                console.error('Error registering VRM loader:', error);
                reject(error);
                return;
            }
            
            const loadModel = (url) => {
                loader.load(
                    url,
                    (gltf) => {
                        try {
                            // VRMモデルの取得
                            const vrm = gltf.userData.vrm;
                            this.currentVrm = vrm;
                            
                            if (vrm) {
                                // VRMモデルの調整
                                vrm.scene.rotation.y = Math.PI; // モデルを正面に向ける
                                this.scene.add(vrm.scene);
                                
                                // 表情をリセット
                                if (vrm.blendShapeProxy) {
                                    vrm.blendShapeProxy.reset();
                                }
                            } else {
                                // VRMではない通常のglTFモデルの場合
                                gltf.scene.rotation.y = Math.PI;
                                this.scene.add(gltf.scene);
                                this.currentVrm = {
                                    scene: gltf.scene,
                                    blendShapeProxy: null,
                                    lookAt: null
                                };
                            }
                            
                            // アニメーションミキサーの設定
                            this.mixer = new THREE.AnimationMixer(vrm.scene || gltf.scene);
                            
                            // まばたきアニメーションの設定
                            this.setupBlinking();
                            
                            resolve(vrm);
                        } catch (error) {
                            console.error('Error processing loaded VRM:', error);
                            reject(error);
                        }
                    },
                    (progress) => {
                        // 読み込み進捗の処理
                        console.log('Loading model...', (progress.loaded / progress.total * 100).toFixed(2) + '%');
                    },
                    (error) => {
                        console.error('Error loading VRM:', error);
                        reject(error);
                    }
                );
            };
            
            // ファイルかURLかを判断
            if (typeof source === 'string') {
                // URLの場合
                loadModel(source);
            } else if (source instanceof File) {
                // ファイルの場合、URLを生成
                const url = URL.createObjectURL(source);
                loadModel(url);
                // 後でURLを解放するためのイベントリスナー
                this.renderer.domElement.addEventListener('vrmLoaded', () => {
                    URL.revokeObjectURL(url);
                }, { once: true });
            } else {
                reject(new Error('Invalid source type. Expected File or URL string.'));
            }
        });
    }
    
    /**
     * まばたきアニメーションの設定
     */
    setupBlinking() {
        if (!this.currentVrm || !this.currentVrm.blendShapeProxy) return;
        
        // 前のまばたきタイマーをクリア
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
        }
        
        // まばたきの間隔をランダム化
        const getRandomBlinkInterval = () => {
            return Math.random() * 3000 + 2000; // 2〜5秒の間隔
        };
        
        // まばたきアニメーション
        const blink = async () => {
            if (!this.currentVrm || !this.currentVrm.blendShapeProxy) return;
            
            // Blink
            this.currentVrm.blendShapeProxy.setValue('blink', 1.0);
            this.currentVrm.blendShapeProxy.update();
            
            // 0.15秒後に目を開ける
            await new Promise(resolve => setTimeout(resolve, 150));
            
            if (!this.currentVrm || !this.currentVrm.blendShapeProxy) return;
            this.currentVrm.blendShapeProxy.setValue('blink', 0.0);
            this.currentVrm.blendShapeProxy.update();
        };
        
        // 最初のまばたき
        setTimeout(blink, 500);
        
        // まばたきタイマーの設定
        this.blinkInterval = setInterval(() => {
            blink();
            
            // 次のまばたきのタイミングを設定
            clearInterval(this.blinkInterval);
            this.blinkInterval = setInterval(blink, getRandomBlinkInterval());
        }, getRandomBlinkInterval());
    }
    
    /**
     * 口の動きを制御する
     * @param {number} value - 0～1の間の値
     */
    setMouthOpen(value) {
        if (!this.currentVrm) return;
        
        try {
            // VRMモデルのblendShapeProxyがある場合
            if (this.currentVrm.blendShapeProxy) {
                // a, iなどの口の形状をバランスよく設定
                this.currentVrm.blendShapeProxy.setValue('a', value);
                this.currentVrm.blendShapeProxy.update();
            } 
            // モーフターゲットを直接操作する方法（代替手段）
            else if (this.currentVrm.scene) {
                // モデルにmorphTargetDictionaryがある場合
                this.currentVrm.scene.traverse((object) => {
                    if (object.morphTargetDictionary && object.morphTargetInfluences) {
                        // 「口」に関連するモーフターゲットを探す
                        const mouthIndices = [];
                        for (const key in object.morphTargetDictionary) {
                            if (key.toLowerCase().includes('mouth') || 
                                key.toLowerCase().includes('a') || 
                                key.toLowerCase().includes('口')) {
                                mouthIndices.push(object.morphTargetDictionary[key]);
                            }
                        }
                        
                        // 見つかったモーフターゲットに値を設定
                        mouthIndices.forEach(index => {
                            if (index >= 0 && index < object.morphTargetInfluences.length) {
                                object.morphTargetInfluences[index] = value;
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error setting mouth open:', error);
        }
    }
    
    /**
     * 感情表現を設定
     * @param {string} emotion - 感情の種類 ('happy', 'sad', 'angry', 'surprised')
     * @param {number} intensity - 強度 (0～1)
     */
    setEmotion(emotion, intensity = 1.0) {
        if (!this.currentVrm) return;
        
        try {
            // VRMモデルのblendShapeProxyがある場合
            if (this.currentVrm.blendShapeProxy) {
                // 全ての感情をリセット
                this.resetEmotions();
                
                // 指定された感情を設定
                switch(emotion) {
                    case 'happy':
                        this.currentVrm.blendShapeProxy.setValue('joy', intensity);
                        break;
                    case 'sad':
                        this.currentVrm.blendShapeProxy.setValue('sorrow', intensity);
                        break;
                    case 'angry':
                        this.currentVrm.blendShapeProxy.setValue('angry', intensity);
                        break;
                    case 'surprised':
                        this.currentVrm.blendShapeProxy.setValue('surprised', intensity);
                        break;
                    default:
                        // 何もしない
                        break;
                }
                
                this.currentVrm.blendShapeProxy.update();
            }
            // モーフターゲットを直接操作する方法（代替手段）
            else if (this.currentVrm.scene) {
                // 感情に関連するモーフターゲットの名前パターン
                const emotionPatterns = {
                    'happy': ['happy', 'joy', 'smile'],
                    'sad': ['sad', 'sorrow'],
                    'angry': ['angry', 'mad'],
                    'surprised': ['surprised', 'surprise']
                };
                
                const patterns = emotionPatterns[emotion] || [];
                
                // モデルのモーフターゲットを探索
                this.currentVrm.scene.traverse((object) => {
                    if (object.morphTargetDictionary && object.morphTargetInfluences) {
                        // まず全ての感情系モーフターゲットをリセット
                        Object.values(emotionPatterns).flat().forEach(pattern => {
                            for (const key in object.morphTargetDictionary) {
                                if (key.toLowerCase().includes(pattern)) {
                                    const index = object.morphTargetDictionary[key];
                                    if (index >= 0 && index < object.morphTargetInfluences.length) {
                                        object.morphTargetInfluences[index] = 0;
                                    }
                                }
                            }
                        });
                        
                        // 指定された感情のモーフターゲットを設定
                        patterns.forEach(pattern => {
                            for (const key in object.morphTargetDictionary) {
                                if (key.toLowerCase().includes(pattern)) {
                                    const index = object.morphTargetDictionary[key];
                                    if (index >= 0 && index < object.morphTargetInfluences.length) {
                                        object.morphTargetInfluences[index] = intensity;
                                    }
                                }
                            }
                        });
                    }
                });
            }
            
            // 一定時間後に感情をリセット
            setTimeout(() => {
                this.resetEmotions();
            }, 3000);
        } catch (error) {
            console.error('Error setting emotion:', error);
        }
    }
    
    /**
     * 全ての感情表現をリセット
     */
    resetEmotions() {
        if (!this.currentVrm) return;
        
        try {
            // VRMモデルのblendShapeProxyがある場合
            if (this.currentVrm.blendShapeProxy) {
                // 全ての感情関連のブレンドシェイプをリセット
                this.currentVrm.blendShapeProxy.setValue('joy', 0);
                this.currentVrm.blendShapeProxy.setValue('angry', 0);
                this.currentVrm.blendShapeProxy.setValue('sorrow', 0);
                this.currentVrm.blendShapeProxy.setValue('fun', 0);
                this.currentVrm.blendShapeProxy.setValue('surprised', 0);
                
                this.currentVrm.blendShapeProxy.update();
            }
            // モーフターゲットを直接操作する方法（代替手段）
            else if (this.currentVrm.scene) {
                // 感情に関連するモーフターゲットの名前パターン
                const emotionPatterns = ['happy', 'joy', 'smile', 'sad', 'sorrow', 'angry', 'mad', 'surprised', 'surprise'];
                
                // モデルのモーフターゲットを探索
                this.currentVrm.scene.traverse((object) => {
                    if (object.morphTargetDictionary && object.morphTargetInfluences) {
                        emotionPatterns.forEach(pattern => {
                            for (const key in object.morphTargetDictionary) {
                                if (key.toLowerCase().includes(pattern)) {
                                    const index = object.morphTargetDictionary[key];
                                    if (index >= 0 && index < object.morphTargetInfluences.length) {
                                        object.morphTargetInfluences[index] = 0;
                                    }
                                }
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error resetting emotions:', error);
        }
    }
    
    /**
     * キャラクターが指定方向を見るように設定
     * @param {THREE.Vector3} target - 見る方向のベクトル
     */
    lookAt(target) {
        if (!this.currentVrm) return;
        
        this.lookAtTarget.copy(target);
        
        if (this.currentVrm.lookAt) {
            this.currentVrm.lookAt.target = target;
        }
    }
    
    /**
     * アニメーションループ
     */
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const delta = this.clock.getDelta();
        
        // アニメーションミキサーの更新
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        // VRMモデルの更新
        if (this.currentVrm) {
            // LookAtの更新
            if (this.currentVrm.lookAt) {
                this.currentVrm.lookAt.update();
            }
            
            // VRMアニメーションの更新
            this.currentVrm.update(delta);
        }
        
        // レンダリング
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * ウィンドウリサイズ時の処理
     */
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// ファイル選択イベントのセットアップ
document.addEventListener('DOMContentLoaded', () => {
    // VRMコントローラのインスタンス化
    const vrmController = new VRMController('vrm-container');
    
    // アップロードボタンのイベントリスナー
    const uploadButton = document.getElementById('upload-model');
    const fileInput = document.getElementById('vrm-input');
    
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            
            // ファイル拡張子のチェック
            if (file.name.toLowerCase().endsWith('.vrm')) {
                vrmController.loadVRM(file)
                    .then(vrm => {
                        console.log('VRM model loaded successfully:', vrm);
                        // カスタムイベントの発火
                        const event = new CustomEvent('vrmLoaded', { detail: { vrm } });
                        document.dispatchEvent(event);
                    })
                    .catch(error => {
                    });
            } else {
                alert('VRMファイル形式(.vrm)のみサポートしています。');
                fileInput.value = '';
            }
        }
    });
    
    // グローバルアクセスのためwindowオブジェクトに追加
    window.vrmController = vrmController;
    
    // デフォルトモデルがある場合は読み込む
    if (CONFIG.vrm.defaultModelUrl) {
        vrmController.loadVRM(CONFIG.vrm.defaultModelUrl)
            .then(vrm => {
                console.log('Default VRM model loaded successfully');
                const event = new CustomEvent('vrmLoaded', { detail: { vrm } });
                document.dispatchEvent(event);
            })
            .catch(error => {
                console.error('Failed to load default VRM model:', error);
            });
    }
});
