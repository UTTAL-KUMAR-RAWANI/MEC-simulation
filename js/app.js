// Application Controller & UI Coordinator
// Handles simulation controls, presentation mode, 3-mode topology selector, comparison dispatcher, and telemetry

class App {
    constructor() {
        this.sim = new window.MecSimulation();
        this.svg = document.getElementById('network-svg');
        this.renderer = new window.NetworkRenderer(this.svg, this.sim);

        this.isPresentationMode = false;
        this.currentPresStep = 0;
        this.lastFrameTime = performance.now();

        this.initDOMReferences();
        this.initPresentationSteps();
        this.bindSimulationEvents();
        this.bindUIEvents();
        this.bindKeyboardShortcuts();
        this.setupResizeHandler();

        // Auto-start simulation immediately so running dot animation is active on load
        this.sim.start();

        requestAnimationFrame(this.renderLoop.bind(this));
    }

    initDOMReferences() {
        // Core Control Buttons
        this.btnStart = document.getElementById('btn-start');
        this.btnPause = document.getElementById('btn-pause');
        this.btnReset = document.getElementById('btn-reset');
        this.btnPresentation = document.getElementById('btn-presentation');
        this.btnToggleUav = document.getElementById('btn-toggle-uav');
        this.btnCompareTask = document.getElementById('btn-compare-task');
        this.statusIndicator = document.getElementById('live-status-indicator');
        this.startOverlay = document.getElementById('start-overlay');
        this.btnOverlayStart = document.getElementById('btn-overlay-start');

        // Mode Switcher Buttons
        this.modeBtnCloud = document.getElementById('mode-btn-cloud');
        this.modeBtnMec = document.getElementById('mode-btn-mec');
        this.modeBtnCompare = document.getElementById('mode-btn-compare');

        // Dynamic Educational Strip & Badges
        this.modeArchitectureBadge = document.getElementById('mode-architecture-badge');
        this.educationalArchitectureDesc = document.getElementById('educational-architecture-desc');

        // 5 Dynamic Metrics Cards
        this.metricActiveUsers = document.getElementById('metric-active-users');
        this.metricLabelNode = document.getElementById('metric-label-node');
        this.metricActiveMec = document.getElementById('metric-active-mec');
        this.metricMecSub = document.getElementById('metric-mec-sub');
        this.metricTasksProcessed = document.getElementById('metric-tasks-processed');
        this.metricLabelLoad = document.getElementById('metric-label-load');
        this.metricEdgeLoad = document.getElementById('metric-edge-load');
        this.metricLoadSub = document.getElementById('metric-load-sub');
        this.metricLabelRtt = document.getElementById('metric-label-rtt');
        this.metricSimulatedRtt = document.getElementById('metric-simulated-rtt');
        this.metricRttSub = document.getElementById('metric-rtt-sub');

        // Presentation Stepper HUD
        this.presentationStepperBar = document.getElementById('presentation-stepper-bar');
        this.presStepNum = document.getElementById('pres-step-num');
        this.presStepTitle = document.getElementById('pres-step-title');
        this.presStepDesc = document.getElementById('pres-step-desc');
        this.btnPresPrev = document.getElementById('btn-pres-prev');
        this.btnPresNext = document.getElementById('btn-pres-next');
        this.btnPresExit = document.getElementById('btn-pres-exit');

        // Event Log
        this.eventLogContainer = document.getElementById('event-log-list');

        // Node Inspector Modal
        this.inspectorModal = document.getElementById('inspector-modal');
        this.inspectorTitle = document.getElementById('inspector-title');
        this.inspectorContent = document.getElementById('inspector-content');
        this.inspectorClose = document.getElementById('inspector-close');
    }

