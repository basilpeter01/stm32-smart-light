# Smart Street Light Monitoring System

An STM32-based IoT prototype that reads ambient light and motion sensors to control a street light, then streams the sensor readings to a Node.js backend and a React dashboard over MQTT.

## Project Overview

This is a course project on Microcontrollers using stm32 nucleo microcontroller and stm32CubeIDE. The STM32 Nucleo reads an LDR and a PIR sensor, decides whether to turn a connected LED on or off, and sends a small JSON packet over USB serial to a PC. A Node.js script running on that PC picks up the packet and forwards it to a HiveMQ Cloud MQTT broker over TLS. A second Node.js server subscribes to the same broker, persists readings to MongoDB Atlas, and pushes live updates to a React dashboard over Socket.io.

## Features

- **LDR-Based Day/Night Detection:** Reads the LDR voltage divider on a 12-bit ADC. If the raw reading is below 2500 the system treats it as daylight and keeps the LED off; 2500 and above is treated as nighttime.
- **Motion-Triggered Lamp:** In nighttime mode, the LED turns on when the PIR sensor detects motion and turns off when the signal goes low.
- **USB Serial Bridge:** `serial-bridge.js` opens the Nucleo's virtual COM port at 115200 baud, prints each incoming JSON line to the terminal, and publishes it to HiveMQ Cloud over MQTTS (port 8883). If the port disconnects it retries every 3 seconds automatically.
- **MQTT over TLS:** Both the serial bridge and the mock scripts connect to HiveMQ Cloud using `mqtts://` with username/password authentication and `rejectUnauthorized: true`.
- **Node Offline Detection:** The backend keeps a 120-second timer per device ID. If no packet arrives within that window the server emits an `OFFLINE` status update over Socket.io.
- **Throttled DB Writes:** Telemetry is saved to MongoDB Atlas at most once every 30 seconds per device during normal operation.
- **Daytime Anomaly Alerts:** The `/api/alerts` endpoint returns records where the light was on (`light_status: true`) while the LDR reading indicated daytime (`ldr_value < 2500`).
- **React Dashboard:** Shows all five nodes in a sidebar list, displays LDR value, motion state, and light status per node, plots a live LDR history chart (last 30 readings), and logs raw incoming packets in a collapsible terminal drawer at the bottom.
- **Mock Scripts for Testing:** Three scripts let you test without physical hardware — a multi-node simulator, a single-node hardware emulator, and a custom one-shot publisher.

## Hardware

### Components

| Component | Details | Purpose |
| :--- | :--- | :--- |
| Microcontroller | STM32 Nucleo-F411RE / F446RE (ARM Cortex-M4) | Reads sensors, drives LED, sends JSON over USB serial |
| Ambient Light Sensor | Photoresistor (LDR) in a voltage divider with a 10 kΩ pull-down resistor | Measures ambient light level on a 12-bit ADC (0–4095) |
| Motion Sensor | HC-SR501 PIR in retrigger mode | Detects motion as a digital GPIO input |
| Light Output | Blue LED with 220 Ω series resistor | Simulates a street light load |
| USB Cable | Micro-USB (Nucleo ST-LINK VCP) | Powers the board and provides the 115200 baud serial connection to PC |

### Pin Connections

| Signal | STM32 Pin | Notes |
| :--- | :--- | :--- |
| LDR voltage divider output | PA0 (ADC1_IN0) | 12-bit analog input |
| PIR OUT | PA1 (GPIO_IN) | Digital input, 3.3V logic |
| LED (via TIM3_CH1 PWM) | PB4 | Driven at 0%, 20%, or 100% duty cycle |
| Common GND | GND | Board and breadboard ground tied together |

## Software & Tools

- **Firmware:** C/C++ in STM32CubeIDE using HAL drivers
- **Backend:** Node.js (v18+), Express, `mqtt.js`, `socket.io`, `mongoose`, `serialport`
- **MQTT Broker:** HiveMQ Cloud Serverless (MQTTS on port 8883)
- **Database:** MongoDB Atlas (M0 Free Tier)
- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Lucide React, Socket.io Client

## Setup

### What You Need

