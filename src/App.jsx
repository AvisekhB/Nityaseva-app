import React, { useState, useEffect } from 'react';
import { DataService } from './services/dataService';
import NurseWorkflow from './components/NurseWorkflow';

export default function App() {
  const [role, setRole] = useState('ADMIN');
  const [seniorList, setSeniorList] = useState([]);
  const [activeSeniorId, setActiveSeniorId] = useState('SEN-001');
  const [seniorData, setSeniorData] = useState({ Full_Name: 'Mrs. Kamala Sharma', Age: 78 });
  const [entitlements, setEntitlements] = useState({ Nurse_Used: 1, Nurse_Allowed: 2, Doctor_Used: 0, Doctor_Allowed: 1 });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Verification & Work Order state
  const [woId, setWoId] = useState('WO-849201');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  // Sample static work orders table data
  const [workOrders, setWorkOrders] = useState([
    { id: 'WO-849201', seniorId: 'SEN-001', type: 'Nurse Visit #1', assignedTo: 'Nurse Anjali', status: 'IN_PROGRESS', startCode: '4821', endCode: '9104' },
    { id: 'WO-849202', seniorId: 'SEN-001', type: 'Doctor Consult #1', assignedTo: 'Dr. R. Mehta', status: 'SCHEDULED', startCode: '3190', endCode: '7742' },
    { id: 'WO-849203', seniorId: 'SEN-002', type: 'Nurse Visit #1', assignedTo: 'Nurse Suresh', status: 'COMPLETED', startCode: '1122', endCode: '3344' },
    { id: 'WO-849204', seniorId: 'SEN-003', type: 'Doctor Consult #1', assignedTo: 'Dr. S. Roy', status: 'SCHEDULED', startCode: '5566', endCode: '7788' }
  ]);

  // 1. Fetch senior list on initial app load
  useEffect(() => {
    async function loadSeniorList() {
      try {
        const list = await DataService.getSeniors();
        if (Array.isArray(list) && list.length > 0) {
          setSeniorList(list);
          const firstId = list[0].Senior_ID || list[0].id;
          if (firstId) setActiveSeniorId(firstId);
        }
      } catch (err) {
        console.error("Error loading senior list:", err);
      }
    }
    loadSeniorList();
  }, []);

  // 2. Fetch senior details & entitlements whenever activeSeniorId changes
  useEffect(() => {
    if (!activeSeniorId) return;

    async function loadSeniorDetails() {
      setLoading(true);
      try {
        const senior = await DataService.getSenior(activeSeniorId);
        if (senior) setSeniorData(senior);

        const entitlementData = await DataService.getEntitlements(activeSeniorId, '10-2026');
        if (entitlementData) setEntitlements(entitlementData);
      } catch (err) {
        console.error("Error loading senior profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSeniorDetails();
  }, [activeSeniorId]);

  // Handle Work Order Code Verification
  const handleVerify = async (type) => {
    try {
      setMessage('');
      const res = type === 'START'
        ? await DataService.verifyStartCode(woId, code, 'caregiver@nityaseva.org')
        : await DataService.verifyEndCode(woId, code, 'caregiver@nityaseva.org');

      setMessage(`Success: ${type} code verified. Status: ${res?.status || 'Updated'}`);
      setCode('');
    } catch (err) {
      setMessage(`Error: ${err.message || 'Verification failed'}`);
    }
  };

  // Filter work orders relevant to selected senior
  const activeWorkOrders = workOrders.filter(wo => wo.seniorId === activeSeniorId);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      {/* HEADER SECTION */}
      <header className="bg-teal-800 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-center shadow-md gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-teal-600 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">NITYASEVA</h1>
            <p className="text-xs text-teal-200">Integrated Senior Care Platform (V5 Pilot)</p>
          </div>
        </div>

        {/* RIGHT CONTROLS: SENIOR SELECTOR + ROLE SELECTOR */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-teal-900/80 px-3 py-1.5 rounded-lg border border-teal-600">
            <span className="text-xs font-semibold text-teal-200 uppercase tracking-wider">Select Senior:</span>
            <select
              value={activeSeniorId}
              onChange={(e) => setActiveSeniorId(e.target.value)}
              className="bg-teal-800 text-white text-sm font-medium rounded px-2 py-1 focus:outline-none cursor-pointer"
            >
              {seniorList.length > 0 ? (
                seniorList.map((s) => {
                  const sId = s.Senior_ID || s.id;
                  const sName = s.Full_Name || s.name;
                  return (
                    <option key={sId} value={sId}>
                      {sId} - {sName}
                    </option>
                  );
                })
              ) : (
                <>
                  <option value="SEN-001">SEN-001 - Mrs. Kamala Sharma</option>
                  <option value="SEN-002">SEN-002 - Mr. Ramesh Patel</option>
                  <option value="SEN-003">SEN-003 - Mr. Rajesh Kumar</option>
                </>
              )}
            </select>
          </div>

          <div className="text-right">
            <p className="text-xs font-medium text-teal-200">Demo User</p>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-teal-900/80 text-white text-xs px-2 py-1 rounded border border-teal-600 focus:outline-none cursor-pointer"
            >
              <option value="ADMIN">View as Admin</option>
              <option value="FAMILY">View as Family</option>
              <option value="NURSE">View as Nurse</option>
            </select>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="bg-white border-b px-6 flex space-x-6 text-sm font-medium text-slate-600">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'work-orders', label: 'Work Orders' },
          { id: 'assessment', label: '20-Point Assessment' },
          { id: 'doctor-reviews', label: 'Doctor Reviews' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent hover:text-teal-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {loading && <div className="text-center py-2 text-teal-700 font-semibold animate-pulse">Updating Senior Profile...</div>}

        {message && (
          <div className="p-4 bg-teal-50 text-teal-800 rounded-lg border border-teal-200 text-sm flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-teal-600 font-bold hover:text-teal-900">×</button>
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-slate-500">Nurse Home Visits</h3>
                  <span className="p-2 bg-teal-50 text-teal-600 rounded-lg text-xs font-bold">Visits</span>
                </div>
                <p className="text-3xl font-bold text-teal-700 mt-2">
                  {entitlements.Nurse_Used} <span className="text-sm font-normal text-slate-400">/ {entitlements.Nurse_Allowed} Used</span>
                </p>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-teal-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (entitlements.Nurse_Used / (entitlements.Nurse_Allowed || 1)) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 mt-3">Monthly Subscription Balance</p>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-slate-500">Doctor Consultations</h3>
                  <span className="p-2 bg-teal-50 text-teal-600 rounded-lg text-xs font-bold">Consults</span>
                </div>
                <p className="text-3xl font-bold text-teal-700 mt-2">
                  {entitlements.Doctor_Used} <span className="text-sm font-normal text-slate-400">/ {entitlements.Doctor_Allowed} Used</span>
                </p>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-teal-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (entitlements.Doctor_Used / (entitlements.Doctor_Allowed || 1)) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 mt-3">1 Consultation included per month</p>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Active Senior Profile</span>
                  <h2 className="text-2xl font-bold text-slate-800 mt-1">{activeSeniorId}</h2>
                  <p className="text-sm text-slate-600 font-medium">{seniorData.Full_Name || 'Senior Profile'}</p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold">
                    Active Plan
                  </span>
                </div>
              </div>
            </div>

            {/* RECENT WORK ORDERS TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Recent Work Orders ({activeSeniorId})</h3>
                <button onClick={() => setActiveTab('work-orders')} className="text-xs font-semibold text-teal-600 hover:text-teal-800">View All →</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs text-slate-400 uppercase border-b">
                    <tr>
                      <th className="p-4">Work Order #</th>
                      <th className="p-4">Service Type</th>
                      <th className="p-4">Assigned To</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Start Code</th>
                      <th className="p-4">End Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeWorkOrders.length > 0 ? (
                      activeWorkOrders.map((wo) => (
                        <tr key={wo.id} className="hover:bg-slate-50">
                          <td className="p-4 font-semibold text-teal-700">{wo.id}</td>
                          <td className="p-4">{wo.type}</td>
                          <td className="p-4">{wo.assignedTo}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              wo.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              wo.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {wo.status}
                            </span>
                          </td>
                          <td className="p-4 font-mono">{wo.startCode}</td>
                          <td className="p-4 font-mono">{wo.endCode}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">No recent work orders for {activeSeniorId}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* VERIFICATION PORTAL */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-lg text-slate-800">Code Verification Portal</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="WO ID"
                  value={woId}
                  onChange={e => setWoId(e.target.value)}
                  className="p-2.5 border rounded-lg text-sm flex-1 focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="4-Digit Code"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  maxLength={4}
                  className="p-2.5 border rounded-lg text-sm font-mono flex-1 focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <button
                  onClick={() => handleVerify('START')}
                  className="px-5 py-2.5 bg-teal-600 text-white font-medium text-sm rounded-lg hover:bg-teal-700 transition"
                >
                  Verify Start
                </button>
                <button
                  onClick={() => handleVerify('END')}
                  className="px-5 py-2.5 bg-slate-800 text-white font-medium text-sm rounded-lg hover:bg-slate-900 transition"
                >
                  Verify End
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WORK ORDERS */}
        {activeTab === 'work-orders' && (
          <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Work Orders Management</h2>
            <p className="text-slate-600 text-sm mb-4">Active Profile: <span className="font-bold">{activeSeniorId}</span></p>
            <div className="space-y-3">
              {activeWorkOrders.map(wo => (
                <div key={wo.id} className="p-4 border rounded-lg flex justify-between items-center bg-slate-50">
                  <div>
                    <h4 className="font-bold text-teal-700">{wo.id} — {wo.type}</h4>
                    <p className="text-xs text-slate-500">Assigned: {wo.assignedTo}</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-teal-100 text-teal-800 rounded-full">{wo.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: 20-POINT ASSESSMENT (Embedded Component) */}
        {activeTab === 'assessment' && (
          <NurseWorkflow seniorId={activeSeniorId} loggedBy="nurse@nityaseva.org" />
        )}

        {/* TAB 4: DOCTOR REVIEWS */}
        {activeTab === 'doctor-reviews' && (
          <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Doctor Reviews & Approvals</h2>
            <p className="text-slate-500 text-sm">Reviewing records for active profile <span className="font-bold">{activeSeniorId}</span>.</p>
          </div>
        )}
      </main>
    </div>
  );
}
