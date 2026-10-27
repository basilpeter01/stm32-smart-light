const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const mqtt = require('mqtt');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// ============================================================================
// HARDWARE SERIAL CONFIGURATION
// ============================================================================
// If different COM port:
//   Edit SERIAL_PORT in your backend/.env file
// ============================================================================
const DEFAULT_COM_PORT = process.env.SERIAL_PORT || 'COM3'; // CHANGE PORT IF NEEDED
const DEFAULT_BAUD_RATE = parseInt(process.env.SERIAL_BAUD || '115200', 10);
const MQTT_TOPIC = 'smartlight/telemetry';

// Check if running in mock/simulation mode
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
  console.log('Connected to HiveMQ Cloud successfully.\n');
  if (IS_MOCK_MODE) {
    startMockHardwareLoop();
  } else {
    startSerialPort();
  }
});

mqttClient.on('error', (err) => {
  console.error('HiveMQ MQTT Connection Error:', err.message);
});

// --- 2. PACKET ADAPTER ---
function processAndForwardPacket(rawLine) {
  const timestamp = new Date().toLocaleTimeString([], { hour12: false });

  // 1. Terminal Display
  console.log(`[${timestamp}] RAW RX ◄ ${rawLine}`);

  try {
    const sanitized = rawLine.replace(/,\s*([}\]])/g, '$1');
    const payload = JSON.parse(sanitized);

    // Validate minimum required fields
    if (!payload.device_id && !payload.node_id) {
      console.warn(`  ⚠️ Ignored packet: missing device_id / node_id: ${rawLine}`);
      return;
    }

    const deviceId = payload.device_id || payload.node_id || 'LIGHT_01';
    const lightStatus = payload.light_status !== undefined
      ? Boolean(payload.light_status)
      : (payload.led_pwm > 0);

    const ldrValue = payload.ldr_value !== undefined
      ? Number(payload.ldr_value)
      : (Number(payload.ambient_light_adc) || 0);

    const motionDetected = payload.motion_detected !== undefined
      ? Boolean(payload.motion_detected)
      : Boolean(payload.motion);

    // Payload
    const cleanPayload = {
      device_id: deviceId,
      node_id: deviceId, // alias for compatibility
      light_status: lightStatus,
      ldr_value: ldrValue,
      motion_detected: motionDetected
    };

    // 2. Publish to HiveMQ Cloud
    if (mqttClient.connected) {
      mqttClient.publish(MQTT_TOPIC, JSON.stringify(cleanPayload), { qos: 0 }, (err) => {
        if (err) {
          console.error(`MQTT publish failed:`, err.message);
        } else {
          console.log(`  MQTT TX ► ${deviceId} forwarded to ${MQTT_TOPIC}`);
        }
      });
    } else {
      console.warn(`  ⚠️ Dropped packet: HiveMQ not currently connected.`);
    }

  } catch (parseError) {
    // If STM32 sends non-JSON text
    console.log(`  [LOG] Non-JSON line: ${rawLine}`);
  }
}

// --- 3. HARDWARE SERIAL PORT CONNECTION ---
let activePort = null;
let reconnectTimer = null;
let isFirstConnect = true;

function scheduleReconnect(delayMs = 3000) {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startSerialPort();
  }, delayMs);
}

