# Smart Street Light IoT Prototype (MVP)

This repository contains the Node.js backend and mock generator for the Smart Street Light IoT Prototype. The system subscribes to real-time telemetry from edge street light nodes over MQTT (HiveMQ Cloud), persists data to MongoDB Atlas, and provides a REST API and WebSocket stream to a frontend dashboard.

## Project Structure

- `backend/` - Contains the Node.js Express server, MongoDB models, MQTT client, and the standalone mock generator.
- `frontend/` - Contains the frontend dashboard for real-time monitoring.

## Backend Setup

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration:**
   Copy the example environment file and fill in your credentials.
   ```bash
   cp .env.example .env
   ```
   *Required Variables:*
   - `MQTT_URL`: HiveMQ TLS cluster URL (e.g., `mqtts://<your-cluster>.s1.eu.hivemq.cloud:8883`)
   - `MQTT_USER` & `MQTT_PASSWORD`: HiveMQ cluster credentials
   - `MONGO_URI`: MongoDB Atlas connection string

3. **Start the Server:**
   ```bash
   npm run start
   ```
   The server will start on port `5000` (or the port specified in your `.env`) and automatically connect to MongoDB and HiveMQ.

4. **Run the Mock Generator:**
   To simulate live traffic, dynamic lighting, and faults from 4 virtual poles during a demo:
   ```bash
   npm run mock
   ```

## Features
- **Secure Connectivity:** MQTTS connectivity over TLS to HiveMQ Cloud.
- **Real-time Updates:** Event broadcasting using `Socket.io` when telemetry is received.
- **Data Persistence:** Automatic database persistence to MongoDB every 30 seconds or immediately upon detecting a fault.
- **Offline Detection:** An in-memory heartbeat check that marks a node as offline if no packets are received for more than 30 seconds.
