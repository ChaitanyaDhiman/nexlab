# NexLab Dashboard

A secure, premium, and customizable dashboard for your local home server. Built with Next.js 15, React 19, Tailwind CSS 4, and Framer Motion.

![NexLab Dashboard](./public/Dashboard_Dark.png)

## ✨ Features

- 🚀 **Centralized Hub**: Single entry point for all your local services with optimized state management via React Context
- 🎨 **In-Dashboard Theme Studio**: Switch between 8 curated palettes (Deep Space, Dracula, Nord, Catppuccin, Tokyo Night, Cyberpunk, Emerald Forest, Clean Light) or create custom themes with a real-time live preview sandbox and direct JSON import/export
- ⚡ **Optimized Monitoring**: CPU/GPU Gauges, Temperature circular monitors, and real-time Network Throughput tracking
- 🔄 **Dedicated Updates Center & Live Terminal**: Manage host OS updates (`apt update`, `apt upgrade -y`, `apt autoremove -y`, host reboot) directly from the UI with an embedded live streaming execution terminal
- 🌦️ **HTTP-Resilient Weather Widget**: Automatic IP-based geolocation fallback for local HTTP dashboard origins, eliminating browser geolocation permission blocks with manual city override
- ★ **Smart Frecency App Tracking**: Mozilla/browser-standard frecency algorithm (frequency + recency weighting) with real-time UI updates
- 🏥 **Resilient Health Checks**: Real-time monitoring with "Internal-to-Public" fallback logic, tiered timeouts, and on-demand refresh buttons
- 🐳 **Docker Integration**: Live container stats (CPU/Mem) and management via Portainer
- 💾 **Storage Monitoring**: Bar and Pie chart visualizations for multiple drives
- 📏 **Global Tile Sizes**: Customize the grid density (Compact, Standard, Comfort) to fit your screen and preference
- ⏰ **Customizable Clock**: Toggle between 12-hour and 24-hour time formats with persistent preferences
- 🛡️ **Connectivity Transparency**: Visual markers (Globe icon) indicating when services are using fallback public routes
- 🔒 **Secure Configuration**: Service URLs configured via environment variables with SSL verification bypass for internal Docker traffic
- 📱 **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- 🛠️ **Easy Customization**: Simple configuration file and component architecture

## 📦 What's Included

This project includes two main components:

1. **NexLab Dashboard** - The web interface for monitoring and accessing your services
2. **Docker Services** - Pre-configured Docker Compose setup for essential homelab services

### Included Services

**Media Streaming:**
- **Plex Media Server** - Media streaming server
- **Jellyfin** - Open-source media streaming server

**Media Management (ARR Stack):**
- **Sonarr** - TV show collection manager
- **Radarr** - Movie collection manager
- **Prowlarr** - Indexer manager for Sonarr/Radarr
- **qBittorrent** - Torrent download client
- **Jellyseerr** - Media request manager

**Photos & Storage:**
- **Immich** - Self-hosted photo and video management
- **Filebrowser** - Web-based file manager for your drives

**Network:**
- **Nginx Proxy Manager** - Reverse proxy with SSL/TLS management
- **Pi-hole** - Network-wide ad blocking and DNS server

**AI:**
- **Open WebUI** - Web interface for AI/LLM interactions

**System:**
- **Portainer** - Docker container management UI
- **Cockpit** - Web-based server administration interface
- **Watchtower** - Automated Docker container updates (scheduled weekly on Sundays at 3 AM)

**Monitoring:**
- **Beszel** - Lightweight server monitoring with beautiful dashboards and GPU support

See the [docker-services README](./docker-services/README.md) for detailed documentation on these services.
See the [Documentation](/docs) folder for details on [Widgets](/docs/widgets.md), [API Reference](/docs/api_reference.md), and [Theming System](/docs/theming.md).

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Docker** and **Docker Compose** (for running services)

### System Requirements

-   **Operating System**: Linux (Required for system stats, updates, and battery monitoring)
    -   *Note: MacOS/Windows are NOT supported for advanced system monitoring features.*
-   **Node.js**: v18+
-   **Docker**: Required for container management features.

## Compatibility Matrix

