const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : 'https://employee-backend-1zst.onrender.com/api';

const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        // Handle unauthorized (token expired, etc.)
        if (response.status === 401 || response.status === 403) {
            // Redirect to login only if we're not already on it
            if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
                localStorage.clear();
                window.location.href = 'index.html';
            }
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        throw error;
    }
};

window.togglePasswordView = (showPasswordView) => {
    const defaultView = document.getElementById('profileDefaultView');
    const pwdView = document.getElementById('profileUpdatePasswordView');
    
    if (defaultView && pwdView) {
        if (showPasswordView) {
            defaultView.classList.add('d-none');
            pwdView.classList.remove('d-none');
        } else {
            defaultView.classList.remove('d-none');
            pwdView.classList.add('d-none');
            const input = document.getElementById('newPasswordInput');
            if (input) input.value = '';
        }
    }
};

window.toggleNewPasswordVisibility = () => {
    const input = document.getElementById('newPasswordInput');
    const icon = document.getElementById('newPasswordIcon');
    if (input && icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('bi-eye-slash', 'bi-eye');
        } else {
            input.type = 'password';
            icon.classList.replace('bi-eye', 'bi-eye-slash');
        }
    }
};

window.saveNewPassword = async () => {
    const input = document.getElementById('newPasswordInput');
    if (!input || !input.value) {
        window.showAlert('Please enter a new password', 'error');
        return;
    }
    
    if (input.value.length < 6) {
        window.showAlert('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        await apiFetch('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ newPassword: input.value })
        });        
        window.showAlert('Password changed successfully!', 'success');
        window.togglePasswordView(false);
    } catch (error) {
        window.showAlert(error.message, 'error');
    }
};
window.logout = () => {
    localStorage.clear();
    window.location.href = 'index.html';
};

// Global SweetAlert Toast
window.showAlert = (message, type = 'success') => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#ffffff',
        color: '#1e293b',
        iconColor: type === 'danger' ? '#ef4444' : '#2563eb',
        customClass: {
            popup: 'theme-toast',
            title: 'theme-toast-title',
            icon: 'theme-toast-icon'
        },
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    Toast.fire({
        icon: type === 'danger' ? 'error' : type,
        title: message
    });
};

// Global SweetAlert Confirm
window.showConfirm = async (title, text = '') => {
    const result = await Swal.fire({
        title: title,
        text: text,
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
    });
    return result.isConfirmed;
};
