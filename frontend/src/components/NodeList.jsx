import React from 'react';
import { Eye } from 'lucide-react';

export default function NodeList({ nodes = [], selectedNodeId, onSelectNode }) {
  return (
    <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-3">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
        Street Lights ({nodes.length})
      </div>

      <div className="flex flex-col gap-2.5">
        {nodes.map((node) => {
          const id = node.device_id || node.node_id;
          const isSelected = id === selectedNodeId;
          const isOnline = node.status === 'ONLINE';
          const isLightOn = Boolean(node.light_status);
          const motionActive = Boolean(node.motion_detected);

          let statusText = 'Offline';
          let statusBadgeClass = 'bg-slate-700/50 text-slate-400 border-slate-600';

          if (isOnline) {
            statusText = isLightOn ? 'Active (ON)' : 'Standby (OFF)';
            statusBadgeClass = isLightOn
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
              : 'bg-blue-500/15 text-blue-300 border-blue-500/30';
          }

          return (
            <button
              key={id}
              onClick={() => onSelectNode(id)}
              className={`text-left p-3.5 rounded-xl transition-all border ${
                isSelected
                  ? 'bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 hover:border-slate-600'
              }`}
            >
              {/* Header: Device ID, Motion indicator, and Status Pill */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-white">
                    {id}
                  </span>
                  {motionActive && isOnline && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30" title="Motion Detected">
                      <Eye className="w-2.5 h-2.5" />
                      PIR
                    </span>
                  )}
                </div>

                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border font-medium ${statusBadgeClass}`}>
                  {statusText}
                </span>
              </div>

              {/* Metrics: Light Status and LDR Sensor Value */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700/60 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">
                    Light State
                  </span>
                  <span className={!node.timestamp ? 'text-slate-500' : isLightOn ? 'text-emerald-400 font-bold' : 'text-slate-300 font-semibold'}>
                    {!node.timestamp ? '--' : isLightOn ? 'LIGHT ON' : 'STANDBY'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">
                    Ambient LDR
                  </span>
                  <span className={isOnline && node.timestamp ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
                    {node.timestamp && node.ldr_value != null ? `${node.ldr_value} adc` : '--'}
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
