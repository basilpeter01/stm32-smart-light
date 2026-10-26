const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const mqtt = require('mqtt');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// ============================================================================
// ⚠️ HARDWARE SERIAL CONFIGURATION
// ============================================================================
// If your STM32 uses a different COM port, either:
//   1. Edit SERIAL_PORT in your backend/.env file (e.g. SERIAL_PORT=COM4)
//   2. Or edit the DEFAULT_COM_PORT variable below directly
// ============================================================================
const DEFAULT_COM_PORT = process.env.SERIAL_PORT || 'COM3'; // <-- CHANGE PORT HERE IF NEEDED
const DEFAULT_BAUD_RATE = parseInt(process.env.SERIAL_BAUD || '115200', 10);
const MQTT_TOPIC = 'smartlight/telemetry';

// Check if running in mock/simulation mode (no physical USB connected)
const IS_MOCK_MODE = process.argv.includes('--mock') || process.argv.includes('-m');

// Validate MQTT credentials
const requiredEnvVars = ['MQTT_URL', 'MQTT_USER', 'MQTT_PASSWORD'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  console.error(`FATAL ERROR: Missing required MQTT environment variables: ${missingVars.join(', ')}`);
  console.error('Make sure backend/.env exists and contains MQTT_URL, MQTT_USER, MQTT_PASSWORD.');
  process.exit(1);
}

// --- 1. CONNECT TO HIVEMQ CLOUD ---
console.log('Connecting to HiveMQ Cloud...');
const mqttClient = mqtt.connect(process.env.MQTT_URL, {
  port: 8883,
  protocol: 'mqtts',
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
  rejectUnauthorized: true
});

mqttClient.on('connect', () => {
  console.log('✅ Connected to HiveMQ Cloud successfully.\n');
  if (IS_MOCK_MODE) {
    startMockHardwareLoop();
  } else {
    startSerialPort();
  }
});

mqttClient.on('error', (err) => {
  console.error('❌ HiveMQ MQTT Connection Error:', err.message);
});

// --- 2. PACKET ADAPTER (Option 1: Hardware Schema -> Backend Schema) ---
function processAndForwardPacket(rawLine) {
  const timestamp = new Date().toLocaleTimeString([], { hour12: false });

  // 1. Tera Term Style Real-time Terminal Display
  console.log(`[${timestamp}] RAW RX ◄ ${rawLine}`);

  try {
    const payload = JSON.parse(rawLine);

    // Validate minimum required fields
    if (!payload.device_id && !payload.node_id) {
      console.warn(`  ⚠️ Ignored packet: missing device_id / node_id: ${rawLine}`);
      return;
    }

    // Map new hardware device_id to legacy backend node_id (e.g. LIGHT_01 -> POLE-01)
    const rawId = payload.device_id || payload.node_id;
    let legacyNodeId = rawId;
    if (rawId.startsWith('LIGHT_')) {
      legacyNodeId = rawId.replace('LIGHT_', 'POLE-');
    }

    // Determine light status and synthesize PWM / current for backend & chart
    const lightStatus = payload.light_status !== undefined
      ? Boolean(payload.light_status)
      : (payload.led_pwm > 0);

    const ldrValue = payload.ldr_value !== undefined
      ? Number(payload.ldr_value)
      : (Number(payload.ambient_light_adc) || 0);

    const motionDetected = payload.motion_detected !== undefined
      ? Boolean(payload.motion_detected)
      : Boolean(payload.motion);

    // Adapted payload that matches the backend / frontend schema perfectly
    const adaptedPayload = {
      node_id: legacyNodeId,
      ambient_light_adc: ldrValue,
      motion: motionDetected,
      led_pwm: payload.led_pwm !== undefined ? payload.led_pwm : (lightStatus ? 100 : 0),
      current_ma: payload.current_ma !== undefined ? payload.current_ma : (lightStatus ? 142.5 : 0.0),
      fault_code: payload.fault_code !== undefined ? payload.fault_code : 0,
      // Also include new fields for forward-compatibility
      device_id: rawId,
      light_status: lightStatus,
      ldr_value: ldrValue,
      motion_detected: motionDetected
    };

    // 2. Publish to HiveMQ Cloud
    if (mqttClient.connected) {
      mqttClient.publish(MQTT_TOPIC, JSON.stringify(adaptedPayload), { qos: 0 }, (err) => {
        if (err) {
          console.error(`  ❌ MQTT publish failed:`, err.message);
        } else {
          console.log(`  MQTT TX ► ${legacyNodeId} forwarded to ${MQTT_TOPIC}`);
        }
      });
    } else {
      console.warn(`  ⚠️ Dropped packet: HiveMQ not currently connected.`);
    }

  } catch (parseError) {
    // If STM32 sends non-JSON text (e.g. boot messages or debug strings)
    console.log(`  [LOG] Non-JSON line: ${rawLine}`);
  }
}

