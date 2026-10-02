import { requireAuth, signOut } from './auth.js';
import { callApi } from './dataService.js';

let currentProfile = null;

async function init() {
  currentProfile = await requireAuth('admin');
  if (!currentProfile) return;

  document.getElementById('user-display').textContent = currentProfile.full_name || currentProfile.email || 'Admin';
  document.getElementById('btn-logout').addEventListener('click', signOut);

  // Set default scheduled time to current time + 1 hour
  const dateInput = document.getElementById('wo-scheduled-at');
  if (dateInput) {
    const d = new Date(Date.now() + 3600000);
    dateInput.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  await loadAdminDashboard();
}

async function loadAdminDashboard() {
  const tbody = document.querySelector('#admin-wo-table tbody');
  try {
    tbody.innerHTML = '<tr><td colspan="6">Loading work orders...</td></tr>';
    const data = await callApi('getAdminDashboard');
    tbody.innerHTML = '';

    if (data.workOrders && data.workOrders.length > 0) {
      const orders = [...data.workOrders].reverse();

      orders.forEach(wo => {
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
          <td>${wo.senior_id}</td>
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
    } else {
      tbody.innerHTML = '<tr><td colspan="6">No work orders recorded yet.</td></tr>';
    }
  } catch (err) {
    console.error('Error loading dashboard:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="color:red;">Error: ${err.message}</td></tr>`;
  }
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

init();
