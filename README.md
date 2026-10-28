# Smart Street Light Monitoring System

An automated street light telemetry and control system using an STM32 microcontroller to regulate lighting based on ambient conditions and stream sensor telemetry to a centralized web dashboard over MQTT.

## Project Overview

This project was developed as an embedded systems and IoT prototype to reduce unnecessary power consumption in municipal street lighting. The system monitors ambient daylight and pedestrian motion locally at each pole to switch between day shutoff and night illumination, while packaging environmental readings into JSON telemetry packets. These records are sent over a secure MQTT broker to a Node.js backend and a React dashboard for real-time fleet observation and historical logging.

## Features

- **Autonomous Day/Night Switching:** Evaluates analog LDR readings against a defined threshold (ADC value 2500) to keep lights off during daylight hours and activate illumination at dusk.
- **Motion-Triggered Lighting:** Reads a digital PIR sensor input to illuminate the lamp immediately upon detecting pedestrian or vehicle presence during night hours.
- **TLS-Encrypted MQTT Transport:** Transmits serialized telemetry over port 8883 using MQTTS to a private HiveMQ Cloud broker.
- **Real-Time Web Dashboard:** Displays node operational status, current light state, motion triggers, and an LDR history chart using React and WebSockets (Socket.io).
- **Node Heartbeat Watchdog:** Automatically flags a node as `OFFLINE` if no packet is received within a 120-second timeout window.
- **Database Write Throttling:** Batches steady-state telemetry to MongoDB Atlas at 30-second intervals per node to prevent excessive database writes while preserving recent history.
- **Multi-Node Fleet Simulator:** Provides a test script (`mock-generator.js`) to simulate telemetry from multiple virtual poles (`LIGHT_02` through `LIGHT_05`) for system verification without physical hardware.

## Hardware / Tech Stack

### Hardware Components

| Component | Specification / Model | Operating Voltage | Purpose |
| :--- | :--- | :--- | :--- |
| Microcontroller | STM32 Nucleo-64 (STM32F401RE / Cortex-M4) | 3.3V Logic | Reads sensors, evaluates switching logic, sends UART packets |
| Ambient Light Sensor | Photoresistor (LDR) in voltage divider | 3.3V | Measures ambient light level via 12-bit ADC |
| Motion Sensor | HC-SR501 Passive Infrared (PIR) | 5V VCC, 3.3V Logic Out | Detects human motion via digital GPIO input |
| Light Output | White LED module with current-limiting resistor | 3.3V / 5V | Simulates street light luminaire |
| USB Connection | Micro-USB Cable (Nucleo ST-LINK / VCP) | 5V (USB Bus) | Powers Nucleo board and provides 115200 baud serial uplink |

### Pin Wiring

| Sensor / Module Pin | STM32 Nucleo Pin | Logic Level | Circuit Notes |
| :--- | :--- | :--- | :--- |
| LDR Divider Midpoint | PA0 (ADC1_IN0) | 3.3V Analog | 10 kΩ pull-down resistor to GND |
| PIR OUT | PA1 (GPIO IN) | 3.3V Digital | Configured as input with internal pull-down |
| LED Anode / Driver | PA5 (GPIO OUT / Timer) | 3.3V Digital | Connected in series with 220 Ω resistor to GND |
| Common Ground | GND | 0V Reference | All board grounds tied to common rail |

### Software & Tools

- **Embedded Firmware:** C/C++ compiled via STM32CubeIDE (HAL drivers)
- **Backend Application:** Node.js (v18+), Express, `mqtt.js`, `socket.io`, `mongoose`, `serialport`
- **MQTT Broker:** HiveMQ Cloud Serverless (TLS / Port 8883)
- **Database:** MongoDB Atlas (M0 Free Tier)
- **Frontend Dashboard:** React 18, Vite, Tailwind CSS, Recharts, Lucide React, Socket.io Client

## Getting Started / Setup Instructions

### Prerequisites

- Node.js (v18.x or newer) and npm installed.
- Git installed.
- Free accounts on [HiveMQ Cloud](https://www.hivemq.com/cloud/) and [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- STM32CubeIDE and Arduino IDE (if flashing physical microcontroller firmware).

### 1. Repository Setup

Clone the repository to your local machine:

```bash
git clone https://github.com/basilpeter01/stm32-smart-light.git
cd stm32-smart-light
```

### 2. Backend Configuration & Launch

1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file in `backend/` based on the provided `.env.example`.
  
3. Ensure MongoDB Atlas Network Access allows connections from your current IP (or `0.0.0.0/0` for cloud deployments).

4. Start the backend server:
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
