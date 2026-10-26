const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const requiredEnvVars = ['MQTT_URL', 'MQTT_USER', 'MQTT_PASSWORD'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  console.error(`FATAL ERROR: Missing required environment variables.`);
  process.exit(1);
}

const mqtt = require('mqtt');

const MQTT_URL = process.env.MQTT_URL;
const MQTT_USER = process.env.MQTT_USER;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

const client = mqtt.connect(MQTT_URL, {
  port: 8883,
  protocol: 'mqtts',
  username: MQTT_USER,
  password: MQTT_PASSWORD,
  rejectUnauthorized: true
});

const NODES = ['LIGHT_02', 'LIGHT_03', 'LIGHT_04', 'LIGHT_05'];

function generateMockData(nodeId) {
  const isNight = new Date().getHours() >= 18 || new Date().getHours() < 6;
  const motion = Math.random() > 0.7;
  // Realistic LDR values: Night < 500, Day >= 500
  const ldr_value = isNight ? 180 + Math.floor(Math.random() * 90) : 620 + Math.floor(Math.random() * 200);
  const light_status = isNight ? (motion || Math.random() > 0.3) : false;

  return {
    device_id: nodeId,
    light_status: light_status,
    ldr_value: ldr_value,
    motion_detected: motion
  };
}

client.on('connect', () => {
  console.log('Mock generator connected to HiveMQ Cloud');

  NODES.forEach((nodeId) => {
    const interval = Math.floor(Math.random() * 3000) + 4000;
    setInterval(() => {
      const payload = generateMockData(nodeId);
      client.publish('smartlight/telemetry', JSON.stringify(payload));
      console.log(`Published mock data for ${nodeId}`);
    }, interval);
  });
});

client.on('error', (err) => {
  console.error('Mock generator MQTT connection error:', err);
});