    initPresentationSteps() {
        this.presSteps = [
            {
                num: 1,
                title: 'Traditional Cloud Computing Architecture',
                desc: 'In traditional cloud computing, computation and storage are centralized in a distant datacenter far away from mobile users across the WAN.',
                run: () => {
                    this.sim.setMode('cloud');
                }
            },
            {
                num: 2,
                title: 'User Generates AI Task Request',
                desc: 'A mobile user generates an AI video analytics request requiring computational resources.',
                run: () => {
                    this.sim.setMode('cloud');
                    this.sim.start();
                    this.sim.generateRandomUserTraffic();
                }
            },
            {
                num: 3,
                title: 'Traversing 4-Hop WAN Transit Network',
                desc: 'The packet travels: User ➔ 5G Base Station ➔ Mobile Core ➔ WAN ➔ Cloud Data Center, leading to high simulated round-trip latency (~120ms).',
                run: () => {
                    this.sim.setMode('cloud');
                }
            },
            {
                num: 4,
                title: 'Switching to Mobile Edge Computing (MEC)',
                desc: 'The MEC Host is co-located right at the 5G Base Station, placing general compute, GPU, caching, and AI engines physically close to the users.',
                run: () => {
                    this.sim.setMode('mec');
                }
            },
            {
                num: 5,
                title: 'Starting Identical Workload in MEC',
                desc: 'The same AI video analytics workload is generated under the MEC architecture.',
                run: () => {
                    this.sim.setMode('mec');
                    this.sim.generateRandomUserTraffic();
                }
            },
            {
                num: 6,
                title: 'Direct 1-Hop Edge Processing (~15ms SIMULATED RTT)',
                desc: 'The task reaches the nearby MEC Host directly. Results return in ~15 ms simulated latency without congesting the core WAN backbone.',
                run: () => {
                    this.sim.setMode('mec');
                }
            },
            {
                num: 7,
                title: 'Enabling UAV-MEC (Mobile Edge Node)',
                desc: 'UAV-MEC is an extension of MEC: autonomous drones carry accelerated edge computing to expand edge coverage dynamically.',
                run: () => {
                    this.sim.setMode('mec');
                    this.sim.toggleUavMode(true);
                    this.updateUavButtonState();
                }
            },
            {
                num: 8,
                title: 'Dynamic Aerial Edge Processing',
                desc: 'Mobile users in the UAV zone connect directly to the UAV-MEC node with rapid line-of-sight wireless communication.',
                run: () => {
                    this.sim.setMode('mec');
                    this.sim.toggleUavMode(true);
                    this.sim.spawnPacket(this.sim.MOBILE_USERS[1], this.sim.PACKET_TYPES.AI_REQUEST);
                }
            },
            {
                num: 9,
                title: 'Conclusion: MEC Brings Computing Closer to Users',
                desc: '“MEC brings computing closer to mobile users. MEC does not replace cloud computing. It brings suitable computing resources closer to users and works alongside the cloud.”',
                run: () => {
                    this.sim.setMode('compare');
                    this.sim.dispatchCompareTask();
                }
            }
        ];
    }

