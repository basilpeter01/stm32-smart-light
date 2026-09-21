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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// MongoDB Schema & Model
const telemetrySchema = new mongoose.Schema({
  node_id: { type: String, required: true },
  timestamp: { type: Number, required: true },
  ambient_light_adc: { type: Number, required: true },
  motion: { type: Boolean, required: true },
  led_pwm: { type: Number, required: true },
  current_ma: { type: Number, required: true },
  fault_code: { type: Number, required: true }
});

const Telemetry = mongoose.model('Telemetry', telemetrySchema);

// In-memory state and timers
const latestNodesState = new Map();
const lastDbSaveTime = new Map();
const nodeTimers = new Map();
const OFFLINE_TIMEOUT = 30000;

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

mqttClient.on('message', async (topic, message) => {
  if (topic === 'smartlight/telemetry') {
    try {
      const payload = JSON.parse(message.toString());
      const now = Date.now();

      const enrichedPayload = {
        ...payload,
        timestamp: now,
        status: 'ONLINE'
      };

      latestNodesState.set(payload.node_id, enrichedPayload);
      io.emit('telemetry_update', enrichedPayload);

      const lastSave = lastDbSaveTime.get(payload.node_id) || 0;
      if (payload.fault_code !== 0 || (now - lastSave) >= 30000) {
        await Telemetry.create(enrichedPayload);
        lastDbSaveTime.set(payload.node_id, now);
      }

      if (nodeTimers.has(payload.node_id)) {
        clearTimeout(nodeTimers.get(payload.node_id));
      }

      const timer = setTimeout(() => {
        const currentState = latestNodesState.get(payload.node_id);
        if (currentState) {
          const offlineState = {
            ...currentState,
            status: 'OFFLINE',
            timestamp: Date.now()
          };
          latestNodesState.set(payload.node_id, offlineState);
          io.emit('telemetry_update', offlineState);
        }
      }, OFFLINE_TIMEOUT);

      nodeTimers.set(payload.node_id, timer);

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
    const history = await Telemetry.find({ node_id: nodeId })
      .sort({ timestamp: -1 })
      .limit(50)
      .select('timestamp current_ma -_id');

    res.json(history.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await Telemetry.find({ fault_code: { $gt: 0 } })
      .sort({ timestamp: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
