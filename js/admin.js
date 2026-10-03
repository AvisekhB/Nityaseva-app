import { requireAuth, signOut } from './auth.js';
import { callApi } from './dataService.js';

let currentProfile = null;
let allSeniorsCache = [];

async function init() {
  currentProfile = await requireAuth('admin');
  if (!currentProfile) return;

  document.getElementById('user-display').textContent = currentProfile.full_name || currentProfile.email || 'Admin';
  document.getElementById('btn-logout').addEventListener('click', signOut);

  // Setup tab switching
  setupTabs();

  // Set default scheduled time to current time + 1 hour in local time
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
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

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

    // 1. Render Work Orders
    renderWorkOrders(data.workOrders || []);

    // 2. Render Seniors & Families
    renderSeniors(data.seniors || []);
    renderFamilies(data.families || [], data.familyLinks || []);

    // 3. Render Staff & Doctors
    renderStaff(data.staff || []);
    renderDoctors(data.doctors || []);

    // 4. Render Subscriptions & Entitlements
    renderSubscriptions(data.subscriptions || []);
    renderEntitlements(data.entitlements || []);

    // 5. Render Appointments
    renderAppointments(data.appointments || []);

    // 6. Render Doctor Reviews
    renderReviews(data.reviews || []);

    // 7. Render Audit Logs
    renderAudit(data.logs || []);

  } catch (err) {
    console.error('Error loading admin dashboard:', err);
  }
}

function populateSeniorDropdowns(seniors) {
  const subDropdown = document.getElementById('sub-senior-id');
  const aptDropdown = document.getElementById('apt-senior-id');

  const buildOptions = () => {
    let html = '<option value="">-- Choose Senior --</option>';
    seniors.forEach(s => {
      html += `<option value="${s.senior_id}">${s.full_name} (${s.senior_id})</option>`;
    });
    return html;
  };

  if (subDropdown) {
    const currentVal = subDropdown.value;
    subDropdown.innerHTML = buildOptions();
    if (currentVal) subDropdown.value = currentVal;
  }

  if (aptDropdown) {
    const currentVal = aptDropdown.value;
    aptDropdown.innerHTML = buildOptions();
    if (currentVal) aptDropdown.value = currentVal;
  }
}

function getSeniorName(id) {
  const s = allSeniorsCache.find(x => x.senior_id === id);
  return s ? s.full_name : id;
}

