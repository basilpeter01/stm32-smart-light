import React from 'react';
import { AlertCircle, WifiOff } from 'lucide-react';
import { LDR_DAY_THRESHOLD } from '../../constants';

export default function FaultBanner({ node }) {
  if (!node) return null;

  const id = node.device_id || node.node_id;

  // 1. Offline Indicator
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

  // 2. Daytime Illumination Notice (LDR >= 500 and Light is ON)
  const isLightOn = Boolean(node.light_status);
  const ldrVal = Number(node.ldr_value) || 0;
  const isDaytime = ldrVal >= LDR_DAY_THRESHOLD;

  if (isLightOn && isDaytime) {
    return (
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-amber-200 text-sm">
            Daytime Illumination Triggered
          </div>
          <div className="text-amber-300/90 mt-0.5">
            Lamp is actively illuminated while ambient light sensor reports daylight (LDR: {ldrVal} adc).
          </div>
        </div>
      </div>
    );
  }

  return null;
}
