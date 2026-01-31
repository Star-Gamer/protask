document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // Basic validation
    if (username === '' || password === '') {
        errorMessage.textContent = 'Please fill in all fields';
        errorMessage.classList.add('show');
        return;
    }
    
    if (password.length < 6) {
        errorMessage.textContent = 'Password must be at least 6 characters';
        errorMessage.classList.add('show');
        return;
    }
    
    // Simple demo validation (in real app, this would be server-side)
    if (username === 'demo' && password === 'password123') {
        errorMessage.classList.remove('show');
        alert('Login successful! Welcome, ' + username);
        // Redirect to home page
        window.location.href = 'home.html';
    } else {
        errorMessage.textContent = 'Invalid username or password';
        errorMessage.classList.add('show');
    }
});

// Clear error message when user starts typing
document.getElementById('username').addEventListener('input', clearError);
document.getElementById('password').addEventListener('input', clearError);

function clearError() {
    document.getElementById('errorMessage').classList.remove('show');
}