import React from 'react';

export default function NodeDetailHeader({ node }) {
  if (!node) return null;

  const isOnline = node.status === 'ONLINE';
  const hasFault = node.fault_code && node.fault_code > 0;

  let statusText = 'Offline';
  let statusBadgeClass = 'bg-slate-700/50 text-slate-400 border-slate-600';

  if (hasFault) {
    statusText = node.fault_code === 1 ? 'Bulb Fault' : 'Overcurrent Fault';
    statusBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  } else if (isOnline) {
    statusText = 'Online';
    statusBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  }

  return (
    <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-5 py-3.5 shadow-sm">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">
          {node.node_id}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Live Node Telemetry
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs font-mono px-3 py-1 rounded-full border font-semibold ${statusBadgeClass}`}>
          {statusText}
        </span>
      </div>
    </div>
  );
}
