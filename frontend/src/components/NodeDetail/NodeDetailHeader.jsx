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
    statusBadgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  }

  return (
    <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-5 py-3.5">
      <div>
        <h2 className="text-lg font-semibold text-white">
          {id}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Node Telemetry
        </p>
      </div>

      <div className="flex items-center gap-2">
        {isOnline && (
          <span className={`text-xs px-3 py-1 rounded border flex items-center gap-1.5 font-medium ${
            isLightOn 
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Lightbulb className={`w-3.5 h-3.5 ${isLightOn ? 'text-amber-400' : 'text-slate-500'}`} />
            {isLightOn ? 'Light ON' : 'Light OFF'}
          </span>
        )}
        <span className={`text-xs px-3 py-1 rounded border font-medium ${statusBadgeClass}`}>
          {statusText}
        </span>
      </div>
    </div>
  );
}
