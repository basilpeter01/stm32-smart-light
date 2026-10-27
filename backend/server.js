require('dotenv').config();

const requiredEnvVars = ['MQTT_URL', 'MQTT_USER', 'MQTT_PASSWORD', 'MONGO_URI'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  console.error(`FATAL ERROR: Missing required environment variables.`);
  process.exit(1);
}

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const { Server } = require('socket.io');
const cors = require('cors');

const ALLOWED_ORIGINS = [
  'http://localhost:5173', // localhost vite server
];

if (process.env.FRONTEND_URL) {
  ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

// MongoDB Schema & Model
const telemetrySchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  node_id: { type: String }, // compatibility alias
  timestamp: { type: Number, required: true },
  light_status: { type: Boolean, required: true },
  ldr_value: { type: Number, required: true },
  motion_detected: { type: Boolean, required: true }
});

const Telemetry = mongoose.model('Telemetry', telemetrySchema);

// In-memory state and timers
const latestNodesState = new Map();
const lastDbSaveTime = new Map();
const nodeTimers = new Map();
const OFFLINE_TIMEOUT = 120000; // 2 minutes

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB Atlas');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Connect to HiveMQ
const mqttClient = mqtt.connect(process.env.MQTT_URL, {
  port: 8883,
  protocol: 'mqtts',
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
  rejectUnauthorized: true
});

mqttClient.on('connect', () => {
  console.log('Connected to HiveMQ Cloud');
  mqttClient.subscribe('smartlight/telemetry', (err) => {
    if (err) {
      console.error('MQTT subscribe error:', err);
    } else {
      console.log('Subscribed to topic: smartlight/telemetry');
    }
  });
});

mqttClient.on('error', (err) => {
  console.error('MQTT connection error:', err);
});

let totalPackets = 0;
let packetsLastInterval = 0;

setInterval(() => {
  console.log(`Info: ${packetsLastInterval} packets received in last 30 sec(${totalPackets} total)`);
  packetsLastInterval = 0;
}, 30000);

mqttClient.on('message', async (topic, message) => {
  if (topic === 'smartlight/telemetry') {
    try {
      totalPackets++;
      packetsLastInterval++;
      const payload = JSON.parse(message.toString());
      const now = Date.now();

      const rawId = payload.device_id || payload.node_id;
      if (!rawId) return;

      const lightStatus = Boolean(payload.light_status ?? (payload.led_pwm > 0));
      const ldrValue = Number(payload.ldr_value ?? payload.ambient_light_adc ?? 0);
      const motionDetected = Boolean(payload.motion_detected ?? payload.motion);

      const enrichedPayload = {
        device_id: rawId,
        node_id: rawId, // provide alias so frontend can use either
        light_status: lightStatus,
        ldr_value: ldrValue,
        motion_detected: motionDetected,
        timestamp: now,
        status: 'ONLINE'
      };

      latestNodesState.set(rawId, enrichedPayload);
      io.emit('telemetry_update', enrichedPayload);

      const lastSave = lastDbSaveTime.get(rawId) || 0;
      if ((now - lastSave) >= 30000) {
        await Telemetry.create({
          device_id: rawId,
          node_id: rawId,
          timestamp: now,
          light_status: lightStatus,
          ldr_value: ldrValue,
          motion_detected: motionDetected
        });
        lastDbSaveTime.set(rawId, now);
      }

      if (nodeTimers.has(rawId)) {
        clearTimeout(nodeTimers.get(rawId));
      }

      const timer = setTimeout(() => {
        const currentState = latestNodesState.get(rawId);
        if (currentState) {
          const offlineState = {
            ...currentState,
            status: 'OFFLINE',
            timestamp: Date.now()
          };
          latestNodesState.set(rawId, offlineState);
          io.emit('telemetry_update', offlineState);
        }
      }, OFFLINE_TIMEOUT);

      nodeTimers.set(rawId, timer);

    } catch (error) {
      console.error('Error processing MQTT message:', error);
    }
  }
});

// REST Endpoints
app.get('/api/nodes', (req, res) => {
  const nodesArray = Array.from(latestNodesState.values());
  res.json(nodesArray);
});

app.get('/api/nodes/:id/history', async (req, res) => {
  try {
    const nodeId = req.params.id;
    const history = await Telemetry.find({
      $or: [{ device_id: nodeId }, { node_id: nodeId }]
    })
      .sort({ timestamp: -1 })
      .limit(50)
      .select('timestamp ldr_value light_status -_id');

    res.json(history.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    // Find daytime illumination anomaly (light ON while daylight: ldr_value < 2500)
    const alerts = await Telemetry.find({
      ldr_value: { $lt: 2500 },
      light_status: true
    })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
