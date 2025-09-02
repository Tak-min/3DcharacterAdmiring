// Authentication JavaScript
// References official docs and implements secure authentication with email 2FA

class AuthManager {
    constructor() {
        this.baseURL = 'http://localhost:8000/api'; // FastAPI backend URL
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        // Form switching
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showForm('register');
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showForm('login');
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        document.getElementById('otpForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleOTPVerification();
        });

        document.getElementById('resendOtp').addEventListener('click', (e) => {
            e.preventDefault();
            this.resendOTP();
        });
    }

    showForm(formType) {
        // Hide all forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.add('hidden');
        });

        // Show selected form
        document.getElementById(`${formType}-form`).classList.remove('hidden');
    }

    async handleLogin() {
        const form = document.getElementById('loginForm');
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');

        if (!this.validateEmail(email)) {
            this.showMessage('有効なメールアドレスを入力してください', 'error');
            return;
        }

        if (!password || password.length < 6) {
            this.showMessage('パスワードは6文字以上で入力してください', 'error');
            return;
        }

        const submitBtn = form.querySelector('.auth-btn');
        this.setLoading(submitBtn, true);

        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store temporary session data for OTP verification
                sessionStorage.setItem('tempAuthData', JSON.stringify({
                    email: email,
                    action: 'login'
                }));
                
                this.showMessage('認証コードをメールアドレスに送信しました', 'info');
                this.showForm('otp');
            } else {
                this.showMessage(data.message || 'ログインに失敗しました', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('ネットワークエラーが発生しました', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async handleRegister() {
        const form = document.getElementById('registerForm');
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (!this.validateEmail(email)) {
            this.showMessage('有効なメールアドレスを入力してください', 'error');
            return;
        }

        if (!password || password.length < 6) {
            this.showMessage('パスワードは6文字以上で入力してください', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('パスワードが一致しません', 'error');
            return;
        }

        const submitBtn = form.querySelector('.auth-btn');
        this.setLoading(submitBtn, true);

        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store temporary session data for OTP verification
                sessionStorage.setItem('tempAuthData', JSON.stringify({
                    email: email,
                    action: 'register'
                }));
                
                this.showMessage('認証コードをメールアドレスに送信しました', 'info');
                this.showForm('otp');
            } else {
                this.showMessage(data.message || '新規登録に失敗しました', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('ネットワークエラーが発生しました', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async handleOTPVerification() {
        const form = document.getElementById('otpForm');
        const formData = new FormData(form);
        const otpCode = formData.get('otpCode');

        if (!otpCode || otpCode.length !== 6) {
            this.showMessage('6桁の認証コードを入力してください', 'error');
            return;
        }

        const tempAuthData = JSON.parse(sessionStorage.getItem('tempAuthData'));
        if (!tempAuthData) {
            this.showMessage('セッションが無効です。最初からやり直してください', 'error');
            this.showForm('login');
            return;
        }

        const submitBtn = form.querySelector('.auth-btn');
        this.setLoading(submitBtn, true);

        try {
            const response = await fetch(`${this.baseURL}/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: tempAuthData.email,
                    otp_code: otpCode,
                    action: tempAuthData.action
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store authentication token
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userEmail', tempAuthData.email);
                
                // Clear temporary session data
                sessionStorage.removeItem('tempAuthData');
                
                this.showMessage('認証が完了しました。ホーム画面に移動します', 'success');
                
                // Redirect to home page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 2000);
            } else {
                this.showMessage(data.message || '認証コードが正しくありません', 'error');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            this.showMessage('ネットワークエラーが発生しました', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async resendOTP() {
        const tempAuthData = JSON.parse(sessionStorage.getItem('tempAuthData'));
        if (!tempAuthData) {
            this.showMessage('セッションが無効です。最初からやり直してください', 'error');
            this.showForm('login');
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/resend-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: tempAuthData.email,
                    action: tempAuthData.action
                }),
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('認証コードを再送信しました', 'info');
            } else {
                this.showMessage(data.message || '再送信に失敗しました', 'error');
            }
        } catch (error) {
            console.error('OTP resend error:', error);
            this.showMessage('ネットワークエラーが発生しました', 'error');
        }
    }

    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            // User is already logged in, redirect to home
            window.location.href = 'home.html';
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showMessage(message, type = 'info') {
        const messageElement = document.getElementById('message');
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageElement.classList.add('hidden');
        }, 5000);
    }
}

// Initialize authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});
