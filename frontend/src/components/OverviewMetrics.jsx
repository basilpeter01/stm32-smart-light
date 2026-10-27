import React from 'react';
import { Layers, Activity, Lightbulb, Sun, Moon } from 'lucide-react';
import { LDR_DAY_THRESHOLD } from '../constants';

export default function OverviewMetrics({ nodes = [] }) {
  const totalPoles = nodes.length;
  const activeOnline = nodes.filter((n) => n.status === 'ONLINE').length;
  const onlineNodes = nodes.filter((n) => n.status === 'ONLINE');

  const lightsOn = onlineNodes.filter((n) => Boolean(n.light_status)).length;

  const totalLdr = onlineNodes.reduce((sum, n) => sum + (Number(n.ldr_value) || 0), 0);
  const avgLdr = onlineNodes.length > 0 ? totalLdr / onlineNodes.length : 0;
  const isNightFleet = avgLdr >= LDR_DAY_THRESHOLD;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Street Lights */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Street Lights</span>
          <Layers className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-white">
          {totalPoles}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          LIGHT_01 through LIGHT_05
        </div>
      </div>

      {/* 2. Active Online */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Active Online</span>
          <Activity className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-400">
          {activeOnline} <span className="text-base text-slate-400 font-normal">/ {totalPoles}</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {totalPoles > 0 && activeOnline === totalPoles ? 'All devices transmitting' : `${totalPoles - activeOnline} offline`}
        </div>
      </div>

      {/* 3. Lights Illuminated */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Lights Illuminated</span>
          <Lightbulb className={`w-4 h-4 ${lightsOn > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
        </div>
        <div className={`text-2xl font-bold font-mono ${lightsOn > 0 ? 'text-amber-300' : 'text-white'}`}>
          {lightsOn} <span className="text-base text-slate-400 font-normal">/ {onlineNodes.length || totalPoles}</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {lightsOn === 0 ? 'All lamps in standby / off' : `${lightsOn} lamp(s) powered ON`}
        </div>
      </div>

      {/* 4. Fleet Avg LDR */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Fleet Avg LDR</span>
          {isNightFleet ? (
            <Moon className="w-4 h-4 text-blue-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </div>
        <div className="text-2xl font-bold font-mono text-sky-400">
          {onlineNodes.length > 0 ? avgLdr.toFixed(0) : '--'}
          <span className="text-xs text-slate-400 font-normal ml-1">adc</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {onlineNodes.length === 0 ? 'Awaiting telemetry' : isNightFleet ? 'Night Condition (>=2500)' : 'Day Condition (<2500)'}
        </div>
      </div>
    </div>
  );
}
