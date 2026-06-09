document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('role');
    if (role !== 'Employee') {
        window.location.href = 'index.html';
        return;
    }

    const userName = localStorage.getItem('userName') || 'Employee';
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay) userNameDisplay.textContent = userName;
    
    const dropdownUserName = document.getElementById('dropdownUserName');
    if (dropdownUserName) dropdownUserName.textContent = userName;
    
    const dropdownAvatarCircle = document.getElementById('dropdownAvatarCircle');
    if (dropdownAvatarCircle && userName) dropdownAvatarCircle.textContent = userName.charAt(0).toUpperCase();

    const profileForm = document.getElementById('profileForm');
    const alertContainer = document.getElementById('alertContainer');
    const nameInput = document.getElementById('profileName');
    const phoneInput = document.getElementById('profilePhone');
    const saveActions = document.getElementById('saveActions');
    const editBtn = document.getElementById('editProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');

    let originalData = {};

    // The showAlert function is now globally available via api.js

    const loadProfile = async () => {
        try {
            const data = await apiFetch('/employees/profile/me');
            originalData = data;
            
            document.getElementById('displayEmpId').textContent = data.employee_id;
            document.getElementById('displayDept').textContent = data.department;
            document.getElementById('displayDesig').textContent = data.designation;
            document.getElementById('displayEmail').textContent = data.email;
            
            nameInput.value = data.name;
            phoneInput.value = data.phone;
            
            // Update header name
            document.getElementById('userNameDisplay').textContent = data.name;
            localStorage.setItem('userName', data.name);
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    };

    const toggleEdit = (isEditing) => {
        nameInput.disabled = !isEditing;
        phoneInput.disabled = !isEditing;
        
        if (isEditing) {
            saveActions.classList.remove('d-none');
            editBtn.classList.add('d-none');
            
            // Focus and highlight
            nameInput.focus();
            nameInput.classList.remove('highlight-pulse');
            phoneInput.classList.remove('highlight-pulse');
            void nameInput.offsetWidth; // Trigger reflow to restart animation
            nameInput.classList.add('highlight-pulse');
            phoneInput.classList.add('highlight-pulse');
        } else {
            saveActions.classList.add('d-none');
            editBtn.classList.remove('d-none');
            nameInput.classList.remove('highlight-pulse');
            phoneInput.classList.remove('highlight-pulse');
        }
    };

    editBtn.addEventListener('click', () => toggleEdit(true));
    
    cancelBtn.addEventListener('click', () => {
        nameInput.value = originalData.name;
        phoneInput.value = originalData.phone;
        toggleEdit(false);
    });

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!profileForm.checkValidity()) {
            e.stopPropagation();
            profileForm.classList.add('was-validated');
            return;
        }

        const newName = nameInput.value.trim();
        const newPhone = phoneInput.value.trim();
        
        if (newName === originalData.name && newPhone === originalData.phone) {
            toggleEdit(false);
            return; // No changes made, do not show success message
        }
        
        if (newName.length < 3) {
            showAlert('Name must be at least 3 characters', 'danger');
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(newName)) {
            showAlert('Name should contain only letters and spaces', 'danger');
            return;
        }
        if (!/^\d{10}$/.test(newPhone)) {
            showAlert('Please enter a valid 10-digit phone number', 'danger');
            return;
        }

        const saveBtn = profileForm.querySelector('.btn-save-custom');
        const originalText = saveBtn ? saveBtn.innerHTML : 'Save Changes';

        try {
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
            }
            await apiFetch('/employees/profile/me', {
                method: 'PUT',
                body: JSON.stringify({
                    name: nameInput.value,
                    phone: phoneInput.value
                })
            });
            
            showAlert('Profile updated successfully');
            toggleEdit(false);
            loadProfile(); // reload to get fresh data
        } catch (error) {
            showAlert(error.message, 'danger');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
            }
        }
    });

    // Initialize
    loadProfile();
});
