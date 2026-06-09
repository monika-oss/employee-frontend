document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('logoutSuccess') === 'true') {
        localStorage.removeItem('logoutSuccess');
        if (window.showAlert) {
            window.showAlert('Logged out successfully', 'success');
        }
    }

    // If already logged in, redirect to correct dashboard
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (token && role) {
        if (role === 'Admin') window.location.href = 'admin-dashboard.html';
        else if (role === 'Employee') window.location.href = 'employee-dashboard.html';
    }

    const loginForm = document.getElementById('loginForm');
    const loginAlert = document.getElementById('loginAlert');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button[type="submit"]');
            
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
            loginAlert.classList.add('d-none');

            try {
                const data = await apiFetch('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                // Store user info and token
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('role', data.role);
                localStorage.setItem('userId', data.id);
                localStorage.setItem('userName', data.name);

                // Redirect based on role
                if (data.role === 'Admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'employee-dashboard.html';
                }
            } catch (error) {
                if (window.showAlert) {
                    window.showAlert(error.message, 'danger');
                } else {
                    loginAlert.textContent = error.message;
                    loginAlert.classList.remove('d-none');
                }
            } finally {
                btn.disabled = false;
                btn.textContent = 'Login';
            }
        });
    }
});
