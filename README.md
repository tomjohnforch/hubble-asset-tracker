<div align="center">

[![Live Demo](https://img.shields.io/badge/Live_Demo-hubble--asset--tracker-blue?style=for-the-badge)](https://hubble-asset-tracker.onrender.com)
[![GitHub Repo](https://img.shields.io/badge/GitHub-hubble--asset--tracker-24292e?style=for-the-badge&logo=github)](https://github.com/tomjohnforch/hubble-asset-tracker)
[![Tech](https://img.shields.io/badge/Powered_by-satellite.js-green?style=for-the-badge)](https://github.com/shashwatak/satellite-js)
[![Leaflet](https://img.shields.io/badge/Map-LeafletJS-199900?style=for-the-badge&logo=leaflet)](https://leafletjs.com)

</div>

🛰️ Hubble Asset Tracker — Demo Application

This project is an interactive visualization prototype inspired by the mission of Hubble Network:
connecting IoT / Bluetooth devices anywhere on Earth via a global constellation of satellites.

The app displays:
- Real-time satellite positions (SGP4 orbit propagation via satellite.js)
- 32 simulated Bluetooth devices across land, sea, and air
- Active communication links (< 3,500 km)
- Projected satellite trajectory paths
- REST API endpoints for programmatic access

This demo is fully deployed and publicly accessible.

🚀 Live Demo:
https://hubble-asset-tracker.onrender.com

✨ Features
🛰 Satellite Visualization
- Uses real TLEs and satellite.js SGP4 propagation
- Computes latitude, longitude, and altitude dynamically
- Projects forward trajectory paths on click

📡 Bluetooth / IoT Devices
- 32 globally distributed simulated devices
- Device “types”: ground stations, sensors, mobile nodes, ocean buoys, aircraft trackers
- Icons dynamically rendered on a dark-themed map

🔗 Active Link Computation
- Haversine distance between each satellite & device
- Real-time visualization of all connections under 3,500 km
- Auto-updates as satellites propagate

🌐 REST API
All data powering the frontend is exposed as API routes:

Endpoint	Description
/api/status	API health, counts, link threshold
/api/devices	List of 32 simulated devices
/api/satellites	Live positions of all satellites
/api/links	All active satellite ↔ device links

🧱 Architecture Overview
frontend (Leaflet.js, HTML, JS)
      |
      | fetch()
      v
backend (Node.js + Express)
      |
      | SGP4 propagation via satellite.js
      v
REST API (live sats, devices, links)

Core Technologies
- Leaflet.js — interactive map rendering
- satellite.js — TLE → ECI → Geodetic coordinate conversion
- Node.js / Express — server + API
- Render.com — hosting / deployment

📡 Satellite Propagation (SGP4)
The backend computes satellite positions using:

const satrec = satellite.twoline2satrec(tle1, tle2);
const positionAndVelocity = satellite.propagate(satrec, new Date());
const gmst = satellite.gstime(new Date());
const geodetic = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

Converted to:
- Latitude
- Longitude
- Altitude (km)
This ensures the satellites move realistically on the map.

⚙️ API Reference
GET /api/status
Returns system information:
{
  "ok": true,
  "satellites": 5,
  "devices": 32,
  "linkThresholdKm": 3500
}

GET /api/devices
Returns the dummy dataset of 32 devices.

GET /api/satellites
Returns live satellite positions with:
- lat
- lng
- altKm
- validPosition

GET /api/links
Returns all active links:
{
  "satName": "LEMUR-2-JOHNNYTRUONG",
  "deviceName": "Cape Canaveral Ground Station",
  "distanceKm": 2498.3
}

🖥️ Running Locally
1. Clone the repo
git clone https://github.com/YOUR_USERNAME/hubble-asset-tracker.git
cd hubble-asset-tracker

2. Install dependencies
npm install

3. Start the server
node server.js

4. Open in browser
http://localhost:4000

Deployment
This project is deployed on Render.
The public link is:

https://hubble-asset-tracker.onrender.com
