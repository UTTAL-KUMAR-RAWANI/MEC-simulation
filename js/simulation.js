// Simulation Engine for MEC Network Simulation
// Manages discrete events, packet queues, telemetry metrics, and topology routing

class MecSimulation {
    constructor() {
        const { PACKET_TYPES, MEC_NODES, MOBILE_USERS } = window.MecData;
        this.PACKET_TYPES = PACKET_TYPES;
        this.MEC_NODES = MEC_NODES;
        this.MOBILE_USERS = MOBILE_USERS;

        this.status = 'idle'; // 'idle' | 'running' | 'paused'
        this.mode = 'mec';    // 'mec' | 'cloud' | 'compare'
        this.speed = 1.0;     // 0.5 (slow), 1.0 (normal), 2.0 (fast)
        this.userActivity = 'medium'; // 'low', 'medium', 'high'
        this.edgeLoadLevel = 'medium';
        this.uavMode = true;  // UAV-MEC enabled by default in MEC mode

        // Telemetry metrics
        this.metrics = {
            activeUsers: 6,
            activeMecNodes: 5,
            tasksProcessed: 0,
            edgeLoad: 42,
            cloudRequests: 38,
            cloudLoad: 42,
            networkHops: 1,
            simulatedRtt: '~15 ms'
        };

        // Internal processing states
        this.nodeProcessing = {
            CPU: { active: false, currentTask: null, progress: 0 },
            GPU: { active: false, currentTask: null, progress: 0 },
            'EDGE APPLICATIONS': { active: false, currentTask: null, progress: 0 },
            CACHE: { active: false, currentTask: null, progress: 0 },
            'AI SERVICES': { active: false, currentTask: null, progress: 0 }
        };

        this.uavState = {
            active: true,
            processing: false,
            currentTask: null,
            load: 28
        };

        this.cloudState = {
            processing: false,
            statusText: 'CENTRAL CLOUD IDLE'
        };

        this.packets = [];
        this.nextPacketId = 1;
        this.eventLogs = [];

        this.lastUserSpawnTime = 0;
        this.lastCloudSyncTime = 0;
        this.userSpawnInterval = 1700;
        this.eventListeners = [];

        this.addLog('SYSTEM', 'Network initialized in MEC Mode. Ready.', 'info');
    }

    start() {
        if (this.status === 'running') return;
        this.status = 'running';
        this.addLog('ORCHESTRATOR', `Simulation active [${this.mode.toUpperCase()} MODE]`, 'start');

        // Immediately spawn initial active packets so running dots are animated right away
        if (this.packets.length === 0) {
            this.generateRandomUserTraffic();
            setTimeout(() => {
                if (this.status === 'running' && this.packets.length < 3) {
                    this.generateRandomUserTraffic();
                }
            }, 500);
        }

        this.notify('statusChange', this.status);
    }

    pause() {
        if (this.status !== 'running') return;
        this.status = 'paused';
        this.addLog('SYSTEM', 'Simulation paused by presenter.', 'warning');
        this.notify('statusChange', this.status);
    }

    togglePlayPause() {
        if (this.status === 'running') {
            this.pause();
        } else {
            this.start();
        }
    }

    reset() {
        this.status = 'idle';
        this.packets = [];
        this.metrics.tasksProcessed = 0;
        this.metrics.edgeLoad = this.mode === 'mec' ? 42 : 0;
        this.metrics.cloudLoad = 42;
        this.metrics.cloudRequests = 38;

        Object.keys(this.nodeProcessing).forEach(key => {
            this.nodeProcessing[key] = { active: false, currentTask: null, progress: 0 };
        });

        this.uavState.processing = false;
        this.uavState.currentTask = null;
        this.cloudState.processing = false;
        this.cloudState.statusText = 'CENTRAL CLOUD IDLE';

        this.eventLogs = [];
        this.addLog('SYSTEM', 'Network reset to baseline idle state.', 'info');
        this.notify('statusChange', this.status);
        this.notify('metricsUpdate', this.metrics);
        this.notify('logUpdate', this.eventLogs);
    }