| Feature | Linux | Windows | MacOS |
| :--- | :---: | :---: | :---: |
| Dashboard UI | ✅ | ✅ | ✅ |
| App Management | ✅ | ✅ | ✅ |
| System Stats (CPU/Mem) | ✅ | ⚠️ (Limited) | ⚠️ (Limited) |
| Docker Management | ✅ | ✅ | ✅ |
| System Updates (APT) | ✅ | ❌ | ❌ |
| Battery Monitoring | ✅ | ❌ | ❌ |
| Storage Monitoring | ✅ | ❌ | ❌ |

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ChaitanyaDhiman/homelab-web.git
   cd homelab-web
   chmod +x start-homelab.sh
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure your services**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` to add your service URLs:
   ```env
   NEXT_PUBLIC_SERVICE_PLEX_URL=http://192.168.xx.xx:32400/web
   NEXT_PUBLIC_SERVICE_JELLYFIN_URL=http://192.168.xx.xx:8096
   NEXT_PUBLIC_SERVICE_PIHOLE_URL=http://192.168.xx.xx/admin
   NEXT_PUBLIC_SERVICE_PORTAINER_URL=http://192.168.xx.xx:9443
   NEXT_PUBLIC_SERVICE_OPENWEBUI_URL=http://192.168.xx.xx:8080
   NEXT_PUBLIC_SERVICE_FILEBROWSER_URL=http://192.168.xx.xx:8085
   NEXT_PUBLIC_SERVICE_IMMICH_URL=http://192.168.xx.xx:2283
   NEXT_PUBLIC_SERVICE_COCKPIT_URL=http://192.168.xx.xx:9090
   NEXT_PUBLIC_SERVICE_NPM_URL=http://192.168.xx.xx:82
   NEXT_PUBLIC_SERVICE_BESZEL_URL=http://192.168.xx.xx:8090
   # ... add your specific IPs/Ports
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view your dashboard.

## 🐳 Docker Deployment

### Option 1: Dashboard Only

Deploy just the NexLab dashboard:

```bash
docker-compose up -d --build
```

The dashboard will be available on port `3000` (internal, exposed via proxy).

### Option 2: Full Stack (Recommended)

The easiest way to deploy the dashboard along with all homelab services is using the included helper script. This handles network creation and starts services in the correct order.

```bash
./start-homelab.sh
```

This script will:
1. Create the necessary Docker network (`proxy_net`)
2. Start networking services (Nginx Proxy Manager, Pi-hole)
3. Start core services (Plex, Jellyfin, Portainer, Open WebUI)
4. Build and start the Next.js dashboard

### Manual Full Stack Deployment

If you prefer to start services manually:

1. **Create the network**:
   ```bash
   docker network create proxy_net || true
   ```

2. **Start the dashboard**:
   ```bash
   docker-compose up -d --build
   ```

   **Note for Battery/Updates Features in Docker**:
   The `docker-compose.yml` mounts specific host paths (`/sys/class/power_supply`, `/var/run/reboot-required`, etc.) to allow the container to read host battery status and update information. Ensure your user has read permissions for these paths.

3. **Start the services**:
   ```bash
   cd docker-services
   # Visit each service directory and update configurations
   docker-compose -f nginx-proxy-manager/docker-compose.yml up -d
   # ... repeat for other services
   ```

4. **Configure Nginx Proxy Manager**:
   - Access admin UI at `http://localhost:82`
   - Default credentials: `admin@example.com` / `changeme`
   - Set up proxy hosts for your services (see [docker-services README](./docker-services/README.md))

### SSL/TLS Configuration

For secure access with HTTPS:

1. **Using Let's Encrypt** (for public domains):
   - Configure in Nginx Proxy Manager UI
   - Automatic certificate renewal

2. **Using Self-Signed Certificates** (for local domains):
   ```bash
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout self-signed.key -out self-signed.crt \
     -subj "/CN=docker.mylocalserver.com"
   ```
   Upload as "Custom Certificate" in Nginx Proxy Manager.

## 📁 Project Structure

```
homelab-web/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes (health, system, storage, updates, apps)
│   ├── components/           # React components (moved from root)
│   │   ├── dashboard/        # Dashboard widgets
│   │   ├── icons/            # Custom icons
│   │   ├── settings/         # Settings components
│   │   └── ui/               # Reusable UI elements
│   ├── contexts/             # Centralized state management (moved from root)
│   ├── hooks/                # Custom React hooks (moved from root)
│   ├── lib/                  # Utility functions (moved from root)
│   ├── types/                # TypeScript definitions (moved from root)
│   └── globals.css           # Global styles & theme
├── config/                   # Configuration files (moved from app/config)
│   ├── apps.json             # User app configuration
│   ├── apps.example.json     # Example configuration
│   ├── storage.json          # User storage configuration
│   └── default.json          # Default settings
├── docker-services/          # Docker services configuration
├── start-homelab.sh          # Deployment helper script
├── docker-compose.yml        # Dashboard compose file
└── README.md                 # This file
```


