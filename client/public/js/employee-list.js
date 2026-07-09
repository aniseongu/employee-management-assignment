import { api, escapeHtml, statusBadgeHtml } from './api.js';

let allEmployees = [];

function renderTable(employees) {
    const tbody = document.getElementById('employee-table-body');
    const empty = document.getElementById('employee-list-empty');
    tbody.innerHTML = '';

    if (employees.length === 0) {
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    employees.forEach((emp) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(emp.emp_no)}</td>
            <td>${escapeHtml(emp.emp_name)}</td>
            <td>${escapeHtml(emp.email)}</td>
            <td>${escapeHtml(emp.dept_name)}</td>
            <td>${escapeHtml(emp.position_name)}</td>
            <td>${escapeHtml(emp.manager_name)}</td>
            <td>${statusBadgeHtml(emp.emp_status)}</td>
            <td>${escapeHtml(emp.hire_date)}</td>
            <td><a class="btn" href="/detail?id=${encodeURIComponent(emp.emp_id)}">상세</a></td>
        `;
        tbody.appendChild(tr);
    });
}

function applyFilters() {
    const nameQuery = document.getElementById('filter-name').value.trim().toLowerCase();
    const deptId = document.getElementById('filter-dept').value;
    const status = document.getElementById('filter-status').value;

    const filtered = allEmployees.filter((emp) => {
        if (nameQuery && !String(emp.emp_name || '').toLowerCase().includes(nameQuery)) return false;
        if (deptId && String(emp.dept_id) !== deptId) return false;
        if (status && emp.emp_status !== status) return false;
        return true;
    });

    renderTable(filtered);
}

async function populateDeptFilter() {
    const select = document.getElementById('filter-dept');
    try {
        const departments = await api.get('/departments');
        departments.forEach((dept) => {
            const option = document.createElement('option');
            option.value = dept.dept_id;
            option.textContent = dept.dept_name;
            select.appendChild(option);
        });
    } catch {
        // 부서 목록을 불러오지 못해도 필터 없이 목록은 계속 볼 수 있어야 한다.
    }
}

function renderOrgTree(employees) {
    const container = document.getElementById('org-tree');
    container.innerHTML = '';

    const byDept = new Map();
    employees.forEach((emp) => {
        const key = emp.dept_name || '부서 미지정';
        if (!byDept.has(key)) byDept.set(key, []);
        byDept.get(key).push(emp);
    });

    byDept.forEach((deptEmployees, deptName) => {
        const deptWrap = document.createElement('div');
        const heading = document.createElement('strong');
        heading.textContent = deptName;
        deptWrap.appendChild(heading);
        deptWrap.appendChild(buildTree(deptEmployees));
        container.appendChild(deptWrap);
    });
}

function buildTree(deptEmployees) {
    const byId = new Map(deptEmployees.map((emp) => [emp.emp_id, { emp, children: [] }]));
    const roots = [];

    byId.forEach((node) => {
        const managerNode = node.emp.manager_id != null ? byId.get(node.emp.manager_id) : null;
        if (managerNode) {
            managerNode.children.push(node);
        } else {
            roots.push(node);
        }
    });

    return renderNodeList(roots);
}

function renderNodeList(nodes) {
    const ul = document.createElement('ul');
    nodes.forEach((node) => {
        const li = document.createElement('li');
        li.textContent = `${node.emp.emp_name} (${node.emp.position_name || '직책 미지정'})`;
        if (node.children.length > 0) {
            li.appendChild(renderNodeList(node.children));
        }
        ul.appendChild(li);
    });
    return ul;
}

async function init() {
    await populateDeptFilter();

    const tbody = document.getElementById('employee-table-body');
    try {
        allEmployees = await api.get('/employees');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="9">${escapeHtml(err.message)}</td></tr>`;
        return;
    }

    renderTable(allEmployees);
    renderOrgTree(allEmployees);

    document.getElementById('filter-name').addEventListener('input', applyFilters);
    document.getElementById('filter-dept').addEventListener('change', applyFilters);
    document.getElementById('filter-status').addEventListener('change', applyFilters);
}

init();
