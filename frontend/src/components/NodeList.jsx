import React from 'react';

export default function NodeList({ nodes = [], selectedNodeId, onSelectNode }) {
  return (
    <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-3">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
        Street Poles ({nodes.length})
      </div>

      <div className="flex flex-col gap-2.5">
        {nodes.map((node) => {
          const isSelected = node.node_id === selectedNodeId;
          const isOnline = node.status === 'ONLINE';
          const hasFault = node.fault_code && node.fault_code > 0;

          let statusText = 'Offline';
          let statusBadgeClass = 'bg-slate-700/50 text-slate-400 border-slate-600';

          if (hasFault) {
            statusText = node.fault_code === 1 ? 'Bulb Fault' : 'Overcurrent';
            statusBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
          } else if (isOnline) {
            statusText = 'Online';
            statusBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
          }

          return (
            <button
              key={node.node_id}
              onClick={() => onSelectNode(node.node_id)}
              className={`text-left p-3.5 rounded-xl transition-all border ${
                isSelected
                  ? 'bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 hover:border-slate-600'
              }`}
            >
              {/* Header: Node ID and Status Pill */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-base text-white">
                  {node.node_id}
                </span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border font-medium ${statusBadgeClass}`}>
                  {statusText}
                </span>
              </div>

              {/* Metrics: PWM and Current Draw */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700/60 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">
                    {isOnline ? 'LED PWM' : 'Last PWM'}
                  </span>
                  <span className={isOnline ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
                    {node.timestamp ? `${node.led_pwm ?? 0}%` : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">
                    {isOnline ? 'Current' : 'Last Current'}
                  </span>
                  <span className={isOnline ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
                    {node.timestamp && node.current_ma != null
                      ? `${Number(node.current_ma).toFixed(1)} mA`
                      : '--'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
