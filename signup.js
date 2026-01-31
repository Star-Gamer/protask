const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;
    const errorMessage = document.getElementById('errorMessage');
    
    // Clear previous errors
    errorMessage.classList.remove('show');
    
    // Validation
    if (fullname === '' || email === '' || username === '' || password === '') {
        errorMessage.textContent = 'Please fill in all fields';
        errorMessage.classList.add('show');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorMessage.textContent = 'Please enter a valid email address';
        errorMessage.classList.add('show');
        return;
    }
    
    // Password length validation
    if (password.length < 6) {
        errorMessage.textContent = 'Password must be at least 6 characters';
        errorMessage.classList.add('show');
        return;
    }
    
    // Password match validation
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match';
        errorMessage.classList.add('show');
        return;
    }
    
    // Terms validation
    if (!terms) {
        errorMessage.textContent = 'You must agree to the terms and conditions';
        errorMessage.classList.add('show');
        return;
    }
    
    // Success message
// Replace the old alert/redirect with this:
async function signUpUser() {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: fullname,
                username: username
            }
        }
    });

    if (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.add('show');
    } else {
        alert('Check your email for a confirmation link!');
        window.location.href = 'index.html';
    }
}

signUpUser();
});

// Clear error message when user starts typing
document.getElementById('fullname').addEventListener('input', clearError);
document.getElementById('email').addEventListener('input', clearError);
document.getElementById('username').addEventListener('input', clearError);
document.getElementById('password').addEventListener('input', clearError);
document.getElementById('confirmPassword').addEventListener('input', clearError);

function clearError() {
    document.getElementById('errorMessage').classList.remove('show');
}
