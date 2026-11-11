import React, { useState } from 'react';
import { 
  Package, Plus, Search, AlertTriangle, Check, 
  ArrowUp, ArrowDown, MapPin, Tag, DollarSign, X
} from 'lucide-react';
import { InventoryItem } from '../types/index.ts';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onAddStock: (id: string, delta: number) => void;
  onAddNewItem: (item: Partial<InventoryItem>) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onAddStock,
  onAddNewItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New item form state
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Storage');
  const [newUnitCost, setNewUnitCost] = useState(40);
  const [newRetailPrice, setNewRetailPrice] = useState(65);
  const [newStockQty, setNewStockQty] = useState(3);
  const [newMinThreshold, setNewMinThreshold] = useState(2);
  const [newLocation, setNewLocation] = useState('Shelf A-1');
  const [newSupplier, setNewSupplier] = useState('TechData');

  const categories = Array.from(new Set(inventory.map((i) => i.category)));

  const filteredItems = inventory.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || !newName) return;

    onAddNewItem({
      sku: newSku,
      name: newName,
      category: newCategory,
      unitCost: Number(newUnitCost),
      retailPrice: Number(newRetailPrice),
      stockQuantity: Number(newStockQty),
      minThreshold: Number(newMinThreshold),
      location: newLocation,
      supplier: newSupplier,
      leadTimeDays: 2,
    });

    setIsAddingNew(false);
    setNewSku('');
    setNewName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="text-xs text-slate-400 mb-1">Total Catalog SKUs</div>
          <div className="text-2xl font-bold font-mono text-cyan-400">{inventory.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Workshop parts & consumables</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="text-xs text-slate-400 mb-1">Out of Stock & Critical</div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {inventory.filter((i) => i.stockQuantity === 0).length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Directly blocks open work orders</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="text-xs text-slate-400 mb-1">Low Stock Warning</div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {inventory.filter((i) => i.stockQuantity > 0 && i.stockQuantity <= i.minThreshold).length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Below minimum shelf threshold</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-800 bg-slate-900/80">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 w-full">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by part name, SKU, shelf location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-950/40 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Workshop SKU</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">SKU & Item Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Location</th>
                <th className="p-3 text-right">Cost / Retail</th>
                <th className="p-3 text-center">Stock Level</th>
                <th className="p-3 text-right">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredItems.map((item) => {
                const isOutOfStock = item.stockQuantity === 0;
                const isLowStock = item.stockQuantity > 0 && item.stockQuantity <= item.minThreshold;

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-100">{item.name}</div>
                      <div className="text-[11px] font-mono text-cyan-400">{item.sku}</div>
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {item.category}
                      </span>
                    </td>

                    <td className="p-3 text-slate-400 flex items-center gap-1.5 pt-4">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.location}</span>
                    </td>

                    <td className="p-3 text-right font-mono">
                      <div className="text-emerald-400 font-bold">${item.retailPrice.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500">Cost: ${item.unitCost.toFixed(2)}</div>
                    </td>

                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[11px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> 0 Units (Out)
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {item.stockQuantity} Units (Low)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] flex items-center gap-1">
                            <Check className="w-3 h-3" /> {item.stockQuantity} Units
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Min threshold: {item.minThreshold}
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onAddStock(item.id, -1)}
                          disabled={item.stockQuantity <= 0}
                          title="Deduct 1 unit (used on bench)"
                          className="w-7 h-7 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 flex items-center justify-center cursor-pointer transition-colors"
                        >
                          -
                        </button>
                        <button
                          onClick={() => onAddStock(item.id, 1)}
                          title="Add 1 unit (restocked)"
                          className="w-7 h-7 rounded border border-cyan-700/80 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 flex items-center justify-center cursor-pointer transition-colors font-bold"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Item Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                Add New Inventory SKU
              </h3>
              <button onClick={() => setIsAddingNew(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Part SKU *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SSD-SATA-1TB-SAM"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Item Full Name & Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samsung 870 EVO 1TB 2.5 Inch SATA III Internal SSD"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-200"
                  >
                    <option value="Storage">Storage</option>
                    <option value="Memory">Memory</option>
                    <option value="Networking">Networking</option>
                    <option value="Cabling">Cabling</option>
                    <option value="Power">Power</option>
                    <option value="Cooling">Cooling</option>
                    <option value="Consumables">Consumables</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Shelf Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newUnitCost}
                    onChange={(e) => setNewUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRetailPrice}
                    onChange={(e) => setNewRetailPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Initial Qty</label>
                  <input
                    type="number"
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-white"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
