import React, { useState } from 'react';
import { 
  Package, ShoppingCart, Check, Clock, AlertTriangle, 
  Search, ArrowRight, Truck, CheckCircle2, ExternalLink
} from 'lucide-react';
import { MissingStockItem } from '../types/index.ts';

interface ProcurementViewProps {
  missingStock: MissingStockItem[];
  onUpdateProcurementItem: (id: string, updates: Partial<MissingStockItem>) => void;
  onSelectTicketByNumber?: (ticketNumber: string) => void;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  missingStock,
  onUpdateProcurementItem,
  onSelectTicketByNumber,
}) => {
  const [filterStatus, setFilterStatus] = useState<'All' | 'Needed' | 'Ordered' | 'Received'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderingItemId, setOrderingItemId] = useState<string | null>(null);
  const [orderSupplier, setOrderSupplier] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  const filteredItems = missingStock.filter((item) => {
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.partNumber && item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalProcurementCost = filteredItems.reduce(
    (sum, item) => sum + item.estimatedCost * item.quantityNeeded,
    0
  );

  const handleMarkOrdered = async (id: string) => {
    onUpdateProcurementItem(id, {
      status: 'Ordered',
      supplier: orderSupplier || 'Preferred Distributor',
      expectedDate: expectedDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      orderDate: new Date().toISOString().split('T')[0],
    });
    setOrderingItemId(null);
    setOrderSupplier('');
    setExpectedDate('');
  };

  const handleMarkReceived = async (id: string) => {
    onUpdateProcurementItem(id, {
      status: 'Received',
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Needed to Order</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {missingStock.filter((i) => i.status === 'Needed').length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Requires purchase orders from suppliers</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>In Transit / Ordered</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {missingStock.filter((i) => i.status === 'Ordered').length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting delivery to workshop bench</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Purchase Commitment</span>
            <ShoppingCart className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ${totalProcurementCost.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across active job requirements</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-800 bg-slate-900/80">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search missing stock by item, ticket #, or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 p-1 text-xs">
          {(['All', 'Needed', 'Ordered', 'Received'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterStatus === st ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Missing Stock Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Required Component</th>
                <th className="p-3">Work Order & Client</th>
                <th className="p-3 text-center">Qty Needed</th>
                <th className="p-3 text-right">Est. Cost</th>
                <th className="p-3">Status</th>
                <th className="p-3">Supplier & ETA</th>
                <th className="p-3 text-right">Workflow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No missing stock items found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-100">{item.itemName}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {item.partNumber || item.category || 'Hardware'}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-cyan-400 font-semibold">{item.ticketNumber}</span>
                        {onSelectTicketByNumber && (
                          <button
                            onClick={() => onSelectTicketByNumber(item.ticketNumber)}
                            className="text-slate-400 hover:text-cyan-300 p-0.5"
                            title="Inspect Work Order"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{item.clientName}</div>
                    </td>

                    <td className="p-3 text-center font-mono font-bold text-slate-200">
                      {item.quantityNeeded}
                    </td>

                    <td className="p-3 text-right font-mono text-emerald-400 font-bold">
                      ${(item.estimatedCost * item.quantityNeeded).toFixed(2)}
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                          item.status === 'Needed'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : item.status === 'Ordered'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {item.status === 'Needed' && <AlertTriangle className="w-3 h-3" />}
                        {item.status === 'Ordered' && <Truck className="w-3 h-3" />}
                        {item.status === 'Received' && <Check className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3 text-slate-300">
                      <div>{item.supplier || 'TBD'}</div>
                      {item.expectedDate && (
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> ETA: {item.expectedDate}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      {item.status === 'Needed' && (
                        orderingItemId === item.id ? (
                          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-slate-950 border border-slate-700 w-64 ml-auto text-left">
                            <input
                              type="text"
                              placeholder="Supplier (e.g. Synnex, Amazon)"
                              value={orderSupplier}
                              onChange={(e) => setOrderSupplier(e.target.value)}
                              className="px-2 py-1 rounded border border-slate-700 bg-slate-900 text-xs text-slate-200"
                            />
                            <input
                              type="date"
                              value={expectedDate}
                              onChange={(e) => setExpectedDate(e.target.value)}
                              className="px-2 py-1 rounded border border-slate-700 bg-slate-900 text-xs text-slate-200"
                            />
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                onClick={() => setOrderingItemId(null)}
                                className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleMarkOrdered(item.id)}
                                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold"
                              >
                                Confirm Order
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setOrderingItemId(item.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Mark Ordered</span>
                          </button>
                        )
                      )}

                      {item.status === 'Ordered' && (
                        <button
                          onClick={() => handleMarkReceived(item.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Received</span>
                        </button>
                      )}

                      {item.status === 'Received' && (
                        <span className="text-[11px] text-emerald-400 font-mono flex items-center justify-end gap-1">
                          <Check className="w-3.5 h-3.5" /> Allocated to Bench
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
