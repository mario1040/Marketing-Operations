import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Calendar,
  CheckCircle2,
  Layers,
  Users,
  BarChart3,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'sop' | 'workflows' | 'architecture'>('sop');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Marketing Operations Guide &amp; SOP
              </h2>
              <p className="text-xs text-slate-500">
                Operational framework for The Professor &amp; Profacto
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('sop')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeSection === 'sop'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Operating Procedure (SOP)
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('workflows')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeSection === 'workflows'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Platform Workflows &amp; Actions
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('architecture')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeSection === 'architecture'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Multi-Brand Architecture
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSection === 'sop' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900">
                <strong>Operational Rhythm:</strong> Follow this weekly sequence to maintain consistent publishing cadence, prevent bottlenecks, and keep content execution aligned with business targets.
              </div>

              <div className="space-y-3">
                {/* Monday */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Monday — Planning &amp; Intake
                    </span>
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-mono text-slate-700">
                      Day 1
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    Review previous week execution rate. Finalize upcoming weekly calendar, verify campaign alignment, assign owners, and confirm asset deadlines.
                  </p>
                </div>

                {/* Tuesday - Wednesday */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Tuesday – Wednesday — Production &amp; Creation
                    </span>
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-mono text-slate-700">
                      Days 2–3
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    Move content items to <strong>In Production</strong>. Draft hooks, body copy, and record visuals. Attach design references and Figma links directly to content cards.
                  </p>
                </div>

                {/* Thursday */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                      Thursday — Editing &amp; Quality Review
                    </span>
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-mono text-slate-700">
                      Day 4
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    Move content to <strong>Editing</strong>. Peer review copy, verify financial and technical accuracy. Brand leads approve items into <strong>Approved</strong> state.
                  </p>
                </div>

                {/* Before Publishing */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">
                      Before Publishing — Scheduling
                    </span>
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-mono text-slate-700">
                      Queue
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    Confirm target publishing timestamp. Queue approved content in platform native or buffer tools. Move status to <strong>Scheduled</strong>.
                  </p>
                </div>

                {/* After Publishing */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      After Publishing — Verification &amp; Archive
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    Verify post rendering live. Paste the actual published URL into the content item. Transition status to <strong>Published</strong>. Never auto-publish without manual verification.
                  </p>
                </div>

                {/* Weekly Review */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Friday / Weekend — Weekly Retrospective
                    </span>
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-mono text-slate-700">
                      Review
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    Audit execution rate formula <code>(Published / Planned) * 100</code>. Triage overdue deliverables, assess team capacity, and queue next week's focus topics.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'workflows' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-600" />
                    Switching Brands
                  </h4>
                  <p className="text-xs text-slate-600">
                    Use the top brand switcher or sidebar buttons to toggle between <strong>All Brands</strong>, <strong>The Professor</strong>, and <strong>Profacto</strong>. All calendar views, KPIs, and reports update synchronously.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-600" />
                    Adding &amp; Rescheduling Content
                  </h4>
                  <p className="text-xs text-slate-600">
                    Click <strong>+ New Content</strong> or click directly on any calendar day. Drag or edit dates in the modal to immediately reschedule. Content Date (planning) is decoupled from Scheduled Date (publishing).
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ArrowRight size={14} className="text-indigo-600" />
                    Status Transitions &amp; Revisions
                  </h4>
                  <p className="text-xs text-slate-600">
                    Workflow progresses: <code>Planned → In Production → Editing → Approved → Scheduled → Published</code>. Items can be moved backward when edits are requested. Every change creates an activity log entry.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Users size={14} className="text-indigo-600" />
                    Team Assignment &amp; Workloads
                  </h4>
                  <p className="text-xs text-slate-600">
                    Every content item has an assigned owner. View team workload distribution in the <strong>Team &amp; Workload</strong> tab to balance creation velocity and avoid team bottlenecks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  Multi-Brand Data Isolation &amp; Shared Engine
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Both <strong>The Professor</strong> and <strong>Profacto</strong> share the same high-performance content engine, database schema, and operational workflow conventions. However, each workspace maintains:
                </p>
                <ul className="text-xs text-slate-700 list-disc list-inside space-y-1 pl-1">
                  <li>Independent content records and calendar grids</li>
                  <li>Independent campaigns and objective taxonomies</li>
                  <li>Independent weekly and monthly performance calculations</li>
                  <li>Shared team assignment and cross-brand operational reporting</li>
                </ul>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <strong>Data Persistence Guarantee:</strong> All changes are written to the persistent JSON storage backend (<code>/data/marketing_db.json</code>) and synced to browser cache. Refreshing will never discard your work.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Got it, Back to Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
