import React, { useState } from 'react';
import { useMarketing, API_BASE_URL, apiFetch, setApiAccessToken } from '../context/MarketingContext';
import {
  Settings,
  Database,
  RefreshCw,
  Download,
  ShieldCheck,
  AlertTriangle,
  Award,
  Cpu,
  BookOpen,
  CheckCircle2,
  Trash2,
  Layers,
  Wrench,
  Search,
  Key,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { IntegrityDiagnosticReport } from '../types';

export const SettingsView: React.FC = () => {
  const {
    brands,
    content,
    campaigns,
    team,
    activeWorkspace,
    resetToInitialData,
    runIntegrityAudit,
    lastSavedAt,
    isOffline,
    exportToJson,
  } = useMarketing();

  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<IntegrityDiagnosticReport | null>(null);
  const [repairMessage, setRepairMessage] = useState<string | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);

  // API Token State
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<{
    type: 'idle' | 'testing' | 'valid' | 'invalid' | 'saved';
    message?: string;
  }>({ type: 'idle' });

  const handleSaveToken = () => {
    const clean = tokenInput.trim();
    setApiAccessToken(clean);
    setTokenStatus({
      type: 'saved',
      message: clean
        ? 'Token is active in memory for this page session only; it was not saved in browser storage.'
        : 'Token cleared from memory.',
    });
  };

  const handleTestToken = async () => {
    setTokenStatus({ type: 'testing', message: 'Verifying with https://marketing-api.bezaverse.com...' });
    const clean = tokenInput.trim();
    try {
      const headers = new Headers();
      if (clean) {
        headers.set('Authorization', `Bearer ${clean}`);
      }
      // Use the same-origin proxy so Cloud Run and browser clients follow one
      // consistent path and do not depend on cross-origin CORS behavior.
      const testRes = await fetch('/api/workspaces', { headers });

      if (testRes.ok) {
        setApiAccessToken(clean);
        setTokenStatus({
          type: 'valid',
          message: 'Connection successful! Authenticated with backend database (HTTP 200). Token is held in memory only.',
        });
      } else if (testRes.status === 401) {
        setApiAccessToken('');
        setTokenStatus({
          type: 'invalid',
          message: 'Unauthorized (HTTP 401): The provided API token does not match the backend secret.',
        });
      } else {
        setApiAccessToken('');
        setTokenStatus({
          type: 'invalid',
          message: `Backend returned HTTP ${testRes.status}. Check API status.`,
        });
      }
    } catch (err: any) {
      setApiAccessToken('');
      setTokenStatus({
        type: 'invalid',
        message: `Network error reaching backend: ${err?.message || 'Check connection'}`,
      });
    }
  };

  const handleRunAudit = async () => {
    setIsRunningAudit(true);
    setRepairMessage(null);
    try {
      const rep = await runIntegrityAudit();
      setDiagnosticReport(rep);
    } catch (e) {
      console.error('Audit run failed:', e);
    } finally {
      setIsRunningAudit(false);
    }
  };

  const handleRunSafeRepair = async () => {
    setIsRepairing(true);
    try {
      const res = await apiFetch('/api/diagnostics/repair', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setRepairMessage(`Repaired ${data.repaired} reference(s). Database is in pristine integrity.`);
        // Re-run audit
        const rep = await runIntegrityAudit();
        setDiagnosticReport(rep);
      }
    } catch (e) {
      console.error('Repair failed:', e);
    } finally {
      setIsRepairing(false);
    }
  };

  const confirmReset = async () => {
    setShowResetModal(false);
    setIsResetting(true);
    try {
      await resetToInitialData();
      setResetMessage('Database successfully reset to initial seeds.');
      setTimeout(() => setResetMessage(null), 3000);
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          System Settings &amp; Platform Architecture
        </h3>
        <p className="text-xs text-slate-500">
          Multi-workspace tenant configuration, relational integrity diagnostics, and storage persistence
        </p>
      </div>

      {resetMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* SECTION 1: RELATIONAL DATA INTEGRITY DIAGNOSTIC TOOL */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Referential Integrity &amp; Diagnostic Tool
              </h4>
              <p className="text-xs text-slate-500">
                Audits all Platform → Workspace → Brand → Operational records for invalid foreign keys, orphans, or cross-tenant leaks.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunAudit}
            disabled={isRunningAudit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Search size={14} className={isRunningAudit ? 'animate-spin' : ''} />
            <span>{isRunningAudit ? 'Auditing Platform...' : 'Run Integrity Audit'}</span>
          </button>
        </div>

        {repairMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{repairMessage}</span>
          </div>
        )}

        {diagnosticReport ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              diagnosticReport.healthy
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-3">
                {diagnosticReport.healthy ? (
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle size={20} className="text-amber-600 shrink-0" />
                )}
                <div>
                  <h5 className="text-xs font-bold">
                    {diagnosticReport.healthy ? '100% Relational Integrity Verified' : 'Attention: Integrity Anomaly Detected'}
                  </h5>
                  <p className="text-[11px] opacity-90">{diagnosticReport.summary}</p>
                </div>
              </div>

              {!diagnosticReport.healthy && (
                <button
                  type="button"
                  onClick={handleRunSafeRepair}
                  disabled={isRepairing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-2xs cursor-pointer shrink-0"
                >
                  <Wrench size={13} />
                  <span>{isRepairing ? 'Repairing...' : 'Run Safe Auto-Repair'}</span>
                </button>
              )}
            </div>

            {/* Total Records Inspected */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Workspaces</span>
                <span className="text-base font-bold text-slate-800">{diagnosticReport.totalRecordsChecked.workspaces}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Brands</span>
                <span className="text-base font-bold text-slate-800">{diagnosticReport.totalRecordsChecked.brands}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Campaigns</span>
                <span className="text-base font-bold text-slate-800">{diagnosticReport.totalRecordsChecked.campaigns}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Content</span>
                <span className="text-base font-bold text-slate-800">{diagnosticReport.totalRecordsChecked.content}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Team</span>
                <span className="text-base font-bold text-slate-800">{diagnosticReport.totalRecordsChecked.team}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Activities</span>
                <span className="text-base font-bold text-slate-800">{diagnosticReport.totalRecordsChecked.activities}</span>
              </div>
            </div>

            {/* List of issues if any */}
            {diagnosticReport.issues.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h5 className="text-xs font-bold text-slate-700">Detailed Findings:</h5>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {diagnosticReport.issues.map((iss, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg text-xs border flex items-start justify-between gap-2 ${
                        iss.severity === 'error'
                          ? 'bg-red-50/70 border-red-200 text-red-800'
                          : 'bg-amber-50/70 border-amber-200 text-amber-800'
                      }`}
                    >
                      <div>
                        <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                          [{iss.severity}] {iss.entityType} ({iss.entityId})
                        </span>
                        <span>{iss.message}</span>
                      </div>
                      {iss.suggestedFix && (
                        <span className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border shrink-0">
                          Fix: {iss.suggestedFix}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Click &ldquo;Run Integrity Audit&rdquo; to execute a real-time verification of all entity foreign keys, workspace scopes, and campaign relationships.
          </p>
        )}
      </div>

      {/* SECTION 2: ACTIVE BRANDS IN CURRENT WORKSPACE */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-indigo-600" />
              Active Workspace Brands
            </h4>
            <p className="text-xs text-slate-500">
              Workspace: <strong className="text-slate-800">{activeWorkspace?.name}</strong> ({brands.length} active brands)
            </p>
          </div>
        </div>

        {brands.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No active brands found in this workspace. Create your first brand in the Brands view.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {brands.map(b => (
              <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: b.primaryColor }}
                    />
                    <h5 className="text-sm font-bold text-slate-900">{b.name}</h5>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">
                    {b.code}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{b.description || 'No description provided.'}</p>

                <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-1">
                  <div>
                    <strong className="text-slate-700">Tagline:</strong> {b.tagline || 'None'}
                  </div>
                  <div>
                    <strong className="text-slate-700">Active Content:</strong>{' '}
                    {content.filter(c => c.brandId === b.id).length} deliverables
                  </div>
                  <div>
                    <strong className="text-slate-700">Active Campaigns:</strong>{' '}
                    {campaigns.filter(c => c.brandId === b.id).length} campaigns
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2.5: BACKEND API & AUTHENTICATION */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">Backend API &amp; Authentication</h4>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {API_BASE_URL}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The frontend connects to the shared PostgreSQL backend at{' '}
          <code className="text-indigo-600 font-mono font-medium">{API_BASE_URL}</code>. Private endpoints require a Bearer Access Token. The token remains in page memory only and is never written to browser storage.
        </p>

        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Marketing API Access Token (Bearer)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  placeholder="Paste your 32+ character API token here..."
                  className="w-full text-xs font-mono px-3 py-2 pr-10 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveToken}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                <Check size={14} />
                <span>Save Token</span>
              </button>

              <button
                type="button"
                onClick={handleTestToken}
                disabled={tokenStatus.type === 'testing'}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw size={14} className={tokenStatus.type === 'testing' ? 'animate-spin' : ''} />
                <span>Test Access</span>
              </button>
            </div>
          </div>

          {tokenStatus.message && (
            <div
              className={`p-3 rounded-lg text-xs border flex items-center gap-2 ${
                tokenStatus.type === 'valid' || tokenStatus.type === 'saved'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : tokenStatus.type === 'invalid'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-800'
              }`}
            >
              <span className="font-bold shrink-0">
                {tokenStatus.type === 'valid'
                  ? '✓ Verified:'
                  : tokenStatus.type === 'saved'
                  ? '✓ Saved:'
                  : tokenStatus.type === 'invalid'
                  ? '✗ Status:'
                  : 'ℹ Notice:'}
              </span>
              <span>{tokenStatus.message}</span>
            </div>
          )}

        </div>
      </div>

      {/* SECTION 3: STORAGE & PERSISTENCE ARCHITECTURE */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database size={16} className="text-indigo-600" />
            Persistence &amp; Storage Architecture
          </h4>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              isOffline
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {isOffline ? 'Backend Unavailable' : 'PostgreSQL Backend Active'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Operational records are stored in PostgreSQL in dedicated workspace, brand, content, campaign, team, and activity tables. The legacy JSON file is used only for initial data import; it is not the live production database.
        </p>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <div>
            <strong>Workspace Scope:</strong> {activeWorkspace?.name} ({activeWorkspace?.id})
          </div>
          <div>
            <strong>Active Deliverables:</strong> {content.length} content deliverables
          </div>
          <div>
            <strong>Active Campaigns:</strong> {campaigns.length} campaigns
          </div>
          <div>
            <strong>Last Saved At:</strong> {lastSavedAt || 'Synced recently'}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={exportToJson}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            <span>Download JSON Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={isResetting ? 'animate-spin' : ''} />
            <span>Reset Demo Seed Data</span>
          </button>
        </div>
      </div>

      {/* RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="p-2.5 rounded-xl bg-red-50 text-red-600 shrink-0">
                <RefreshCw size={20} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Demo Database</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to reset the database to clean default demo seeds? All custom records will be restored to initial sample data.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReset}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
