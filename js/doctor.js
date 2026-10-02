import { requireAuth, signOut } from './auth.js';
import { callApi } from './dataService.js';

let currentProfile = null;
let activeReviewId = null;
let activeSeniorId = null;

async function init() {
  currentProfile = await requireAuth('doctor');
  if (!currentProfile) return;

  document.getElementById('user-display').textContent = currentProfile.full_name || 'Dr. Practitioner';
  document.getElementById('btn-logout').addEventListener('click', signOut);

  await loadDoctorQueue();
}

async function loadDoctorQueue() {
  try {
    const data = await callApi('getDoctorDashboard', { doctorId: currentProfile.doctor_id || currentProfile.id });
    const tbody = document.querySelector('#doctor-queue-table tbody');
    tbody.innerHTML = '';

    if (data.queue && data.queue.length > 0) {
      data.queue.forEach(q => {
        const badgeColor = q.priority === 'EMERGENCY' ? 'badge-red' : (q.priority === 'URGENT' ? 'badge-yellow' : 'badge-blue');
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${q.review_id}</strong></td>
          <td>${q.senior_id}</td>
          <td><span class="badge ${badgeColor}">${q.priority}</span></td>
          <td>${q.reason || 'Routine review'}</td>
          <td><button class="review-btn" data-id="${q.review_id}" data-senior="${q.senior_id}">Consult</button></td>
        `;
        tbody.appendChild(tr);
      });

      document.querySelectorAll('.review-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          activeReviewId = e.target.getAttribute('data-id');
          activeSeniorId = e.target.getAttribute('data-senior');
          document.getElementById('feedback-panel').classList.remove('hidden');
          document.getElementById('current-senior-title').textContent = activeSeniorId + ' (' + activeReviewId + ')';
        });
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="5">No pending doctor escalations in queue.</td></tr>';
    }
  } catch (err) {
    alert('Error loading queue: ' + err.message);
  }
}

document.getElementById('doctor-feedback-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await callApi('saveDoctorFeedback', {
      reviewId: activeReviewId,
      seniorId: activeSeniorId,
      clinicalSummary: document.getElementById('doc-summary').value,
      observations: document.getElementById('doc-obs').value,
      advice: document.getElementById('doc-advice').value,
      investigationRecommendation: document.getElementById('doc-inv').value,
      followUpRequired: !!document.getElementById('doc-followup').value,
      followUpDate: document.getElementById('doc-followup').value
    });

    alert('Clinical feedback submitted and review closed successfully!');
    document.getElementById('feedback-panel').classList.add('hidden');
    loadDoctorQueue();
  } catch (err) {
    alert('Failed to save feedback: ' + err.message);
  }
});

init();