- STM32 Nucleo-F411RE or F446RE board, LDR, 10 kΩ resistor, HC-SR501 PIR sensor, a blue LED, 220 Ω resistor, breadboard, and jumper wires
- [Node.js](https://nodejs.org/) v18 or newer
- [STM32CubeIDE](https://www.st.com/en/development-tools/stm32cubeide.html) to compile and flash the firmware
- A free [HiveMQ Cloud](https://www.hivemq.com/cloud/) cluster
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### 1. Clone the Repo

```bash
git clone https://github.com/basilpeter01/stm32-smart-light.git
cd stm32-smart-light
```

### 2. Flash the STM32

1. Wire the circuit according to the pin connection table above.
2. Connect the Nucleo board to your PC via USB.
3. Open the firmware project in STM32CubeIDE and flash it to the board.
4. Note the COM port the Nucleo appears on (e.g. `COM3` on Windows, `/dev/ttyACM0` on Linux).

### 3. Backend

1. Navigate to `backend/` and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Copy the example env file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
   ```env
   PORT=5000
   MQTT_URL=mqtts://<your-cluster>.s1.eu.hivemq.cloud:8883
   MQTT_USER=<your-hivemq-username>
   MQTT_PASSWORD=<your-hivemq-password>
   MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/smartlight?retryWrites=true&w=majority
   SERIAL_PORT=COM3
   SERIAL_BAUD=115200
   FRONTEND_URL=http://localhost:5173
   ```

3. In MongoDB Atlas, go to **Network Access** and allow your current IP (or `0.0.0.0/0` while developing).

4. Start the ingestion server:
   ```bash
   npm start
   ```

### 3. Frontend Dashboard Setup

1. In a separate terminal, navigate to the frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in browser.

### 4. Running the Simulation / Testing

If you do not have the physical hardware connected, you can run the mock simulation scripts from the `backend/` directory:

- **Run multi-pole fleet simulation (simulates 4 poles):**
  ```bash
  npm run mock
  ```
- **Send a single manual custom payload:**
  Modify `backend/mock/custom-payload.json` as desired, then run:
  ```bash
  npm run publish-custom
  ```

## How It Works

```
[ LDR + PIR + ACS712 ]
          │
          ▼
   [ STM32 Nucleo ] ──(Local Control)──► [ LED Driver (PWM) ]
          │
          ▼ (UART Serial @ 115200)
    [ ESP-01 Module ]
          │
          ▼ (MQTTS over TLS Port 8883)
  [ HiveMQ Cloud Broker ]
          │
          ▼ (Topic: smartlight/telemetry)
  [ Node.js / Express Server ]
     ├── In-Memory Heartbeat & Watchdog
     ├── MongoDB Atlas (Throttled Records & Alerts)
     └── Socket.io Broadcast
          │
          ▼
  [ React Dashboard (Vite) ]
```

1. **Edge Evaluation Loop:** The STM32 reads the LDR voltage divider on an analog pin. If the ADC reading is below 800 (night mode), it sets the LED to a 20% standby duty cycle. When the PIR sensor detects motion, it immediately raises the duty cycle to 100%. If ambient light is above 800 (day mode), the LED is forced to 0%.
2. **Fault Checking:** The STM32 reads current via the ACS712. If PWM is commanded above 0% but current measures 0 mA, it flags an open-circuit failure (`fault_code = 1`). If current exceeds 160 mA, it flags an overcurrent condition (`fault_code = 2`).
3. **Serial Transmission:** The STM32 formats this state into a compact JSON string and transmits it over USART to the ESP-01 module.
4. **Cloud Uplink:** The ESP-01 acts as a transparent network modem, publishing the JSON payload over an authenticated TLS socket to the HiveMQ Cloud broker under the topic `smartlight/telemetry`.
5. **Ingestion & Distribution:** The Node.js backend receives the packet, attaches a server timestamp and `ONLINE` status, resets the 120-second watchdog timer for that node, and immediately emits the update via Socket.io to connected web clients.
6. **Data Storage:** Data is stored in MongoDB Atlas on an interval of once every 30 seconds per node during standard operation, or immediately upon a non-zero fault code.

## Known Limitations & Future Improvements

- **Hall-Effect Sensor Noise at Low Currents:** The ACS712-05B sensor has a sensitivity of approximately 185 mV/A. When measuring low currents typical of small LED prototype loads (under 150 mA), thermal noise and analog reading jitter can produce minor fluctuations unless averaged over multiple ADC samples.
- **In-Memory Server State:** The backend tracks active node status and heartbeat timers in memory (`Map`). If the server restarts, nodes appear offline until their next periodic heartbeat packet arrives. Future versions should hydrate initial state directly from the most recent MongoDB document per node.
- **Unidirectional MQTT Topology:** The current architecture only implements uplink telemetry from edge nodes to cloud. Implementing downlink command topics would allow operators to manually override brightness levels or adjust sensor trigger thresholds from the dashboard.

## License

This project is released under the [MIT License](LICENSE).
