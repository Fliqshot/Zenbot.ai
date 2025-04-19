document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.querySelector('.toggle-password');
    const loginBtn = document.querySelector('.login-btn');
    const loader = document.querySelector('.loader');

    // Toggle Password Visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });

    // Form Submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) return;
        
        // Show loading state
        loginBtn.disabled = true;
        loginBtn.querySelector('span').textContent = 'Logging in...';
        loader.style.display = 'block';
        
        try {
            // Send login request to backend
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            // Store token and redirect
            localStorage.setItem('token', data.token);
            window.location.href = '/dashboard.html'; // Redirect to dashboard
            
        } catch (error) {
            alert(error.message);
        } finally {
            // Reset button state
            loginBtn.disabled = false;
            loginBtn.querySelector('span').textContent = 'Login';
            loader.style.display = 'none';
        }
    });

    // Google Login (mock)
    document.querySelector('.google-btn').addEventListener('click', () => {
        alert('Google login would be implemented with Firebase or OAuth');
    });
});