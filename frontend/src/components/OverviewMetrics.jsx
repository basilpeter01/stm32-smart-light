import React from 'react';
import { Layers, Activity, AlertTriangle, Zap } from 'lucide-react';

export default function OverviewMetrics({ nodes = [] }) {
  const totalPoles = nodes.length;
  const activeOnline = nodes.filter((n) => n.status === 'ONLINE').length;
  const activeFaults = nodes.filter((n) => n.fault_code && n.fault_code > 0).length;

  const onlineNodes = nodes.filter((n) => n.status === 'ONLINE');
  const totalCurrent = onlineNodes.reduce((sum, n) => sum + (Number(n.current_ma) || 0), 0);
  const avgCurrent = onlineNodes.length > 0 ? totalCurrent / onlineNodes.length : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Poles */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Poles</span>
          <Layers className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-white">
          {totalPoles}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          POLE-01 through POLE-05
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
          {totalPoles > 0 && activeOnline === totalPoles ? 'All nodes reporting' : `${totalPoles - activeOnline} offline`}
        </div>
      </div>

      {/* 3. Active Faults */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Active Faults</span>
          <AlertTriangle className={`w-4 h-4 ${activeFaults > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
        </div>
        <div className={`text-2xl font-bold font-mono ${activeFaults > 0 ? 'text-rose-400' : 'text-white'}`}>
          {activeFaults}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {activeFaults === 0 ? 'No active circuit faults' : `${activeFaults} pole(s) requiring attention`}
        </div>
      </div>

      {/* 4. Fleet Avg Current */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Avg Current</span>
          <Zap className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-cyan-400">
          {avgCurrent.toFixed(1)} <span className="text-sm font-normal text-slate-400">mA</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Total Fleet Draw: {totalCurrent.toFixed(1)} mA
        </div>
      </div>
    </div>
  );
}
