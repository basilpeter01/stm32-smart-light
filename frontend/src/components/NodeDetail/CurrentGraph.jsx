import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { Activity } from 'lucide-react';
import { OVERCURRENT_CEILING_MA } from '../../constants';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const current = payload[0].value;
    const isOvercurrent = current >= OVERCURRENT_CEILING_MA;

    return (
      <div className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg shadow-xl font-mono text-xs">
        <div className="text-slate-400 text-[11px] mb-1">{label}</div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Current:</span>
          <span className={`font-bold ${isOvercurrent ? 'text-rose-400' : 'text-emerald-400'}`}>
            {typeof current === 'number' ? current.toFixed(1) : current} mA
          </span>
        </div>
        {isOvercurrent && (
          <div className="text-rose-400 text-[10px] mt-1 font-semibold">
            Overcurrent Warning (&gt;160 mA)
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function CurrentGraph({ historyData = [], currentNode }) {
  const currentMa = currentNode ? Number(currentNode.current_ma) || 0 : 0;

  // Format data for Recharts (last 30 readings)
  const chartData = historyData.slice(-30).map((d, index) => {
    const timeStr = d.timestamp
      ? new Date(d.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : `#${index + 1}`;

    return {
      time: timeStr,
      current_ma: Number(d.current_ma) || 0
    };
  });

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Current Draw History
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400">Live: </span>
            <span className="text-emerald-400 font-bold">{currentMa.toFixed(1)} mA</span>
          </div>
          <div>
            <span className="text-slate-400">Safe Max: </span>
            <span className="text-amber-400 font-bold">{OVERCURRENT_CEILING_MA.toFixed(1)} mA</span>
          </div>
        </div>
      </div>

      {/* Recharts LineChart */}
      <div className="h-64 w-full bg-slate-900/70 border border-slate-700/60 rounded-lg p-2">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
            Waiting for live telemetry readings to populate history...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />

              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#475569' }}
                interval="preserveStartEnd"
              />

              <YAxis
                domain={[0, 200]}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#475569' }}
                unit=" mA"
                ticks={[0, 50, 100, 150, 200]}
              />

              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine
                y={OVERCURRENT_CEILING_MA}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: '160 mA Max',
                  fill: '#f59e0b',
                  position: 'top',
                  fontSize: 10,
                  fontFamily: 'monospace'
                }}
              />

              <Line
                type="monotone"
                dataKey="current_ma"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 2, fill: '#10b981' }}
                activeDot={{ r: 5, fill: '#34d399' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
