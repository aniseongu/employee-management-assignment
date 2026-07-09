import { api, escapeHtml, statusBadgeHtml, STATUS_LABELS } from './api.js';

const ALLOWED_TRANSITIONS = {
    ACTIVE: ['LEAVE', 'RESIGNED'],
    LEAVE: ['ACTIVE', 'RESIGNED'],
    RESIGNED: [],
};

const CHANGE_TYPE_LABELS = {
    HIRE: '입사',
    TRANSFER: '발령',
    PROMOTION: '승진',
    LEAVE: '휴직',
    RETURN: '복직',
    RESIGN: '퇴직',
};

const empId = new URLSearchParams(window.location.search).get('id');
const editForm = document.getElementById('employee-edit-form');

function fillEditForm(employee) {
    editForm.empName.value = employee.emp_name || '';
    editForm.email.value = employee.email || '';
    editForm.phone.value = employee.phone || '';
    editForm.memo.value = employee.memo || '';
    editForm.deptId.value = employee.dept_id ?? '';
    editForm.positionId.value = employee.position_id ?? '';
    editForm.managerId.value = employee.manager_id ?? '';
}

function renderView(employee) {
    document.getElementById('view-empNo').textContent = employee.emp_no;
    document.getElementById('view-status').innerHTML = statusBadgeHtml(employee.emp_status);
    document.getElementById('view-hireDate').textContent = employee.hire_date;
}

function renderHistory(history) {
    const tbody = document.getElementById('history-table-body');
    const empty = document.getElementById('history-empty');
    tbody.innerHTML = '';

    if (!history || history.length === 0) {
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    history.forEach((h) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(h.effective_date)}</td>
            <td>${escapeHtml(CHANGE_TYPE_LABELS[h.change_type] || h.change_type)}</td>
            <td>${escapeHtml(h.remark)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderStatusActions(employee) {
    const container = document.getElementById('status-actions');
    container.innerHTML = '';

    const allowedTargets = ALLOWED_TRANSITIONS[employee.emp_status] || [];
    if (allowedTargets.length === 0) {
        container.innerHTML = '<p class="muted">퇴직 상태는 다른 상태로 변경할 수 없습니다.</p>';
        return;
    }

    allowedTargets.forEach((target) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn';
        button.textContent = `${STATUS_LABELS[target]}(으)로 변경`;
        button.addEventListener('click', () => changeStatus(target));
        container.appendChild(button);
    });
}

async function changeStatus(status) {
    const statusError = document.getElementById('status-error');
    statusError.style.display = 'none';
    try {
        const employee = await api.patch(`/employees/${empId}/status`, { status });
        render(employee);
    } catch (err) {
        statusError.textContent = err.message;
        statusError.style.display = 'block';
    }
}

async function populateSelectOptions(selectId, url, valueKey, labelKey, excludeId) {
    const select = document.getElementById(selectId);
    const items = await api.get(url);
    items
        .filter((item) => String(item[valueKey]) !== String(excludeId))
        .forEach((item) => {
            const option = document.createElement('option');
            option.value = item[valueKey];
            option.textContent = item[labelKey];
            select.appendChild(option);
        });
}

function render(employee) {
    renderView(employee);
    fillEditForm(employee);
    renderStatusActions(employee);
    renderHistory(employee.history);
}

async function init() {
    if (!empId) {
        document.getElementById('load-error').textContent = '직원 ID가 없습니다.';
        document.getElementById('load-error').style.display = 'block';
        return;
    }

    await Promise.all([
        populateSelectOptions('deptId', '/departments', 'dept_id', 'dept_name'),
        populateSelectOptions('positionId', '/positions', 'position_id', 'position_name'),
        populateSelectOptions('managerId', '/employees', 'emp_id', 'emp_name', empId),
    ]);

    try {
        const employee = await api.get(`/employees/${empId}`);
        render(employee);
    } catch (err) {
        document.getElementById('load-error').textContent = err.message;
        document.getElementById('load-error').style.display = 'block';
    }
}

editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formError = document.getElementById('form-error');
    formError.style.display = 'none';
    ['empName', 'email', 'phone', 'deptId', 'positionId', 'managerId', 'memo'].forEach((name) => {
        const el = document.getElementById(`error-${name}`);
        if (el) el.textContent = '';
    });

    const body = {
        empName: editForm.empName.value.trim(),
        email: editForm.email.value.trim(),
        phone: editForm.phone.value.trim() || null,
        deptId: Number(editForm.deptId.value),
        positionId: Number(editForm.positionId.value),
        managerId: editForm.managerId.value ? Number(editForm.managerId.value) : null,
        memo: editForm.memo.value.trim() || null,
    };

    try {
        const employee = await api.patch(`/employees/${empId}`, body);
        render(employee);
    } catch (err) {
        if (err.fieldErrors) {
            Object.entries(err.fieldErrors).forEach(([field, messages]) => {
                const el = document.getElementById(`error-${field}`);
                if (el) el.textContent = messages[0];
            });
        }
        formError.textContent = err.message;
        formError.style.display = 'block';
    }
});

init();
