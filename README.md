# Mobile Edge Computing (MEC) — Network Simulation
**B.Tech Presentation & Demonstration Platform**

---

## 🎯 Overview

This is a dedicated, interactive visual and behavioral simulation of a **Mobile Edge Computing (MEC)** network designed for high-clarity academic presentations, classroom lectures, and engineering defenses.

The simulation visualizes a structured **5-Zone Network Topology**:

```
┌─────────────────────────────────────────────────────────────┐
│ ZONE 1 (TOP):            ☁ CLOUD DATA CENTER                │
│              [COMPUTE | STORAGE | AI/ML | GLOBAL SERVICES]  │
│                                                             │
│ ZONE 2 (UPPER-MID):          CORE NETWORK                   │
│                                   │                         │
│ ZONE 3 (MIDDLE):       📡 5G BS ───────► 🖥 MEC HOST        │
│                       (gNodeB)  EDGE BACKHAUL               │
│                          ))))                               │
│ ZONE 4 (LOWER-MID):           🛸 UAV-MEC                    │
│                            (Mobile Edge Node)               │
│                                )))))))))                    │
│ ZONE 5 (BOTTOM):    📱     📱     📱     📱     📱     📱   │
│                   UE-01  UE-02  UE-03  UE-04  UE-05  UE-06  │
│                   Video   AI   Sensor   AR    IoT   Vehicle │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Running the Webpage

### Direct Double-Click (Zero Setup Required)
Simply double-click [`index.html`](file:///c:/Users/rajra/OneDrive/Desktop/MEC%20simulation/index.html) in your Windows File Explorer to open in Google Chrome, Microsoft Edge, Brave, or Firefox.

- **100% Offline Compatible:** Built with vanilla HTML5, CSS3, and JavaScript with HTML5 Canvas.
- **Zero Dependencies:** No Node.js runtime, backend server, database, or network connection required.

---

## ⌨️ Presentation Keyboard Shortcuts

| Shortcut | Function | Description |
| :---: | :---: | :--- |
| **`Space`** | **Start / Pause** | Toggle simulation running state instantly |
| **`R`** | **Reset** | Reset network metrics, queues, and packets to idle state |
| **`M`** | **Toggle Topology Mode** | Switch between **MEC Mode** (Edge Acceleration) and **Traditional Cloud Mode** (Distant Datacenter) |
| **`U`** | **Toggle UAV-MEC** | Deploy / standby the aerial edge computing drone |
| **`P`** | **Presentation Mode** | Maximizes canvas to 78vh, hides control drawers for classroom projector screens |

---

## ⚡ Three Demonstrable Computing Modes

### 1. Traditional Cloud Computing Mode
- **No MEC infrastructure is visible** (MEC Host, Edge applications, Edge cache, and UAV-MEC are completely hidden).
- Centralized Hyperscale **Cloud Data Center** located at the top with:
  `COMPUTE` • `STORAGE` • `AI / ML` • `DATABASE`
- Traversal path:
  `📱 Mobile Users ➔ 📡 5G Base Station ➔ 🌐 Mobile Core Network ➔ 🌍 Internet / WAN ➔ ☁ Cloud Data Center`
- When Cloud Data Center receives data: **`CLOUD PROCESSING`** illuminates on the datacenter.
- Long round-trip communication path with **`SIMULATED RTT: ~120 ms`** (4 Hops).

### 2. Mobile Edge Computing (MEC) Mode (Default)
- **5G Base Station & MEC Host** are co-located at the edge tier and connected by a direct **`HIGH-SPEED EDGE LINK`**.
- MEC Host contains:
  `CPU` • `GPU` • `EDGE APPLICATIONS` • `CACHE` • `AI SERVICES`
- Traversal path:
  `📱 Mobile Users ➔ 📡 5G Base Station ➔ 🖥 MEC Host ➔ Result Returned`
- Optional cloud collaboration: Periodic model updates and global synchronization via **`Core Network ➔ Cloud Data Center`**.
- Short 1-hop path with **`SIMULATED RTT: ~15 ms`**.
- **UAV-MEC (Mobile Edge Node)** can be toggled ON/OFF as an aerial extension of edge compute.

### 3. Side-by-Side Architectural Compare Mode
- Splits the network visualization down the center with a central futuristic divider:
  - **Left Half:** Traditional Cloud Computing (`Remote Computing` • 4 Hops)
  - **Right Half:** Mobile Edge Computing (`Nearby Computing` • 1 Hop)
- Dedicated **`RUN SAME TASK: AI VIDEO ANALYTICS`** action:
  Dispatches the identical task (`Input: Video Stream`, `Processing: Object Detection`, `Output: "Vehicle Detected"`) simultaneously on both architectures.
  Demonstrates visually that MEC terminates at the nearby Edge Host in a fraction of the time while Traditional Cloud is still traversing the WAN transit network!

---

## 🖥️ 9-Step Interactive Presentation Mode

Click **`[ 🖥️ PRESENTATION MODE ]`** (or press key **`P`**) to activate the presenter walkthrough with previous/next controls (`ArrowLeft` / `ArrowRight`):

1. **Step 1:** Traditional Cloud Computing Architecture (Centralized remote compute)
2. **Step 2:** User Generates AI Task Request (Workload initiated)
3. **Step 3:** Traversing 4-Hop WAN Transit Network (Long path & transit delay)
4. **Step 4:** Switching to Mobile Edge Computing (MEC Host placed co-located at 5G Base Station)
5. **Step 5:** Starting Identical Workload in MEC (Fair comparison)
6. **Step 6:** Direct 1-Hop Edge Processing (Immediate response, ~15ms simulated RTT)
7. **Step 7:** Enabling UAV-MEC (Mobile Edge Node aerial extension)
8. **Step 8:** Dynamic Aerial Edge Processing (Quadcopter Line-of-Sight edge offloading)
9. **Step 9:** Conclusion: *“MEC brings computing closer to mobile users. MEC does not replace cloud computing. It brings suitable computing resources closer to users and works alongside the cloud.”*

- **UAV-MEC** acts as an aerial edge node hovering above users.
- Central Cloud receives only periodic summary telemetry via **`Cloud Synchronization`**.

### 2. Traditional Cloud Mode (Distant Transit)
- Press **`M`** or click the topology button.
- **MEC Host and UAV-MEC are bypassed and removed from the canvas topology**.
- The 5G Base Station sits centrally, routing all mobile traffic through the **`CORE NETWORK`** over a long **`WIDE-AREA TRANSIT (~120ms)`** link to the distant **`CLOUD DATA CENTER`**.
- Evaluators can immediately witness the dramatic latency and congestion penalty of traditional non-MEC architectures.

---

## 🎨 Data Flow Particle Colors

| Color | Workload |
| :---: | :--- |
| **CYAN** | Sensor Data |
| **BLUE** | Video Data |
| **ORANGE** | AI Request |
| **GREEN** | Edge Result |
| **PURPLE** | Cloud Sync |

---

## 📊 4 Key Presentation Metrics

1. **ACTIVE USERS:** 6 connected 5G User Equipments (UE).
2. **ACTIVE MEC NODES:** 5 hardware accelerator modules (0 when in Traditional Cloud Mode).
3. **TASKS PROCESSOR:** Completed computing decisions returned to mobile devices.
4. **EDGE LOAD:** Real-time edge host utilization percentage.
