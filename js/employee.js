document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('role');
    if (role !== 'Employee') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userNameDisplay').textContent = localStorage.getItem('userName');

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
        } else {
            saveActions.classList.add('d-none');
            editBtn.classList.remove('d-none');
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
        
        try {
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
        }
    });

    // Initialize
    loadProfile();
});