    bindSimulationEvents() {
        this.sim.on('statusChange', (status) => {
            if (status === 'running') {
                this.statusIndicator.innerHTML = '<span class="status-dot green animate-ping"></span> <span class="status-text text-green">LIVE SIMULATION</span>';
                this.btnStart.classList.add('active-primary');
                this.btnPause.classList.remove('active-warning');
                if (this.startOverlay) this.startOverlay.classList.add('hidden');
            } else if (status === 'paused') {
                this.statusIndicator.innerHTML = '<span class="status-dot amber"></span> <span class="status-text text-amber">PAUSED</span>';
                this.btnStart.classList.remove('active-primary');
                this.btnPause.classList.add('active-warning');
            } else {
                this.statusIndicator.innerHTML = '<span class="status-dot cyan"></span> <span class="status-text text-cyan">IDLE</span>';
                this.btnStart.classList.remove('active-primary');
                this.btnPause.classList.remove('active-warning');
            }
        });

        this.sim.on('modeChange', (mode) => {
            this.updateModeUIState(mode);
            this.renderer.refreshTopology();
        });

        this.sim.on('uavChange', () => {
            this.renderer.refreshTopology();
        });

        this.sim.on('metricsUpdate', (metrics) => {
            if (this.metricActiveUsers) this.metricActiveUsers.textContent = metrics.activeUsers;
            if (this.metricTasksProcessed) this.metricTasksProcessed.textContent = metrics.tasksProcessed;

            const mode = this.sim.mode;
            if (mode === 'cloud') {
                // Traditional Cloud Mode Metrics
                if (this.metricLabelNode) this.metricLabelNode.textContent = 'CLOUD REQUESTS';
                if (this.metricActiveMec) this.metricActiveMec.textContent = metrics.cloudRequests || '38';
                if (this.metricMecSub) this.metricMecSub.textContent = 'Centralized DC Queue';

                if (this.metricLabelLoad) this.metricLabelLoad.textContent = 'CLOUD LOAD';
                if (this.metricEdgeLoad) this.metricEdgeLoad.textContent = `${metrics.cloudLoad || 42}%`;
                if (this.metricLoadSub) this.metricLoadSub.textContent = 'Hyperscale DC Load';

                if (this.metricLabelRtt) this.metricLabelRtt.textContent = 'SIMULATED RTT';
                if (this.metricSimulatedRtt) this.metricSimulatedRtt.textContent = '~120 ms';
                if (this.metricRttSub) this.metricRttSub.textContent = 'SIMULATION VALUE • 4 Hops';
            } else if (mode === 'compare') {
                // Side-by-Side Compare Mode Metrics
                if (this.metricLabelNode) this.metricLabelNode.textContent = 'NETWORK HOPS';
                if (this.metricActiveMec) this.metricActiveMec.textContent = '4 vs 1';
                if (this.metricMecSub) this.metricMecSub.textContent = 'Cloud (4) vs MEC (1)';

                if (this.metricLabelLoad) this.metricLabelLoad.textContent = 'COMPUTE LOAD';
                if (this.metricEdgeLoad) this.metricEdgeLoad.textContent = '42% / 38%';
                if (this.metricLoadSub) this.metricLoadSub.textContent = 'Edge vs Cloud DC';

                if (this.metricLabelRtt) this.metricLabelRtt.textContent = 'SIMULATED RTT';
                if (this.metricSimulatedRtt) this.metricSimulatedRtt.textContent = '15ms vs 120ms';
                if (this.metricRttSub) this.metricRttSub.textContent = 'MEC Edge vs Cloud WAN';
            } else {
                // MEC Mode Metrics
                if (this.metricLabelNode) this.metricLabelNode.textContent = 'ACTIVE MEC NODES';
                if (this.metricActiveMec) this.metricActiveMec.textContent = metrics.activeMecNodes;
                if (this.metricMecSub) this.metricMecSub.textContent = 'CPU • GPU • Cache • AI';

                if (this.metricLabelLoad) this.metricLabelLoad.textContent = 'EDGE LOAD';
                if (this.metricEdgeLoad) this.metricEdgeLoad.textContent = `${metrics.edgeLoad}%`;
                if (this.metricLoadSub) this.metricLoadSub.textContent = 'Co-located Capacity';

                if (this.metricLabelRtt) this.metricLabelRtt.textContent = 'SIMULATED RTT';
                if (this.metricSimulatedRtt) this.metricSimulatedRtt.textContent = '~15 ms';
                if (this.metricRttSub) this.metricRttSub.textContent = 'SIMULATION VALUE • 1 Hop';
            }
        });

        this.sim.on('logUpdate', (logs) => {
            this.renderEventLogs(logs);
        });

        this.renderer.onNodeSelected = (node) => {
            this.showNodeInspector(node);
        };
    }

