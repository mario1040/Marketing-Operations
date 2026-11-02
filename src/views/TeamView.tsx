import React, { useState } from 'react';
import { useMarketing } from '../context/MarketingContext';
import {
  Users,
  Plus,
  Mail,
  Briefcase,
  CheckCircle2,
  Clock,
  Edit3,
  X,
  Layers,
} from 'lucide-react';
import { BrandBadge } from '../components/BrandBadge';
import { StatusBadge } from '../components/StatusBadge';
import { TeamMember, BrandId } from '../types';

export const TeamView: React.FC = () => {
  const {
    team,
    content,
    activeBrandId,
    createTeamMember,
    openEditModal,
  } = useMarketing();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: '',
    role: '',
    email: '',
    avatarBg: 'bg-indigo-600',
    brands: ['the-professor', 'profacto'],
  });

  const relevantTeam =
    activeBrandId === 'all'
      ? team
      : team.filter(t => t.brands.includes(activeBrandId));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.role) return;
    await createTeamMember(newMember);
    setIsAddOpen(false);
    setNewMember({
      name: '',
      role: '',
      email: '',
      avatarBg: 'bg-indigo-600',
      brands: ['the-professor', 'profacto'],
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Team &amp; Workload Capacity
          </h3>
          <p className="text-xs text-slate-500">
            Ownership directory, channel responsibilities, and deliverable bandwidth allocation
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relevantTeam.map(member => {
          const assignedItems = content.filter(c => c.responsiblePerson === member.name);
          const inProgress = assignedItems.filter(
            c => c.status === 'In Production' || c.status === 'Editing'
          ).length;
          const published = assignedItems.filter(c => c.status === 'Published').length;
          const planned = assignedItems.filter(
            c => c.status === 'Planned' || c.status === 'Approved' || c.status === 'Scheduled'
          ).length;

          // Capacity load logic
          const capacityStatus =
            inProgress > 3 ? 'High Load' : inProgress >= 1 ? 'Optimal Load' : 'Available';

          const capacityBg =
            inProgress > 3
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : inProgress >= 1
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-50 text-slate-600 border-slate-200';

          return (
            <div
              key={member.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-2xs ${member.avatarBg}`}
                    >
                      {member.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {member.name}
                      </h4>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${capacityBg}`}
                  >
                    {capacityStatus}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <Mail size={12} className="text-slate-400" />
                  <span className="font-mono">{member.email}</span>
                </div>

                {/* Brands Assigned */}
                <div className="flex items-center gap-1.5 mb-4">
                  {member.brands.map(b => (
                    <BrandBadge key={b} brandId={b} size="sm" />
                  ))}
                </div>

                {/* Workload Stats Grid */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">
                      Active
                    </span>
                    <span className="text-sm font-bold text-blue-700 font-mono">{inProgress}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">
                      Queue
                    </span>
                    <span className="text-sm font-bold text-purple-700 font-mono">{planned}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">
                      Done
                    </span>
                    <span className="text-sm font-bold text-emerald-800 font-mono">{published}</span>
                  </div>
                </div>
              </div>

              {/* Assigned Deliverables List */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
                  Active Tasks ({assignedItems.length})
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {assignedItems.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">No items assigned yet.</p>
                  ) : (
                    assignedItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-md bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-800 truncate mr-2 font-medium">
                          {item.topic}
                        </span>
                        <StatusBadge status={item.status} size="sm" showDot={false} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                Add Team Member
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMember.name}
                  onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="e.g. Maya Lin"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role &amp; Specialization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMember.role}
                  onChange={e => setNewMember({ ...newMember, role: e.target.value })}
                  placeholder="e.g. Lead Technical Writer & Video Editor"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="e.g. maya@agency.io"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  Save Team Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
