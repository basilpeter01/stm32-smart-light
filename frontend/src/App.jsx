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
  device_id: id,
  node_id: id,
  status: 'OFFLINE',
  light_status: false,
  ldr_value: 0,
  motion_detected: false,
  timestamp: null
}));

export default function App() {
  const [nodes, setNodes] = useState(INITIAL_POLES);
  const [selectedNodeId, setSelectedNodeId] = useState('LIGHT_01');
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
        const map = new Map(prev.map((n) => [n.device_id || n.node_id, n]));
        serverNodes.forEach((sn) => {
          const id = sn.device_id || sn.node_id;
          map.set(id, { ...map.get(id), ...sn, device_id: id, node_id: id, status: sn.status || 'ONLINE' });
        });
        return Array.from(map.values());
      });
      setMqttActive(true);
    }
  }, []);

  // Handle incoming live telemetry packet over Socket.io
  const handleTelemetryUpdate = useCallback((packet) => {
    const id = packet.device_id || packet.node_id;
    if (!packet || !id) return;

    // Auto-focus first active transmitting pole if user hasn't manually picked one
    if (!hasUserSelectedRef.current && selectedNodeIdRef.current === 'LIGHT_01' && id !== 'LIGHT_01') {
      setSelectedNodeId(id);
      hasUserSelectedRef.current = true;
    }

    // 1. Append to raw logs terminal (last 100 packets)
    const timeStr = new Date(packet.timestamp || Date.now()).toLocaleTimeString([], { hour12: false });
    setLogs((prev) => [
      ...prev.slice(-99),
      {
        time: timeStr,
        device_id: id,
        node_id: id,
        payload: {
          device_id: id,
          light_status: Boolean(packet.light_status),
          ldr_value: Number(packet.ldr_value ?? packet.ambient_light_adc ?? 0),
          motion_detected: Boolean(packet.motion_detected ?? packet.motion)
        }
      }
    ]);

    // 2. Update pole in nodes list
    setNodes((prev) => {
      const index = prev.findIndex((n) => (n.device_id || n.node_id) === id);
      const updatedNode = {
        device_id: id,
        node_id: id,
        ...packet,
        status: packet.status || 'ONLINE'
      };

      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...updatedNode };
        return updated;
      }
      return [...prev, updatedNode];
    });

    // 3. Append to that node's history buffer (sliding window of max 30 readings)
    setHistories((prev) => {
      const existing = prev[id] || [];
      const newPoint = {
        timestamp: packet.timestamp || Date.now(),
        ldr_value: Number(packet.ldr_value ?? packet.ambient_light_adc) || 0,
        light_status: Boolean(packet.light_status)
      };
      return {
        ...prev,
        [id]: [...existing, newPoint].slice(-MAX_HISTORY_POINTS)
      };
    });

    setMqttActive(true);
  }, []);

  // Initialize Socket.io connection on mount
  useEffect(() => {
    loadInitialNodes();
    loadHistoryForNode('LIGHT_01');

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
    if (!histories[nodeId] || histories[nodeId].length === 0) {
      loadHistoryForNode(nodeId);
    }
  };

  const selectedNode = nodes.find((n) => (n.device_id || n.node_id) === selectedNodeId) || nodes[0];
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

            {/* Informational Alert Banner (or Offline Indicator) */}
            <FaultBanner node={selectedNode} />

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
