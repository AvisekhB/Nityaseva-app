import React, { useState, useEffect } from 'react';
import { DataService } from './services/dataService';

export default function App() {
  const [role, setRole] = useState('ADMIN');
  const [entitlements, setEntitlements] = useState({ Nurse_Used: 1, Nurse_Allowed: 2, Doctor_Used: 0, Doctor_Allowed: 1 });
  const [woId, setWoId] = useState('WO-849201');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    DataService.getEntitlements('SEN-001', '10-2026')
      .then(data => data && setEntitlements(data))
      .catch(() => {});
  }, []);

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
        <select value={role} onChange={e => setRole(e.target.value)} className="bg-teal-800 text-white p-2 rounded">
          <option value="ADMIN">Admin</option>
          <option value="FAMILY">Family</option>
          <option value="NURSE">Nurse</option>
          <option value="DOCTOR">Doctor</option>
        </select>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {message && <div className="p-4 bg-teal-100 text-teal-800 rounded">{message}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded shadow border">
            <h3 className="font-bold">Nurse Visits</h3>
            <p className="text-2xl">{entitlements.Nurse_Used} / {entitlements.Nurse_Allowed}</p>
          </div>
          <div className="p-4 bg-white rounded shadow border">
            <h3 className="font-bold">Doctor Consults</h3>
            <p className="text-2xl">{entitlements.Doctor_Used} / {entitlements.Doctor_Allowed}</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded shadow border space-y-4">
          <h3 className="font-bold text-lg">Code Verification Portal</h3>
          <div className="flex space-x-2">
            <input type="text" placeholder="WO ID" value={woId} onChange={e => setWoId(e.target.value)} className="p-2 border rounded" />
            <input type="text" placeholder="4-Digit Code" value={code} onChange={e => setCode(e.target.value)} className="p-2 border rounded font-mono" maxLength={4} />
            <button onClick={() => handleVerify('START')} className="px-4 py-2 bg-teal-600 text-white rounded">Verify Start</button>
            <button onClick={() => handleVerify('END')} className="px-4 py-2 bg-slate-800 text-white rounded">Verify End</button>
          </div>
        </div>
      </main>
    </div>
  );
}