function renderWorkOrders(orders) {
  const tbody = document.querySelector('#admin-wo-table tbody');
  tbody.innerHTML = '';

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No work orders recorded yet.</td></tr>';
    return;
  }

  [...orders].reverse().forEach(wo => {
    const tr = document.createElement('tr');
    const badgeColor = wo.status === 'COMPLETED' ? 'badge-green' : 
                      (wo.status === 'IN_PROGRESS' ? 'badge-yellow' : 
                      (wo.status === 'CANCELLED' ? 'badge-red' : 'badge-blue'));

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

    tr.innerHTML = `
      <td><strong>${wo.work_order_id}</strong></td>
      <td>${getSeniorName(wo.senior_id)}</td>
      <td>${wo.type}</td>
      <td>${displayTime}</td>
      <td><span class="badge ${badgeColor}">${wo.status}</span></td>
      <td>
        ${wo.status !== 'CANCELLED' && wo.status !== 'COMPLETED'
          ? `<button class="override-btn danger" data-id="${wo.work_order_id}">Cancel</button>`
          : `<span style="color:#a0aec0;font-size:12px;">Locked</span>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.override-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
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
  if (seniors.length === 0) return tbody.innerHTML = '<tr><td colspan="6">No seniors registered yet.</td></tr>';

  seniors.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${s.senior_id}</strong></td>
      <td>${s.full_name}</td>
      <td>${s.phone || '-'}</td>
      <td>${s.email || '-'}</td>
      <td>${s.address || '-'}</td>
      <td><span class="badge badge-green">${s.status || 'ACTIVE'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderFamilies(families, links) {
  const tbody = document.querySelector('#admin-families-table tbody');
  tbody.innerHTML = '';
  if (families.length === 0) return tbody.innerHTML = '<tr><td colspan="6">No families recorded in Sheets.</td></tr>';

  families.forEach(f => {
    const link = links.find(l => l.family_id === f.family_id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${f.family_id}</strong></td>
      <td>${f.full_name}</td>
      <td>${f.relationship || '-'}</td>
      <td>${link ? `<code>${link.senior_id}</code>` : '<em>Unlinked</em>'}</td>
      <td>${f.email || '-'}</td>
      <td>${f.phone || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderStaff(staff) {
  const tbody = document.querySelector('#admin-staff-table tbody');
  tbody.innerHTML = '';
  if (staff.length === 0) return tbody.innerHTML = '<tr><td colspan="6">No staff recorded in Staff sheet tab.</td></tr>';

  staff.forEach(st => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${st.staff_id}</strong></td>
      <td>${st.full_name}</td>
      <td>${st.role}</td>
      <td>${st.email}</td>
      <td>${st.phone || '-'}</td>
      <td><span class="badge badge-green">${st.status || 'ACTIVE'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderDoctors(doctors) {
  const tbody = document.querySelector('#admin-doctors-table tbody');
  tbody.innerHTML = '';
  if (doctors.length === 0) return tbody.innerHTML = '<tr><td colspan="6">No doctors recorded in Doctors sheet tab.</td></tr>';

  doctors.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${d.doctor_id}</strong></td>
      <td>${d.full_name}</td>
      <td>${d.specialty || 'General'}</td>
      <td>${d.email}</td>
      <td>${d.phone || '-'}</td>
      <td><span class="badge badge-green">${d.status || 'ACTIVE'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSubscriptions(subs) {
  const tbody = document.querySelector('#admin-subs-table tbody');
  tbody.innerHTML = '';
  if (subs.length === 0) return tbody.innerHTML = '<tr><td colspan="6">No active subscriptions found.</td></tr>';

  subs.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${s.subscription_id}</strong></td>
      <td>${getSeniorName(s.senior_id)}</td>
      <td>${s.plan_name}</td>
      <td>${s.nurse_visits_per_month}</td>
      <td>${s.doctor_consults_per_month}</td>
      <td><span class="badge badge-green">${s.status || 'ACTIVE'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderEntitlements(ents) {
  const tbody = document.querySelector('#admin-entitlements-table tbody');
  tbody.innerHTML = '';
  if (ents.length === 0) return tbody.innerHTML = '<tr><td colspan="4">No entitlement records recorded.</td></tr>';

  ents.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${getSeniorName(e.senior_id)}</strong></td>
      <td>${e.month}</td>
      <td>${e.nurse_used} / ${e.nurse_allowed}</td>
      <td>${e.doctor_used} / ${e.doctor_allowed}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAppointments(apts) {
  const tbody = document.querySelector('#admin-apts-table tbody');
  tbody.innerHTML = '';
  if (apts.length === 0) return tbody.innerHTML = '<tr><td colspan="5">No appointments requested.</td></tr>';

  [...apts].reverse().forEach(a => {
    const tr = document.createElement('tr');
    let displayTime = a.scheduled_at || '-';
    try {
      if (a.scheduled_at) {
        displayTime = new Date(a.scheduled_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
      }
    } catch (e) {}

    tr.innerHTML = `
      <td><strong>${a.appointment_id}</strong></td>
      <td>${getSeniorName(a.senior_id)}</td>
      <td>${a.type}</td>
      <td>${displayTime}</td>
      <td><span class="badge badge-yellow">${a.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderReviews(revs) {
  const tbody = document.querySelector('#admin-reviews-table tbody');
  tbody.innerHTML = '';
  if (revs.length === 0) return tbody.innerHTML = '<tr><td colspan="6">No doctor reviews pending.</td></tr>';

  revs.forEach(r => {
    const tr = document.createElement('tr');
    const color = r.priority === 'EMERGENCY' ? 'badge-red' : (r.priority === 'URGENT' ? 'badge-yellow' : 'badge-blue');
    tr.innerHTML = `
      <td><strong>${r.review_id}</strong></td>
      <td>${getSeniorName(r.senior_id)}</td>
      <td><span class="badge ${color}">${r.priority}</span></td>
      <td>${r.reason}</td>
      <td>${r.assigned_doctor_id || 'Open'}</td>
      <td><span class="badge badge-yellow">${r.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAudit(logs) {
  const tbody = document.querySelector('#admin-audit-table tbody');
  tbody.innerHTML = '';
  if (logs.length === 0) return tbody.innerHTML = '<tr><td colspan="6">No audit records found.</td></tr>';

  [...logs].reverse().forEach(l => {
    const tr = document.createElement('tr');
    let timeStr = l.timestamp || '-';
    try { timeStr = new Date(l.timestamp).toLocaleTimeString(); } catch (e) {}
    tr.innerHTML = `
      <td><small>${timeStr}</small></td>
      <td>${l.actor_id}</td>
      <td><span class="badge badge-blue">${l.actor_role}</span></td>
      <td><strong>${l.event}</strong></td>
      <td>${l.work_order_id || '-'}</td>
      <td><small>${l.reason || ''}</small></td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('create-senior-form').addEventListener('submit', async (e) => {
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
    document.getElementById('wo-senior-id').value = res.seniorId;
    document.getElementById('create-senior-form').reset();
    await loadAdminDashboard();
  } catch (err) {
    alert('Failed to create senior: ' + err.message);
  }
});

document.getElementById('create-wo-form').addEventListener('submit', async (e) => {
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

    resultDiv.innerHTML = `
      <strong>Work Order Created & Emailed!</strong><br>
      ID: <code>${res.workOrderId}</code><br>
      Scheduled Time: <strong>${displayFormatted}</strong><br>
      Start Code: <code style="font-size:16px;">${res.startCode}</code> | 
      End Code: <code style="font-size:16px;">${res.endCode}</code><br>
      <small>Confirmation email with scheduled date/time & codes has been sent.</small>
    `;
    resultDiv.className = 'message success';
    resultDiv.classList.remove('hidden');

    await loadAdminDashboard();
  } catch (err) {
    resultDiv.innerHTML = 'Error: ' + err.message;
    resultDiv.className = 'message error';
    resultDiv.classList.remove('hidden');
  }
});

// NEW: Create Subscription Form Handler
document.getElementById('create-sub-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultDiv = document.getElementById('sub-result');
  resultDiv.className = 'message hidden';

  try {
    const res = await callApi('adminCreateSubscription', {
      seniorId: document.getElementById('sub-senior-id').value,
      planName: document.getElementById('sub-plan-name').value.trim(),
      nurseVisits: Number(document.getElementById('sub-nurse-visits').value),
      doctorConsults: Number(document.getElementById('sub-doctor-consults').value)
    });

    resultDiv.innerHTML = `<strong>Subscription created successfully!</strong> ID: ${res.subscriptionId}`;
    resultDiv.className = 'message success';
    resultDiv.classList.remove('hidden');

    document.getElementById('create-sub-form').reset();
    document.getElementById('sub-plan-name').value = 'Standard Care';
    document.getElementById('sub-nurse-visits').value = 2;
    document.getElementById('sub-doctor-consults').value = 1;

    await loadAdminDashboard();
  } catch (err) {
    resultDiv.innerHTML = 'Error: ' + err.message;
    resultDiv.className = 'message error';
    resultDiv.classList.remove('hidden');
  }
});

// NEW: Create Appointment Form Handler
document.getElementById('create-apt-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const scheduledVal = document.getElementById('apt-scheduled-at').value;
    const scheduledIso = scheduledVal ? new Date(scheduledVal).toISOString() : '';

    await callApi('adminCreateAppointment', {
      seniorId: document.getElementById('apt-senior-id').value,
      type: document.getElementById('apt-type').value,
      scheduledAt: scheduledIso
    });

    alert('Appointment created successfully!');
    document.getElementById('create-apt-form').reset();

    const d2 = new Date(Date.now() + 3600000);
    document.getElementById('apt-scheduled-at').value = new Date(d2.getTime() - d2.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    await loadAdminDashboard();
  } catch (err) {
    alert('Failed to create appointment: ' + err.message);
  }
});

init();
