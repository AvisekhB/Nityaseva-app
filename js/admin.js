import { requireAuth, signOut } from './auth.js';
import { callApi } from './dataService.js';

let currentProfile = null;
let allSeniorsCache = [];

async function init() {
  setupTabs();

  currentProfile = await requireAuth('admin');
  if (!currentProfile) return;

  document.getElementById('user-display').textContent = currentProfile.full_name || currentProfile.email || 'Admin';
  document.getElementById('btn-logout').addEventListener('click', signOut);

  const dateInput = document.getElementById('wo-scheduled-at');
  if (dateInput) {
    const d = new Date(Date.now() + 3600000);
    dateInput.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  const aptDateInput = document.getElementById('apt-scheduled-at');
  if (aptDateInput) {
    const d2 = new Date(Date.now() + 3600000);
    aptDateInput.value = new Date(d2.getTime() - d2.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  await loadAdminDashboard();
}

function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      tabs.forEach(function (b) { b.classList.remove('active'); });
      contents.forEach(function (c) { c.classList.remove('active'); });

      const tabId = e.currentTarget.getAttribute('data-tab');
      e.currentTarget.classList.add('active');
      const target = document.getElementById(tabId);
      if (target) target.classList.add('active');
    });
  });
}

async function loadAdminDashboard() {
  try {
    const data = await callApi('getAdminDashboard');

    allSeniorsCache = data.seniors || [];
    populateSeniorDropdowns(allSeniorsCache);

    renderWorkOrders(data.workOrders || []);
    renderSeniors(data.seniors || []);
    renderFamilies(data.families || [], data.familyLinks || []);
    renderStaff(data.staff || []);
    renderDoctors(data.doctors || []);
    renderSubscriptions(data.subscriptions || []);
    renderEntitlements(data.entitlements || []);
    renderAppointments(data.appointments || []);
    renderReviews(data.reviews || []);
    renderAudit(data.logs || []);

  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    alert('Dashboard load error: ' + err.message);
  }
}

function populateSeniorDropdowns(seniors) {
  const subDropdown = document.getElementById('sub-senior-id');
  const aptDropdown = document.getElementById('apt-senior-id');

  let optionsHtml = '<option value="">-- Choose Senior --</option>';
  for (let i = 0; i < seniors.length; i++) {
    const s = seniors[i];
    optionsHtml += '<option value="' + s.senior_id + '">' + s.full_name + ' (' + s.senior_id + ')</option>';
  }

  if (subDropdown) {
    const currentVal = subDropdown.value;
    subDropdown.innerHTML = optionsHtml;
    if (currentVal) subDropdown.value = currentVal;
  }

  if (aptDropdown) {
    const currentVal = aptDropdown.value;
    aptDropdown.innerHTML = optionsHtml;
    if (currentVal) aptDropdown.value = currentVal;
  }
}

function getSeniorName(id) {
  const s = allSeniorsCache.find(function (x) { return x.senior_id === id; });
  return s ? s.full_name : id;
}

function renderWorkOrders(orders) {
  const tbody = document.querySelector('#admin-wo-table tbody');
  tbody.innerHTML = '';

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No work orders recorded yet.</td></tr>';
    return;
  }

  const reversed = orders.slice().reverse();

  reversed.forEach(function (wo) {
    const tr = document.createElement('tr');

    const isClosedState = (wo.status === 'COMPLETE' || wo.status === 'CLOSE');
    let badgeColor = 'badge-blue';
    if (isClosedState) {
      badgeColor = 'badge-green';
    } else if (wo.status === 'IN_PROGRESS') {
      badgeColor = 'badge-yellow';
    }

    let displayTime = '-';
    if (wo.created_at) {
      try {
        displayTime = new Date(wo.created_at).toLocaleString('en-IN', {
          dateStyle: 'short',
          timeStyle: 'short'
        });
      } catch (e) {
        displayTime = wo.created_at;
      }
    }

    const canCancel = (wo.status !== 'CANCELLED' && wo.status !== 'COMPLETE' && wo.status !== 'CLOSE');

    let actionCell = '<span style="color:#a0aec0;font-size:12px;">Locked</span>';
    if (canCancel) {
      actionCell = '<button class="override-btn danger" data-id="' + wo.work_order_id + '">Cancel</button>';
    }

    const seniorName = getSeniorName(wo.senior_id);

    let rowHtml = '';
    rowHtml += '<td><strong>' + wo.work_order_id + '</strong></td>';
    rowHtml += '<td>' + seniorName + '</td>';
    rowHtml += '<td>' + wo.type + '</td>';
    rowHtml += '<td>' + displayTime + '</td>';
    rowHtml += '<td><span class="badge ' + badgeColor + '">' + wo.status + '</span></td>';
    rowHtml += '<td>' + actionCell + '</td>';

    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.override-btn').forEach(function (btn) {
    btn.addEventListener('click', async function (e) {
      const woId = e.target.getAttribute('data-id');
      const reason = prompt('Enter override/cancellation reason:');
      if (!reason) return;
      try {
        await callApi('adminOverrideWorkOrder', {
          workOrderId: woId,
          newStatus: 'CANCELLED',
          reason: reason
        });
        alert('Work Order cancelled successfully.');
        await loadAdminDashboard();
      } catch (err) {
        alert('Override failed: ' + err.message);
      }
    });
  });
}

