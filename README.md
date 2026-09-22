# Smart Street Light IoT Prototype (MVP)

This is a prototype project for a Smart Street Light Monitoring System. It collects live sensor data (light levels, motion detection, power usage) from street lights using MQTT, saves it to a database, and displays it on a live dashboard.

## Project Structure

- `backend/` - Node.js Express server. Connects to HiveMQ Cloud (MQTT broker) to receive data and MongoDB Atlas to store it. Also handles WebSocket connections.
- `frontend/` - React dashboard built with Vite, Tailwind CSS, and Recharts to view the live street light data.

## What's Included So Far

1. **Live Dashboard:** A clean, master-detail React UI that shows live status for all poles, current faults, and live updating graphs of power usage.
2. **Backend Server:** Listens to MQTT telemetry data, broadcasts it to the frontend via Socket.io, and saves historical data to MongoDB.
3. **Offline Detection:** The backend automatically marks a pole as "Offline" if it hasn't sent any data for 2 minutes.
4. **Mock Data Generator:** A script to simulate live traffic, night/day cycles, and random faults across 4 virtual poles.
5. **Custom Publisher Tool:** A testing script that lets us manually send custom MQTT JSON payloads to see how the dashboard reacts.

## How to Run It

### 1. Start the Backend
Open a terminal in the `backend/` folder and run:
```bash
npm install
npm run start
```
*Note: Make sure your `.env` file is set up with your MongoDB and HiveMQ credentials.*

### 2. Start the Frontend Dashboard
Open a second terminal in the `frontend/` folder and run:
```bash
npm install
npm run dev
```

### 3. Generate Test Data
If you don't have physical street lights connected, you can simulate data. Open a third terminal in the `backend/` folder:
- **To run the automated mock generator (simulates 4 poles):**
  ```bash
  npm run mock
  ```
- **To send a manual test payload (edit `backend/mock/custom-payload.json` first):**
  ```bash
  npm run publish-custom
  ```
