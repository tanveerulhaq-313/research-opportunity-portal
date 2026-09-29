// frontend/app.js
const API = 'http://localhost:3000/api/opportunities';

const $ = (id) => document.getElementById(id);
const tableBody = $('opportunitiesTable');
const form = $('opportunityForm');
const saveBtn = $('saveBtn');
const formModal = new bootstrap.Modal($('formModal'));
const detailsModal = new bootstrap.Modal($('detailsModal'));
const FIELDS = ['title', 'area', 'description', 'faculty_name', 'department', 'skills', 'positions', 'deadline', 'status'];

let items = [];
let filters = { q: '', status: 'all', sort: 'deadline' };

// ---------- Helpers ----------
function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
// MySQL DATE columns can arrive as "2026-10-05" or as an ISO timestamp; normalise to local YYYY-MM-DD
const dateOnly = (d) => {
  const s = String(d ?? '');
  if (s.length <= 10) return s;
  const dt = new Date(s);
  if (isNaN(dt)) return s.slice(0, 10);
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
};
const daysLeft = (d) => Math.ceil((new Date(dateOnly(d) + 'T23:59:59') - new Date()) / 864e5);
const fmtDate = (d) => {
  const dt = new Date(dateOnly(d) + 'T00:00');
  return isNaN(dt) ? escapeHtml(d) : dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};
const isLive = (o) => o.status === 'Open' && daysLeft(o.deadline) >= 0; // open and not past its deadline
const badge = (s) => `<span class="status-badge ${s === 'Open' ? 'status-open' : 'status-closed'}">${escapeHtml(s)}</span>`;

function showToast(message, type = 'success') {
  const colors = { success: 'text-bg-success', error: 'text-bg-danger', info: 'text-bg-primary' };
  const id = 'toast-' + Date.now();
  $('toastContainer').insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center ${colors[type] || colors.info} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>`);
  const el = $(id);
  new bootstrap.Toast(el, { delay: 3000 }).show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

// ---------- Load ----------
async function loadOpportunities() {
  tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-5">Loading…</td></tr>`;
  try {
    const res = await fetch(API);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load');
    items = Array.isArray(data) ? data : [];
    render();
  } catch (err) {
    console.error(err);
    items = [];
    renderStats();
    $('countLabel').textContent = '';
    tableBody.innerHTML = `<tr><td colspan="8"><div class="empty"><b>Can't load opportunities</b>${escapeHtml(err.message)}. Check that the server is running on port 3000, then refresh.</div></td></tr>`;
    showToast(err.message, 'error');
  }
}

// ---------- Render ----------
function visible() {
  const q = filters.q.toLowerCase();
  const list = items.filter((o) =>
    (filters.status === 'all' || o.status === filters.status) &&
    (!q || [o.title, o.area, o.faculty_name, o.department, o.skills].join(' ').toLowerCase().includes(q)));
  const sorts = {
    deadline: (a, b) => a.status === b.status
      ? dateOnly(a.deadline).localeCompare(dateOnly(b.deadline))
      : a.status === 'Open' ? -1 : 1,
    positions: (a, b) => b.positions - a.positions,
    title: (a, b) => String(a.title).localeCompare(String(b.title)),
  };
  return list.sort(sorts[filters.sort]);
}

function renderStats() {
  const open = items.filter(isLive);
  const soon = open.filter((o) => { const d = daysLeft(o.deadline); return d >= 0 && d <= 7; }).length;
  const seats = open.reduce((n, o) => n + Number(o.positions || 0), 0);
  const depts = new Set(items.map((o) => o.department)).size;
  $('stats').innerHTML = `
    <div class="stat"><b>${open.length}</b><span>open projects</span></div>
    <div class="stat"><b>${seats}</b><span>positions to fill</span></div>
    <div class="stat"><b>${depts}</b><span>departments</span></div>
    <div class="stat urgent"><b>${soon}</b><span>closing within a week</span></div>`;
}

function render() {
  renderStats();
  const list = visible();
  $('countLabel').textContent = `Showing ${list.length} of ${items.length} opportunities`;

  if (!list.length) {
    tableBody.innerHTML = `<tr><td colspan="8"><div class="empty"><b>${items.length ? 'Nothing matches' : 'No opportunities yet'}</b>${items.length ? 'Try a different search or filter.' : 'Add the first opportunity to get started.'}</div></td></tr>`;
    return;
  }

  tableBody.innerHTML = list.map((o) => {
    const d = daysLeft(o.deadline);
    const soon = o.status === 'Open' && d >= 0 && d <= 7;
    const pct = d < 0 ? 0 : Math.max(4, Math.min(100, (d / 60) * 100));
    const note = d < 0 ? `Ended ${-d} day${d === -1 ? '' : 's'} ago` : d === 0 ? 'Closes today' : `${d} day${d === 1 ? '' : 's'} left`;
    return `
      <tr class="row-clickable ${isLive(o) ? '' : 'closed'}" data-id="${o.id}">
        <td class="row-num">${o.id}</td>
        <td><div class="opp-title">${escapeHtml(o.title)}</div><div class="opp-dept">${escapeHtml(o.department)}</div></td>
        <td><span class="area-tag">${escapeHtml(o.area)}</span></td>
        <td>${escapeHtml(o.faculty_name)}</td>
        <td>${o.positions}</td>
        <td><div class="deadline ${soon ? 'soon' : ''}">
          <div class="deadline-date">${fmtDate(o.deadline)}</div>
          <div class="meter"><i style="width:${pct}%"></i></div>
          <small>${note}</small></div></td>
        <td>${badge(o.status)}</td>
        <td class="text-end actions">
          <button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${o.id}">Edit</button>
          <button class="btn btn-sm btn-outline-warning me-1" data-action="toggle" data-id="${o.id}" data-status="${o.status}">${o.status === 'Open' ? 'Close' : 'Reopen'}</button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${o.id}">Delete</button>
        </td>
      </tr>`;
  }).join('');
}

