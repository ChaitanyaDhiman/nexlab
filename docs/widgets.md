# Widget Catalog

NexLab Dashboard includes a rich catalog of modular widgets designed for real-time homelab monitoring and administration.

---

## Core Widgets

### 1. Date & Time
- **Type**: `datetime`
- **Variants**: Digital, Minimal, Analog.
- **Features**: 12/24-hour time format toggle, date display, persistent user settings.

### 2. Weather
- **Type**: `weather`
- **Features**: 
  - Current temperature, WMO weather condition icons, wind speed, and humidity.
  - **HTTP-Resilient**: Automatically detects location via server-side IP geolocation (`ip-api.com` / `ipapi.co`) without triggering browser geolocation permission blocks on insecure HTTP dashboard origins.
  - **Manual City Search**: Click the map pin or location label to search and pin any city globally.
  - **Header Actions**: Quick refresh button and location picker.

### 3. Applications
- **Variants**: 
  - Single App Tile
  - **Frequent Apps** (`frequent-apps`)
- **Features**: 
  - **Smart Frecency Tracking**: Automatically tracks app clicks using a Mozilla/browser-standard Frecency algorithm (frequency + recency weight).
  - **Instant UI Updates**: List re-orders dynamically when any app is launched on the dashboard without requiring a page reload.
  - **Reset History**: Dedicated reset action in the header to clear usage history.

### 4. Service Health Summary
- **Type**: `service-health`
- **Features**:
  - Radial health percentage gauge showing overall system availability.
  - Real-time status breakdown: Online (green), Degraded (yellow), Offline (red).
  - Expandable list of offline services.
  - **On-Demand Refresh**: Header `<RefreshCw>` button to trigger instant health checks across all services.

---

## System Monitoring

### 5. System Load Gauge
- **Type**: `cpu-gpu-gauge`
- **Display**: Dual radial gauge displaying CPU (outer ring) and GPU (inner ring) utilization.
- **Best for**: High-level visual glance at total server compute utilization.

### 6. CPU Monitor
- **Type**: `cpu-temp-circle`
- **Display**: Circular gauge for CPU load, core average temperature (°C), and live trend sparkline.
- **Best for**: Tracking CPU processing intensity and thermal conditions.

### 7. GPU Monitor
- **Type**: `gpu-temp-circle`
- **Display**: Circular progress for GPU core load, VRAM usage, and GPU temperature.
- **Best for**: Transcoding (Plex/Jellyfin) and AI/LLM workloads (Ollama/Open WebUI).

### 8. Network Throughput
- **Type**: `network`
- **Display**:
  - **Inbound (RX) - Down**: Incoming traffic arriving at the server's network interfaces (downloads, torrents, photo backups).
  - **Outbound (TX) - Up**: Outgoing traffic served by the server (Plex streams, web responses, file uploads).
  - **Live Traffic Status**: Real-time traffic state badge with glowing pulse (`Idle`, `Active`, `Heavy`).

### 9. System Updates
- **Type**: `updates`
- **Display**: 
  - Overview count of total available updates vs. critical security patches.
  - Visual pulse indicators when updates are pending.
  - Kernel reboot alert badge when `/var/run/reboot-required` is active on the host.
  - **One-Click Refresh**: Re-analyzes host package lists.
  - **Deep Link**: One-click navigation to the full **Updates Center** (`/updates`).

---

## Storage Monitoring

### 10. Storage Bar
- **Type**: `storage-bar`
- **Display**: Linear progress bar showing total vs. used capacity across drives.
- **Best for**: Quick disk capacity monitoring.

### 11. Storage Pie Chart
- **Type**: `storage-pie`
- **Display**: Interactive pie chart visualizing used vs. free disk space across mounted volumes.

---

## Containers & Infrastructure

### 12. Docker Containers
- **Type**: `docker`
- **Display**: Live tabular list of active containers with CPU %, Memory usage, uptime, and Portainer shortcuts.

