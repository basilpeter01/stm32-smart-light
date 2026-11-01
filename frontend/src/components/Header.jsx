import React from 'react';
import { Lightbulb, Radio } from 'lucide-react';

export default function Header({ wsConnected, mqttActive }) {
  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      {/* App Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-white">
            Smart Street Light Monitor
          </h1>
          <p className="text-xs text-slate-400">
            Node Telemetry Dashboard
          </p>
        </div>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-3">
        {/* WebSocket Status */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-xs">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
          <span className="text-slate-400">WebSocket:</span>
          <span className={wsConnected ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
            {wsConnected ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* HiveMQ Status */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-xs">
          <Radio className={`w-3 h-3 ${mqttActive ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className="text-slate-400">MQTT:</span>
          <span className={mqttActive ? 'text-emerald-400 font-medium' : 'text-slate-400 font-medium'}>
            {mqttActive ? 'Connected' : 'Standby'}
          </span>
        </div>
      </div>
    </header>
  );
}
