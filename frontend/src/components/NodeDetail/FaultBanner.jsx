import React from 'react';
import { WifiOff } from 'lucide-react';

export default function FaultBanner({ node }) {
  if (!node) return null;

  const id = node.device_id || node.node_id;

  // Offline Indicator
  if (node.status === 'OFFLINE' || !node.timestamp) {
    return (
      <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-mono flex items-center gap-3">
        <WifiOff className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <div>
          <span className="text-slate-300 font-semibold">{id} is currently Offline.</span>
          <span className="text-slate-500 ml-2">Awaiting telemetry heartbeat...</span>
        </div>
      </div>
    );
  }

  return null;
}