async function startSerialPort() {
  if (isFirstConnect) {
    console.log(`======================================================`);
    console.log(`🔌 STM32 USB SERIAL BRIDGE`);
    console.log(`Configured Port : ${DEFAULT_COM_PORT}`);
    console.log(`Baud Rate       : ${DEFAULT_BAUD_RATE}`);
    console.log(`MQTT Topic      : ${MQTT_TOPIC}`);
    console.log(`Auto-Reconnect  : Enabled (retries every 3s if disconnected)`);
    console.log(`======================================================\n`);
    isFirstConnect = false;
  }

  try {
    if (activePort && activePort.isOpen) {
      return;
    }

    activePort = new SerialPort({
      path: DEFAULT_COM_PORT,
      baudRate: DEFAULT_BAUD_RATE,
      autoOpen: false
    });

    // Delimiter: '\n' catches both \r\n (CRLF) and \n (LF)
    const parser = activePort.pipe(new ReadlineParser({ delimiter: '\n' }));

    activePort.open((err) => {
      if (err) {
        handlePortOpenError(err);
        return;
      }
      console.log(`Serial port ${DEFAULT_COM_PORT} opened successfully.`);
      console.log(`Waiting for incoming telemetry...\n`);
    });

    let jsonBuffer = '';

    parser.on('data', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // If we see an opening '{', start a new JSON buffer
      if (trimmed.includes('{')) {
        jsonBuffer = trimmed.substring(trimmed.indexOf('{'));
      } else if (jsonBuffer.length > 0) {
        // Continue accumulating lines inside the JSON object
        jsonBuffer += ' ' + trimmed;
      } else {
        // Normal debug text printed by STM32 (e.g. "PIR Sensor Ready!", separator lines)
        console.log(`[${new Date().toLocaleTimeString([], { hour12: false })}] [STM32 LOG] ${trimmed}`);
        return;
      }

      // If the buffer now contains a closing '}', we have a complete JSON packet!
      if (jsonBuffer.includes('}')) {
        const fullJsonStr = jsonBuffer.substring(0, jsonBuffer.lastIndexOf('}') + 1);
        jsonBuffer = ''; // Reset buffer for next packet
        processAndForwardPacket(fullJsonStr);
      } else if (jsonBuffer.length > 1000) {
        // Prevent buffer overflow if malformed input arrives
        jsonBuffer = '';
      }
    });

    activePort.on('error', (err) => {
      console.error(`Serial Port Error:`, err.message);
    });

    activePort.on('close', () => {
      console.warn(`⚠️ Serial port ${DEFAULT_COM_PORT} disconnected. Reconnecting in 3 seconds...`);
      activePort = null;
      scheduleReconnect(3000);
    });

  } catch (err) {
    handlePortOpenError(err);
  }
}

// Helper: auto-detect and display available ports on connection failure, then retry
async function handlePortOpenError(err) {
  console.error(`Could not open '${DEFAULT_COM_PORT}': ${err.message}. Retrying in 3s...`);

  try {
    const availablePorts = await SerialPort.list();
    if (availablePorts.length > 0) {
      const portsList = availablePorts.map(p => p.path).join(', ');
      console.log(`   (Detected active COM ports: ${portsList})`);
    }
  } catch (listErr) {
    // ignore listing error
  }

  activePort = null;
  scheduleReconnect(3000);
}

// --- 4. MOCK HARDWARE SIMULATOR ---
function startMockHardwareLoop() {
  console.log(`======================================================`);
  console.log(`MOCK HARDWARE MODE ACTIVE (--mock)`);
  console.log(`Simulating STM32 USB serial transmission for LIGHT_01`);
  console.log(`Forwarding adapted packets to HiveMQ: ${MQTT_TOPIC}`);
  console.log(`======================================================\n`);

  let count = 0;
  setInterval(() => {
    count++;

    // Motion triggered every 3 ticks
    const motion = count % 3 === 0;

    // Simulate Day (ticks 0-5) vs Night (ticks 6-11)
    const isDay = Math.floor(count / 6) % 2 === 0;
    const ldr = isDay
      ? 1900 + Math.floor(Math.random() * 150)  // 1900 - 2050 (Daylight)
      : 2700 + Math.floor(Math.random() * 150); // 2700 - 2850 (Darkness)

    // Daytime (LDR < 2500): Light is ALWAYS OFF.
    // Nighttime (LDR >= 2500): Light turns ON when motion is detected.
    const isNight = ldr >= 2500;
    const lightStatus = isNight && motion;

    const mockStm32Line = JSON.stringify({
      device_id: 'LIGHT_01',
      light_status: lightStatus,
      ldr_value: ldr,
      motion_detected: motion
    });

    processAndForwardPacket(mockStm32Line);
  }, 4000);
}