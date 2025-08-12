// Redirect based on authentication status
if (!sessionStorage.getItem('authenticated')) {
    // If not authenticated, redirect to login page if not already on login/register
    if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
        window.location.href = 'login.html';
    }
} else {
    // If authenticated, redirect to home page if on login/register
    if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html')) {
        window.location.href = 'index.html';
    }
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Dummy authentication
        sessionStorage.setItem('authenticated', 'true');
        window.location.href = 'index.html';
    });
}

const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Dummy registration
        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
    });
}


const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        sessionStorage.removeItem('authenticated');
        window.location.href = 'login.html';
    });
}
