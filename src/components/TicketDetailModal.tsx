import React, { useState } from 'react';
import { 
  X, Check, Copy, MessageCircle, Phone, Mail, 
  Clock, AlertTriangle, Layers, Wrench, ShieldAlert, 
  Printer, ArrowRight, CheckCircle2, DollarSign,
  Image as ImageIcon, Film, Eye
} from 'lucide-react';
import { WorkOrderTicket, TicketStatus, AttachedMediaItem } from '../types/index.ts';

interface TicketDetailModalProps {
  ticket: WorkOrderTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTicket: (updated: WorkOrderTicket) => void;
  onDeleteTicket: (ticketId: string) => void;
}

const ALL_STATUSES: TicketStatus[] = [
  'New Intake',
  'Triage & Diagnosis',
  'Waiting on Parts',
  'In Progress / Bench',
  'Testing & QA',
  'Ready for Pickup',
  'Completed',
];

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onUpdateTicket,
  onDeleteTicket,
}) => {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPreviewMedia, setSelectedPreviewMedia] = useState<AttachedMediaItem | null>(null);

  if (!isOpen || !ticket) return null;

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdateTicket(data.ticket);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleChecklist = async (itemId: string) => {
    const updatedItems = ticket.suggestedActionItems.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    // Optimistic update
    const updatedTicket = { ...ticket, suggestedActionItems: updatedItems };
    onUpdateTicket(updatedTicket);

    try {
      await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestedActionItems: updatedItems }),
      });
    } catch (err) {
      console.error('Failed to save checklist state:', err);
    }
  };

  const copyWhatsApp = () => {
    const msg = `*Work Order Update: ${ticket.ticketNumber}*
Hello ${ticket.client.name},

${ticket.clientFacingExplanation}

*Current Status:* ${ticket.status}
*Estimated Quote:* $${ticket.totalEstimatedCost.toFixed(2)}
*Contact:* TechIntake Engineering Bench (+1 555-TECH-FIX)`;

    navigator.clipboard.writeText(msg);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  const completedSteps = ticket.suggestedActionItems.filter(i => i.completed).length;
  const totalSteps = ticket.suggestedActionItems.length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const openWhatsAppDirect = () => {
    const cleanPhone = ticket.client.phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hi ${ticket.client.name}, update regarding your work order ${ticket.ticketNumber}:\n\n${ticket.clientFacingExplanation}`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
              {ticket.ticketNumber}
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {ticket.client.name} {ticket.client.company && <span className="text-xs text-slate-400 font-normal">({ticket.client.company})</span>}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{ticket.jobType}</span>
                <span>•</span>
                <span className={`font-semibold ${
                  ticket.priority === 'Urgent' ? 'text-rose-400' :
                  ticket.priority === 'High' ? 'text-amber-400' : 'text-slate-300'
                }`}>
                  {ticket.priority} Priority
                </span>
                <span>•</span>
                <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              title="Print Work Order Bench Ticket"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Tracker Bar */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Current Workflow Stage
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={ticket.status}
                  disabled={isUpdating}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  className="rounded-lg border border-cyan-600/60 bg-cyan-950/40 text-cyan-200 px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st} className="bg-slate-900 text-slate-200">
                      {st}
                    </option>
                  ))}
                </select>
                {ticket.billOfMaterials.some(b => !b.inStock) && ticket.status === 'Waiting on Parts' && (
                  <span className="text-xs text-amber-400 flex items-center gap-1 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5" /> Awaiting Supplier Shipment
                  </span>
                )}
              </div>
            </div>

            {/* Checklist Progress */}
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Diagnostic Steps Progress</span>
                <span className="font-mono text-cyan-400 font-bold">{completedSteps}/{totalSteps} ({progressPercent}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Total Estimated Cost */}
            <div className="text-right">
              <div className="text-[11px] text-slate-400">Estimated Total Cost</div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                ${ticket.totalEstimatedCost.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Client Communication & WhatsApp Actions */}
          <div className="p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <MessageCircle className="w-4 h-4" />
                <span>Client-Facing Explanation & Instant Proposal</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openWhatsAppDirect}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors cursor-pointer shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={copyWhatsApp}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedWhatsApp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWhatsApp ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              {ticket.clientFacingExplanation}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" /> {ticket.client.phone}
              </span>
              {ticket.client.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {ticket.client.email}
                </span>
              )}
              {ticket.client.preferredContact && (
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] text-cyan-300 font-mono">
                  Channel: {ticket.client.preferredContact}
                </span>
              )}
              <span className="text-slate-500 font-mono text-[11px]">
                Labor: {ticket.estimatedLaborHours} hrs @ ${ticket.laborRatePerHour}/hr
              </span>
            </div>
          </div>

          {/* Technical Diagnostics & Layman Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Layman Problem Summary</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {ticket.laymanProblemSummary}
              </p>
              <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800/80 font-mono">
                Raw Input: "{ticket.rawInput}"
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                <span>Engineering Diagnosis & Spec</span>
              </div>
              <p className="text-xs text-slate-200 font-mono leading-relaxed bg-slate-900/80 p-2.5 rounded border border-slate-800">
                {ticket.technicalDiagnosisOrSpec}
              </p>
              {ticket.rootCauseAnalysis && (
                <p className="text-[11px] text-rose-300/90 pt-1">
                  <strong>Root Cause:</strong> {ticket.rootCauseAnalysis}
                </p>
              )}
            </div>
          </div>

          {/* Attached Photos & Videos (if present) */}
          {ticket.attachedMedia && ticket.attachedMedia.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Client Attached Diagnostic Media ({ticket.attachedMedia.length} Files)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">Click to inspect</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ticket.attachedMedia.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedPreviewMedia(m)}
                    className="group relative rounded-xl border border-slate-700 bg-slate-900 overflow-hidden text-left hover:border-cyan-400 transition-all cursor-pointer shadow"
                  >
                    <div className="aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                      {m.type === 'image' ? (
                        <img src={m.dataUrl} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-indigo-400">
                          <Film className="w-6 h-6 mb-1" />
                          <span className="text-[9px] font-mono">Video Clip</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="p-2 text-[10px] truncate text-slate-300 font-medium">
                      {m.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostic Checklist */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Step-by-Step Bench Checklist ({ticket.suggestedActionItems.length} Tasks)</span>
            </div>

            <div className="space-y-2">
              {ticket.suggestedActionItems.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleChecklist(item.id)}
                  className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    item.completed
                      ? 'bg-slate-900/40 border-slate-800/80 opacity-60'
                      : 'bg-slate-900 border-slate-700/80 hover:border-cyan-500/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      item.completed ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-500'
                    }`}>
                      {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="font-mono text-xs text-slate-500 font-bold">#{idx + 1}</span>
                    <span className={`text-xs ${item.completed ? 'line-through text-slate-400' : 'text-slate-100 font-medium'}`}>
                      {item.step}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {item.estimatedMinutes}m
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bill of Materials (BOM) */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Bill of Materials (BOM)</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Component</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Est.</th>
                    <th className="p-2.5 text-center">Stock Status</th>
                    <th className="p-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {ticket.billOfMaterials.map((bom) => (
                    <tr key={bom.id}>
                      <td className="p-2.5 font-medium text-slate-200">{bom.itemName}</td>
                      <td className="p-2.5 text-slate-400">{bom.category}</td>
                      <td className="p-2.5 text-center font-mono">{bom.quantity}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-400">${bom.estimatedCost.toFixed(2)}</td>
                      <td className="p-2.5 text-center">
                        {bom.inStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            <Check className="w-3 h-3" /> In Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
                            <AlertTriangle className="w-3 h-3" /> Missing (On Order)
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-400">{bom.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80 rounded-b-2xl">
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to delete this work order?')) {
                onDeleteTicket(ticket.id);
                onClose();
              }
            }}
            className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
          >
            Delete Work Order
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Media Lightbox Viewer */}
      {selectedPreviewMedia && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-4xl max-h-[90vh] rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white">{selectedPreviewMedia.name}</span>
              <button
                type="button"
                onClick={() => setSelectedPreviewMedia(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center py-4 overflow-hidden">
              {selectedPreviewMedia.type === 'image' ? (
                <img
                  src={selectedPreviewMedia.dataUrl}
                  alt={selectedPreviewMedia.name}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow"
                />
              ) : (
                <video
                  src={selectedPreviewMedia.dataUrl}
                  controls
                  autoPlay
                  className="max-h-[70vh] max-w-full rounded-lg shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
