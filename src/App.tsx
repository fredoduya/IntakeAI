import React, { useState, useEffect } from 'react';
import { 
  WorkOrderTicket, InventoryItem, MissingStockItem, TicketStatus 
} from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { TicketKanban } from './components/TicketKanban.tsx';
import { IntakeModal } from './components/IntakeModal.tsx';
import { TicketDetailModal } from './components/TicketDetailModal.tsx';
import { ProcurementView } from './components/ProcurementView.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { ArchitectureDocsView } from './components/ArchitectureDocsView.tsx';
import { Sparkles, Wrench, ShieldCheck, Cpu, HardDrive } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'procurement' | 'inventory' | 'architecture'>('tickets');
  const [tickets, setTickets] = useState<WorkOrderTicket[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [missingStock, setMissingStock] = useState<MissingStockItem[]>([]);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<WorkOrderTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ticketsRes, invRes, procRes] = await Promise.all([
        fetch('/api/tickets'),
        fetch('/api/inventory'),
        fetch('/api/procurement'),
      ]);

      const [ticketsData, invData, procData] = await Promise.all([
        ticketsRes.json(),
        invRes.json(),
        procRes.json(),
      ]);

      if (ticketsData.tickets) setTickets(ticketsData.tickets);
      if (invData.inventory) setInventory(invData.inventory);
      if (procData.missingStock) setMissingStock(procData.missingStock);
    } catch (err) {
      console.error('Error fetching workshop data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTicketCreated = (newTicket: WorkOrderTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    // Refresh procurement list to pick up newly added missing stock items
    fetchData();
  };

  const handleUpdateTicket = (updatedTicket: WorkOrderTicket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
    setSelectedTicket(updatedTicket);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' });
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setSelectedTicket(null);
    } catch (err) {
      console.error('Failed to delete ticket:', err);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? data.ticket : t)));
      }
    } catch (err) {
      console.error('Failed to change ticket status:', err);
    }
  };

  const handleAddStock = async (invId: string, delta: number) => {
    try {
      const res = await fetch(`/api/inventory/${invId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      const data = await res.json();
      if (data.success) {
        setInventory((prev) => prev.map((i) => (i.id === invId ? data.item : i)));
        // Reload tickets to update inStock flags
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update inventory:', err);
    }
  };

  const handleAddNewInventoryItem = async (newItem: Partial<InventoryItem>) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      const data = await res.json();
      if (data.success) {
        setInventory((prev) => [...prev, data.item]);
      }
    } catch (err) {
      console.error('Failed to create inventory item:', err);
    }
  };

  const handleUpdateProcurementItem = async (id: string, updates: Partial<MissingStockItem>) => {
    try {
      const res = await fetch(`/api/procurement/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setMissingStock((prev) => prev.map((m) => (m.id === id ? data.item : m)));
        // Reload all data so tickets and inventory reflect restocked items
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update procurement item:', err);
    }
  };

  const handleSelectTicketByNumber = (ticketNumber: string) => {
    const found = tickets.find((t) => t.ticketNumber === ticketNumber);
    if (found) {
      setSelectedTicket(found);
      setActiveTab('tickets');
    }
  };

  const activeTicketsCount = tickets.filter((t) => t.status !== 'Completed').length;
  const missingStockCount = missingStock.filter((m) => m.status !== 'Received').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewIntake={() => setIsIntakeModalOpen(true)}
        openTicketsCount={activeTicketsCount}
        missingStockCount={missingStockCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            {/* Quick Banner & Stat Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Engineering Bench & Work-Order Pipeline</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Live AI Diagnostics
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    Vague customer complaints parsed into actionable diagnostic steps, parts BOMs, and client updates.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Active Bench Jobs</div>
                  <div className="text-lg font-bold font-mono text-cyan-400">{activeTicketsCount} Orders</div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Parts on Order</div>
                  <div className="text-lg font-bold font-mono text-amber-400">{missingStockCount} Items</div>
                </div>
              </div>
            </div>

            {/* Kanban / List of Tickets */}
            <TicketKanban
              tickets={tickets}
              onSelectTicket={(t) => setSelectedTicket(t)}
              onOpenNewIntake={() => setIsIntakeModalOpen(true)}
              onUpdateTicketStatus={handleUpdateTicketStatus}
            />
          </div>
        )}

        {activeTab === 'procurement' && (
          <ProcurementView
            missingStock={missingStock}
            onUpdateProcurementItem={handleUpdateProcurementItem}
            onSelectTicketByNumber={handleSelectTicketByNumber}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            inventory={inventory}
            onAddStock={handleAddStock}
            onAddNewItem={handleAddNewInventoryItem}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureDocsView />}
      </main>

      {/* New Intake Modal Drawer */}
      <IntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        onTicketCreated={handleTicketCreated}
      />

      {/* Ticket Details & Diagnostic Checklist Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        onUpdateTicket={handleUpdateTicket}
        onDeleteTicket={handleDeleteTicket}
      />
    </div>
  );
}
