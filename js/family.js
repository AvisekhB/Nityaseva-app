import { requireAuth, signOut } from './auth.js';
import { callApi } from './dataService.js';

let currentProfile = null;

async function init() {
  currentProfile = await requireAuth('family');
  if (!currentProfile) return;

  document.getElementById('user-display').textContent = currentProfile.full_name || currentProfile.email || 'Family Member';
  document.getElementById('btn-logout').addEventListener('click', signOut);

  await loadDashboard();
}

async function loadDashboard() {
  try {
    const data = await callApi('getFamilyDashboard', { familyId: currentProfile.family_id || currentProfile.id });

    // Senior Details
    const seniorInfo = document.getElementById('senior-info');
    if (data.seniors && data.seniors.length > 0) {
      const s = data.seniors[0];
      seniorInfo.innerHTML = `<strong>${s.full_name}</strong> | DOB: ${s.dob || 'N/A'} | Phone: ${s.phone || 'N/A'}<br>Address: ${s.address || 'N/A'}`;
    } else {
      seniorInfo.innerHTML = '<em>No senior profile linked to this family account yet.</em>';
    }

    // Entitlements
    if (data.entitlements && data.entitlements.length > 0) {
      const ent = data.entitlements[0];
      const nurseRem = Math.max(0, Number(ent.nurse_allowed) - Number(ent.nurse_used));
      const docRem = Math.max(0, Number(ent.doctor_allowed) - Number(ent.doctor_used));
      document.getElementById('nurse-count').textContent = nurseRem + ' / ' + ent.nurse_allowed;
      document.getElementById('doctor-count').textContent = docRem + ' / ' + ent.doctor_allowed;
    }

    // Work Orders Table
    const tbody = document.querySelector('#work-orders-table tbody');
    tbody.innerHTML = '';
    if (data.workOrders && data.workOrders.length > 0) {
      data.workOrders.forEach(wo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${wo.work_order_id}</strong></td>
          <td>${wo.type}</td>
          <td><span class="badge ${wo.status === 'COMPLETED' ? 'badge-green' : 'badge-yellow'}">${wo.status}</span></td>
          <td>${wo.created_at ? wo.created_at.slice(0, 16).replace('T', ' ') : '-'}</td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="4">No scheduled visits.</td></tr>';
    }
  } catch (err) {
    alert('Failed to load dashboard: ' + err.message);
  }
}

document.getElementById('appointment-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const type = document.getElementById('apt-type').value;
  const time = document.getElementById('apt-time').value;

  try {
    await callApi('createAppointment', {
      seniorId: currentProfile.senior_id || '',
      type: type,
      scheduledAt: time
    });
    alert('Appointment requested successfully!');
    await loadDashboard();
  } catch (err) {
    alert('Error booking appointment: ' + err.message);
  }
});

init();
