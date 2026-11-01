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
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase">Total Nodes</span>
          <Layers className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold text-white">
          {totalPoles}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          LIGHT_01 through LIGHT_05
        </div>
      </div>

      {/* 2. Active Online */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase">Online</span>
          <Activity className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold text-emerald-400">
          {activeOnline} <span className="text-base text-slate-400 font-normal">/ {totalPoles}</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {totalPoles > 0 && activeOnline === totalPoles ? 'All nodes reporting' : `${totalPoles - activeOnline} offline`}
        </div>
      </div>

      {/* 3. Lights On */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase">Lights On</span>
          <Lightbulb className={`w-4 h-4 ${lightsOn > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
        </div>
        <div className={`text-2xl font-bold ${lightsOn > 0 ? 'text-amber-300' : 'text-white'}`}>
          {lightsOn} <span className="text-base text-slate-400 font-normal">/ {onlineNodes.length || totalPoles}</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {lightsOn === 0 ? 'All lights off' : `${lightsOn} light(s) on`}
        </div>
      </div>

      {/* 4. Avg LDR */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase">Avg LDR</span>
          {isNightFleet ? (
            <Moon className="w-4 h-4 text-blue-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </div>
        <div className="text-2xl font-bold text-sky-400">
          {onlineNodes.length > 0 ? avgLdr.toFixed(0) : '--'}
          <span className="text-xs text-slate-400 font-normal ml-1">adc</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {onlineNodes.length === 0 ? 'No data yet' : isNightFleet ? 'Night (>=2500)' : 'Day (<2500)'}
        </div>
      </div>
    </div>
  );
}
