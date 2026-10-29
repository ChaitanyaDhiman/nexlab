# API Reference

Complete reference for all REST and streaming APIs exposed by the NexLab Dashboard.

---

## 1. System API
`GET /api/system`

Returns real-time host metrics including CPU, memory, GPU, fan speed, temperatures, uptime, and network throughput.

**Response:**
```json
{
  "cpu": 14,
  "memory": {
    "total": 33418534912,
    "used": 14197321728,
    "free": 19221213184
  },
  "gpu": {
    "name": "NVIDIA GeForce RTX 3060",
    "utilization": 2,
    "memory": 1120,
    "memoryTotal": 12288,
    "temperature": 44
  },
  "temperature": 48,
  "uptime": 284500,
  "fanSpeed": "Low",
  "network": { 
    "rx_sec": 124500,
    "tx_sec": 45200
  }
}
```

---

## 2. Weather API
`GET /api/weather`

Returns current weather and temperature with server-side IP geolocation fallback. Works seamlessly on insecure HTTP dashboard origins without browser permission prompts.

**Query Parameters:**
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `lat` | `float` (optional) | Latitude coordinate |
| `lon` | `float` (optional) | Longitude coordinate |
| `city` | `string` (optional) | City name (e.g. `London` or `Delhi`), geocoded via Open-Meteo |

*If no parameters are passed, the endpoint automatically uses the server's public IP geolocation.*

**Response:**
```json
{
  "success": true,
  "data": {
    "temperature": 20,
    "description": "Mainly clear, partly cloudy",
    "weatherCode": 2,
    "windSpeed": 6.8,
    "humidity": 95,
    "isDay": true,
    "location": "Dehradun, Uttarakhand",
    "latitude": "30.3275",
    "longitude": "78.0325"
  }
}
```

---

## 3. Updates & Host Management APIs

### Get Pending Updates
`GET /api/updates`

Returns available APT package updates, security patches, detailed package version diffs, and reboot flags.

**Response:**
```json
{
  "success": true,
  "data": {
    "rebootRequired": false,
    "rebootReasons": [],
    "lastUpdateCheck": "2026-10-29 17:42:27 +0530",
    "updatesAvailable": 3,
    "securityUpdates": 2,
    "updatePackages": ["libbrotli1", "tailscale"],
    "securityPackagesList": ["libbrotli1"],
    "packageDetails": [
      {
        "name": "libbrotli1",
        "currentVersion": "1.0.9-2build6",
        "newVersion": "1.0.9-2ubuntu0.1",
        "arch": "amd64",
        "isSecurity": true
      },
      {
        "name": "tailscale",
        "currentVersion": "1.104.2",
        "newVersion": "1.104.4",
        "arch": "amd64",
        "isSecurity": false
      }
    ],
    "hasNsenter": true
  }
}
```

### Refresh Package Lists (Check Updates)
`POST /api/updates/refresh`

Triggers `apt-get update` on host mirrors inside host namespaces via `update-agent` and synchronizes package lists.

**Response:**
```json
{
  "success": true,
  "message": "Update check started"
}
```

### Apply Updates (Upgrade & Autoremove)
`POST /api/updates/apply`

Executes `apt-get upgrade -y && apt-get autoremove -y` inside host namespaces. Streams live progress to the execution console.

**Response:**
```json
{
  "success": true,
  "message": "Update process started",
  "job": {
    "id": "job_1730204123",
    "status": "running",
    "step": "upgrading"
  }
}
```

### Live Execution Stream
`GET /api/updates/stream`

Server-Sent Events (SSE) streaming endpoint providing real-time line-by-line stdout and status updates from running APT commands.

**Event Stream Format:**
```
data: {"type": "log", "line": "Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease"}
data: {"type": "log", "line": "Get:2 http://security.ubuntu.com/ubuntu jammy-security InRelease"}
data: {"type": "status", "status": "completed", "exitCode": 0}
```

### Host Reboot
`POST /api/updates/reboot`

Executes `/sbin/reboot` in host namespace 1.

**Response:**
```json
{
  "success": true,
  "message": "Host reboot scheduled"
}
```

---

## 4. Health API
`GET /api/health`

Performs health checks on all configured homelab services with internal-to-public fallback routing.

**Response:**
```json
{
  "success": true,
  "data": {
    "plex": { "status": "online", "responseTime": 42, "usedFallback": false },
    "jellyfin": { "status": "online", "responseTime": 85, "usedFallback": false },
    "qbittorrent": { "status": "online", "responseTime": 18, "usedFallback": false }
  }
}
```

---

## 5. Docker API
`GET /api/docker`

Returns list of active Docker containers with real-time CPU and memory metrics.

**Response:**
```json
[
  {
    "id": "7c4c9231e409",
    "name": "nexlab",
    "image": "homelab-web-nexlab",
    "status": "Up 2 hours",
    "state": "running",
    "cpu": "1.2%",
    "memory": "145MB / 32GB"
  }
]
```

---

## 6. Storage API
`GET /api/storage`

Returns configured storage drives and partitions.

**Response:**
```json
{
  "drives": [
    {
      "id": "main",
      "name": "System Root",
      "path": "/",
      "total": 512000000000,
      "used": 198000000000,
      "percentage": 38
    }
  ]
}
```

---

## 7. Versioning & Config APIs

### Check Version
`GET /api/check-update`
Checks GitHub Releases for new dashboard versions.

### Apps Configuration
- `GET /api/apps`: Returns apps and categories.
- `POST /api/apps`: Saves updated apps configuration.

### Widgets Configuration
- `GET /api/widgets`: Returns dashboard layout and widgets.
- `POST /api/widgets`: Saves updated widget grid layout.

