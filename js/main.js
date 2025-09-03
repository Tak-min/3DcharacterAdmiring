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
                '初期化完了。私はレイです。...初回利用ですね。\n\n' +
                'システム概要を説明します：\n' +
                '1. VRMモデルのアップロード機能 - 右下のボタンから実行可能\n' +
                '2. テキストベース対話システム - 下部の入力フィールドを使用\n' +
                '3. 音声入力インターフェース - マイクアイコンでアクティベート\n' +
                '4. 設定パネル - 右上の⚙️から各種パラメータを調整可能\n' +
                '5. モーション制御システム - 左下のボタンで動作を実行\n\n' +
                '技術的な質問や効率化の相談など、お気軽にどうぞ。最適な解決策を提示します。'
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
        }
    }, 100);
}

// モーション制御初期化の開始
document.addEventListener('DOMContentLoaded', () => {
    // 他の初期化処理の後にモーション制御を初期化
    setTimeout(initMotionController, 500);
});

/**
 * エラーハンドリング
 */
let errorCount = 0;
let lastErrorTime = 0;
const ERROR_THROTTLE_TIME = 1000; // 1秒間隔でエラーを制限

window.onerror = function(message, source, lineno, colno, error) {
    const currentTime = Date.now();
    
    // 同じエラーが短時間で大量発生している場合は抑制
    if (currentTime - lastErrorTime < ERROR_THROTTLE_TIME) {
        errorCount++;
        if (errorCount > 5) {
            console.warn('Too many errors detected, throttling error messages');
            return true; // エラーを抑制
        }
    } else {
        errorCount = 0;
    }
    
    lastErrorTime = currentTime;
    
    console.error('Global error:', error);
    
    // VRM関連のエラーの場合は特別処理
    if (message && message.includes('getWorldPosition') && window.vrmLoader) {
        console.warn('VRM LookAt error detected, attempting to disable LookAt...');
        try {
            if (window.vrmLoader.currentVrm && window.vrmLoader.currentVrm.lookAt) {
                window.vrmLoader.currentVrm.lookAt = null;
                console.info('VRM LookAt disabled due to error');
            }
        } catch (e) {
            console.error('Failed to disable VRM LookAt:', e);
        }
        return true; // エラーを処理済みとする
    }
    
    // UIが初期化されている場合はエラーメッセージを表示（制限付き）
    if (window.uiController && errorCount < 3) {
        window.uiController.addErrorMessage('エラーが発生しました: ' + message);
    }
    
    return false;
};