## ⚙️ Configuration

### Apps Configuration

The dashboard uses a key-value JSON configuration system. `config/apps.json` stores your applications.

#### Initial Setup

1. **Automatic Creation**: If `apps.json` is missing (e.g., fresh install), NexLab will automatically create it using `apps.example.json` as a base.
2. **Settings UI**: Navigate to **Settings → Apps Management** to start adding apps immediately.

#### Adding Apps via UI

The easiest way to manage apps is through the web interface:

1. Navigate to **Settings → Apps Management**
2. Click **"Add App"** or **"Add Category"**
3. Fill in the details:
   - **Name**: Display name for your app
   - **Description**: Brief description
   - **URL**: Access URL for the app
   - **Health Check URL**: URL to ping for health status (optional)
   - **Icon**: Choose from 1000+ Lucide icons, upload custom, or use URL
4. **Drag and drop** to reorder apps and categories
5. Click **"Save Changes"**

### Storage Configuration

Manage your monitored drives via **Settings → Storage**. `config/storage.json` stores this configuration.

1. **Automatic Creation**: If missing, `storage.json` is created from `storage.example.json`.
2. **Settings UI**: Add, edit, or remove drives in the Settings tab.
   - **Label**: Display name (e.g., "Movies Drive")
   - **Mount Point**: The path to monitor (e.g., `/mnt/media`)
   - **Icon**: Select a matching icon

Only drives that are actually mounted and accessible by the system will be displayed in the widget.

### Environment Variables

For Docker internal networking, you can optionally configure internal URLs via environment variables:

```env
# Internal Docker URLs (optional, for health checks)
INTERNAL_SERVICE_PLEX_URL=http://plex:32400/web
INTERNAL_SERVICE_JELLYFIN_URL=http://jellyfin:8096
# ... add more as needed
```

The health API will try internal URLs first, then fall back to the URLs in `apps.json`.

### Customizing the Theme

Edit CSS variables in `app/globals.css`:

```css
:root {
  --primary: #00f0ff;
  --secondary: #bd00ff;
  /* ... other variables */
}
```