// ---------- Form (new / edit) ----------
function openForm(mode, o = {}) {
  form.reset();
  form.classList.remove('was-validated');
  if (mode === 'edit') {
    $('formModalTitle').textContent = `Edit opportunity #${o.id}`;
    $('opportunityId').value = o.id;
    FIELDS.forEach((f) => { $(f).value = f === 'deadline' ? dateOnly(o[f]) : (o[f] ?? ''); });
    if (!o.positions) $('positions').value = 1;
  } else {
    $('formModalTitle').textContent = 'New opportunity';
    $('opportunityId').value = '';
    $('status').value = 'Open';
  }
  formModal.show();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;

  const id = $('opportunityId').value;
  const payload = Object.fromEntries(FIELDS.map((f) => [f, $(f).value.trim()]));
  payload.positions = Number(payload.positions);

  saveBtn.disabled = true;
  try {
    const res = await fetch(id ? `${API}/${id}` : API, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.details ? data.details.join(', ') : (data.error || 'Request failed'));

    showToast(id ? 'Opportunity updated' : 'Opportunity created');
    formModal.hide();
    loadOpportunities();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
  }
});

// ---------- Details ----------
function showDetails(o) {
  const skills = String(o.skills ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    .map((s) => `<span class="skill-pill">${escapeHtml(s)}</span>`).join('');
  $('detailsBody').innerHTML = `
    <h6>${escapeHtml(o.title)}</h6>
    <p class="text-muted">${escapeHtml(o.area)} · ${escapeHtml(o.department)}</p>
    <dl class="mb-0">
      <dt>Description</dt><dd>${escapeHtml(o.description)}</dd>
      <dt>Supervisor</dt><dd>${escapeHtml(o.faculty_name)}</dd>
      <dt>Required skills</dt><dd>${skills}</dd>
      <dt>Positions</dt><dd>${o.positions}</dd>
      <dt>Deadline</dt><dd>${fmtDate(o.deadline)}</dd>
      <dt>Status</dt><dd>${badge(o.status)}</dd>
    </dl>`;
  detailsModal.show();
}

// ---------- Row click & action buttons ----------
tableBody.addEventListener('click', async (e) => {
  const actionBtn = e.target.closest('[data-action]');
  const row = e.target.closest('tr[data-id]');
  const id = row?.dataset.id;
  if (!id) return;
  if (!actionBtn && e.target.closest('.actions')) return; // ignore clicks on the empty part of the actions cell

  try {
    if (actionBtn) {
      e.stopPropagation();
      const action = actionBtn.dataset.action;

      if (action === 'edit') {
        const res = await fetch(`${API}/${id}`);
        const data = await res.json();
        if (!res.ok) return showToast(data.error, 'error');
        return openForm('edit', data);
      }

      if (action === 'toggle') {
        const newStatus = actionBtn.dataset.status === 'Open' ? 'Closed' : 'Open';
        const res = await fetch(`${API}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json();
        if (!res.ok) return showToast(data.error, 'error');
        showToast(`Status changed to ${newStatus}`);
        return loadOpportunities();
      }

      if (action === 'delete') {
        if (!confirm('Delete this opportunity? This cannot be undone.')) return;
        const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) return showToast(data.error, 'error');
        showToast('Opportunity deleted');
        return loadOpportunities();
      }
    }

    const res = await fetch(`${API}/${id}`);
    const o = await res.json();
    if (!res.ok) return showToast(o.error, 'error');
    showDetails(o);
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ---------- Toolbar ----------
$('refreshBtn').addEventListener('click', loadOpportunities);
$('newBtn').addEventListener('click', () => openForm('new'));
$('searchInput').addEventListener('input', (e) => { filters.q = e.target.value; render(); });
$('sortSelect').addEventListener('change', (e) => { filters.sort = e.target.value; render(); });
$('statusChips').addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === b));
  filters.status = b.dataset.status;
  render();
});

// ---------- Init ----------
loadOpportunities();