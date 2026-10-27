import React from 'react';
import { Lightbulb } from 'lucide-react';

export default function NodeDetailHeader({ node }) {
  if (!node) return null;

  const id = node.device_id || node.node_id;
  const isOnline = node.status === 'ONLINE';
  const isLightOn = Boolean(node.light_status);

  let statusText = 'Offline';
  let statusBadgeClass = 'bg-slate-700/50 text-slate-400 border-slate-600';

  if (isOnline) {
    statusText = 'Online';
    statusBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  }

  return (
    <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-5 py-3.5 shadow-sm">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">
          {id}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Live Node Telemetry
        </p>
      </div>

      <div className="flex items-center gap-2">
        {isOnline && (
          <span className={`text-xs font-mono px-3 py-1 rounded-full border flex items-center gap-1.5 font-medium ${
            isLightOn 
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Lightbulb className={`w-3.5 h-3.5 ${isLightOn ? 'text-amber-400' : 'text-slate-500'}`} />
            {isLightOn ? 'Lamp Active (ON)' : 'Standby (OFF)'}
          </span>
        )}
        <span className={`text-xs font-mono px-3 py-1 rounded-full border font-semibold ${statusBadgeClass}`}>
          {statusText}
        </span>
      </div>
    </div>
  );
}
