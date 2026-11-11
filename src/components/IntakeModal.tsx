import React, { useState } from 'react';
import { 
  X, Sparkles, Send, Copy, Check, AlertTriangle, 
  Wrench, Layers, DollarSign, Clock, ShieldAlert,
  MessageCircle, Plus, Trash2, CheckCircle2, RefreshCw
} from 'lucide-react';
import { WorkOrderTicket, JobType, PriorityLevel, ActionItem, BOMItem, AttachedMediaItem } from '../types/index.ts';
import { MediaIntake } from './MediaIntake.tsx';
import { PresetSelector, PresetScenario } from './PresetSelector.tsx';

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: (ticket: WorkOrderTicket) => void;
}

export const IntakeModal: React.FC<IntakeModalProps> = ({
  isOpen,
  onClose,
  onTicketCreated,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [company, setCompany] = useState('');
  const [preferredContact, setPreferredContact] = useState<'WhatsApp' | 'Phone' | 'Email' | 'Walk-In'>('WhatsApp');
  const [priorityOverride, setPriorityOverride] = useState<PriorityLevel | 'auto'>('auto');
  const [jobTypeOverride, setJobTypeOverride] = useState<JobType | 'auto'>('auto');
  const [rawText, setRawText] = useState('');
  
  // Audio & Media state
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');
  const [attachedMedia, setAttachedMedia] = useState<AttachedMediaItem[]>([]);
  
  // AI Extraction state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedDraft, setExtractedDraft] = useState<WorkOrderTicket | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: PresetScenario) => {
    setClientName(preset.clientName);
    setClientPhone(preset.phone);
    setCompany(preset.company);
    setRawText(preset.rawInput);
    setAttachedMedia([]);
    setExtractedDraft(null);
    setErrorMsg(null);
  };

  const handleAudioReady = (base64: string, mimeType: string) => {
    setAudioBase64(base64);
    setAudioMimeType(mimeType);
  };

  const handleClearAudio = () => {
    setAudioBase64(null);
  };

  const handleRunAI = async () => {
    if (!rawText.trim() && !audioBase64 && attachedMedia.length === 0) {
      setErrorMsg('Please enter customer text, record audio, or attach photos/videos.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/intake/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          audioBase64,
          audioMimeType,
          attachedMedia: attachedMedia.map(m => ({
            id: m.id,
            name: m.name,
            type: m.type,
            mimeType: m.mimeType,
            data: m.dataUrl.includes(',') ? m.dataUrl.split(',')[1] : m.dataUrl,
            sizeStr: m.sizeStr,
            description: m.description
          })),
          clientName: clientName.trim() || 'Walk-in Client',
          clientPhone,
          clientEmail,
          company,
          preferredContact,
          priorityOverride: priorityOverride === 'auto' ? undefined : priorityOverride,
          jobTypeOverride: jobTypeOverride === 'auto' ? undefined : jobTypeOverride,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to process intake with AI');
      }

      // Preserve attached media on draft
      const ticketWithMedia: WorkOrderTicket = {
        ...data.ticket,
        attachedMedia: attachedMedia,
      };

      setExtractedDraft(ticketWithMedia);
    } catch (err: any) {
      console.error('Intake analysis failed:', err);
      setErrorMsg(err.message || 'Error communicating with AI engine.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveTicket = async () => {
    if (!extractedDraft) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractedDraft),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save ticket');
      }

      onTicketCreated(data.ticket);
      onClose();
    } catch (err: any) {
      console.error('Failed to create ticket:', err);
      setErrorMsg(err.message || 'Failed to save work order');
    } finally {
      setIsSaving(false);
    }
  };

  const copyWhatsAppMessage = () => {
    if (!extractedDraft) return;
    const msg = `*Work Order Update - ${extractedDraft.ticketNumber}*
Hi ${extractedDraft.client.name},

${extractedDraft.clientFacingExplanation}

*Estimated Cost:* $${extractedDraft.totalEstimatedCost.toFixed(2)} (Labor: ${extractedDraft.estimatedLaborHours}h @ $${extractedDraft.laborRatePerHour}/hr + Parts)
*Estimated Turnaround:* ${extractedDraft.priority === 'Urgent' ? 'Same day / 24 hrs' : '1-3 Business Days'}

We will confirm with you before any parts are replaced. Thank you!
- TechIntake Engineering Team`;

    navigator.clipboard.writeText(msg);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  // Draft editing helpers
  const handleToggleAction = (id: string) => {
    if (!extractedDraft) return;
    setExtractedDraft({
      ...extractedDraft,
      suggestedActionItems: extractedDraft.suggestedActionItems.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    });
  };

  const handleDeleteAction = (id: string) => {
    if (!extractedDraft) return;
    setExtractedDraft({
      ...extractedDraft,
      suggestedActionItems: extractedDraft.suggestedActionItems.filter(item => item.id !== id),
    });
  };

  const handleAddAction = () => {
    if (!extractedDraft) return;
    const newStep: ActionItem = {
      id: `act-${Date.now()}`,
      step: 'Additional bench inspection step',
      category: 'diagnostic',
      estimatedMinutes: 15,
      completed: false,
    };
    setExtractedDraft({
      ...extractedDraft,
      suggestedActionItems: [...extractedDraft.suggestedActionItems, newStep],
    });
  };

  const handleAddBOM = () => {
    if (!extractedDraft) return;
    const newBOM: BOMItem = {
      id: `bom-${Date.now()}`,
      itemName: 'Custom Replacement Part',
      category: 'Hardware',
      estimatedCost: 45.00,
      quantity: 1,
      inStock: false,
      notes: 'Added manually',
    };
    const updatedBOM = [...extractedDraft.billOfMaterials, newBOM];
    const partsCost = updatedBOM.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0);
    const laborCost = extractedDraft.estimatedLaborHours * extractedDraft.laborRatePerHour;
    setExtractedDraft({
      ...extractedDraft,
      billOfMaterials: updatedBOM,
      totalEstimatedCost: Number((laborCost + partsCost).toFixed(2)),
    });
  };

  const handleDeleteBOM = (id: string) => {
    if (!extractedDraft) return;
    const updatedBOM = extractedDraft.billOfMaterials.filter(item => item.id !== id);
    const partsCost = updatedBOM.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0);
    const laborCost = extractedDraft.estimatedLaborHours * extractedDraft.laborRatePerHour;
    setExtractedDraft({
      ...extractedDraft,
      billOfMaterials: updatedBOM,
      totalEstimatedCost: Number((laborCost + partsCost).toFixed(2)),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                New Intake & Technical Work-Order Generator
              </h2>
              <p className="text-xs text-slate-400">
                Transforms layman complaints and voice notes into diagnostic trees, BOMs, and client proposals.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-950/60 border border-rose-800/80 p-3 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preset scenarios bar */}
          <PresetSelector onSelectPreset={handleSelectPreset} />

          {/* Section 1: Client & Job Meta */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/40">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                Client Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Marcus Vance"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                Phone / WhatsApp *
              </label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                placeholder="Optional company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                Preferred Channel
              </label>
              <select
                value={preferredContact}
                onChange={(e: any) => setPreferredContact(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Phone">Phone Call</option>
                <option value="Email">Email</option>
                <option value="Walk-In">Walk-In</option>
              </select>
            </div>
          </div>

          {/* Section 2: Input Modality (Text / Audio) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>Raw Client Communication (WhatsApp / Voice Memo / Phone Notes)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Category Override:</span>
                <select
                  value={jobTypeOverride}
                  onChange={(e: any) => setJobTypeOverride(e.target.value)}
                  className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="auto">Auto-Detect by AI</option>
                  <option value="Repair">Repair</option>
                  <option value="Network Setup">Network Setup</option>
                  <option value="Upgrade">Upgrade</option>
                  <option value="New Build">New Build</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
              </div>
            </div>

            <textarea
              rows={4}
              placeholder="Paste raw WhatsApp text, customer email, or voicemail transcript here (e.g., 'The back office Wi-Fi is terrible when everyone is streaming and my computer makes clicking sounds')..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none font-mono leading-relaxed"
            />

            {/* Multi-Modal Media Intake (Voice, Images & Video) */}
            <MediaIntake
              onAudioReady={handleAudioReady}
              onClearAudio={handleClearAudio}
              existingAudio={audioBase64}
              attachedMedia={attachedMedia}
              onAddMedia={(item) => setAttachedMedia((prev) => [...prev, item])}
              onRemoveMedia={(id) => setAttachedMedia((prev) => prev.filter((m) => m.id !== id))}
            />

            {/* Trigger AI Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleRunAI}
                disabled={isAnalyzing || (!rawText.trim() && !audioBase64 && attachedMedia.length === 0)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-950/50 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Technical Reasoning & Specs...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>Run AI Extraction & Generate Work Order</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 3: Extracted AI Result & Interactive Review */}
          {extractedDraft && (
            <div className="space-y-6 pt-4 border-t border-slate-800 animate-in fade-in duration-300">
              <div className="flex items-center justify-between p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Work Order Generated: {extractedDraft.ticketNumber}
                    </div>
                    <div className="text-sm font-bold text-white">
                      {extractedDraft.jobType} • Priority: {extractedDraft.priority}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Total Estimated Quote</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    ${extractedDraft.totalEstimatedCost.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Layman vs Technical Translation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <MessageCircle className="w-4 h-4 text-cyan-400" />
                    <span>Layman Problem Summary</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
                    {extractedDraft.laymanProblemSummary}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>Technical Diagnosis & Spec</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px]">
                    {extractedDraft.technicalDiagnosisOrSpec}
                  </p>
                </div>
              </div>

              {extractedDraft.rootCauseAnalysis && (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Root Cause Analysis</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {extractedDraft.rootCauseAnalysis}
                  </p>
                </div>
              )}

              {/* Suggested Diagnostic Action Items Checklist */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>Actionable Diagnostic Checklist ({extractedDraft.suggestedActionItems.length} Steps)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAction}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Step
                  </button>
                </div>

                <div className="space-y-2">
                  {extractedDraft.suggestedActionItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:bg-slate-850"
                    >
                      <div className="flex items-center gap-2.5 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleAction(item.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            item.completed
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-slate-600 hover:border-cyan-400'
                          }`}
                        >
                          {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <span className="text-xs font-mono text-slate-500 font-bold">#{idx + 1}</span>
                        <span className={`text-xs ${item.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {item.step}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> {item.estimatedMinutes}m
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAction(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill of Materials (BOM) & Missing Stock Linkage */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Bill of Materials (BOM) & Inventory Linkage</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBOM}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Component
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Item Name & Spec</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Est.</th>
                        <th className="p-2.5 text-center">Stock Status</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                      {extractedDraft.billOfMaterials.map((bom) => (
                        <tr key={bom.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-2.5 font-medium text-slate-200">
                            <div>{bom.itemName}</div>
                            {bom.notes && <div className="text-[10px] text-slate-400">{bom.notes}</div>}
                          </td>
                          <td className="p-2.5 text-slate-400">{bom.category}</td>
                          <td className="p-2.5 text-center font-mono">{bom.quantity}</td>
                          <td className="p-2.5 text-right font-mono text-emerald-400">
                            ${bom.estimatedCost.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-center">
                            {bom.inStock ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                                <Check className="w-3 h-3" /> In Stock ({bom.stockAvailable ?? 1})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
                                <AlertTriangle className="w-3 h-3" /> Missing (To Order)
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteBOM(bom.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {extractedDraft.billOfMaterials.some(b => !b.inStock) && (
                  <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      Notice: <strong>{extractedDraft.billOfMaterials.filter(b => !b.inStock).length} component(s)</strong> are not in workshop inventory and will automatically be routed to the <strong>Missing Stock / Restock Orders</strong> dashboard.
                    </span>
                  </div>
                )}
              </div>

              {/* Client-Facing Explanation Preview & 1-Click WhatsApp Share */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    <MessageCircle className="w-4 h-4" />
                    <span>Client-Facing Proposal / WhatsApp Message</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyWhatsAppMessage}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/60 hover:bg-emerald-600 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      {copiedWhatsApp ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy WhatsApp Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-900/40 bg-emerald-950/20 text-xs text-slate-200 leading-relaxed font-sans">
                  {extractedDraft.clientFacingExplanation}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {extractedDraft && (
            <button
              type="button"
              onClick={handleSaveTicket}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSaving ? 'Creating Work Order...' : 'Confirm & Launch Work Order'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
