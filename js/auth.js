// --- Authentication & Redirection ---

// Get the current page filename (e.g., "index.html", "login.html")
const currentPage = window.location.pathname.split('/').pop();

const isAuthenticated = sessionStorage.getItem('authenticated') === 'true';

// If not authenticated, redirect to login page
if (!isAuthenticated && currentPage !== 'login.html' && currentPage !== 'register.html') {
    window.location.href = 'login.html';
}

// If authenticated, redirect from login/register to the main page
if (isAuthenticated && (currentPage === 'login.html' || currentPage === 'register.html')) {
    window.location.href = 'index.html';
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