// --- 3. HARDWARE SERIAL PORT CONNECTION ---
async function startSerialPort() {
  console.log(`======================================================`);
  console.log(`🔌 STM32 USB SERIAL BRIDGE`);
  console.log(`Configured Port : ${DEFAULT_COM_PORT}`);
  console.log(`Baud Rate       : ${DEFAULT_BAUD_RATE}`);
  console.log(`MQTT Topic      : ${MQTT_TOPIC}`);
  console.log(`======================================================\n`);

  try {
    const port = new SerialPort({
      path: DEFAULT_COM_PORT,
      baudRate: DEFAULT_BAUD_RATE,
      autoOpen: false
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    port.open((err) => {
      if (err) {
        handlePortOpenError(err);
        return;
      }
      console.log(`✅ Serial port ${DEFAULT_COM_PORT} opened successfully.`);
      console.log(`Waiting for incoming telemetry lines from STM32...\n`);
    });

    parser.on('data', (line) => {
      const trimmed = line.trim();
      if (trimmed) {
        processAndForwardPacket(trimmed);
      }
    });

    port.on('error', (err) => {
      console.error(`❌ Serial Port Runtime Error:`, err.message);
    });

    port.on('close', () => {
      console.warn(`⚠️ Serial port ${DEFAULT_COM_PORT} closed.`);
    });

  } catch (err) {
    handlePortOpenError(err);
  }
}

// Helper: auto-detect and display available ports on connection failure
async function handlePortOpenError(err) {
  console.error(`\n❌ Could not open serial port '${DEFAULT_COM_PORT}': ${err.message}`);

  try {
    const availablePorts = await SerialPort.list();
    console.log(`\n🔍 Scanning available COM ports on this PC:`);
    if (availablePorts.length === 0) {
      console.log(`   (No active COM ports detected. Is the STM32 plugged into USB?)`);
    } else {
      availablePorts.forEach((p) => {
        const info = p.manufacturer ? `(${p.manufacturer})` : '';
        console.log(`   -> ${p.path} ${info}`);
      });
      console.log(`\n💡 To switch port, edit SERIAL_PORT in backend/.env or backend/serial-bridge.js`);
    }
  } catch (listErr) {
    console.error('Failed to list serial ports:', listErr.message);
  }

  console.log('\nTip: To test without hardware right now, run: npm run serial-bridge:mock\n');
}

// --- 4. MOCK HARDWARE SIMULATOR (For testing without hardware) ---
function startMockHardwareLoop() {
  console.log(`======================================================`);
  console.log(`🧪 MOCK HARDWARE MODE ACTIVE (--mock)`);
  console.log(`Simulating STM32 USB serial transmission for LIGHT_01`);
  console.log(`Forwarding adapted packets to HiveMQ: ${MQTT_TOPIC}`);
  console.log(`======================================================\n`);

  let count = 0;
  setInterval(() => {
    count++;
    // Toggle motion periodically and compute light state
    const motion = count % 3 === 0;
    const ldr = motion ? 280 : (350 + Math.floor(Math.random() * 40));
    const lightStatus = ldr < 500 || motion;

    const mockStm32Line = JSON.stringify({
      device_id: 'LIGHT_01',
      light_status: lightStatus,
      ldr_value: ldr,
      motion_detected: motion
    });

    processAndForwardPacket(mockStm32Line);
  }, 4000);
}