function renderSeniors(seniors) {
  const tbody = document.querySelector('#admin-seniors-table tbody');
  tbody.innerHTML = '';
  if (seniors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No seniors registered yet.</td></tr>';
    return;
  }

  seniors.forEach(function (s) {
    const tr = document.createElement('tr');
    let html = '';
    html += '<td><strong>' + s.senior_id + '</strong></td>';
    html += '<td>' + s.full_name + '</td>';
    html += '<td>' + (s.phone || '-') + '</td>';
    html += '<td>' + (s.email || '-') + '</td>';
    html += '<td>' + (s.address || '-') + '</td>';
    html += '<td><span class="badge badge-green">' + (s.status || 'ACTIVE') + '</span></td>';
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

function renderFamilies(families, links) {
  const tbody = document.querySelector('#admin-families-table tbody');
  tbody.innerHTML = '';
  if (families.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No families recorded in Sheets.</td></tr>';
    return;
  }

  families.forEach(function (f) {
    const link = links.find(function (l) { return l.family_id === f.family_id; });
    const tr = document.createElement('tr');
    const linkedDisplay = link ? ('<code>' + link.senior_id + '</code>') : '<em>Unlinked</em>';

    let html = '';
    html += '<td><strong>' + f.family_id + '</strong></td>';
    html += '<td>' + f.full_name + '</td>';
    html += '<td>' + (f.relationship || '-') + '</td>';
    html += '<td>' + linkedDisplay + '</td>';
    html += '<td>' + (f.email || '-') + '</td>';
    html += '<td>' + (f.phone || '-') + '</td>';
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

function renderStaff(staff) {
  const tbody = document.querySelector('#admin-staff-table tbody');
  tbody.innerHTML = '';
  if (staff.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No staff recorded in Staff sheet tab.</td></tr>';
    return;
  }

  staff.forEach(function (st) {
    const tr = document.createElement('tr');
    let html = '';
    html += '<td><strong>' + st.staff_id + '</strong></td>';
    html += '<td>' + st.full_name + '</td>';
    html += '<td>' + st.role + '</td>';
    html += '<td>' + st.email + '</td>';
    html += '<td>' + (st.phone || '-') + '</td>';
    html += '<td><span class="badge badge-green">' + (st.status || 'ACTIVE') + '</span></td>';
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

function renderDoctors(doctors) {
  const tbody = document.querySelector('#admin-doctors-table tbody');
  tbody.innerHTML = '';
  if (doctors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No doctors recorded in Doctors sheet tab.</td></tr>';
    return;
  }

  doctors.forEach(function (d) {
    const tr = document.createElement('tr');
    let html = '';
    html += '<td><strong>' + d.doctor_id + '</strong></td>';
    html += '<td>' + d.full_name + '</td>';
    html += '<td>' + (d.specialty || 'General') + '</td>';
    html += '<td>' + d.email + '</td>';
    html += '<td>' + (d.phone || '-') + '</td>';
    html += '<td><span class="badge badge-green">' + (d.status || 'ACTIVE') + '</span></td>';
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

function renderSubscriptions(subs) {
  const tbody = document.querySelector('#admin-subs-table tbody');
  tbody.innerHTML = '';
  if (subs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No active subscriptions found.</td></tr>';
    return;
  }

  subs.forEach(function (s) {
    const tr = document.createElement('tr');
    let html = '';
    html += '<td><strong>' + s.subscription_id + '</strong></td>';
    html += '<td>' + getSeniorName(s.senior_id) + '</td>';
    html += '<td>' + s.plan_name + '</td>';
    html += '<td>' + s.nurse_visits_per_month + '</td>';
    html += '<td>' + s.doctor_consults_per_month + '</td>';
    html += '<td><span class="badge badge-green">' + (s.status || 'ACTIVE') + '</span></td>';
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

function renderEntitlements(ents) {
  const tbody = document.querySelector('#admin-entitlements-table tbody');
  tbody.innerHTML = '';
  if (ents.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No entitlement records recorded.</td></tr>';
    return;
  }

  ents.forEach(function (e) {
    const tr = document.createElement('tr');
    let html = '';
    html += '<td><strong>' + getSeniorName(e.senior_id) + '</strong></td>';
    html += '<td>' + e.month + '</td>';
    html += '<td>' + e.nurse_used + ' / ' + e.nurse_allowed + '</td>';
    html += '<td>' + e.doctor_used + ' / ' + e.doctor_allowed + '</td>';
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

function renderAppointments(apts) {
  const tbody = document.querySelector('#admin-apts-table tbody');
  tbody.innerHTML = '';
  if (apts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No appointments requested.</td></tr>';
    return;
  }

  const reversed = apts.slice().reverse();

  reversed.forEach(function (a) {
    const tr = document.createElement('tr');

    let displayTime = a.scheduled_at || '-';
    try {
      if (a.scheduled_at) {
        displayTime = new Date(a.scheduled_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
      }
    } catch (e) {}

    let html = '';
    html += '<td><strong>' + a.appointment_id + '</strong></td>';
    html += '<td>' + getSeniorName(a.senior_id) + '</td>';
    html += '<td>' + a.type + '</td>';
    html += '<td>' + displayTime + '</td>';
    html += '<td><span class="badge badge-yellow">' + a.status + '</span></td>';
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

function renderReviews(revs) {
  const tbody = document.querySelector('#admin-reviews-table tbody');
  tbody.innerHTML = '';
  if (revs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No doctor reviews pending.</td></tr>';
    return;
  }

  revs.forEach(function (r) {
    const tr = document.createElement('tr');
    let color = 'badge-blue';
    if (r.priority === 'EMERGENCY') color = 'badge-red';
    else if (r.priority === 'URGENT') color = 'badge-yellow';

    let html = '';
    html += '<td><strong>' + r.review_id + '</strong></td>';
    html += '<td>' + getSeniorName(r.senior_id) + '</td>';
    html += '<td><span class="badge ' + color + '">' + r.priority + '</span></td>';
    html += '<td>' + r.reason + '</td>';
    html += '<td>' + (r.assigned_doctor_id || 'Open') + '</td>';
    html += '<td><span class="badge badge-yellow">' + r.status + '</span></td>';
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

function renderAudit(logs) {
  const tbody = document.querySelector('#admin-audit-table tbody');
  tbody.innerHTML = '';
  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No audit records found.</td></tr>';
    return;
  }

  const reversed = logs.slice().reverse();

  reversed.forEach(function (l) {
    const tr = document.createElement('tr');
    let timeStr = l.timestamp || '-';
    try { timeStr = new Date(l.timestamp).toLocaleTimeString(); } catch (e) {}

    let html = '';
    html += '<td><small>' + timeStr + '</small></td>';
    html += '<td>' + l.actor_id + '</td>';
    html += '<td><span class="badge badge-blue">' + l.actor_role + '</span></td>';
    html += '<td><strong>' + l.event + '</strong></td>';
    html += '<td>' + (l.work_order_id || '-') + '</td>';
    html += '<td><small>' + (l.reason || '') + '</small></td>';
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

function safeBind(id, eventName, handler) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener(eventName, handler);
  } else {
    console.warn('Element not found, skipping binding: #' + id);
  }
}

safeBind('create-senior-form', 'submit', async function (e) {
  e.preventDefault();
  try {
    const res = await callApi('adminCreateSenior', {
      fullName: document.getElementById('snr-name').value.trim(),
      dob: document.getElementById('snr-dob').value,
      phone: document.getElementById('snr-phone').value.trim(),
      email: document.getElementById('snr-email').value.trim(),
      address: document.getElementById('snr-address').value.trim()
    });

    alert('Senior created successfully! ID: ' + res.seniorId);
    const woSeniorInput = document.getElementById('wo-senior-id');
    if (woSeniorInput) woSeniorInput.value = res.seniorId;
    document.getElementById('create-senior-form').reset();
    await loadAdminDashboard();
  } catch (err) {
    alert('Failed to create senior: ' + err.message);
  }
});

safeBind('create-wo-form', 'submit', async function (e) {
  e.preventDefault();
  const resultDiv = document.getElementById('wo-result');
  resultDiv.className = 'message hidden';

  try {
    const scheduledVal = document.getElementById('wo-scheduled-at').value;
    const scheduledIso = scheduledVal ? new Date(scheduledVal).toISOString() : new Date().toISOString();

    const res = await callApi('createWorkOrder', {
      seniorId: document.getElementById('wo-senior-id').value.trim(),
      type: document.getElementById('wo-type').value,
      scheduledAt: scheduledIso,
      staffId: document.getElementById('wo-staff-id').value.trim()
    });

    let displayFormatted = scheduledIso;
    try {
      displayFormatted = new Date(res.scheduledAt).toLocaleString();
    } catch (e) {}

    let resultHtml = '';
    resultHtml += '<strong>Work Order Created & Emailed!</strong><br>';
    resultHtml += 'ID: <code>' + res.workOrderId + '</code><br>';
    resultHtml += 'Scheduled Time: <strong>' + displayFormatted + '</strong><br>';
    resultHtml += 'Start Code: <code style="font-size:16px;">' + res.startCode + '</code> | ';
    resultHtml += 'End Code: <code style="font-size:16px;">' + res.endCode + '</code><br>';
    resultHtml += '<small>Confirmation email with scheduled date/time and codes