    bindUIEvents() {
        if (this.btnOverlayStart) {
            this.btnOverlayStart.addEventListener('click', () => {
                this.startOverlay.classList.add('hidden');
                this.sim.start();
            });
        }

        this.btnStart.addEventListener('click', () => this.sim.start());
        this.btnPause.addEventListener('click', () => this.sim.pause());
        this.btnReset.addEventListener('click', () => this.sim.reset());

        this.btnPresentation.addEventListener('click', () => this.togglePresentationMode());

        // Mode Switcher Buttons
        if (this.modeBtnCloud) {
            this.modeBtnCloud.addEventListener('click', () => this.sim.setMode('cloud'));
        }
        if (this.modeBtnMec) {
            this.modeBtnMec.addEventListener('click', () => this.sim.setMode('mec'));
        }
        if (this.modeBtnCompare) {
            this.modeBtnCompare.addEventListener('click', () => this.sim.setMode('compare'));
        }

        // Compare Task Dispatch Button
        if (this.btnCompareTask) {
            this.btnCompareTask.addEventListener('click', () => {
                this.sim.dispatchCompareTask();
            });
        }

        // UAV Toggle Button
        this.btnToggleUav.addEventListener('click', () => {
            this.sim.toggleUavMode();
            this.updateUavButtonState();
        });

        // Presentation Stepper Action Buttons
        if (this.btnPresPrev) {
            this.btnPresPrev.addEventListener('click', () => this.prevPresentationStep());
        }
        if (this.btnPresNext) {
            this.btnPresNext.addEventListener('click', () => this.nextPresentationStep());
        }
        if (this.btnPresExit) {
            this.btnPresExit.addEventListener('click', () => this.togglePresentationMode(false));
        }

        document.querySelectorAll('[data-speed]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-speed]').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.sim.setSpeed(e.currentTarget.dataset.speed);
            });
        });

        const userActivitySelect = document.getElementById('select-user-activity');
        if (userActivitySelect) {
            userActivitySelect.addEventListener('change', (e) => {
                this.sim.setUserActivity(e.target.value);
            });
        }

        if (this.inspectorClose) {
            this.inspectorClose.addEventListener('click', () => {
                this.inspectorModal.classList.add('hidden');
            });
        }
    }

    bindKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            if (e.code === 'Space') {
                e.preventDefault();
                this.sim.togglePlayPause();
            } else if (e.key === 'r' || e.key === 'R') {
                this.sim.reset();
            } else if (e.key === 'm' || e.key === 'M') {
                this.sim.toggleMode();
            } else if (e.key === 'u' || e.key === 'U') {
                if (this.sim.mode === 'mec') {
                    this.sim.toggleUavMode();
                    this.updateUavButtonState();
                }
            } else if (e.key === 'p' || e.key === 'P') {
                this.togglePresentationMode();
            } else if (this.isPresentationMode && (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N')) {
                this.nextPresentationStep();
            } else if (this.isPresentationMode && (e.key === 'ArrowLeft' || e.key === 'b' || e.key === 'B')) {
                this.prevPresentationStep();
            }
        });
    }

    updateUavButtonState() {
        if (this.sim.uavMode) {
            this.btnToggleUav.classList.add('active-uav');
            this.btnToggleUav.innerHTML = '🛸 UAV-MEC: <strong>ON</strong>';
        } else {
            this.btnToggleUav.classList.remove('active-uav');
            this.btnToggleUav.innerHTML = '🛸 UAV-MEC: <strong>OFF</strong>';
        }
    }

    updateModeUIState(mode) {
        // Update Mode Pill Active State
        [this.modeBtnCloud, this.modeBtnMec, this.modeBtnCompare].forEach(b => {
            if (b) b.classList.remove('active');
        });

        if (mode === 'cloud') {
            if (this.modeBtnCloud) this.modeBtnCloud.classList.add('active');
            if (this.btnToggleUav) this.btnToggleUav.style.display = 'none';
            if (this.btnCompareTask) this.btnCompareTask.classList.add('hidden');

            if (this.modeArchitectureBadge) {
                this.modeArchitectureBadge.textContent = 'REMOTE COMPUTING';
                this.modeArchitectureBadge.style.background = 'rgba(168, 85, 247, 0.2)';
                this.modeArchitectureBadge.style.color = '#c084fc';
                this.modeArchitectureBadge.style.borderColor = '#a855f7';
            }
            if (this.educationalArchitectureDesc) {
                this.educationalArchitectureDesc.textContent = '“Computing is centralized and farther from the user across the WAN transit network.”';
            }
        } else if (mode === 'compare') {
            if (this.modeBtnCompare) this.modeBtnCompare.classList.add('active');
            if (this.btnToggleUav) this.btnToggleUav.style.display = 'none';
            if (this.btnCompareTask) this.btnCompareTask.classList.remove('hidden');

            if (this.modeArchitectureBadge) {
                this.modeArchitectureBadge.textContent = 'SIDE-BY-SIDE ARCHITECTURAL COMPARISON';
                this.modeArchitectureBadge.style.background = 'rgba(56, 189, 248, 0.2)';
                this.modeArchitectureBadge.style.color = '#38bdf8';
                this.modeArchitectureBadge.style.borderColor = '#38bdf8';
            }
            if (this.educationalArchitectureDesc) {
                this.educationalArchitectureDesc.textContent = '“Simultaneous fair task execution: Traditional Cloud (Left) vs Mobile Edge Computing (Right).”';
            }
        } else {
            if (this.modeBtnMec) this.modeBtnMec.classList.add('active');
            if (this.btnToggleUav) this.btnToggleUav.style.display = 'inline-flex';
            if (this.btnCompareTask) this.btnCompareTask.classList.add('hidden');

            if (this.modeArchitectureBadge) {
                this.modeArchitectureBadge.textContent = 'NEARBY COMPUTING';
                this.modeArchitectureBadge.style.background = 'rgba(16, 185, 129, 0.15)';
                this.modeArchitectureBadge.style.color = '#34d399';
                this.modeArchitectureBadge.style.borderColor = '#10b981';
            }
            if (this.educationalArchitectureDesc) {
                this.educationalArchitectureDesc.textContent = '“Computing resources are placed closer to the user at the 5G Base Station.”';
            }
        }
    }

    togglePresentationMode(forceVal) {
        this.isPresentationMode = (forceVal !== undefined) ? forceVal : !this.isPresentationMode;
        document.body.classList.toggle('presentation-mode-active', this.isPresentationMode);
        this.btnPresentation.classList.toggle('active-primary', this.isPresentationMode);

        if (this.presentationStepperBar) {
            this.presentationStepperBar.classList.toggle('hidden', !this.isPresentationMode);
        }

        if (this.isPresentationMode) {
            this.currentPresStep = 0;
            this.applyPresentationStep(this.currentPresStep);
            this.sim.addLog('SYSTEM', 'PRESENTATION MODE ACTIVE: Interactive step-by-step walkthrough', 'info');
        }

        setTimeout(() => this.setupResizeHandler(), 100);
    }

    applyPresentationStep(index) {
        if (index < 0 || index >= this.presSteps.length) return;
        this.currentPresStep = index;
        const step = this.presSteps[index];

        if (this.presStepNum) this.presStepNum.textContent = step.num;
        if (this.presStepTitle) this.presStepTitle.textContent = step.title;
        if (this.presStepDesc) this.presStepDesc.textContent = step.desc;

        if (this.btnPresPrev) {
            this.btnPresPrev.disabled = (index === 0);
            this.btnPresPrev.style.opacity = (index === 0) ? '0.4' : '1';
        }
        if (this.btnPresNext) {
            this.btnPresNext.textContent = (index === this.presSteps.length - 1) ? 'RESTART (STEP 1) ↺' : 'NEXT STEP ▶';
        }

        // Execute action defined for the step
        if (step.run) step.run();
    }

    nextPresentationStep() {
        if (this.currentPresStep >= this.presSteps.length - 1) {
            this.applyPresentationStep(0);
        } else {
            this.applyPresentationStep(this.currentPresStep + 1);
        }
    }

    prevPresentationStep() {
        if (this.currentPresStep > 0) {
            this.applyPresentationStep(this.currentPresStep - 1);
        }
    }

    renderEventLogs(logs) {
        if (!this.eventLogContainer) return;
        this.eventLogContainer.innerHTML = '';

        logs.forEach(log => {
            const row = document.createElement('div');
            row.className = `log-row log-${log.category}`;

            const badgeClass = {
                traffic: 'badge-cyan',
                process: 'badge-green',
                result: 'badge-emerald',
                cloud: 'badge-purple',
                uav: 'badge-amber',
                warning: 'badge-amber',
                start: 'badge-green',
                info: 'badge-gray'
            }[log.category] || 'badge-gray';

            row.innerHTML = `
                <span class="log-time">${log.time}</span>
                <span class="log-source ${badgeClass}">${log.source}</span>
                <span class="log-text">${log.text}</span>
            `;
            this.eventLogContainer.appendChild(row);
        });
    }

    showNodeInspector(node) {
        if (!this.inspectorModal) return;

        const { type, data } = node;
        let html = '';

        if (type === 'user') {
            this.inspectorTitle.innerHTML = `📱 ${data.name} (${data.appLabel})`;
            html = `
                <div class="inspector-grid">
                    <div class="inspector-item"><span class="label">Device:</span> <span class="val">5G User Equipment</span></div>
                    <div class="inspector-item"><span class="label">Radio Link:</span> <span class="val text-cyan">5G NR (Signal: ${data.signal}%)</span></div>
                    <div class="inspector-item"><span class="label">Application:</span> <span class="val text-amber">${data.appLabel}</span></div>
                    <div class="inspector-item"><span class="label">Architecture Target:</span> <span class="val text-green">${this.sim.mode === 'cloud' ? 'Distant Centralized Cloud' : 'Nearby MEC Host'}</span></div>
                </div>
            `;
        } else if (type === 'bs') {
            this.inspectorTitle.innerHTML = '📡 5G BASE STATION (gNodeB)';
            html = `
                <div class="inspector-grid">
                    <div class="inspector-item"><span class="label">RAN Interface:</span> <span class="val text-cyan">3GPP 5G NR</span></div>
                    <div class="inspector-item"><span class="label">Antenna Array:</span> <span class="val">Massive MIMO</span></div>
                    <div class="inspector-item"><span class="label">MEC Interconnect:</span> <span class="val text-green">${this.sim.mode === 'cloud' ? 'None (Bypassed to Cloud Backhaul)' : 'Direct High-Speed Edge Link'}</span></div>
                    <div class="inspector-item"><span class="label">Status:</span> <span class="val text-green">ACTIVE</span></div>
                </div>
            `;
        } else if (type === 'mec') {
            this.inspectorTitle.innerHTML = '🖥️ MEC HOST';
            html = `
                <div class="inspector-grid">
                    <div class="inspector-item"><span class="label">Platform:</span> <span class="val text-green">Mobile Edge Computing Platform</span></div>
                    <div class="inspector-item"><span class="label">Compute Modules:</span> <span class="val">CPU, GPU, Edge Apps, Cache, AI Services</span></div>
                    <div class="inspector-item"><span class="label">Simulated RTT:</span> <span class="val text-green">~15 ms (SIMULATION VALUE)</span></div>
                    <div class="inspector-item"><span class="label">Status:</span> <span class="val text-green">ONLINE / ACTIVE</span></div>
                </div>
            `;
        } else if (type === 'cloud') {
            this.inspectorTitle.innerHTML = '☁ CLOUD DATA CENTER';
            html = `
                <div class="inspector-grid">
                    <div class="inspector-item"><span class="label">Architecture:</span> <span class="val text-purple">Centralized Hyperscale Cloud</span></div>
                    <div class="inspector-item"><span class="label">Compute & Storage:</span> <span class="val">Compute, Storage, AI/ML, Database</span></div>
                    <div class="inspector-item"><span class="label">Simulated RTT:</span> <span class="val text-amber">~120 ms (SIMULATION VALUE)</span></div>
                    <div class="inspector-item"><span class="label">Transit:</span> <span class="val text-purple">Internet / Wide Area Network (WAN)</span></div>
                </div>
            `;
        } else if (type === 'uav') {
            this.inspectorTitle.innerHTML = '🛸 UAV-MEC (Mobile Edge Node)';
            html = `
                <div class="inspector-grid">
                    <div class="inspector-item"><span class="label">Platform:</span> <span class="val text-amber">Autonomous Quadcopter</span></div>
                    <div class="inspector-item"><span class="label">Role:</span> <span class="val text-green">Mobile Aerial Edge Node</span></div>
                    <div class="inspector-item"><span class="label">Air-to-Ground:</span> <span class="val text-cyan">Line-of-Sight 5G Wireless</span></div>
                    <div class="inspector-item"><span class="label">Status:</span> <span class="val text-green">ONLINE / HOVERING</span></div>
                </div>
            `;
        }

        this.inspectorContent.innerHTML = html;
        this.inspectorModal.classList.remove('hidden');
    }

    setupResizeHandler() {
        const container = document.getElementById('canvas-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.max(540, Math.floor(rect.height));

        this.renderer.resize(w, h);
    }

    renderLoop(currentTime) {
        const delta = Math.min(100, currentTime - this.lastFrameTime);
        this.lastFrameTime = currentTime;

        this.sim.update(delta);
        this.renderer.render(currentTime);

        requestAnimationFrame(this.renderLoop.bind(this));
    }
}

window.MecApp = App;
window.addEventListener('DOMContentLoaded', () => {
    window.mecAppInstance = new App();
    window.addEventListener('resize', () => {
        if (window.mecAppInstance) {
            window.mecAppInstance.setupResizeHandler();
        }
    });
});
