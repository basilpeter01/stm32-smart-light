require('dotenv').config();

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

const NODES = ['POLE-02', 'POLE-03', 'POLE-04', 'POLE-05'];

function generateMockData(nodeId) {
  const isNight = new Date().getHours() >= 18 || new Date().getHours() < 6;
  const motion = Math.random() > 0.8;
  const faultRand = Math.random();

  let fault_code = 0;
  if (faultRand > 0.98) {
    fault_code = 1;
  } else if (faultRand > 0.95) {
    fault_code = 2;
  }

  let led_pwm = 0;
  let current_ma = 0;

  if (isNight) {
    led_pwm = motion ? 100 : 20;
    current_ma = motion ? 142.5 + (Math.random() * 5 - 2.5) : 28.5 + (Math.random() * 2 - 1);
  } else {
    led_pwm = 0;
    current_ma = 0.1 + Math.random() * 0.2;
  }

  if (fault_code === 1) {
    current_ma = 0;
  }

  return {
    node_id: nodeId,
    ambient_light_adc: isNight ? 100 + Math.floor(Math.random() * 50) : 3400 + Math.floor(Math.random() * 200),
    motion: isNight ? motion : false,
    led_pwm: led_pwm,
    current_ma: parseFloat(current_ma.toFixed(2)),
    fault_code: fault_code
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
