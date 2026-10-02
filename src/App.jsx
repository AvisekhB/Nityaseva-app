import React, { useState, useEffect } from 'react';
import { DataService } from './services/dataService';

export default function App() {
  const [role, setRole] = useState('ADMIN');
  const [seniorList, setSeniorList] = useState([]);
  const [activeSeniorId, setActiveSeniorId] = useState('SEN-001');
  const [seniorData, setSeniorData] = useState({ Full_Name: 'Mrs. Kamala Sharma', Age: 78 });
  const [entitlements, setEntitlements] = useState({ Nurse_Used: 1, Nurse_Allowed: 2, Doctor_Used: 0, Doctor_Allowed: 1 });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // 1. Fetch senior list on initial app load
  useEffect(() => {
    async function loadSeniorList() {
      try {
        const list = await DataService.getSeniors();
        if (Array.isArray(list) && list.length > 0) {
          setSeniorList(list);
          // Set initial senior to first record if present
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* HEADER SECTION */}
      <header className="bg-teal-800 text-white px-6 py-4 flex justify-between items-center shadow-md">
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
          {/* Dynamic Senior Selector Dropdown */}
          <div className="flex items-center space-x-2 bg-teal-900/60 px-3 py-1.5 rounded-lg border border-teal-600">
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

          {/* Role Selector Dropdown */}
          <div className="text-right">
            <p className="text-xs font-medium text-teal-200">Demo User</p>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-teal-900/80 text-white text-xs px-2 py-1 rounded border border-teal-600 focus:outline-none"
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
        {['dashboard', 'work-orders', 'assessment', 'doctor-reviews'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 capitalize border-b-2 ${
              activeTab === tab
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent hover:text-teal-600'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {loading && <div className="text-center py-2 text-teal-700 font-semibold">Updating Senior Profile...</div>}

        {/* DASHBOARD WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500">Nurse Home Visits</h3>
            <p className="text-3xl font-bold text-teal-700 mt-2">
              {entitlements.Nurse_Used} <span className="text-sm font-normal text-slate-400">/ {entitlements.Nurse_Allowed} Used</span>
            </p>
            <p className="text-xs text-slate-400 mt-4">October 2026 Monthly Subscription Balance</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500">Doctor Consultations</h3>
            <p className="text-3xl font-bold text-teal-700 mt-2">
              {entitlements.Doctor_Used} <span className="text-sm font-normal text-slate-400">/ {entitlements.Doctor_Allowed} Used</span>
            </p>
            <p className="text-xs text-slate-400 mt-4">1 Consultation included per month</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Active Senior Profile</span>
              <h2 className="text-xl font-bold text-slate-800 mt-1">{activeSeniorId}</h2>
              <p className="text-sm text-slate-600 font-medium">{seniorData.Full_Name}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold">
                Active Plan
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
