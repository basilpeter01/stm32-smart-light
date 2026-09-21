import React from 'react';
import { Sun, Moon, Eye, Sliders, WifiOff } from 'lucide-react';

export default function SensorCards({ node }) {
  if (!node) return null;

  const isOffline = node.status === 'OFFLINE' || !node.timestamp;
  const adcValue = Number(node.ambient_light_adc) || 0;
  const isNight = adcValue < 800;
  const motionActive = Boolean(node.motion);
  const pwm = Number(node.led_pwm) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Ambient Light */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Ambient Light</span>
          {isOffline ? (
            <WifiOff className="w-4 h-4 text-slate-500" />
          ) : isNight ? (
            <Moon className="w-4 h-4 text-blue-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </div>

        <div className="my-2">
          <div className="text-2xl font-bold font-mono text-white">
            {isOffline ? (
              <span className="text-slate-500">--</span>
            ) : (
              <>
                {adcValue} <span className="text-xs text-slate-400 font-normal">/ 4095</span>
              </>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {isOffline ? 'No Signal' : 'Raw ADC Conversion'}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-700/60">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium ${isOffline
            ? 'bg-slate-700/30 text-slate-400'
            : isNight
              ? 'bg-blue-500/20 text-blue-300'
              : 'bg-amber-500/20 text-amber-300'
            }`}>
            {isOffline ? 'Offline' : isNight ? 'Night Mode (<800)' : 'Day Mode (>=800)'}
          </span>
        </div>
      </div>

      {/* 2. Motion Detection (PIR) */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Motion Detection</span>
          <Eye className={`w-4 h-4 ${isOffline ? 'text-slate-500' : motionActive ? 'text-amber-400' : 'text-slate-400'}`} />
        </div>

        <div className="my-2">
          <div className="text-xl font-bold font-mono">
            {isOffline ? (
              <span className="text-slate-500">--</span>
            ) : motionActive ? (
              <span className="text-amber-400">Motion Detected</span>
            ) : (
              <span className="text-slate-400">Clear</span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {isOffline ? 'No Signal' : 'PIR Digital Sensor'}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-700/60">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium ${isOffline
            ? 'bg-slate-700/30 text-slate-400'
            : motionActive
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-slate-700/40 text-slate-400'
            }`}>
            {isOffline ? 'Offline' : motionActive ? 'Active' : 'Idle / No Movement'}
          </span>
        </div>
      </div>

      {/* 3. LED Output */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">LED Output</span>
          <Sliders className={`w-4 h-4 ${isOffline ? 'text-slate-500' : 'text-emerald-400'}`} />
        </div>

        <div className="my-2">
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {isOffline ? <span className="text-slate-500">--</span> : `${pwm}%`}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {isOffline ? 'No Signal' : 'PWM Duty Cycle'}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-700/60">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium ${isOffline
            ? 'bg-slate-700/30 text-slate-400'
            : 'bg-emerald-500/15 text-emerald-300'
            }`}>
            {isOffline
              ? 'Offline'
              : pwm === 100
                ? 'Illumination (100%)'
                : pwm === 20
                  ? 'Dimming (20%)'
                  : 'Standby (0%)'}
          </span>
        </div>
      </div>
    </div>
  );
}