    setMode(newMode) {
        if (this.mode === newMode) return;
        this.mode = newMode;
        this.packets = [];

        if (this.mode === 'cloud') {
            this.metrics.activeMecNodes = 0;
            this.metrics.edgeLoad = 0;
            this.metrics.networkHops = 4;
            this.metrics.cloudLoad = 42;
            this.metrics.cloudRequests = Math.max(38, this.metrics.tasksProcessed + 38);
            this.metrics.simulatedRtt = '~120 ms';
            this.addLog('TOPOLOGY', 'Switched to TRADITIONAL CLOUD (All tasks route to distant Datacenter)', 'cloud');
        } else if (this.mode === 'compare') {
            this.metrics.networkHops = '4 vs 1';
            this.metrics.simulatedRtt = '15ms vs 120ms';
            this.addLog('TOPOLOGY', 'Switched to SIDE-BY-SIDE ARCHITECTURAL COMPARISON', 'info');
        } else {
            this.mode = 'mec';
            this.metrics.activeMecNodes = 5;
            this.metrics.edgeLoad = 42;
            this.metrics.networkHops = 1;
            this.metrics.simulatedRtt = '~15 ms';
            this.addLog('TOPOLOGY', 'Switched to MEC MODE (Co-located Edge Host active near users)', 'start');
        }

        this.notify('modeChange', this.mode);
        this.notify('metricsUpdate', this.metrics);
    }

    toggleMode() {
        if (this.mode === 'mec') this.setMode('cloud');
        else if (this.mode === 'cloud') this.setMode('compare');
        else this.setMode('mec');
    }

    setSpeed(speedVal) {
        this.speed = parseFloat(speedVal);
        this.addLog('CONTROL', `Simulation speed: ${this.speed}x`, 'info');
    }

    setUserActivity(level) {
        this.userActivity = level;
        if (level === 'low') this.userSpawnInterval = 2800;
        else if (level === 'medium') this.userSpawnInterval = 1700;
        else if (level === 'high') this.userSpawnInterval = 850;
        this.addLog('CONFIG', `User traffic load: ${level.toUpperCase()}`, 'info');
    }

    toggleUavMode(forceVal) {
        this.uavMode = forceVal !== undefined ? forceVal : !this.uavMode;
        this.uavState.active = this.uavMode;
        if (this.uavMode) {
            this.addLog('UAV-MEC', 'UAV-MEC Mobile Edge Node: ONLINE', 'uav');
        } else {
            this.addLog('UAV-MEC', 'UAV-MEC Mobile Edge Node: STANDBY (Ground RAN Only)', 'warning');
        }
        this.notify('uavChange', this.uavMode);
    }

    update(deltaTimeMs) {
        if (this.status !== 'running') return;

        const effectiveDelta = deltaTimeMs * this.speed;

        // Periodic user packet generation
        this.lastUserSpawnTime += effectiveDelta;
        if (this.lastUserSpawnTime >= this.userSpawnInterval) {
            this.lastUserSpawnTime = 0;
            this.generateRandomUserTraffic();
        }

        // Periodic cloud sync (only in MEC mode)
        if (this.mode === 'mec') {
            this.lastCloudSyncTime += effectiveDelta;
            if (this.lastCloudSyncTime >= 7000) {
                this.lastCloudSyncTime = 0;
                this.triggerCloudSyncEvent();
            }
        }

        this.updatePackets(effectiveDelta);
        this.updateNodeProcessing(effectiveDelta);
        this.updateDynamicMetrics();
    }

    generateRandomUserTraffic() {
        if (this.mode === 'compare') {
            // Pick randomly between left side user (UE-01..03) or right side user (UE-04..06)
            const user = this.MOBILE_USERS[Math.floor(Math.random() * this.MOBILE_USERS.length)];
            const taskType = this.PACKET_TYPES[user.primaryTask] || this.PACKET_TYPES.AI_REQUEST;
            this.spawnPacket(user, taskType);
            return;
        }

        const user = this.MOBILE_USERS[Math.floor(Math.random() * this.MOBILE_USERS.length)];
        const taskType = this.PACKET_TYPES[user.primaryTask] || this.PACKET_TYPES.AI_REQUEST;
        this.spawnPacket(user, taskType);
    }

