import React from 'react';
import { Sun, Moon, Eye, Lightbulb, WifiOff } from 'lucide-react';
import { LDR_DAY_THRESHOLD } from '../../constants';

export default function SensorCards({ node }) {
  if (!node) return null;

  const isOffline = node.status === 'OFFLINE' || !node.timestamp;
  const ldrVal = Number(node.ldr_value ?? node.ambient_light_adc) || 0;
  const isNight = ldrVal >= LDR_DAY_THRESHOLD;
  const motionActive = Boolean(node.motion_detected ?? node.motion);
  const isLightOn = Boolean(node.light_status ?? (node.led_pwm > 0));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Ambient Light (LDR) */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase">Ambient Light (LDR)</span>
          {isOffline ? (
            <WifiOff className="w-4 h-4 text-slate-500" />
          ) : isNight ? (
            <Moon className="w-4 h-4 text-blue-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </div>

        <div className="my-2">
          <div className="text-2xl font-bold text-white">
            {isOffline ? (
              <span className="text-slate-500">--</span>
            ) : (
              <>
                {ldrVal} <span className="text-xs text-slate-400 font-normal">adc</span>
              </>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {isOffline ? 'No data' : 'Photoresistor reading'}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-700/60">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isOffline
            ? 'bg-slate-700/30 text-slate-400'
            : isNight
              ? 'bg-blue-500/15 text-blue-300'
              : 'bg-amber-500/15 text-amber-300'
            }`}>
            {isOffline ? 'Offline' : isNight ? 'Night' : 'Day'}
          </span>
        </div>
      </div>

      {/* 2. Motion Detection (PIR) */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase">Motion (PIR)</span>
          <Eye className={`w-4 h-4 ${isOffline ? 'text-slate-500' : motionActive ? 'text-amber-400' : 'text-slate-400'}`} />
        </div>

        <div className="my-2">
          <div className="text-xl font-bold">
            {isOffline ? (
              <span className="text-slate-500">--</span>
            ) : motionActive ? (
              <span className="text-amber-400">Detected</span>
            ) : (
              <span className="text-slate-400">Clear</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {isOffline ? 'No data' : 'PIR sensor'}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-700/60">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isOffline
            ? 'bg-slate-700/30 text-slate-400'
            : motionActive
              ? 'bg-amber-500/15 text-amber-300'
              : 'bg-slate-700/40 text-slate-400'
            }`}>
            {isOffline ? 'Offline' : motionActive ? 'Movement' : 'No movement'}
          </span>
        </div>
      </div>

      {/* 3. Light Output Status (ON / OFF) */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase">Light Status</span>
          <Lightbulb className={`w-4 h-4 ${isOffline ? 'text-slate-500' : isLightOn ? 'text-emerald-400' : 'text-slate-500'}`} />
        </div>

        <div className="my-2">
          <div className="text-2xl font-bold">
            {isOffline ? (
              <span className="text-slate-500">--</span>
            ) : isLightOn ? (
              <span className="text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                ON
              </span>
            ) : (
              <span className="text-slate-400">OFF</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {isOffline ? 'No data' : 'Street light'}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-700/60">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isOffline
            ? 'bg-slate-700/30 text-slate-400'
            : isLightOn
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'bg-slate-700/40 text-slate-400'
            }`}>
            {isOffline ? 'Offline' : isLightOn ? 'Active' : 'Off'}
          </span>
        </div>
      </div>
    </div>
  );
}
