document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('role');
    if (role !== 'Admin') {
        window.location.href = 'index.html';
        return;
    }

    const userName = localStorage.getItem('userName') || 'Admin';
    const adminNameDisplay = document.getElementById('adminName');
    if (adminNameDisplay) adminNameDisplay.textContent = userName;
    
    const dropdownUserName = document.getElementById('dropdownUserName');
    if (dropdownUserName) dropdownUserName.textContent = userName;
    
    const dropdownAvatarCircle = document.getElementById('dropdownAvatarCircle');
    if (dropdownAvatarCircle && userName) dropdownAvatarCircle.textContent = userName.charAt(0).toUpperCase();

    const employeeModal = new bootstrap.Modal(document.getElementById('employeeModal'));
    const employeeForm = document.getElementById('employeeForm');
    const tableBody = document.getElementById('employeeTableBody');
    const alertContainer = document.getElementById('alertContainer');

    let employees = [];
    let isEditing = false;
    let editingEmployeeId = null;
    let originalEditingData = null;
    let currentView = window.innerWidth < 992 ? 'card' : 'list'; // 'list' or 'card'
    let currentPage = 1;
    const itemsPerPage = 5;

    // --- Inline Options Manager Logic ---
    let departments = JSON.parse(localStorage.getItem('departments')) || ['IT', 'HR', 'Finance', 'Marketing', 'Design', 'Game'];
    let designations = JSON.parse(localStorage.getItem('designations')) || ['Software Developer', 'Designer', 'Manager', 'Executive'];

    const renderOptionDropdown = (type) => {
        const list = type === 'dept' ? departments : designations;
        const menuId = type === 'dept' ? 'deptDropdownMenu' : 'desigDropdownMenu';
        const inputId = type === 'dept' ? 'newDeptInput' : 'newDesigInput';
        const btnId = type === 'dept' ? 'addDeptBtn' : 'addDesigBtn';
        const placeholder = type === 'dept' ? 'New Dept' : 'New Desig';
        
        const menu = document.getElementById(menuId);
        if (!menu) return;
        
        let html = '';
        list.forEach(item => {
            html += `
                <li class="dropdown-item d-flex justify-content-between align-items-center rounded mb-1" style="cursor: pointer; font-size: 0.9rem;" onclick="window.selectOption('${type}', '${item.replace(/'/g, "\\'")}')">
                    <span>${item}</span>
                    <i class="bi bi-trash text-danger" style="padding: 4px;" title="Delete" onclick="event.stopPropagation(); window.deleteOption('${type}', '${item.replace(/'/g, "\\'")}')"></i>
                </li>`;
        });
        
        html += `
            <li><hr class="dropdown-divider"></li>
            <li class="px-2 pt-1 pb-1" onclick="event.stopPropagation()">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control shadow-none" id="${inputId}" placeholder="${placeholder}" style="border-color: #3B82F6;">
                    <button class="btn text-white" style="background: linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%); border: none;" type="button" id="${btnId}" onclick="window.addOption('${type}')"><i class="bi bi-plus-lg fw-bold"></i></button>
                </div>
            </li>`;
            
        menu.innerHTML = html;
        
        // Add enter key support
        setTimeout(() => {
            const inputEl = document.getElementById(inputId);
            if (inputEl) {
                inputEl.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        window.addOption(type);
                    }
                });
            }
        }, 0);
    };

    window.selectOption = (type, val) => {
        const inputId = type === 'dept' ? 'empDept' : 'empDesig';
        document.getElementById(inputId).value = val;
    };

    window.addOption = (type) => {
        const inputId = type === 'dept' ? 'newDeptInput' : 'newDesigInput';
        const inputEl = document.getElementById(inputId);
        const val = inputEl.value.trim();
        if (!val) return;
        
        if (type === 'dept') {
            if (!departments.includes(val)) {
                departments.push(val);
                localStorage.setItem('departments', JSON.stringify(departments));
            }
        } else {
            if (!designations.includes(val)) {
                designations.push(val);
                localStorage.setItem('designations', JSON.stringify(designations));
            }
        }
        renderOptionDropdown(type);
    };

    window.deleteOption = (type, val) => {
        if (type === 'dept') {
            departments = departments.filter(d => d !== val);
            localStorage.setItem('departments', JSON.stringify(departments));
        } else {
            designations = designations.filter(d => d !== val);
            localStorage.setItem('designations', JSON.stringify(designations));
        }
        renderOptionDropdown(type);
        
        // Clear input if the deleted item was selected
        const mainInputId = type === 'dept' ? 'empDept' : 'empDesig';
        const mainInput = document.getElementById(mainInputId);
        if (mainInput && mainInput.value === val) {
            mainInput.value = '';
        }
    };
    
    // Initialize dropdowns
    renderOptionDropdown('dept');
    renderOptionDropdown('desig');
    // --- End Inline Options Manager Logic ---

    window.changePage = (page) => {
        currentPage = page;
        renderEmployees();
    };

    const loadEmployees = async () => {
        try {
            const tableView = document.getElementById('employeeTableView');
            const tableBody = document.getElementById('employeeTableBody');
            const cardView = document.getElementById('employeeCardView');
            const cardPaginationContainer = document.getElementById('cardPaginationContainer');
            
            // Update view visibility FIRST so the correct skeleton shows
            if (currentView === 'list') {
                if (tableView) tableView.classList.remove('d-none');
                if (cardView) cardView.classList.add('d-none');
                if (cardPaginationContainer) cardPaginationContainer.classList.add('d-none');
            } else {
                if (tableView) tableView.classList.add('d-none');
                if (cardView) cardView.classList.remove('d-none');
                if (cardPaginationContainer) cardPaginationContainer.classList.add('d-none'); // Hide pagination while loading
            }
            
            if (tableBody && currentView === 'list') {
                tableBody.innerHTML = Array(5).fill(`
                    <tr class="placeholder-glow">
                        <td><span class="placeholder col-8 rounded"></span></td>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <span class="placeholder rounded-circle" style="width: 32px; height: 32px;"></span>
                                <span class="placeholder col-6 rounded"></span>
                            </div>
                        </td>
                        <td><span class="placeholder col-8 rounded"></span></td>
                        <td><span class="placeholder col-6 rounded"></span></td>
                        <td><span class="placeholder col-6 rounded"></span></td>
                        <td><span class="placeholder col-8 rounded"></span></td>
                        <td><span class="placeholder col-4 rounded"></span></td>
                    </tr>
                `).join('');
            }
            
            if (cardView && currentView === 'card') {
                cardView.innerHTML = Array(3).fill(`
                    <div class="col-12 col-md-6 col-lg-4 mb-3">
                        <div class="card border-0 shadow-sm placeholder-glow p-3" style="border-radius: 12px; height: 180px;">
                            <span class="placeholder col-12 h-100 rounded"></span>
                        </div>
                    </div>
                `).join('');
            }

            employees = await apiFetch('/employees');
            populateFilterDropdowns();
            renderEmployees();
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    };
    
    const populateFilterDropdowns = () => {
        const deptSelect = document.getElementById('filterDepartment');
        const desigSelect = document.getElementById('filterDesignation');
        
        // Save current selections to restore them if needed
        const currDept = deptSelect.value;
        const currDesig = desigSelect.value;
        
        // Get unique values
        const departments = [...new Set(employees.map(e => e.department))].filter(Boolean).sort();
        const designations = [...new Set(employees.map(e => e.designation))].filter(Boolean).sort();
        
        // Populate Departments
        deptSelect.innerHTML = '<option value="">Select department</option>' + 
            departments.map(d => `<option value="${d}">${d}</option>`).join('');
        
        // Populate Designations
        desigSelect.innerHTML = '<option value="">Select designation</option>' + 
            designations.map(d => `<option value="${d}">${d}</option>`).join('');
            
        // Restore selections if they still exist
        if (departments.includes(currDept)) deptSelect.value = currDept;
        if (designations.includes(currDesig)) desigSelect.value = currDesig;
    };

    const getAvatarStyle = (name) => {
        const char = name.charAt(0).toUpperCase();
        const colors = [
            { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' }, // Blue
            { bg: '#f3e8ff', text: '#9333ea', border: '#e9d5ff' }, // Purple
            { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' }, // Green
            { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5' }, // Orange
            { bg: '#ecfeff', text: '#0891b2', border: '#cffafe' }, // Cyan
            { bg: '#fdf2f8', text: '#db2777', border: '#fbcfe8' }  // Pink
        ];
        const index = char.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const getDeptBadgeClass = (dept) => {
        const d = dept.toLowerCase();
        if (d.includes('it') || d.includes('tech') || d.includes('develop')) return 'badge-it';
        if (d.includes('design') || d.includes('game') || d.includes('art')) return 'badge-design';
        if (d.includes('market') || d.includes('sale') || d.includes('brand')) return 'badge-marketing';
        if (d.includes('hr') || d.includes('resource') || d.includes('people')) return 'badge-hr';
        if (d.includes('finance') || d.includes('account') || d.includes('pay')) return 'badge-finance';
        return 'badge-other';
    };

    const renderEmployees = () => {
        const tableView = document.getElementById('employeeTableView');
        const cardView = document.getElementById('employeeCardView');
        const cardPaginationContainer = document.getElementById('cardPaginationContainer');
        
        // Filter employees based on search, column, and sidebar filters
        const searchVal = (document.getElementById('searchEmployees')?.value || '').toLowerCase().trim();
        const filteredEmployees = employees.filter(emp => {
            // 1. Search Query Logic
            let matchesSearch = true;
            if (searchVal) {
                matchesSearch = false; // default to false if there's a query
                const searchField = window.currentSearchColumn || 'all';
                
                if (searchField === 'all') {
                    matchesSearch = emp.name.toLowerCase().includes(searchVal) ||
                        emp.employee_id.toLowerCase().includes(searchVal) ||
                        emp.department.toLowerCase().includes(searchVal) ||
                        emp.designation.toLowerCase().includes(searchVal) ||
                        emp.email.toLowerCase().includes(searchVal);
                } else {
                    const fieldValue = emp[searchField] ? emp[searchField].toString().toLowerCase() : '';
                    matchesSearch = fieldValue.includes(searchVal);
                }
            }

            // 2. Sidebar Filters Logic
            let matchesSidebar = true;
            const filters = window.activeFilters || {};
            
            if (filters.department && emp.department.toLowerCase() !== filters.department.toLowerCase()) {
                matchesSidebar = false;
            }
            
            if (filters.designation && matchesSidebar) {
                if (emp.designation.toLowerCase() !== filters.designation.toLowerCase()) {
                    matchesSidebar = false;
                }
            }
            
            return matchesSearch && matchesSidebar;
        });
        
        // Update total count badge
        document.getElementById('totalMembersCount').textContent = filteredEmployees.length;

        // Client-side pagination logic
        const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredEmployees.length);
        const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

        // Helper to generate pagination buttons
        const buildPaginationHtml = () => {
            let pageHtml = '';
            // Prev button
            pageHtml += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link rounded-circle border-0 text-secondary" href="#" onclick="changePage(${currentPage - 1}); return false;" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent;">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>`;
            
            // Page buttons
            for (let i = 1; i <= totalPages; i++) {
                if (i === currentPage) {
                    pageHtml += `<li class="page-item active">
                        <a class="page-link rounded-circle border-0" href="#" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #2563eb; color: white; font-weight: bold;">
                            ${i}
                        </a>
                    </li>`;
                } else {
                    pageHtml += `<li class="page-item">
                        <a class="page-link rounded-circle border-0 text-secondary" href="#" onclick="changePage(${i}); return false;" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent;">
                            ${i}
                        </a>
                    </li>`;
                }
            }
            
            // Next button
            pageHtml += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link rounded-circle border-0 text-secondary" href="#" onclick="changePage(${currentPage + 1}); return false;" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent;">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>`;
            return pageHtml;
        };

        if (currentView === 'list') {
            tableView.classList.remove('d-none');
            cardView.classList.add('d-none');
            cardPaginationContainer.classList.add('d-none');
            
            if (filteredEmployees.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No employees found.</td></tr>';
                document.getElementById('paginationInfo').textContent = 'Showing 0 to 0 of 0 employees';
                document.getElementById('adminPagination').innerHTML = '';
                return;
            }

            tableBody.innerHTML = paginatedEmployees.map(emp => {
                if (editingEmployeeId === emp.id) {
                    return `
                        <tr style="background-color: #f8fafc;">
                            <td style="min-width: 100px; vertical-align: middle;">
                                <span class="fw-bold" style="color: #64748b; font-size: 0.9rem;">${emp.employee_id}</span>
                            </td>
                            <td style="min-width: 180px;">
                                <input type="text" class="form-control form-control-sm mb-1" id="inline_name_${emp.id}" value="${emp.name}" placeholder="Name">
                                <input type="text" class="form-control form-control-sm" id="inline_phone_${emp.id}" value="${emp.phone}" placeholder="Phone">
                            </td>
                            <td style="min-width: 250px;"><input type="email" class="form-control form-control-sm" id="inline_email_${emp.id}" value="${emp.email}"></td>
                            <td style="min-width: 160px;">
                                <select class="form-select form-select-sm" id="inline_dept_${emp.id}">
                                    ${departments.map(d => `<option value="${d}" ${d === emp.department ? 'selected' : ''}>${d}</option>`).join('')}
                                </select>
                            </td>
                            <td style="min-width: 180px;">
                                <select class="form-select form-select-sm" id="inline_desig_${emp.id}">
                                    ${designations.map(d => `<option value="${d}" ${d === emp.designation ? 'selected' : ''}>${d}</option>`).join('')}
                                </select>
                            </td>
                            <td style="min-width: 120px;"><input type="number" class="form-control form-control-sm" id="inline_salary_${emp.id}" value="${emp.salary}"></td>
                            <td style="white-space: nowrap;">
                                <button class="btn-action-circle me-1" onclick="saveInlineEdit(${emp.id})" style="background: #10b981; color: white; border-color: #10b981;" title="Save"><i class="bi bi-check2"></i></button>
                                <button class="btn-action-circle" onclick="cancelEdit()" style="background: #ef4444; color: white; border-color: #ef4444;" title="Cancel"><i class="bi bi-x-lg"></i></button>
                            </td>
                        </tr>
                    `;
                }

                const avStyle = getAvatarStyle(emp.name);
                const deptClass = getDeptBadgeClass(emp.department);
                return `
                    <tr>
                        <td class="fw-semibold text-secondary" style="font-size: 0.85rem;">${emp.employee_id}</td>
                        <td>
                            <div class="d-flex align-items-center">
                                <div class="avatar-circle-row me-3" style="background: ${avStyle.bg}; color: ${avStyle.text}; border-color: ${avStyle.border};">
                                    ${emp.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div class="fw-bold" style="color: #0f172a; font-size: 0.95rem;">${emp.name}</div>
                                    <small style="color: #64748b; font-size: 0.8rem; font-weight: 500;">${emp.phone}</small>
                                </div>
                            </div>
                        </td>
                        <td style="color: #475569; font-weight: 500;">${emp.email}</td>
                        <td><span class="badge-dept ${deptClass}">${emp.department}</span></td>
                        <td style="color: #475569; font-weight: 500;">${emp.designation}</td>
                        <td style="color: #475569; font-weight: 500;">₹${emp.salary}</td>
                        <td style="white-space: nowrap;">
                            <button class="btn-action-circle me-2" onclick="startInlineEdit(${emp.id})"><i class="bi bi-pencil"></i></button>
                            <button class="btn-action-circle delete" onclick="deleteEmployee(${emp.id})"><i class="bi bi-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            const showingStart = filteredEmployees.length === 0 ? 0 : startIndex + 1;
            document.getElementById('paginationInfo').textContent = `Showing ${showingStart} to ${endIndex} of ${filteredEmployees.length} employees`;
            document.getElementById('adminPagination').innerHTML = buildPaginationHtml();
        } else {
            tableView.classList.add('d-none');
            cardView.classList.remove('d-none');
            cardPaginationContainer.classList.remove('d-none');
            
            if (filteredEmployees.length === 0) {
                cardView.innerHTML = '<div class="col-12 text-center py-4 text-muted">No employees found.</div>';
                document.getElementById('adminPaginationCard').innerHTML = '';
                return;
            }

            cardView.innerHTML = paginatedEmployees.map(emp => {
                const avStyle = getAvatarStyle(emp.name);
                const deptClass = getDeptBadgeClass(emp.department);
                return `
                    <div class="col-md-6 col-lg-4 col-xl-4 mb-4">
                        <div class="emp-card-redesign p-3 h-100">
                            <!-- Card Header -->
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="d-flex align-items-center gap-2">
                                    <div class="emp-card-avatar-wrapper" style="width: 46px; height: 46px;">
                                        <div class="emp-card-avatar" style="background: ${avStyle.bg}; color: ${avStyle.text}; border-color: ${avStyle.border}; font-size: 1rem;">
                                            ${emp.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div class="emp-card-status" style="width: 10px; height: 10px;"></div>
                                    </div>
                                    <div>
                                        <h5 class="fw-bold mb-1" style="color: #0f172a; font-size: 1rem; letter-spacing: -0.01em;">${emp.name}</h5>
                                        <span class="badge-dept ${deptClass}" style="padding: 0.25rem 0.6rem; font-size: 0.7rem;">${emp.department}</span>
                                    </div>
                                </div>
                                <div class="dropdown">
                                    <button class="btn btn-sm btn-link text-secondary p-0 border-0" type="button" data-bs-toggle="dropdown">
                                        <i class="bi bi-three-dots-vertical fs-6"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                                        <li><a class="dropdown-item" href="#" onclick="editEmployee(${emp.id}); return false;"><i class="bi bi-pencil me-2 text-primary"></i>Edit</a></li>
                                        <li><a class="dropdown-item text-danger" href="#" onclick="deleteEmployee(${emp.id}); return false;"><i class="bi bi-trash me-2"></i>Delete</a></li>
                                    </ul>
                                </div>
                            </div>
                            
                            <!-- Card Content Fields -->
                            <div class="d-flex flex-column gap-2 my-3 py-1" style="font-size: 0.85rem; font-weight: 500;">
                                <div class="d-flex align-items-center gap-2">
                                    <div class="d-flex justify-content-center align-items-center rounded flex-shrink-0" style="width: 24px; height: 24px; background-color: #eff6ff; color: #2563eb;">
                                        <i class="bi bi-briefcase" style="font-size: 0.8rem;"></i>
                                    </div>
                                    <span style="color: #334155;" class="text-truncate">${emp.designation}</span>
                                </div>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="d-flex justify-content-center align-items-center rounded flex-shrink-0" style="width: 24px; height: 24px; background-color: #eff6ff; color: #2563eb;">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="2" y="4" width="20" height="16" rx="2.5"></rect>
                                            <path d="M2 6l10 7 10-7"></path>
                                        </svg>
                                    </div>
                                    <span style="color: #334155;" class="text-truncate">${emp.email}</span>
                                </div>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="d-flex justify-content-center align-items-center rounded flex-shrink-0" style="width: 24px; height: 24px; background-color: #eff6ff; color: #2563eb;">
                                        <i class="bi bi-telephone" style="font-size: 0.8rem;"></i>
                                    </div>
                                    <span style="color: #334155;" class="text-truncate">${emp.phone}</span>
                                </div>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="d-flex justify-content-center align-items-center rounded flex-shrink-0" style="width: 24px; height: 24px; background-color: #eff6ff; color: #2563eb;">
                                        <span style="font-size: 0.8rem; font-weight: bold;">₹</span>
                                    </div>
                                    <span style="color: #334155;" class="text-truncate">${emp.salary}</span>
                                </div>
                            </div>
                            
                            <hr class="my-2" style="border-color: #e2e8f0; opacity: 0.5;">
                            
                            <!-- Card Footer -->
                            <div class="d-flex justify-content-between align-items-center pt-2" style="font-size: 0.8rem;">
                                <div>
                                    <span class="text-muted me-1">Employee ID</span>
                                    <span class="fw-bold text-primary">${emp.employee_id}</span>
                                </div>
                                <a href="#" class="text-primary fw-bold text-decoration-none d-flex align-items-center gap-1" onclick="viewEmployee(${emp.id}); return false;" style="font-size: 0.8rem;">
                                    View Details <i class="bi bi-chevron-right" style="font-size: 0.7rem; margin-top: 2px;"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            document.getElementById('adminPaginationCard').innerHTML = buildPaginationHtml();
        }
    };

    // Toggle logic
    const btnListView = document.getElementById('btnListView');
    const btnCardView = document.getElementById('btnCardView');

    // Set initial view toggle active states
    if (currentView === 'card') {
        btnCardView.classList.add('active');
        btnListView.classList.remove('active');
    } else {
        btnListView.classList.add('active');
        btnCardView.classList.remove('active');
    }

    // Sidebar Filter Logic
    window.activeFilters = {};

    window.applyFilters = () => {
        const dept = document.getElementById('filterDepartment').value;
        const desig = document.getElementById('filterDesignation').value;
        
        window.activeFilters = {};
        if (dept) window.activeFilters.department = dept;
        if (desig) window.activeFilters.designation = desig;
        
        currentPage = 1;
        renderEmployees();
        toggleClearBtn();
        
        // Close offcanvas
        const offcanvasEl = document.getElementById('filterSidebar');
        const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl) || new bootstrap.Offcanvas(offcanvasEl);
        offcanvas.hide();
    };

    const toggleClearBtn = () => {
        const btn = document.getElementById('clearFiltersBtn');
        if (!btn) return;
        if (Object.keys(window.activeFilters).length > 0) {
            btn.classList.remove('d-none');
        } else {
            btn.classList.add('d-none');
        }
    };

    window.resetFilterForm = () => {
        document.getElementById('filterForm').reset();
        window.activeFilters = {};
        currentPage = 1;
        renderEmployees();
        toggleClearBtn();
        
        // Close offcanvas
        const offcanvasEl = document.getElementById('filterSidebar');
        const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (offcanvas) offcanvas.hide();
    };

    window.clearAllFilters = () => {
        window.activeFilters = {};
        document.getElementById('filterForm').reset();
        currentPage = 1;
        renderEmployees();
        toggleClearBtn();
    };

    window.clearFilter = (key) => {
        delete window.activeFilters[key];
        document.getElementById('filter' + key.charAt(0).toUpperCase() + key.slice(1)).value = '';
        currentPage = 1;
        renderEmployees();
        toggleClearBtn();
    };



    // Replace the simple string assignments with a map if needed, but the basic form works.

    btnListView.addEventListener('click', () => {
        currentView = 'list';
        btnListView.classList.add('active');
        btnCardView.classList.remove('active');
        renderEmployees();
    });

    btnCardView.addEventListener('click', () => {
        currentView = 'card';
        btnCardView.classList.add('active');
        btnListView.classList.remove('active');
        renderEmployees();
    });

    // Search input listener
    document.getElementById('searchEmployees').addEventListener('input', () => {
        currentPage = 1;
        renderEmployees();
    });

    // Column Filter Listener
    window.currentSearchColumn = 'all';
    document.addEventListener('click', (e) => {
        const filterOpt = e.target.closest('.filter-opt');
        if (filterOpt) {
            e.preventDefault();
            document.querySelectorAll('.filter-opt').forEach(el => el.classList.remove('active'));
            filterOpt.classList.add('active');
            window.currentSearchColumn = filterOpt.getAttribute('data-filter');
            
            // Optionally, update the button text to show what is selected
            const btnText = filterOpt.textContent;
            document.querySelector('#columnFilterMenu').previousElementSibling.innerHTML = `<i class="bi bi-funnel"></i> ${btnText}`;
            
            currentPage = 1;
            renderEmployees();
        }
    });



    // Reset form to editable state
    const resetFormState = () => {
        const inputs = document.querySelectorAll('#employeeForm .form-control');
        inputs.forEach(input => {
            if (input.id !== 'empId' && input.id !== 'empDept' && input.id !== 'empDesig') {
                input.removeAttribute('readonly');
            }
        });
        const saveBtn = document.querySelector('#employeeForm button[type="submit"]');
        saveBtn.classList.remove('d-none');
        saveBtn.classList.add('d-flex');
        document.querySelector('#employeeForm button[data-bs-dismiss="modal"]').innerHTML = 'Cancel';
    };

    document.getElementById('addEmpBtn').addEventListener('click', () => {
        isEditing = false;
        employeeForm.reset();
        document.getElementById('empDbId').value = '';
        document.getElementById('modalTitle').textContent = 'Add Employee';
        document.getElementById('modalSubtitle').textContent = 'Add new employee information and details';
        resetFormState();
        
        // Auto-generate ID based on existing employees
        let nextIdNum = 1;
        if (employees && employees.length > 0) {
            const ids = employees.map(e => {
                const match = e.employee_id.match(/\d+/);
                return match ? parseInt(match[0]) : 0;
            });
            nextIdNum = Math.max(...ids) + 1;
        }
        document.getElementById('empId').value = 'EMP' + nextIdNum.toString().padStart(3, '0');
    });

    employeeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const empData = {
            employee_id: document.getElementById('empId').value,
            name: document.getElementById('empName').value,
            email: document.getElementById('empEmail').value,
            phone: document.getElementById('empPhone').value,
            department: document.getElementById('empDept').value,
            designation: document.getElementById('empDesig').value,
            salary: document.getElementById('empSalary').value
        };

        const dbId = document.getElementById('empDbId').value;
        const saveBtn = employeeForm.querySelector('button[type="submit"]');
        const originalText = saveBtn.innerHTML;

        if (empData.name.trim().length < 3) {
            showAlert('Name must be at least 3 characters', 'danger');
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(empData.name.trim())) {
            showAlert('Name should contain only letters and spaces', 'danger');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empData.email)) {
            showAlert('Please enter a valid email address', 'danger');
            return;
        }
        if (!/^\d{10}$/.test(empData.phone)) {
            showAlert('Please enter a valid 10-digit phone number', 'danger');
            return;
        }
        
        const isDuplicatePhone = employees.some(e => e.phone === empData.phone && String(e.id) !== dbId);
        if (isDuplicatePhone) {
            showAlert('This phone number is already registered to another employee', 'danger');
            return;
        }
        if (!empData.department) {
            showAlert('Please select a department', 'danger');
            return;
        }
        if (!empData.designation) {
            showAlert('Please select a designation', 'danger');
            return;
        }
        if (!empData.salary || isNaN(empData.salary) || Number(empData.salary) <= 0) {
            showAlert('Please enter a valid positive salary', 'danger');
            return;
        }

        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

            if (isEditing) {
                const hasChanges = !originalEditingData ||
                    empData.employee_id !== originalEditingData.employee_id ||
                    empData.name !== originalEditingData.name ||
                    empData.email !== originalEditingData.email ||
                    empData.phone !== originalEditingData.phone ||
                    empData.department !== originalEditingData.department ||
                    empData.designation !== originalEditingData.designation ||
                    empData.salary !== String(originalEditingData.salary);

                if (!hasChanges) {
                    employeeModal.hide();
                    return; // No changes made
                }

                await apiFetch(`/employees/${dbId}`, {
                    method: 'PUT',
                    body: JSON.stringify(empData)
                });
                employeeModal.hide();
                showAlert('Employee updated successfully');
                loadEmployees();
            } else {
                await apiFetch('/employees', {
                    method: 'POST',
                    body: JSON.stringify(empData)
                });
                showAlert('Employee added successfully');
            }
            
            employeeModal.hide();
            loadEmployees();
        } catch (error) {
            showAlert(error.message, 'danger');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    });

    window.editEmployee = (id) => {
        const emp = employees.find(e => e.id === id);
        if (emp) {
            isEditing = true;
            originalEditingData = { ...emp };
            document.getElementById('empDbId').value = emp.id;
            document.getElementById('empId').value = emp.employee_id;
            document.getElementById('empName').value = emp.name;
            document.getElementById('empEmail').value = emp.email;
            document.getElementById('empPhone').value = emp.phone;
            document.getElementById('empDept').value = emp.department;
            document.getElementById('empDesig').value = emp.designation;
            document.getElementById('empSalary').value = emp.salary;
            
            document.getElementById('modalTitle').textContent = 'Edit Employee';
            document.getElementById('modalSubtitle').textContent = 'Update employee information and details';
            resetFormState();
            employeeModal.show();
        }
    };
    
    // View Employee Details
    window.viewEmployee = function(id) {
        const emp = employees.find(e => e.id === id);
        if (emp) {
            document.getElementById('empDbId').value = emp.id;
            document.getElementById('empId').value = emp.employee_id;
            document.getElementById('empName').value = emp.name;
            document.getElementById('empEmail').value = emp.email;
            document.getElementById('empPhone').value = emp.phone;
            document.getElementById('empDept').value = emp.department;
            document.getElementById('empDesig').value = emp.designation;
            document.getElementById('empSalary').value = emp.salary;
            
            document.getElementById('modalTitle').textContent = 'Employee Details';
            document.getElementById('modalSubtitle').textContent = 'View complete information of the employee';
            
            // Set fields to readonly
            const inputs = document.querySelectorAll('#employeeForm .form-control');
            inputs.forEach(input => input.setAttribute('readonly', true));
            
            // Hide save button and change cancel to close
            const saveBtn = document.querySelector('#employeeForm button[type="submit"]');
            saveBtn.classList.remove('d-flex');
            saveBtn.classList.add('d-none');
            
            document.querySelector('#employeeForm button[data-bs-dismiss="modal"]').innerHTML = 'Close';
            
            employeeModal.show();
        }
    };

    window.startInlineEdit = (id) => {
        editingEmployeeId = id;
        renderEmployees();
    };

    window.cancelEdit = () => {
        editingEmployeeId = null;
        renderEmployees();
    };

    window.saveInlineEdit = async (id) => {
        const emp = employees.find(e => e.id === id);
        if (!emp) return;

        const updatedData = {
            employee_id: emp.employee_id,
            name: document.getElementById(`inline_name_${id}`).value,
            email: document.getElementById(`inline_email_${id}`).value,
            phone: document.getElementById(`inline_phone_${id}`).value,
            department: document.getElementById(`inline_dept_${id}`).value,
            designation: document.getElementById(`inline_desig_${id}`).value,
            salary: document.getElementById(`inline_salary_${id}`).value
        };

        if (updatedData.name.trim().length < 3) {
            showAlert('Name must be at least 3 characters', 'danger');
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(updatedData.name.trim())) {
            showAlert('Name should contain only letters and spaces', 'danger');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedData.email)) {
            showAlert('Please enter a valid email address', 'danger');
            return;
        }
        if (!/^\d{10}$/.test(updatedData.phone)) {
            showAlert('Please enter a valid 10-digit phone number', 'danger');
            return;
        }

        const isDuplicatePhone = employees.some(e => e.phone === updatedData.phone && e.id !== id);
        if (isDuplicatePhone) {
            showAlert('This phone number is already registered to another employee', 'danger');
            return;
        }
        if (!updatedData.department) {
            showAlert('Please select a department', 'danger');
            return;
        }
        if (!updatedData.designation) {
            showAlert('Please select a designation', 'danger');
            return;
        }
        if (!updatedData.salary || isNaN(updatedData.salary) || Number(updatedData.salary) <= 0) {
            showAlert('Please enter a valid positive salary', 'danger');
            return;
        }

        const hasChanges = 
            updatedData.employee_id !== emp.employee_id ||
            updatedData.name !== emp.name ||
            updatedData.email !== emp.email ||
            updatedData.phone !== emp.phone ||
            updatedData.department !== emp.department ||
            updatedData.designation !== emp.designation ||
            updatedData.salary !== String(emp.salary);

        if (!hasChanges) {
            editingEmployeeId = null;
            renderEmployees();
            return;
        }

        try {
            await apiFetch(`/employees/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updatedData)
            });
            showAlert('Employee updated successfully');
            editingEmployeeId = null;
            loadEmployees();
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    };

    window.deleteEmployee = async (id) => {
        const isConfirmed = await window.showConfirm('Delete Employee?', 'Are you sure you want to delete this employee?');
        if (isConfirmed) {
            try {
                await apiFetch(`/employees/${id}`, { method: 'DELETE' });
                showAlert('Employee deleted successfully');
                loadEmployees();
            } catch (error) {
                showAlert(error.message, 'danger');
            }
        }
    };

    // Initialize
    loadEmployees();
});
