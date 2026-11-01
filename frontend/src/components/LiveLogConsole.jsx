import React, { useState, useRef, useEffect } from 'react';
import { Terminal, ChevronUp, ChevronDown, Trash2, Pause, Play } from 'lucide-react';

export default function LiveLogConsole({ logs = [], onClearLogs }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollContainerRef = useRef(null);

  // Auto-scroll ONLY inside the terminal container, never hijacking window/page scroll
  useEffect(() => {
    if (!isCollapsed && autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs, isCollapsed, autoScroll]);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden mt-6">
      {/* Header Bar */}
      <div className="px-4 py-2.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium text-slate-200">
            Live Log
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-400">
            {logs.length} packets
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 px-2 rounded text-xs flex items-center gap-1 transition-colors border ${autoScroll
              ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              }`}
            title={autoScroll ? "Pause auto-scroll inside terminal" : "Resume auto-scroll inside terminal"}
          >
            {autoScroll ? <Pause className="w-3 h-3 text-slate-400" /> : <Play className="w-3 h-3 text-amber-400" />}
            <span className="text-[11px]">{autoScroll ? 'Pause' : 'Paused'}</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={onClearLogs}
            className="p-1 px-2 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Clear</span>
          </button>

          {/* Expand / Collapse Drawer */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 px-2 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="text-[11px]">{isCollapsed ? 'Expand' : 'Collapse'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Content Box */}
      {!isCollapsed && (
        <div
          ref={scrollContainerRef}
          className="p-3 max-h-44 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 bg-slate-900"
        >
          {logs.length === 0 ? (
            <div className="text-slate-600 italic py-2">
              Waiting for packets...
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-slate-500 select-none">[{log.time}]</span>
                <span className="text-emerald-400 font-medium select-none">
                  {log.device_id || log.node_id}:
                </span>
                <span className="text-slate-300 break-all">
                  {JSON.stringify(log.payload)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
