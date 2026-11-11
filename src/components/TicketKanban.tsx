import React, { useState } from 'react';
import { 
  Plus, Search, Filter, AlertTriangle, CheckCircle2, 
  Clock, ArrowRight, User, Wrench, Layers, Eye, Image as ImageIcon
} from 'lucide-react';
import { WorkOrderTicket, TicketStatus, JobType, PriorityLevel } from '../types/index.ts';

interface TicketKanbanProps {
  tickets: WorkOrderTicket[];
  onSelectTicket: (ticket: WorkOrderTicket) => void;
  onOpenNewIntake: () => void;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
}

const KANBAN_COLUMNS: { status: TicketStatus; label: string; color: string }[] = [
  { status: 'New Intake', label: 'New Intake', color: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300' },
  { status: 'Triage & Diagnosis', label: 'Triage & Diagnosis', color: 'border-blue-500/50 bg-blue-950/20 text-blue-300' },
  { status: 'Waiting on Parts', label: 'Waiting on Parts', color: 'border-amber-500/50 bg-amber-950/20 text-amber-300' },
  { status: 'In Progress / Bench', label: 'In Progress / Bench', color: 'border-indigo-500/50 bg-indigo-950/20 text-indigo-300' },
  { status: 'Testing & QA', label: 'Testing & QA', color: 'border-purple-500/50 bg-purple-950/20 text-purple-300' },
  { status: 'Ready for Pickup', label: 'Ready for Pickup', color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300' },
  { status: 'Completed', label: 'Completed', color: 'border-slate-700 bg-slate-900/40 text-slate-400' },
];

export const TicketKanban: React.FC<TicketKanbanProps> = ({
  tickets,
  onSelectTicket,
  onOpenNewIntake,
  onUpdateTicketStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobType, setSelectedJobType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.client.company && t.client.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.laymanProblemSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.technicalDiagnosisOrSpec.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesJob = selectedJobType === 'all' || t.jobType === selectedJobType;
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;

    return matchesSearch && matchesJob && matchesPriority;
  });

  return (
    <div className="space-y-4">
      {/* Control Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-800 bg-slate-900/80">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ticket #, client, symptoms, hardware..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Job Type Filter */}
          <select
            value={selectedJobType}
            onChange={(e) => setSelectedJobType(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Job Types</option>
            <option value="Repair">Repair</option>
            <option value="Network Setup">Network Setup</option>
            <option value="Upgrade">Upgrade</option>
            <option value="New Build">New Build</option>
            <option value="General Inquiry">General Inquiry</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onOpenNewIntake}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New AI Intake (+)</span>
        </button>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const columnTickets = filteredTickets.filter((t) => t.status === col.status);

            return (
              <div
                key={col.status}
                className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/60 min-w-[260px] max-h-[80vh]"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{col.label}</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                      {columnTickets.length}
                    </span>
                  </div>
                </div>

                {/* Column Body / Cards */}
                <div className="flex-1 p-2 space-y-2.5 overflow-y-auto">
                  {columnTickets.length === 0 ? (
                    <div className="p-4 text-center rounded-xl border border-dashed border-slate-800/60 text-[11px] text-slate-600">
                      No jobs in this stage
                    </div>
                  ) : (
                    columnTickets.map((ticket) => {
                      const hasMissingStock = ticket.billOfMaterials.some((b) => !b.inStock);
                      const completedCount = ticket.suggestedActionItems.filter((i) => i.completed).length;
                      const totalSteps = ticket.suggestedActionItems.length;

                      return (
                        <div
                          key={ticket.id}
                          className="group rounded-xl border border-slate-800 hover:border-cyan-500/60 bg-slate-900/90 hover:bg-slate-900 p-3 shadow transition-all cursor-pointer space-y-2.5"
                          onClick={() => onSelectTicket(ticket)}
                        >
                          {/* Ticket Top Meta */}
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-cyan-400 group-hover:underline">
                              {ticket.ticketNumber}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                ticket.priority === 'Urgent'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : ticket.priority === 'High'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {ticket.priority}
                            </span>
                          </div>

                          {/* Client & Problem */}
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                              {ticket.client.name}
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                              {ticket.laymanProblemSummary}
                            </div>
                          </div>

                          {/* Missing Stock Warning */}
                          {hasMissingStock && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-950/60 border border-rose-800/80 text-[10px] font-semibold text-rose-300">
                              <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                              <span>Parts On Order ({ticket.billOfMaterials.filter((b) => !b.inStock).length})</span>
                            </div>
                          )}

                          {/* Attached Media Indicator */}
                          {ticket.attachedMedia && ticket.attachedMedia.length > 0 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/50 text-[10px] font-mono text-cyan-300">
                              <ImageIcon className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span>{ticket.attachedMedia.length} Photo/Video Evidence</span>
                            </div>
                          )}

                          {/* Progress & Bottom Bar */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3 text-slate-500" />
                              <span className="font-mono">
                                {completedCount}/{totalSteps}
                              </span>
                            </span>

                            <span className="font-mono font-bold text-emerald-400">
                              ${ticket.totalEstimatedCost.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table View */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Ticket #</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Job Type</th>
                  <th className="p-3">Problem Summary</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3 text-center">Checklist</th>
                  <th className="p-3 text-right">Est. Cost</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="p-3 font-mono font-bold text-cyan-400">{t.ticketNumber}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-100">{t.client.name}</div>
                      <div className="text-[11px] text-slate-400">{t.client.phone}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {t.jobType}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{t.laymanProblemSummary}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          t.priority === 'Urgent'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : t.priority === 'High'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-slate-200">{t.status}</span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-400">
                      {t.suggestedActionItems.filter((i) => i.completed).length}/{t.suggestedActionItems.length}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      ${t.totalEstimatedCost.toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      <button className="text-cyan-400 hover:text-cyan-300 p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
