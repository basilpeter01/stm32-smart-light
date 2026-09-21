import React from 'react';
import { AlertTriangle, AlertCircle, WifiOff } from 'lucide-react';

export default function FaultBanner({ node, faultCode = 0, ledPwm = 0, currentMa = 0 }) {
  // If the node is offline, show a clear informational offline banner
  if (node && node.status === 'OFFLINE') {
    return (
      <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-mono flex items-center gap-3">
        <WifiOff className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <div>
          <span className="text-slate-300 font-semibold">{node.node_id} is Offline.</span>{' '}
          {node.node_id === 'POLE-01'
            ? null
            : 'No telemetry packets received yet.'}
        </div>
      </div>
    );
  }

  // If node is online and healthy, show no banner
  if (!faultCode || faultCode === 0) {
    return null;
  }

  // Fault 1: Bulb failure (open-circuit)
  if (faultCode === 1) {
    return (
      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-rose-200 text-sm">
            Bulb Failure Detected (Open-Circuit)
          </div>
          <div className="text-rose-300/90 mt-0.5">
            LED PWM commanded to {ledPwm}%, but measured current draw is {Number(currentMa).toFixed(1)} mA.
          </div>
        </div>
      </div>
    );
  }

  // Fault 2: Overcurrent
  if (faultCode === 2) {
    return (
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-amber-200 text-sm">
            Overcurrent Alert
          </div>
          <div className="text-amber-300/90 mt-0.5">
            Current draw ({Number(currentMa).toFixed(1)} mA) exceeds safe operational limits (160.0 mA).
          </div>
        </div>
      </div>
    );
  }

  return null;
}