The dashboard uses [Lucide React](https://lucide.dev) for icons - browse their library to find the perfect icon for your services.

## 🎨 Theming System

The dashboard features a robust dual-theme system built for aesthetics and usability:

- **Dark Theme**: The default immersive theme featuring deep violet/blue gradients, neon accents, and glowing glass panels. Optimized for late-night maintenance sessions.
- **Light Theme**: A polished, professional light theme using soft pastel gradients and high-contrast text for excellent readability in bright environments.

![NexLab Dashboard Light Theme](./public/Dashboard_Light.png)
- **Glassmorphism**: Both themes utilize advanced backdrop filters, semi-transparent layers, and subtle borders to create a modern, layered depth effect.
- **Smooth Transitions**: All theme changes are animated with smooth 300ms transitions for background colors, borders, and text.

## 📊 System Monitoring

The dashboard includes real-time system monitoring using a high-performance polling architecture:

- **Centralized Polling**: Single `/api/system` call every 5 seconds shared across all components via `SystemContext`.
- **CPU**: Current usage percentage and load average.
- **GPU**: Utilization percentage, memory usage, and temperature (NVIDIA/AMD support via `systeminformation`).
- **RAM**: Active memory usage with total available.
- **Temperature**: Average temperature of all CPU cores.
- **Fan Speed**: System fan speed monitoring.
- **Storage**: Usage of configured drives via `/api/storage` with automatic detection.
- **Battery**: Detailed power metrics including charge %, health status, voltage, and power draw (requires `/sys` mount in Docker).
- **Uptime**: System uptime in human-readable format.

## 🔄 System Updates & Host Management

The dashboard includes a dedicated **Updates Center** (`/updates`) powered by an active `update-agent` sidecar container that can monitor, trigger, and execute host package updates in real-time.

### Architecture

```
┌────────────────────────────────────────────────────────┐
│                      Host System                       │
│  - Linux Host APT System (dpkg, apt-get, reboot)       │
└────────────────────────────────────────────────────────┘
                           ▲
             nsenter -t 1 (Host Namespaces)
                           ▼
┌────────────────────────────────────────────────────────┐
│                      update-agent                      │
│                 (FastAPI Daemon :5000)                 │
│  - Executes host commands via nsenter                  │
│  - Runs `apt update`, `apt upgrade -y`, `autoremove`   │
│  - Streams stdout/stderr via Server-Sent Events (SSE)  │
└────────────────────────────────────────────────────────┘
                           ▲
                    HTTP REST & SSE
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Next.js Dashboard                    │
│  - /updates View with Package Version Diffs            │
│  - Embedded Live Execution Terminal (Auto-expanding)   │
│  - System Updates Widget on Home Dashboard             │
└────────────────────────────────────────────────────────┘
```

### Features

- **Dedicated Updates Center**: A full-screen view listing all upgradable packages with current version, target version, architecture, and security badges.
- **Live Terminal Execution**: An embedded xterm-style live execution console at the bottom of the page that streams real-time `apt` output line-by-line as commands run on the host.
- **One-Click Actions**:
  - 🔍 **Check Updates**: Runs `apt update` on the host to refresh mirrors and synchronizes package lists.
  - 🔄 **Refresh Status**: Refetches and analyzes pending updates against the local package cache.
  - ⚡ **Apply Updates**: Executes `apt-get upgrade -y && apt-get autoremove -y` inside host namespaces with confirmation protection.
  - 🔁 **Reboot Host**: Safely triggers `/sbin/reboot` with confirmation dialogs.
- **Security Awareness**: Badges distinguish critical security patches from regular updates.
- **Reboot Detection**: Notifies users when `/var/run/reboot-required` is present on the host.

### API Endpoints

- **`GET /api/updates`**: Returns current pending updates, security counts, package lists, and reboot status.
- **`POST /api/updates/refresh`**: Triggers `apt update` and caches the refreshed package list.
- **`POST /api/updates/apply`**: Triggers full system upgrade and package cleanup.
- **`GET /api/updates/stream`**: Server-Sent Events (SSE) stream providing real-time stdout and execution state.
- **`POST /api/updates/reboot`**: Initiates a host system reboot.

### Configuration

In `docker-compose.yml`, the `update-agent` service is configured with host PID and privileges:

```yaml
  update-agent:
    build:
      context: ./update-agent
      dockerfile: dockerfile
    container_name: update-agent
    privileged: true
    pid: host
    restart: unless-stopped
    ports:
      - "127.0.0.1:5000:5000"
    volumes:
      - ./update-agent/update-check.py:/app/update-check.py:ro
```

## 🔄 Versioning & Auto-Updates

The dashboard includes built-in version tracking and an auto-update mechanism:

### Features
- **Version Display**: Current version (e.g., `v1.0.0`) is always visible in the sidebar footer.
- **Update Notifications**: Automatically checks GitHub Releases for new versions. A pulsing "Update Available" indicator appears when a newer version is found.
- **CI/CD Pipeline**: 
  - Uses GitHub Actions (`.github/workflows/docker-publish.yml`) to automatically build and publish Docker images to GHCR on every push to `master`.
  - Simplifies deployment updates by ensuring the latest image is always available.

## 📡 API Documentation

The dashboard exposes several API endpoints for system monitoring:

### System Stats

**`GET /api/system`**

Returns real-time system information including CPU, RAM, GPU, temperature, and uptime.

```json
{
  "success": true,
  "data": {
    "cpu": { "usage": 15.2, "model": "Intel i7-12700", "cores": 12 },
    "memory": { "total": 32000000000, "used": 12000000000, "percentage": 37.5 },
    "gpu": { "name": "NVIDIA RTX 3080", "utilization": 5, "temperature": 45 },
    "temperature": { "main": 52 },
    "uptime": 345600
  }
}
```

---

### Health Checks

**`GET /api/health`**

Returns health status for all configured services.

```json
{
  "success": true,
  "data": {
    "plex": { "status": "online", "responseTime": 124, "usedFallback": false },
    "jellyfin": { "status": "online", "responseTime": 89, "usedFallback": false }
  }
}
```

---

### Storage

**`GET /api/storage`**

Returns storage information for configured drives.

```json
{
  "success": true,
  "data": {
    "drives": [
      { "id": "main", "label": "Main Storage", "mount": "/", "total": 500000000000, "used": 200000000000, "percentage": 40, "found": true }
    ]
  }
}
```

---

### Updates

**`GET /api/updates`**

Returns system update status (available packages, security updates, reboot status).

```json
{
  "success": true,
  "data": {
    "rebootRequired": false,
    "updatesAvailable": 5,
    "securityUpdates": 2,
    "updatePackages": ["pkg1", "pkg2"],
    "securityPackages": ["pkg1"],
    "packages": [
      {
        "name": "curl",
        "currentVersion": "7.88.1-10+deb12u8",
        "newVersion": "7.88.1-10+deb12u9",
        "architecture": "amd64",
        "isSecurity": true
      }
    ],
    "lastUpdateCheck": "2026-10-29T11:45:00Z"
  }
}
```

**`POST /api/updates/refresh`**

Runs `apt-get update` on host mirrors and synchronizes package status.

**`POST /api/updates/apply`**

Executes `apt-get upgrade -y && apt-get autoremove -y` inside host namespaces.

**`GET /api/updates/stream`**

Server-Sent Events (SSE) stream providing real-time line-by-line output of running update commands.

**`POST /api/updates/reboot`**

Safely triggers a host system reboot via `/sbin/reboot`.

---

### Weather

**`GET /api/weather`**

Returns current weather condition and temperature with automatic server IP-geolocation fallback (works seamlessly on insecure HTTP origins).

Query parameters:
- `lat` / `lon`: Optional latitude and longitude coordinates.
- `city`: Optional city name (geocoded automatically via Open-Meteo).

```json
{
  "success": true,
  "data": {
    "temperature": 21,
    "description": "Clear sky",
    "weatherCode": 0,
    "windSpeed": 5.2,
    "humidity": 45,
    "isDay": true,
    "location": "Dehradun, Uttarakhand"
  }
}
```

## 🏥 Service Health Monitoring

The dashboard includes comprehensive real-time health monitoring for all configured services:

### Features

- **Centralized Health Check**: Single `/api/health` fetch every 30 seconds managed by `HealthContext`.
- **Intelligent Fallback**: Attempts internal Docker networking first, falling back to public URLs with tiered timeouts (2s internal / 3s public) for maximum reliability in both dev and production.
- **Response Time Tracking**: Color-coded response times for performance insights:
  - 🟢 Green: < 200ms (Excellent)
  - 🟡 Yellow: 200-500ms (Good)
  - 🟠 Orange: 500-2000ms (Slow)
  - 🔴 Red: > 2000ms (Degraded)
- **Status Markers**: Visual indicators including a 🌐 marker for fallback connections and status bubbles on each service card.
- **Health Summary Widget**: Expandable overview showing:
  - Overall health percentage
  - Count of online, degraded, and offline services
  - Animated progress bar with color-coded health states

## 🖥️ Cockpit Server Management

Access comprehensive server management through Cockpit:

- Web-based server administration interface
- Real-time system monitoring and metrics
- Service management and logs viewer
- Terminal access directly in the browser
- Storage and network configuration
- Integrated with your homelab services

**Note**: Running Cockpit directly on the host system is recommended over Docker for full functionality.

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server (port 3000)
npm run lint     # Run ESLint
```

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **React**: 19
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion 12
- **Icons**: Lucide React
- **Server Management**: Cockpit
- **System Info**: systeminformation
- **TypeScript**: Full type safety

## 🔒 Security Best Practices

- Change all default passwords immediately after deployment
- Use SSL/TLS certificates for all services
- Restrict access to admin interfaces
- Keep all services updated regularly (Watchtower handles this automatically)
- Use strong passwords and consider implementing authentication
- Review Pi-hole logs for suspicious DNS queries
- Limit external access to services that don't need it

## 🐛 Troubleshooting

### Dashboard Won't Start

```bash
# Check logs
docker compose logs nextjs-dashboard

# Rebuild container
docker compose up -d --build --force-recreate
```

### Services Not Accessible

- Verify service URLs in `.env.local`
- Check that services are running: `docker ps`
- Ensure network connectivity between containers
- Check Nginx Proxy Manager configuration

### System Stats Not Loading

- Ensure the dashboard has proper permissions to read system info
- Check `/api/system` endpoint in browser DevTools
- Verify `systeminformation` package is installed
- For GPU stats, ensure you have NVIDIA/AMD drivers installed

### Storage Drives Not Showing

- Check your storage configuration in Settings or `app/config/storage.json`
- Verify the drives are mounted: `df -h`
- Only drives that are actually present will be displayed

### Cockpit Not Accessible

- Verify Cockpit service is running on the host or in Docker
- Check Nginx Proxy Manager configuration for Cockpit
- Ensure port 9090 (host) or 4200 (Docker) is not blocked by firewall
- Check logs: `systemctl status cockpit` (host) or `docker logs cockpit` (Docker)

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Docker Services Documentation](./docker-services/README.md)
- [Nginx Proxy Manager Guide](https://nginxproxymanager.com/guide/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this project for your own homelab!

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the homelab community
- Icons by [Lucide](https://lucide.dev)

---

**NexLab Dashboard - Made with ❤️ for homelabbers**
