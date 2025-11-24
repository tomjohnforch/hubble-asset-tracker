// api-server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const satellite = require("satellite.js");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve the frontend (index.html, icons, etc.)
app.use(express.static(path.join(__dirname)));

// Optional: root route just returns index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


// ---- 1. Load devices from devices.json ----
const devicesPath = path.join(__dirname, "devices.json");
let devices = JSON.parse(fs.readFileSync(devicesPath, "utf8"));

// ---- 2. Define satellites with TLEs (same ones you use on the map) ----
const hubsats = [
  {
    name: "LEMUR-2-JOHNNYTRUONG",
    catnr: 59146,
    tle1: "1 59146U 24080AJ  24250.53483817  .00016718  00000+0  96698-3 0  9994",
    tle2: "2 59146  97.5352  23.3811 0011492  65.6620 294.5825 15.11976190  9683"
  },
  {
    name: "LEMUR-2-ROCINANTE",
    catnr: 59147,
    tle1: "1 59147U 24080AK  24250.53114544  .00015505  00000+0  89727-3 0  9993",
    tle2: "2 59147  97.5354  23.3780 0011053  66.0933 294.1496 15.12101031  9686"
  },
  {
    name: "HUBBLE-NETWORK-1",
    catnr: 99901,
    tle1: "1 99901U 24999A   24250.50000000  .00000000  00000-0  00000-0 0  9995",
    tle2: "2 99901  97.50  30.00 0005000  60.0 300.0 15.10     1000"
  },
  {
    name: "HUBBLE-NETWORK-2",
    catnr: 99902,
    tle1: "1 99902U 24999B   24250.50000000  .00000000  00000-0  00000-0 0  9996",
    tle2: "2 99902  97.40 120.00 0005000 120.0 240.0 15.05     1001"
  },
  {
    name: "HUBBLE-NETWORK-3",
    catnr: 99903,
    tle1: "1 99903U 24999C   24250.50000000  .00000000  00000-0  00000-0 0  9997",
    tle2: "2 99903  97.60 210.00 0005000 180.0 180.0 15.08     1002"
  }
];

// Precompute satrec objects
const satellites = hubsats.map((s) => ({
  ...s,
  satrec: satellite.twoline2satrec(s.tle1, s.tle2)
}));

// Helper: haversine distance (km)
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getSatelliteSnapshot() {
  const now = new Date();
  const gmst = satellite.gstime(now);

  return satellites.map((sat) => {
    let pv;
    try {
      pv = satellite.propagate(sat.satrec, now);
    } catch (err) {
      console.error("Propagation error for", sat.name, err);
      return {
        name: sat.name,
        catnr: sat.catnr,
        validPosition: false
      };
    }

    // v5: propagate can return null if it fails
    if (!pv || !pv.position) {
      console.warn("No position for satellite", sat.name);
      return {
        name: sat.name,
        catnr: sat.catnr,
        validPosition: false
      };
    }

    const gd = satellite.eciToGeodetic(pv.position, gmst);
    const lat = satellite.degreesLat(gd.latitude);
    const lng = satellite.degreesLong(gd.longitude);
    const altKm = gd.height;

    const valid =
      Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(altKm);

    return {
      name: sat.name,
      catnr: sat.catnr,
      lat,
      lng,
      altKm,
      validPosition: valid
    };
  });
}


// Compute active links between sats and devices (< 3500 km)
const LINK_THRESHOLD_KM = 3500;

function getActiveLinks() {
  const sats = getSatelliteSnapshot().filter((s) => s.validPosition);
  const links = [];

  for (const sat of sats) {
    for (const dev of devices) {
      if (!Number.isFinite(dev.lat) || !Number.isFinite(dev.lng)) continue;
      const d = haversineKm(sat.lat, sat.lng, dev.lat, dev.lng);
      if (d <= LINK_THRESHOLD_KM) {
        links.push({
          satCatnr: sat.catnr,
          satName: sat.name,
          deviceId: dev.id,
          deviceName: dev.name,
          distanceKm: Number(d.toFixed(1))
        });
      }
    }
  }

  return links;
}

// ---- API ROUTES ----

// Simple health check
app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    satellites: satellites.length,
    devices: devices.length,
    linkThresholdKm: LINK_THRESHOLD_KM
  });
});

// Devices (static from devices.json)
app.get("/api/devices", (req, res) => {
  res.json(devices);
});

// Satellites (live positions from TLE)
app.get("/api/satellites", (req, res) => {
  res.json(getSatelliteSnapshot());
});

// Active links (sat ↔ device)
app.get("/api/links", (req, res) => {
  res.json(getActiveLinks());
});

app.listen(PORT, () => {
  console.log(`Hubble tracker API running on http://localhost:${PORT}`);
});
