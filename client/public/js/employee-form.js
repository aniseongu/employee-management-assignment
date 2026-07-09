import { api } from './api.js';

const FIELD_NAMES = ['empNo', 'empName', 'email', 'phone', 'hireDate', 'deptId', 'positionId', 'managerId', 'empStatus', 'memo'];

function clearErrors() {
    document.getElementById('form-error').style.display = 'none';
    FIELD_NAMES.forEach((name) => {
        const el = document.getElementById(`error-${name}`);
        if (el) el.textContent = '';
    });
}

function showErrors(err) {
    const formError = document.getElementById('form-error');
    if (err.fieldErrors) {
        Object.entries(err.fieldErrors).forEach(([field, messages]) => {
            const el = document.getElementById(`error-${field}`);
            if (el) el.textContent = messages[0];
        });
    }
    formError.textContent = err.message;
    formError.style.display = 'block';
}

async function populateSelect(selectId, url, valueKey, labelKey) {
    const select = document.getElementById(selectId);
    const items = await api.get(url);
    items.forEach((item) => {
        const option = document.createElement('option');
        option.value = item[valueKey];
        option.textContent = item[labelKey];
        select.appendChild(option);
    });
}

async function populateManagerSelect() {
    const select = document.getElementById('managerId');
    const employees = await api.get('/employees');
    employees.forEach((emp) => {
        const option = document.createElement('option');
        option.value = emp.emp_id;
        option.textContent = `${emp.emp_name} (${emp.emp_no})`;
        select.appendChild(option);
    });
}

async function init() {
    await Promise.all([
        populateSelect('deptId', '/departments', 'dept_id', 'dept_name'),
        populateSelect('positionId', '/positions', 'position_id', 'position_name'),
        populateManagerSelect(),
    ]);
}

document.getElementById('employee-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const form = event.target;
    const body = {
        empNo: form.empNo.value.trim(),
        empName: form.empName.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim() || undefined,
        hireDate: form.hireDate.value,
        deptId: Number(form.deptId.value),
        positionId: Number(form.positionId.value),
        managerId: form.managerId.value ? Number(form.managerId.value) : undefined,
        empStatus: form.empStatus.value,
        memo: form.memo.value.trim() || undefined,
    };

    try {
        await api.post('/employees', body);
        window.location.href = '/';
    } catch (err) {
        showErrors(err);
    }
});

init();
