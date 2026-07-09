export const STATUS_LABELS = {
    ACTIVE: '재직',
    LEAVE: '휴직',
    RESIGNED: '퇴직',
};

const STATUS_BADGE_CLASS = {
    ACTIVE: 'badge-active',
    LEAVE: 'badge-leave',
    RESIGNED: 'badge-resigned',
};

export function statusBadgeHtml(status) {
    const label = STATUS_LABELS[status] || status;
    const cls = STATUS_BADGE_CLASS[status] || '';
    return `<span class="badge ${cls}">${escapeHtml(label)}</span>`;
}

export function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function request(method, url, body) {
    const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    const envelope = await res.json();
    if (!envelope.success) {
        const error = new Error(envelope.message || '요청 처리 중 오류가 발생했습니다.');
        error.fieldErrors = envelope.errors || null;
        throw error;
    }
    return envelope.data;
}

export const api = {
    get: (url) => request('GET', url),
    post: (url, body) => request('POST', url, body),
    patch: (url, body) => request('PATCH', url, body),
};
