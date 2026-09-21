import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import OverviewMetrics from './components/OverviewMetrics';
import NodeList from './components/NodeList';
import NodeDetailHeader from './components/NodeDetail/NodeDetailHeader';
import FaultBanner from './components/NodeDetail/FaultBanner';
import SensorCards from './components/NodeDetail/SensorCards';
import CurrentGraph from './components/NodeDetail/CurrentGraph';
import LiveLogConsole from './components/LiveLogConsole';
import { fetchNodes, fetchNodeHistory } from './services/api';
import { initSocket, disconnectSocket } from './services/socket';
import { DEFAULT_POLES, MAX_HISTORY_POINTS } from './constants';

const INITIAL_POLES = DEFAULT_POLES.map((id) => ({
  node_id: id,
  status: 'OFFLINE',
  ambient_light_adc: 0,
  motion: false,
  led_pwm: 0,
  current_ma: 0,
  fault_code: 0,
  timestamp: null
}));

export default function App() {
  const [nodes, setNodes] = useState(INITIAL_POLES);
  const [selectedNodeId, setSelectedNodeId] = useState('POLE-01');
  const [histories, setHistories] = useState({});
  const [logs, setLogs] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [mqttActive, setMqttActive] = useState(false);

  const selectedNodeIdRef = useRef(selectedNodeId);
  selectedNodeIdRef.current = selectedNodeId;
  const hasUserSelectedRef = useRef(false);

  // Fetch initial history for a specific node from REST API
  const loadHistoryForNode = useCallback(async (nodeId) => {
    const history = await fetchNodeHistory(nodeId);
    if (history && Array.isArray(history) && history.length > 0) {
      setHistories((prev) => ({
        ...prev,
        [nodeId]: history.slice(-MAX_HISTORY_POINTS)
      }));
    }
  }, []);

  // Fetch initial node states from backend on mount
  const loadInitialNodes = useCallback(async () => {
    const serverNodes = await fetchNodes();
    if (serverNodes && Array.isArray(serverNodes) && serverNodes.length > 0) {
      setNodes((prev) => {
        const map = new Map(prev.map((n) => [n.node_id, n]));
        serverNodes.forEach((sn) => {
          map.set(sn.node_id, { ...map.get(sn.node_id), ...sn, status: sn.status || 'ONLINE' });
        });
        return Array.from(map.values());
      });
      setMqttActive(true);
    }
  }, []);

  // Handle incoming live telemetry packet over Socket.io
  const handleTelemetryUpdate = useCallback((packet) => {
    if (!packet || !packet.node_id) return;

    // Auto-focus first active transmitting pole if user hasn't picked one
    if (!hasUserSelectedRef.current && selectedNodeIdRef.current === 'POLE-01' && packet.node_id !== 'POLE-01') {
      setSelectedNodeId(packet.node_id);
      hasUserSelectedRef.current = true;
    }

    // 1. Append to raw logs terminal (last 100 packets)
    const timeStr = new Date(packet.timestamp || Date.now()).toLocaleTimeString([], { hour12: false });
    setLogs((prev) => [
      ...prev.slice(-99),
      {
        time: timeStr,
        node_id: packet.node_id,
        payload: {
          ambient_light_adc: packet.ambient_light_adc,
          motion: packet.motion,
          led_pwm: packet.led_pwm,
          current_ma: packet.current_ma,
          fault_code: packet.fault_code
        }
      }
    ]);

    // 2. Update pole in nodes list
    setNodes((prev) => {
      const index = prev.findIndex((n) => n.node_id === packet.node_id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          ...packet,
          status: packet.status || 'ONLINE'
        };
        return updated;
      }
      return [...prev, { ...packet, status: packet.status || 'ONLINE' }];
    });

    // 3. Append to that node's history buffer (sliding window of max 30 readings)
    setHistories((prev) => {
      const existing = prev[packet.node_id] || [];
      const newPoint = {
        timestamp: packet.timestamp || Date.now(),
        current_ma: Number(packet.current_ma) || 0
      };
      return {
        ...prev,
        [packet.node_id]: [...existing, newPoint].slice(-MAX_HISTORY_POINTS)
      };
    });

    setMqttActive(true);
  }, []);

  // Initialize Socket.io connection on mount
  useEffect(() => {
    loadInitialNodes();
    loadHistoryForNode('POLE-01');

    initSocket({
      onConnect: () => {
        setWsConnected(true);
      },
      onDisconnect: () => {
        setWsConnected(false);
      },
      onError: () => {
        setWsConnected(false);
      },
      onTelemetryUpdate: handleTelemetryUpdate
    });

    return () => {
      disconnectSocket();
    };
  }, [loadInitialNodes, loadHistoryForNode, handleTelemetryUpdate]);

  // Node selection handler
  const handleSelectNode = (nodeId) => {
    setSelectedNodeId(nodeId);
    hasUserSelectedRef.current = true;
    // If we don't have cached history for this node yet, fetch from backend
    if (!histories[nodeId] || histories[nodeId].length === 0) {
      loadHistoryForNode(nodeId);
    }
  };

  const selectedNode = nodes.find((n) => n.node_id === selectedNodeId) || nodes[0];
  const activeHistory = histories[selectedNodeId] || [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* 1. Top Header */}
      <Header wsConnected={wsConnected} mqttActive={mqttActive} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {/* 2. Top Stats Row (4 KPI Cards) */}
        <OverviewMetrics nodes={nodes} />

        {/* 3. Master-Detail Section (Two Columns) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start flex-1">
          {/* Left Column (Width: 320px) */}
          <NodeList
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
          />

          {/* Right Column (Remaining Width) */}
          <div className="flex-1 w-full flex flex-col gap-4">
            {/* Selected Pole Header */}
            <NodeDetailHeader node={selectedNode} />

            {/* Fault Alert Banner (or Offline Indicator) */}
            <FaultBanner
              node={selectedNode}
              faultCode={selectedNode?.fault_code || 0}
              ledPwm={selectedNode?.led_pwm || 0}
              currentMa={selectedNode?.current_ma || 0}
            />

            {/* 3 Sensor Telemetry Cards */}
            <SensorCards node={selectedNode} />

            {/* Real-time Recharts LineChart for selected pole */}
            <CurrentGraph
              historyData={activeHistory}
              currentNode={selectedNode}
            />
          </div>
        </div>

        {/* 4. Bottom Collapsible Drawer for Raw JSON Packets */}
        <LiveLogConsole
          logs={logs}
          onClearLogs={() => setLogs([])}
        />
      </main>
    </div>
  );
}
