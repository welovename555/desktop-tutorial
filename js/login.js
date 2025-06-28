// Mock employee data - In production, this would come from Supabase
const employees = {
    '1234': { name: 'พนักงาน A', role: 'employee' },
    '5678': { name: 'พนักงาน B', role: 'employee' },
    '9999': { name: 'ผู้จัดการ', role: 'admin' }
};

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const employeeCodeInput = document.getElementById('employeeCode');
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = loginForm.querySelector('.login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnSpinner = loginBtn.querySelector('.btn-spinner');

    // Auto-focus on employee code input
    employeeCodeInput.focus();

    // Only allow numeric input
    employeeCodeInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const employeeCode = employeeCodeInput.value.trim();
        
        if (employeeCode.length !== 4) {
            showError('กรุณากรอกรหัสพนักงาน 4 หลัก');
            return;
        }

        // Show loading state
        showLoading(true);
        hideError();

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if employee exists
            const employee = employees[employeeCode];
            
            if (employee) {
                // Store user session
                sessionStorage.setItem('currentUser', JSON.stringify({
                    code: employeeCode,
                    name: employee.name,
                    role: employee.role,
                    loginTime: new Date().toISOString()
                }));

                // Redirect to POS system
                window.location.href = 'pos.html';
            } else {
                showError('รหัสพนักงานไม่ถูกต้อง');
            }
        } catch (error) {
            showError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        } finally {
            showLoading(false);
        }
    });

    function showLoading(show) {
        if (show) {
            btnText.style.display = 'none';
            btnSpinner.style.display = 'flex';
            loginBtn.disabled = true;
        } else {
            btnText.style.display = 'block';
            btnSpinner.style.display = 'none';
            loginBtn.disabled = false;
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        employeeCodeInput.focus();
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    // Check if user is already logged in
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'pos.html';
    }
});