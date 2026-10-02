import { requireAuth, signOut } from './auth.js';
import { callApi } from './dataService.js';

let currentProfile = null;
let activeWorkOrderId = null;
let activeSeniorId = null;

async function init() {
  currentProfile = await requireAuth('nurse');
  if (!currentProfile) return;

  document.getElementById('user-display').textContent = currentProfile.full_name || 'Nurse';
  document.getElementById('btn-logout').addEventListener('click', signOut);

  await loadNurseWorkOrders();
}

async function loadNurseWorkOrders() {
  try {
    const data = await callApi('getNurseDashboard', { staffId: currentProfile.staff_id || currentProfile.id });
    const tbody = document.querySelector('#nurse-wo-table tbody');
    tbody.innerHTML = '';

    if (data.workOrders && data.workOrders.length > 0) {
      data.workOrders.forEach(wo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${wo.work_order_id}</strong></td>
          <td>${wo.senior_id}</td>
          <td>${wo.type}</td>
          <td><span class="badge ${wo.status === 'IN_PROGRESS' ? 'badge-yellow' : 'badge-blue'}">${wo.status}</span></td>
          <td><button class="select-wo" data-id="${wo.work_order_id}" data-senior="${wo.senior_id}" data-status="${wo.status}">Open</button></td>
        `;
        tbody.appendChild(tr);
      });

      document.querySelectorAll('.select-wo').forEach(btn => {
        btn.addEventListener('click', (e) => {
          activeWorkOrderId = e.target.getAttribute('data-id');
          activeSeniorId = e.target.getAttribute('data-senior');
          const status = e.target.getAttribute('data-status');
          openWorkspace(status);
        });
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="5">No active work orders assigned.</td></tr>';
    }
  } catch (err) {
    alert('Error loading work orders: ' + err.message);
  }
}

function openWorkspace(status) {
  document.getElementById('visit-workspace').classList.remove('hidden');
  document.getElementById('active-wo-id').textContent = activeWorkOrderId;

  const startStep = document.getElementById('start-code-step');
  const asmStep = document.getElementById('assessment-step');
  const endStep = document.getElementById('end-code-step');

  if (status === 'IN_PROGRESS') {
    startStep.classList.add('hidden');
    asmStep.classList.remove('hidden');
    endStep.classList.remove('hidden');
  } else {
    startStep.classList.remove('hidden');
    asmStep.classList.add('hidden');
    endStep.classList.add('hidden');
  }
}

document.getElementById('btn-verify-start').addEventListener('click', async () => {
  const code = document.getElementById('start-code-input').value.trim();
  if (!code) return alert('Enter Start Code');

  try {
    const res = await callApi('verifyStartCode', { workOrderId: activeWorkOrderId, code: code });
    if (res.success) {
      alert('Start code verified! Visit marked IN_PROGRESS.');
      openWorkspace('IN_PROGRESS');
      loadNurseWorkOrders();
    } else {
      alert(res.error || 'Invalid code');
    }
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('assessment-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const payload = {
      senior_id: activeSeniorId,
      visit_id: activeWorkOrderId,
      bp: document.getElementById('asm-bp').value,
      heart_rate: Number(document.getElementById('asm-hr').value),
      spo2: Number(document.getElementById('asm-spo2').value),
      temperature: Number(document.getElementById('asm-temp').value),
      blood_sugar: Number(document.getElementById('asm-sugar').value || 0),
      pain_level: Number(document.getElementById('asm-pain').value || 0),
      nurse_notes: document.getElementById('asm-notes').value
    };

    const res = await callApi('saveAssessment', payload);
    alert('Assessment saved successfully!' + (res.flagged ? ' Note: Values flagged for doctor review.' : ''));
    document.getElementById('end-code-step').classList.remove('hidden');
  } catch (err) {
    alert('Failed to save assessment: ' + err.message);
  }
});

document.getElementById('btn-verify-end').addEventListener('click', async () => {
  const code = document.getElementById('end-code-input').value.trim();
  if (!code) return alert('Enter End Code');

  try {
    const res = await callApi('verifyEndCode', { workOrderId: activeWorkOrderId, code: code });
    if (res.success) {
      alert('End code verified! Visit COMPLETED.');
      document.getElementById('visit-workspace').classList.add('hidden');
      loadNurseWorkOrders();
    } else {
      alert(res.error || 'Invalid code');
    }
  } catch (err) {
    alert(err.message);
  }
});

init();
