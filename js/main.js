/**
 * アプリケーションのメインスクリプト
 * 他のコンポーネントを統合して全体の制御を行います
 */

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('3D AI Companion アプリケーションを初期化中...');
    
    // APIキーのチェック
    checkApiKey();
    
    // 設定パネルの初期化
    initSettingsPanel();
    
    // キーボードショートカットの設定
    setupKeyboardShortcuts();
    
    // 初回利用時のガイダンス
    showFirstTimeGuidance();
});

/**
 * Gemini APIキーの確認
 */
function checkApiKey() {
    // 設定画面でAPIキーを設定するため、初期チェックは不要
    console.log('Gemini APIキー設定確認: 設定画面で行います');
}

/**
 * 設定パネルの初期化
 */
function initSettingsPanel() {
    // テーマ設定の初期化
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = CONFIG.ui.theme;
    }
    
    // 音声設定の初期化
    const voiceSpeed = document.getElementById('voice-speed');
    if (voiceSpeed) {
        voiceSpeed.value = CONFIG.voicevox.defaultSpeed;
        const rangeValue = voiceSpeed.nextElementSibling;
        if (rangeValue) {
            rangeValue.textContent = CONFIG.voicevox.defaultSpeed.toFixed(1);
        }
    }
    
    // キャラクター設定の初期化
    const characterPersona = document.getElementById('character-persona');
    if (characterPersona) {
        characterPersona.value = CONFIG.character.personality;
    }
}

/**
 * キーボードショートカットの設定
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Escキーで設定パネルを閉じる
        if (e.key === 'Escape') {
            const settingsPanel = document.getElementById('settings-panel');
            if (settingsPanel && settingsPanel.classList.contains('open')) {
                settingsPanel.classList.remove('open');
            }
        }
        
        // Ctrl+/ でキーボードショートカットのヘルプを表示
        if (e.ctrlKey && e.key === '/') {
            showKeyboardShortcuts();
            e.preventDefault();
        }
    });
}

/**
 * キーボードショートカットのヘルプを表示
 */
function showKeyboardShortcuts() {
    const shortcuts = [
        { key: 'Enter', description: 'メッセージを送信' },
        { key: 'Shift+Enter', description: '改行を入力' },
        { key: 'Esc', description: '設定パネルを閉じる' },
        { key: 'Ctrl+/', description: 'このヘルプを表示' }
    ];
    
    let shortcutText = 'キーボードショートカット:\n\n';
    shortcuts.forEach(shortcut => {
        shortcutText += `${shortcut.key}: ${shortcut.description}\n`;
    });
    
    alert(shortcutText);
}

/**
 * 初回利用時のガイダンスを表示
 */
function showFirstTimeGuidance() {
    // ローカルストレージで初回利用かチェック
    const hasVisitedBefore = localStorage.getItem('aiCompanion_hasVisited');
    
    if (!hasVisitedBefore) {
        // 初回訪問時の案内メッセージ
        setTimeout(() => {
            window.uiController.addMessage('assistant', 
                '👋 はじめまして！このアプリの使い方をご案内します。\n\n' +
                '1. 右下のアップロードボタンから、お好みのVRMモデルをアップロードできます\n' +
                '2. テキストボックスにメッセージを入力して送信すると、AIが応答します\n' +
                '3. マイクボタンを押すと、音声入力で会話できます\n' +
                '4. 右上の⚙️ボタンから、音声や見た目などの設定を変更できます\n' +
                '5. 左下のモーションボタンでキャラクターの動きを操作できます\n\n' +
                'それでは、楽しい会話をお楽しみください！何か質問があればどうぞ😊'
            );
        }, 1500);
        
        // 訪問済みフラグを設定
        localStorage.setItem('aiCompanion_hasVisited', 'true');
    }
}

/**
 * モーション制御の初期化
 */
function initMotionController() {
    // VRMコントローラーが読み込まれるまで待機
    const waitForVRMController = setInterval(() => {
        if (window.vrmController && window.MotionController) {
            clearInterval(waitForVRMController);
            
            // モーションコントローラーのインスタンス化
            window.motionController = new MotionController(window.vrmController);
            console.log('MotionController: 初期化完了');
            
            // モーションボタンのイベントリスナー設定
            setupMotionButtons();
        }
    }, 100);
}

/**
 * モーションボタンのイベントリスナー設定
 */
function setupMotionButtons() {
    // ジェスチャーボタン
    const gestureButtons = document.querySelectorAll('.motion-btn[data-gesture]');
    gestureButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const gesture = button.dataset.gesture;
            console.log(`モーションボタンクリック: ${gesture}`);
            
            // ボタンのアクティブ状態
            button.classList.add('active');
            
            // ジェスチャー実行
            if (window.motionController) {
                await window.motionController.playGesture(gesture);
            }
            
            // アクティブ状態を解除
            setTimeout(() => {
                button.classList.remove('active');
            }, 2000);
        });
    });
    
    // 感情ボタン
    const emotionButtons = document.querySelectorAll('.motion-btn[data-emotion]');
    emotionButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const emotion = button.dataset.emotion;
            console.log(`感情ボタンクリック: ${emotion}`);
            
            // 他の感情ボタンのアクティブ状態を解除
            emotionButtons.forEach(btn => btn.classList.remove('active'));
            
            // 現在のボタンをアクティブに
            button.classList.add('active');
            
            // 感情表現実行
            if (window.motionController) {
                await window.motionController.playEmotion(emotion);
            }
            
            // アクティブ状態を解除
            setTimeout(() => {
                button.classList.remove('active');
            }, 3000);
        });
    });
    
    console.log('MotionController: ボタンイベントリスナー設定完了');
}

// モーション制御初期化の開始
document.addEventListener('DOMContentLoaded', () => {
    // 他の初期化処理の後にモーション制御を初期化
    setTimeout(initMotionController, 500);
});

/**
 * エラーハンドリング
 */
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', error);
    
    // UIが初期化されている場合はエラーメッセージを表示
    if (window.uiController) {
        window.uiController.addErrorMessage('エラーが発生しました: ' + message);
    }
    
    return false;
};
