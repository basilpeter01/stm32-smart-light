import React from 'react';
import { Map, Activity, Layers, Clock, AlertTriangle, Zap, Server } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'gis', label: 'Map View', icon: Map, active: false },
  { id: 'telemetry', label: 'Telemetry', icon: Activity, active: true },
  { id: 'inventory', label: 'Inventory', icon: Layers, active: false },
  { id: 'schedules', label: 'Schedules', icon: Clock, active: false },
  { id: 'diagnostics', label: 'Diagnostics', icon: AlertTriangle, active: false },
  { id: 'energy', label: 'Energy', icon: Zap, active: false },
];

export default function SidebarNav({ activeTab = 'telemetry', onSelectTab }) {
  return (
    <aside className="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-700 hidden lg:flex flex-col justify-between p-3 select-none">
      <div>
        <div className="text-[10px] tracking-wide text-slate-500 uppercase px-3 py-2 font-medium">
          Modules
        </div>
        <nav className="space-y-1 mt-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeTab;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab && onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Load Ratio Widget */}
      <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-slate-400">Load Ratio</span>
          <span className="text-emerald-400 font-semibold">73.4%</span>
        </div>
        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mb-2">
          <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: '73.4%' }}></div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>41,288 / 56,128</span>
          <span>Active</span>
        </div>
      </div>
    </aside>
  );
}
