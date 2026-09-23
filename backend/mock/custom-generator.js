const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mqtt = require('mqtt');

const requiredEnvVars = ['MQTT_URL', 'MQTT_USER', 'MQTT_PASSWORD'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  console.error(`FATAL ERROR: Missing required environment variables.`);
  process.exit(1);
}

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

client.on('connect', () => {
  console.log('Custom publisher connected to HiveMQ Cloud');
  
  // Get payload from command line arguments or file
  const args = process.argv.slice(2);
  let payloadObj;

  if (args.length > 0) {
    try {
      payloadObj = JSON.parse(args[0]);
    } catch (err) {
      console.error('Invalid JSON payload in arguments:', err.message);
      process.exit(1);
    }
  } else {
    // Attempt to read from custom-payload.json
    try {
      const fs = require('fs');
      const path = require('path');
      const payloadStr = fs.readFileSync(path.join(__dirname, 'custom-payload.json'), 'utf8');
      payloadObj = JSON.parse(payloadStr);
      console.log('Read payload from custom-payload.json');
    } catch (err) {
      console.error('Failed to read from custom-payload.json and no arguments provided.');
      console.error(err.message);
      process.exit(1);
    }
  }

  // Publish to smartlight/telemetry
  client.publish('smartlight/telemetry', JSON.stringify(payloadObj), {}, (err) => {
    if (err) {
      console.error('Failed to publish message:', err);
    } else {
      console.log(`Successfully published message for ${payloadObj.node_id || 'unknown node'}`);
    }
    // Disconnect after publishing
    client.end();
  });
});

client.on('error', (err) => {
  console.error('Custom publisher MQTT connection error:', err);
  process.exit(1);
});
