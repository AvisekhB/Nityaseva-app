import { requireAuth, signOut } from './auth.js';
import { callApi } from './dataService.js';

let currentProfile = null;

async function init() {
  currentProfile = await requireAuth('admin');
  if (!currentProfile) return;

  document.getElementById('user-display').textContent = currentProfile.full_name || 'Admin';
  document.getElementById('btn-logout').addEventListener('click', signOut);

  await loadAdminDashboard();
}

async function loadAdminDashboard() {
  try {
    const data = await callApi('getAdminDashboard');
    const tbody = document.querySelector('#admin-wo-table tbody');
    tbody.innerHTML = '';

    if (data.workOrders && data.workOrders.length > 0) {
      data.workOrders.forEach(wo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${wo.work_order_id}</strong></td>
          <td>${wo.senior_id}</td>
          <td>${wo.type}</td>
          <td><span class="badge ${wo.status === 'COMPLETED' ? 'badge-green' : 'badge-yellow'}">${wo.status}</span></td>
          <td><button class="override-btn danger" data-id="${wo.work_order_id}">Cancel</button></td>
        `;
        tbody.appendChild(tr);
      });

      document.querySelectorAll('.override-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const woId = e.target.getAttribute('data-id');
          const reason = prompt('Enter override reason:');
          if (!reason) return;
          await callApi('adminOverrideWorkOrder', {
            workOrderId: woId,
            newStatus: 'CANCELLED',
            reason: reason
          });
          alert('Work Order updated.');
          loadAdminDashboard();
        });
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="5">No work orders recorded.</td></tr>';
    }
  } catch (err) {
    console.error(err);
  }
}

document.getElementById('create-senior-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await callApi('adminCreateSenior', {
      fullName: document.getElementById('snr-name').value,
      dob: document.getElementById('snr-dob').value,
      phone: document.getElementById('snr-phone').value,
      email: document.getElementById('snr-email').value,
      address: document.getElementById('snr-address').value
    });
    alert('Senior created successfully! ID: ' + res.seniorId);
    document.getElementById('create-senior-form').reset();
  } catch (err) {
    alert('Failed to create senior: ' + err.message);
  }
});

document.getElementById('create-wo-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultDiv = document.getElementById('wo-result');
  try {
    const res = await callApi('createWorkOrder', {
      seniorId: document.getElementById('wo-senior-id').value,
      type: document.getElementById('wo-type').value,
      staffId: document.getElementById('wo-staff-id').value
    });

    resultDiv.innerHTML = `
      <strong>Work Order Created!</strong><br>
      ID: ${res.workOrderId}<br>
      Start Code: <code>${res.startCode}</code><br>
      End Code: <code>${res.endCode}</code><br>
      <em>(Codes also emailed to senior/family)</em>
    `;
    resultDiv.className = 'message success';
    resultDiv.classList.remove('hidden');
    loadAdminDashboard();
  } catch (err) {
    resultDiv.innerHTML = err.message;
    resultDiv.className = 'message error';
    resultDiv.classList.remove('hidden');
  }
});

init();
