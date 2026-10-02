import React, { useState } from 'react';
import { DataService } from '../services/dataService';

export default function NurseWorkflow({ seniorId = "SEN-001", loggedBy = "nurse@nityaseva.org" }) {
  const [formData, setFormData] = useState({
Vitals_BP: '',
    Heart_Rate: '',       // Updated from Pulse
    SpO2: '',
    Resp_Rate: '',
    Temp: '',
    Fasting_Glucose: '',
    Glucose_PP: '',       // Updated from Random_Glucose
    Weight: '',
    Height: '',
    BMI: '',
    Waist_Circ: '',
    Pain_Score: '0',
    Consciousness: 'Alert',
    Fall_Risk: 'Low',
    Mobility: 'Independent',
    Resp_Symptoms: 'None',
    Edema: 'None',
    Hydration: 'Normal',
    Med_Adherence: 'Good',
    Cognitive_Obs: '',
    Notes: ''            // Added explicit Notes field''
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate BMI if Weight (kg) and Height (cm) are provided
      if ((name === 'Weight' || name === 'Height') && updated.Weight && updated.Height) {
        const heightM = parseFloat(updated.Height) / 100;
        if (heightM > 0) {
          updated.BMI = (parseFloat(updated.Weight) / (heightM * heightM)).toFixed(1);
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving assessment...');
    try {
      const payload = {
        Senior_ID: seniorId,
        Logged_By: loggedBy,
        ...formData
      };
      await DataService.saveAssessment(payload);
      setStatus('Success: 20-Point Assessment logged successfully!');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow border space-y-6">
      <h2 className="text-2xl font-bold text-teal-800 border-b pb-2">20-Point Nurse Assessment</h2>
      {status && <div className="p-3 bg-teal-50 text-teal-800 rounded font-medium">{status}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Vital Signs */}
        <fieldset className="border p-4 rounded space-y-4">
          <legend className="font-semibold text-teal-700 px-2">1. Primary Vitals</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">1. BP (mmHg)</label>
              <input type="text" name="Vitals_BP" placeholder="120/80" value={formData.Vitals_BP} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">2. Heart Rate (bpm)</label>
              <input type="number" name="Pulse" placeholder="72" value={formData.Pulse} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">3. SpO2 (%)</label>
              <input type="number" name="SpO2" placeholder="98" value={formData.SpO2} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">4. Respiratory Rate (/min)</label>
              <input type="number" name="Resp_Rate" placeholder="16" value={formData.Resp_Rate} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">5. Temperature (°F)</label>
              <input type="number" step="0.1" name="Temp" placeholder="98.6" value={formData.Temp} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
          </div>
        </fieldset>

        {/* Section 2: Blood Glucose */}
        <fieldset className="border p-4 rounded space-y-4">
          <legend className="font-semibold text-teal-700 px-2">2. Blood Glucose</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">6. Fasting Glucose (mg/dL)</label>
              <input type="number" name="Fasting_Glucose" placeholder="95" value={formData.Fasting_Glucose} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">7. Random / Post-meal Glucose (mg/dL)</label>
              <input type="number" name="Random_Glucose" placeholder="140" value={formData.Random_Glucose} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
          </div>
        </fieldset>

        {/* Section 3: Anthropometrics */}
        <fieldset className="border p-4 rounded space-y-4">
          <legend className="font-semibold text-teal-700 px-2">3. Body Measurements</legend>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium">8. Weight (kg)</label>
              <input type="number" step="0.1" name="Weight" placeholder="65" value={formData.Weight} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">9. Height (cm)</label>
              <input type="number" step="0.1" name="Height" placeholder="165" value={formData.Height} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">10. BMI (Auto)</label>
              <input type="text" name="BMI" value={formData.BMI} readOnly className="w-full border p-2 rounded bg-slate-100 font-bold" />
            </div>
            <div>
              <label className="block text-sm font-medium">11. Waist Circumference (cm)</label>
              <input type="number" step="0.1" name="Waist_Circ" placeholder="85" value={formData.Waist_Circ} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
          </div>
        </fieldset>

        {/* Section 4: Clinical Observations */}
        <fieldset className="border p-4 rounded space-y-4">
          <legend className="font-semibold text-teal-700 px-2">4. Physical & Clinical Observation</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">12. Pain Score (0–10)</label>
              <select name="Pain_Score" value={formData.Pain_Score} onChange={handleChange} className="w-full border p-2 rounded">
                {[...Array(11).keys()].map(num => <option key={num} value={num}>{num}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">13. Level of Consciousness</label>
              <select name="Consciousness" value={formData.Consciousness} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="Alert">Alert</option>
                <option value="Drowsy">Drowsy</option>
                <option value="Confused">Confused</option>
                <option value="Unresponsive">Unresponsive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">14. Fall Risk</label>
              <select name="Fall_Risk" value={formData.Fall_Risk} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">15. Mobility Status</label>
              <select name="Mobility" value={formData.Mobility} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="Independent">Independent</option>
                <option value="Assistance Needed">Assistance Needed</option>
                <option value="Wheelchair Bound">Wheelchair Bound</option>
                <option value="Bedridden">Bedridden</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">16. Respiratory Symptoms</label>
              <input type="text" name="Resp_Symptoms" placeholder="None / Cough / Wheezing" value={formData.Resp_Symptoms} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">17. Edema</label>
              <select name="Edema" value={formData.Edema} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="None">None</option>
                <option value="Pedal (1+)">Pedal (1+)</option>
                <option value="Moderate (2+)">Moderate (2+)</option>
                <option value="Severe (3+)">Severe (3+)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">18. Hydration Status</label>
              <select name="Hydration" value={formData.Hydration} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="Normal">Normal</option>
                <option value="Mild Dehydration">Mild Dehydration</option>
                <option value="Severe Dehydration">Severe Dehydration</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">19. Medication Adherence</label>
              <select name="Med_Adherence" value={formData.Med_Adherence} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="Good">Good (100%)</option>
                <option value="Partial">Partial</option>
                <option value="Poor">Poor / Missed Doses</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">20. Mental / Cognitive Observation</label>
            <textarea name="Cognitive_Obs" rows="3" placeholder="Notes on orientation to time, place, person, memory, or behavior..." value={formData.Cognitive_Obs} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
        </fieldset>

        <button type="submit" className="w-full py-3 bg-teal-700 text-white font-bold rounded shadow hover:bg-teal-800">
          Save 20-Point Assessment
        </button>
      </form>
    </div>
  );
}