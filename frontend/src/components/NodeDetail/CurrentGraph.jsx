import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { Sun, Moon, Activity } from 'lucide-react';
import { LDR_DAY_THRESHOLD, LDR_MAX_SCALE } from '../../constants';

/* ── Tooltip for the Analog (LDR) pane ── */
function LdrTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const ldrVal = payload[0].value;
    const isNight = ldrVal >= LDR_DAY_THRESHOLD;

    return (
      <div className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg shadow-lg text-xs">
        <div className="text-slate-400 text-[11px] mb-1">{label}</div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">LDR:</span>
          <span className={`font-semibold ${isNight ? 'text-blue-400' : 'text-amber-400'}`}>
            {ldrVal} adc
          </span>
        </div>
        <div className={`text-[10px] mt-1 font-medium ${isNight ? 'text-blue-300' : 'text-amber-300'}`}>
          {isNight ? 'Night (>=2500)' : 'Day (<2500)'}
        </div>
      </div>
    );
  }
  return null;
}

/* ── Tooltip for the Digital (PIR + LED) pane ── */
function DigitalTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const pir = payload.find((p) => p.dataKey === 'motion');
    const led = payload.find((p) => p.dataKey === 'led');

    return (
      <div className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg shadow-lg text-xs">
        <div className="text-slate-400 text-[11px] mb-1">{label}</div>
        {pir && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">PIR:</span>
            <span className={`font-semibold ${pir.value ? 'text-amber-400' : 'text-slate-400'}`}>
              {pir.value ? 'Motion' : 'Clear'}
            </span>
          </div>
        )}
        {led && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">LED:</span>
            <span className={`font-semibold ${led.value ? 'text-emerald-400' : 'text-slate-400'}`}>
              {led.value ? 'ON' : 'OFF'}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function CurrentGraph({ historyData = [], currentNode }) {
  const liveLdr = currentNode ? Number(currentNode.ldr_value ?? currentNode.ambient_light_adc) || 0 : 0;
  const isNight = liveLdr >= LDR_DAY_THRESHOLD;

  // Format data for both charts (shared time axis, last 30 readings)
  const chartData = historyData.slice(-30).map((d, index) => {
    const timeStr = d.timestamp
      ? new Date(d.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : `#${index + 1}`;

    return {
      time: timeStr,
      ldr_value: Number(d.ldr_value ?? d.ambient_light_adc ?? d.current_ma) || 0,
      motion: d.motion_detected ? 1 : 0,
      led: d.light_status ? 1 : 0
    };
  });

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-white">
            Sensor History
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            {isNight ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span className="text-slate-400">{currentNode?.status === 'ONLINE' ? 'Live: ' : 'Last: '}</span>
            <span className={currentNode?.status === 'ONLINE' ? (isNight ? 'text-blue-400 font-medium' : 'text-amber-400 font-medium') : 'text-slate-400'}>
              {currentNode?.timestamp ? `${liveLdr} adc` : '--'}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Threshold: </span>
            <span className="text-amber-400 font-medium">{LDR_DAY_THRESHOLD} adc</span>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 w-full bg-slate-900/50 border border-slate-700/50 rounded-lg flex items-center justify-center text-xs text-slate-500">
          Waiting for telemetry data...
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* ── Top Pane: Analog LDR Reading ── */}
          <div>
            <div className="text-[10px] uppercase text-slate-500 font-medium mb-1 px-1">
              Ambient Light (LDR)
            </div>
            <div className="h-44 w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickLine={{ stroke: '#475569' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, LDR_MAX_SCALE]}
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickLine={{ stroke: '#475569' }}
                    unit=" adc"
                    ticks={[0, 1000, 2000, 2500, 3000, 4000]}
                  />
                  <Tooltip content={<LdrTooltip />} />
                  <ReferenceLine
                    y={LDR_DAY_THRESHOLD}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{
                      value: '2500 Threshold',
                      fill: '#f59e0b',
                      position: 'top',
                      fontSize: 10
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ldr_value"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 2, fill: '#38bdf8' }}
                    activeDot={{ r: 5, fill: '#7dd3fc' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Bottom Pane: Digital Traces (PIR + LED) ── */}
          <div>
            <div className="text-[10px] uppercase text-slate-500 font-medium mb-1 px-1 flex items-center gap-3">
              <span>Digital I/O</span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-amber-400/80"></span>
                <span className="normal-case text-slate-400">PIR Motion</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-emerald-400/80"></span>
                <span className="normal-case text-slate-400">LED Output</span>
              </span>
            </div>
            <div className="h-28 w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickLine={{ stroke: '#475569' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 1]}
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickLine={{ stroke: '#475569' }}
                    ticks={[0, 1]}
                    tickFormatter={(v) => (v === 1 ? 'HIGH' : 'LOW')}
                  />
                  <Tooltip content={<DigitalTooltip />} />
                  <Area
                    type="stepAfter"
                    dataKey="motion"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    fill="#f59e0b"
                    fillOpacity={0.1}
                    isAnimationActive={false}
                    dot={false}
                  />
                  <Area
                    type="stepAfter"
                    dataKey="led"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    fill="#10b981"
                    fillOpacity={0.15}
                    isAnimationActive={false}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