    spawnPacket(user, packetType, isForcedCompare = false, compareSide = null) {
        const id = this.nextPacketId++;

        let trajectory = [];
        let routesViaUav = false;
        let isCloudPath = false;

        if (this.mode === 'cloud' || compareSide === 'cloud' || (this.mode === 'compare' && ['UE-01', 'UE-02', 'UE-03'].includes(user.id))) {
            // Traditional Cloud Mode:
            // Mobile User -> 5G Base Station -> Mobile Core Network -> Internet/WAN -> Cloud Data Center -> Result Back
            trajectory = ['USER', 'BS', 'CORE', 'WAN', 'CLOUD', 'WAN', 'CORE', 'BS', 'USER'];
            isCloudPath = true;
        } else {
            // MEC Mode:
            // Check if user is in UAV zone (UE-01, UE-02, UE-03 in normal MEC mode) and UAV is active
            const inUavZone = (user.id === 'UE-01' || user.id === 'UE-02' || user.id === 'UE-03');
            routesViaUav = (this.mode === 'mec') && this.uavMode && inUavZone && (Math.random() < 0.65);

            if (routesViaUav) {
                // Direct aerial edge processing
                trajectory = ['USER', 'UAV', 'USER'];
            } else {
                // User -> 5G Base Station -> MEC Host -> 5G Base Station -> User
                trajectory = ['USER', 'BS', 'MEC', 'BS', 'USER'];
            }
        }

        const packet = {
            id,
            user,
            type: packetType,
            startTime: performance.now(),
            stageIndex: 0,
            trajectory,
            progress: 0,
            speed: (isCloudPath ? 0.0019 : 0.0022) * this.speed,
            status: 'in-flight',
            currentFrom: trajectory[0],
            currentTo: trajectory[1],
            targetMecNode: packetType.targetNode,
            isUavHandled: routesViaUav,
            isTraditionalCloud: isCloudPath,
            isCompare: Boolean(isForcedCompare),
            compareSide: compareSide
        };

        this.packets.push(packet);

        if (routesViaUav) {
            this.addLog(`${user.id} ➔ UAV-MEC`, `${packetType.label} Generated`, 'uav');
        } else if (isCloudPath) {
            this.addLog(`${user.id} ➔ 5G Base Station`, `${packetType.label} Generated`, 'traffic');
        } else {
            this.addLog(`${user.id} ➔ 5G Base Station`, `${packetType.label} Generated`, 'traffic');
        }

        return packet;
    }

    dispatchCompareTask() {
        const compTask = window.MecData.COMPARISON_TASK;
        const taskType = {
            id: 'compare_ai_video',
            label: compTask.title,
            color: '#38bdf8',
            glow: 'rgba(56, 189, 248, 0.8)',
            icon: '📹',
            targetNode: 'GPU'
        };

        this.addLog('COMPARE', `Simultaneous Task Dispatched: ${compTask.title} (${compTask.input})`, 'start');

        // Spawn on Left (Cloud - UE-02) and Right (MEC - UE-05) at the exact same instant
        const userCloud = this.MOBILE_USERS[1]; // UE-02
        const userMec = this.MOBILE_USERS[4];   // UE-05

        this.spawnPacket(userCloud, taskType, true, 'cloud');
        this.spawnPacket(userMec, taskType, true, 'mec');
    }

    triggerCloudSyncEvent() {
        if (this.packets.length > 12) return;

        const id = this.nextPacketId++;
        const packet = {
            id,
            user: { id: 'MEC HOST', name: 'MEC Host' },
            type: this.PACKET_TYPES.CLOUD_SYNC,
            startTime: performance.now(),
            stageIndex: 0,
            trajectory: ['MEC', 'CORE', 'CLOUD'],
            progress: 0,
            speed: 0.0014 * this.speed,
            status: 'in-flight',
            currentFrom: 'MEC',
            currentTo: 'CORE',
            targetMecNode: 'CLOUD',
            isUavHandled: false,
            isTraditionalCloud: false
        };

        this.packets.push(packet);
        this.addLog('MEC Host ➔ Cloud', 'Model Synchronization', 'cloud');
    }

