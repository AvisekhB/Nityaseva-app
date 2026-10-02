import React, { useState, useEffect } from 'react';
import { DataService } from './services/dataService';

export default function App() {
  const [role, setRole] = useState('ADMIN');
  const [activeSeniorId, setActiveSeniorId] = useState('SEN-001');
  const [seniorData, setSeniorData] = useState({ Full_Name: 'Mrs. Kamala Sharma' });
  const [entitlements, setEntitlements] = useState({ Nurse_Used: 1, Nurse_Allowed: 2, Doctor_Used: 0, Doctor_Allowed: 1 });
  const [woId, setWoId] = useState('WO-849201');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  // Available Senior Profiles
  const seniorList = [
    { id: 'SEN-001', name: 'Mrs. Kamala Sharma (78 yrs)' },
    { id: 'SEN-002', name: 'Mr. Ramesh Patel (81 yrs)' },
    { id: 'SEN-003', name: 'Mr. Rajesh Kumar (75 yrs)' }
  ];

  useEffect(() => {
    async function loadSeniorDetails() {
      try {
        // Fetch senior profile and entitlement details dynamically
        const senior = await DataService.getSenior(activeSeniorId);
        if (senior) setSeniorData(senior);

        const entitlementData = await DataService.getEntitlements(activeSeniorId, '10-2026');
        if (entitlementData) setEntitlements(entitlementData);
      } catch (err) {
        console.error("Error loading senior data:", err);
      }
    }

    loadSeniorDetails();
  }, [activeSeniorId]);

  const handleVerify = async (type) => {
    try {
      setMessage('');
      const res = type === 'START' 
        ? await DataService.verifyStartCode(woId, code, 'caregiver@nityaseva.org')
        : await DataService.verifyEndCode(woId, code, 'caregiver@nityaseva.org');
      setMessage(`Success: ${type} code verified. Status: ${res.status}`);
      setCode('');
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-teal-700 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">NITYASEVA V5</h1>

        <div className="flex items-center space-x-4">
          {/* Active Senior Switcher */}
          <div className="flex items-center space-x-2">
            <label htmlFor="senior-select" className="text-sm font-semibold text-teal-100">
              Senior:
            </label>
            <select 
              id="senior-select"
              value={activeSeniorId} 
              onChange={e => setActiveSeniorId(e.target.value)} 
              className="bg-teal-800 text-white p-2 rounded border border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              {seniorList.map((senior) => (
                <option key={senior.id} value={senior.id}>
                  {senior.id} - {senior.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role Switcher */}
          <select value={role} onChange={e => setRole(e.target.value)} className="bg-teal-800 text-white p-2 rounded border border-teal-600 focus:outline-none">
            <option value="ADMIN">Admin</option>
            <option value="FAMILY">Family</option>
            <option value="NURSE">Nurse</option>
            <option value="DOCTOR">Doctor</option>
          </select>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {message && <div className="p-4 bg-teal-100 text-teal-800 rounded border border-teal-200">{message}</div>}

        {/* Selected Senior Summary Banner */}
        <div className="p-4 bg-white rounded shadow border flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-teal-600 tracking-wider uppercase">Active Senior Profile</span>
            <h2 className="text-lg font-bold text-slate-800">{activeSeniorId} — {seniorData.Full_Name || 'Senior Profile'}</h2>
          </div>
          <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold">Active Plan</span>
        </div>

        {/* Entitlements Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded shadow border">
            <h3 className="font-bold text-slate-600">Nurse Visits</h3>
            <p className="text-2xl font-bold text-teal-700">{entitlements.Nurse_Used} / {entitlements.Nurse_Allowed}</p>
          </div>
          <div className="p-4 bg-white rounded shadow border">
            <h3 className="font-bold text-slate-600">Doctor Consults</h3>
            <p className="text-2xl font-bold text-teal-700">{entitlements.Doctor_Used} / {entitlements.Doctor_Allowed}</p>
          </div>
        </div>

        {/* Verification Form */}
        <div className="p-6 bg-white rounded shadow border space-y-4">
          <h3 className="font-bold text-lg text-slate-700">Code Verification Portal</h3>
          <div className="flex space-x-2">
            <input type="text" placeholder="WO ID" value={woId} onChange={e => setWoId(e.target.value)} className="p-2 border rounded" />
            <input type="text" placeholder="4-Digit Code" value={code} onChange={e => setCode(e.target.value)} className="p-2 border rounded font-mono" maxLength={4} />
            <button onClick={() => handleVerify('START')} className="px-4 py-2 bg-teal-600 text-white rounded font-medium hover:bg-teal-700">Verify Start</button>
            <button onClick={() => handleVerify('END')} className="px-4 py-2 bg-slate-800 text-white rounded font-medium hover:bg-slate-900">Verify End</button>
          </div>
        </div>
      </main>
    </div>
  );
}
