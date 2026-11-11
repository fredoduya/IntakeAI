import React from 'react';
import { Sparkles, HardDrive, Wifi, Cpu, Laptop, Flame } from 'lucide-react';

export interface PresetScenario {
  id: string;
  title: string;
  icon: React.ReactNode;
  clientName: string;
  phone: string;
  company: string;
  rawInput: string;
  categoryHint: string;
  badgeColor: string;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'clicking-hdd',
    title: 'Clicking Hard Drive & Won\'t Boot',
    icon: <HardDrive className="w-3.5 h-3.5 text-rose-400" />,
    clientName: 'David Miller',
    phone: '+1 (555) 438-9921',
    company: 'Miller Tax Advisory',
    rawInput: "My office desktop started making this faint ticking and clicking noise yesterday morning. Today when I booted it up, Windows wouldn't load at all and it gave me a black screen with white text saying something like 'No bootable drive detected'. All our 2024 tax client spreadsheets are on that drive, please tell me you can save it!",
    categoryHint: 'Repair (Urgent)',
    badgeColor: 'border-rose-500/40 text-rose-300 bg-rose-950/40',
  },
  {
    id: 'slow-wifi',
    title: 'Back-Office Wi-Fi Freezes on Zoom',
    icon: <Wifi className="w-3.5 h-3.5 text-amber-400" />,
    clientName: 'Elena Rostova',
    phone: '+1 (555) 891-2304',
    company: 'Apex Digital Agency',
    rawInput: "Hey team! Our back conference room Wi-Fi is completely unusable whenever the video editors start uploading to YouTube or our cloud storage. Zoom calls stutter, video freezes, and our clients can't hear us. We just have the standard Spectrum ISP modem router sitting by the front door.",
    categoryHint: 'Network Setup (High)',
    badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/40',
  },
  {
    id: 'custom-build',
    title: '4K DaVinci Resolve Workstation Build',
    icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" />,
    clientName: 'Jordan Reed',
    phone: '+1 (555) 312-7788',
    company: 'Kinetic Productions',
    rawInput: "Hi, I want a custom editing desktop built for 4K and 6K ProRes editing in DaVinci Resolve and After Effects. Need at least 64GB fast RAM, 2TB primary NVMe for OS/Apps, a separate high-speed scratch disk, robust quiet cooling, and a power supply with room to grow. Budget is around $2,500 - $3,000.",
    categoryHint: 'New Build (Medium)',
    badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40',
  },
  {
    id: 'thermal-throttling',
    title: 'PC Shuts Down Under Load & Loud Fan',
    icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
    clientName: 'Liam Chen',
    phone: '+1 (555) 674-1290',
    company: 'Individual',
    rawInput: "My gaming computer keeps violently shutting off by itself about 10 minutes into playing any heavy game like Cyberpunk or rendering 3D models. The fans rev up super loud sounding like a jet engine right before the screen goes black. The PC case feels burning hot to the touch near the top.",
    categoryHint: 'Repair / Maintenance',
    badgeColor: 'border-orange-500/40 text-orange-300 bg-orange-950/40',
  },
  {
    id: 'liquid-damage',
    title: 'Coffee Spill on Laptop Keyboard',
    icon: <Laptop className="w-3.5 h-3.5 text-emerald-400" />,
    clientName: 'Jessica Taylor',
    phone: '+1 (555) 543-8891',
    company: 'Summit Legal',
    rawInput: "I accidentally tipped half a cup of black coffee onto the right side of my Dell XPS 15 laptop keyboard. I wiped it with paper towels, but 10 minutes later some keys stopped responding and then it turned off. It won't turn on or show a charging light when plugged in now.",
    categoryHint: 'Repair (Urgent)',
    badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40',
  },
];

interface PresetSelectorProps {
  onSelectPreset: (scenario: PresetScenario) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ onSelectPreset }) => {
  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-800/40 p-3.5">
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>One-Click Client Scenarios (Instant AI Test):</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {PRESET_SCENARIOS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelectPreset(preset)}
            className="group flex flex-col items-start gap-1 p-2.5 rounded-lg border border-slate-700/60 bg-slate-900/60 hover:bg-slate-800 hover:border-cyan-500/50 text-left transition-all cursor-pointer"
          >
            <div className="flex items-center gap-1.5 w-full">
              {preset.icon}
              <span className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                {preset.title}
              </span>
            </div>
            <div className="flex items-center justify-between w-full mt-1">
              <span className="text-[11px] text-slate-400 truncate">{preset.clientName}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${preset.badgeColor}`}>
                {preset.categoryHint}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