    updatePackets(delta) {
        for (let i = this.packets.length - 1; i >= 0; i--) {
            const pkt = this.packets[i];

            if (pkt.status === 'processing-at-node') {
                pkt.processTimer -= delta;
                if (pkt.processTimer <= 0) {
                    this.onPacketFinishedProcessing(pkt);
                }
                continue;
            }

            if (pkt.status === 'in-flight') {
                pkt.progress += pkt.speed * delta;
                if (pkt.progress >= 1.0) {
                    pkt.progress = 0;
                    pkt.stageIndex++;

                    if (pkt.stageIndex >= pkt.trajectory.length - 1) {
                        this.onPacketCompleted(pkt);
                        this.packets.splice(i, 1);
                    } else {
                        const waypoint = pkt.trajectory[pkt.stageIndex];
                        pkt.currentFrom = waypoint;
                        pkt.currentTo = pkt.trajectory[pkt.stageIndex + 1];

                        this.onPacketReachedWaypoint(pkt, waypoint);
                    }
                }
            }
        }
    }

    onPacketReachedWaypoint(pkt, waypoint) {
        if (waypoint === 'BS') {
            if (pkt.currentTo === 'MEC') {
                this.addLog('Base Station ➔ MEC Host', 'Request Received', 'traffic');
            } else if (pkt.currentTo === 'CORE') {
                this.addLog('Base Station ➔ Mobile Core', 'Data Forwarded', 'traffic');
            }
        } else if (waypoint === 'CORE') {
            if (pkt.currentTo === 'WAN') {
                this.addLog('Core ➔ Internet / WAN', 'Cloud Request', 'cloud');
            }
        } else if (waypoint === 'WAN') {
            // Traversing WAN to Cloud
        } else if (waypoint === 'UAV') {
            // UAV-MEC processes task
            pkt.status = 'processing-at-node';
            pkt.processTimer = 420;
            this.uavState.processing = true;
            this.uavState.currentTask = pkt.type.label;
            this.addLog('UAV-MEC', `Mobile Edge Processing`, 'uav');
        } else if (waypoint === 'MEC') {
            // MEC Host processing (nearby edge processing)
            const target = pkt.targetMecNode || 'GPU';
            pkt.status = 'processing-at-node';
            pkt.processTimer = 450;

            if (this.nodeProcessing[target]) {
                this.nodeProcessing[target].active = true;
                this.nodeProcessing[target].currentTask = pkt.type.label;
                this.nodeProcessing[target].progress = 0;
            }

            if (pkt.isCompare) {
                this.addLog('MEC Host', 'AI Processing: Object Detection', 'process');
            } else {
                this.addLog('MEC Host', 'AI Processing', 'process');
            }
        } else if (waypoint === 'CLOUD') {
            if (pkt.type.id === 'cloud_sync') {
                this.cloudState.processing = true;
                this.cloudState.statusText = 'SYNCING MODEL';
                setTimeout(() => {
                    this.cloudState.processing = false;
                    this.cloudState.statusText = 'CENTRAL CLOUD IDLE';
                }, 800);
                this.addLog('Cloud Data Center', 'Cloud Synchronization Complete', 'cloud');
                this.onPacketCompleted(pkt);
                const idx = this.packets.indexOf(pkt);
                if (idx > -1) this.packets.splice(idx, 1);
            } else {
                // Traditional Cloud mode processing (longer delay across distant WAN!)
                pkt.status = 'processing-at-node';
                pkt.processTimer = 850;
                this.cloudState.processing = true;
                this.cloudState.statusText = 'CLOUD PROCESSING';
                if (pkt.isCompare) {
                    this.addLog('Cloud Data Center', 'Processing AI Request (Object Detection)', 'cloud');
                } else {
                    this.addLog('Cloud Data Center', 'Processing AI Request', 'cloud');
                }
            }
        }
    }

    onPacketFinishedProcessing(pkt) {
        pkt.status = 'in-flight';

        if (pkt.isUavHandled) {
            this.uavState.processing = false;
            this.uavState.currentTask = null;
            pkt.type = this.PACKET_TYPES.RESULT;
            this.addLog(`UAV-MEC ➔ ${pkt.user.id}`, 'Result Returned', 'result');
        } else if (pkt.isTraditionalCloud) {
            this.cloudState.processing = false;
            this.cloudState.statusText = 'CENTRAL CLOUD IDLE';
            pkt.type = this.PACKET_TYPES.RESULT;
            if (pkt.isCompare) {
                this.addLog(`Cloud ➔ ${pkt.user.id}`, 'Result: "Vehicle Detected" (SIMULATED RTT: ~120ms)', 'result');
            } else {
                this.addLog(`Cloud ➔ ${pkt.user.id}`, 'Result Returned', 'result');
            }
        } else {
            if (pkt.targetMecNode && this.nodeProcessing[pkt.targetMecNode]) {
                this.nodeProcessing[pkt.targetMecNode].active = false;
                this.nodeProcessing[pkt.targetMecNode].currentTask = null;
            }
            pkt.type = this.PACKET_TYPES.RESULT;
            if (pkt.isCompare) {
                this.addLog(`MEC Host ➔ ${pkt.user.id}`, 'Result: "Vehicle Detected" (SIMULATED RTT: ~15ms)', 'result');
            } else {
                this.addLog(`MEC Host ➔ ${pkt.user.id}`, 'Result Returned', 'result');
            }
        }
    }

    onPacketCompleted(pkt) {
        this.metrics.tasksProcessed++;
        if (this.mode === 'cloud') {
            this.metrics.cloudRequests++;
        }
        this.notify('metricsUpdate', this.metrics);
    }

    updateNodeProcessing(delta) {
        Object.keys(this.nodeProcessing).forEach(key => {
            const proc = this.nodeProcessing[key];
            if (proc.active) {
                proc.progress = Math.min(100, proc.progress + (0.35 * this.speed * delta));
            } else {
                proc.progress = Math.max(0, proc.progress - (0.2 * delta));
            }
        });
    }

    updateDynamicMetrics() {
        if (this.mode === 'cloud') {
            this.metrics.activeMecNodes = 0;
            this.metrics.edgeLoad = 0;
        } else {
            this.metrics.activeMecNodes = 5;
            let baseLoad = 38;
            if (this.edgeLoadLevel === 'high') baseLoad = 72;
            if (this.edgeLoadLevel === 'low') baseLoad = 22;

            const activeNodeCount = Object.values(this.nodeProcessing).filter(p => p.active).length;
            const uavBonus = (this.uavMode && this.uavState.processing) ? 8 : 0;
            const targetLoad = Math.min(95, Math.max(18, baseLoad + (activeNodeCount * 12) + uavBonus + (this.packets.length * 2)));

            this.metrics.edgeLoad = Math.round(this.metrics.edgeLoad * 0.94 + targetLoad * 0.06);
        }

        this.notify('metricsUpdate', this.metrics);
    }

    addLog(source, text, category = 'info') {
        const now = new Date();
        const timeStr = [
            now.getHours().toString().padStart(2, '0'),
            now.getMinutes().toString().padStart(2, '0'),
            now.getSeconds().toString().padStart(2, '0')
        ].join(':');

        const logEntry = {
            id: Date.now() + Math.random(),
            time: timeStr,
            source,
            text,
            category
        };

        this.eventLogs.unshift(logEntry);
        if (this.eventLogs.length > 5) {
            this.eventLogs.pop();
        }

        this.notify('logUpdate', this.eventLogs);
    }

    on(event, callback) {
        this.eventListeners.push({ event, callback });
    }

    notify(event, data) {
        this.eventListeners
            .filter(l => l.event === event)
            .forEach(l => l.callback(data));
    }
}

window.MecSimulation = MecSimulation;
