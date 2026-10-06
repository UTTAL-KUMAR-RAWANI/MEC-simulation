// Network Visualization SVG Engine
// Precision Alignment & Presentation Quality: 100% Vector Responsive SVG (1600x650)
// Architectural Demonstration: TRADITIONAL CLOUD vs MOBILE EDGE COMPUTING (MEC) vs SIDE-BY-SIDE COMPARE

class NetworkRenderer {
    constructor(canvasOrSvg, simulation) {
        this.sim = simulation;
        const { MOBILE_USERS, MEC_NODES, CLOUD_NODES, PACKET_TYPES } = window.MecData;

        this.MOBILE_USERS = MOBILE_USERS;
        this.MEC_NODES = MEC_NODES;
        this.CLOUD_NODES = CLOUD_NODES;
        this.PACKET_TYPES = PACKET_TYPES;

        // Resolve SVG element
        if (canvasOrSvg && canvasOrSvg.tagName && canvasOrSvg.tagName.toLowerCase() === 'svg') {
            this.svg = canvasOrSvg;
        } else {
            this.svg = document.getElementById('network-svg');
        }

        this.time = 0;
        this.rotorAngle = 0;
        this.onNodeSelected = null;

        // Base coordinates container
        this.coords = {
            cloud: { x: 800, y: 55, w: 520, h: 76, id: 'cloud' },
            wan: { x: 800, y: 175, w: 640, h: 28, id: 'wan' },
            core: { x: 800, y: 245, w: 640, h: 28, id: 'core' },
            bs: { x: 520, y: 310, w: 80, h: 120, id: 'bs' },
            mec: { x: 1080, y: 310, w: 560, h: 146, id: 'mec' },
            uav: { x: 730, y: 435, w: 90, h: 48, id: 'uav' },
            users: []
        };

        this.setupCoordinates();
        this.buildSvgDom();
        this.initPacketPool();
    }

    setupCoordinates() {
        const mode = this.sim.mode;

        if (mode === 'compare') {
            // SIDE-BY-SIDE SPLIT ARCHITECTURE (Split at x = 800)
            // Left Half: TRADITIONAL CLOUD (x: 0 .. 790)
            // Right Half: MOBILE EDGE COMPUTING (x: 810 .. 1600)
            this.coords.compareLeft = {
                cloud: { x: 390, y: 70, w: 460, h: 68, id: 'cloud-left' },
                wan: { x: 390, y: 172, w: 440, h: 26, id: 'wan-left' },
                core: { x: 390, y: 246, w: 440, h: 26, id: 'core-left' },
                bs: { x: 390, y: 380, w: 70, h: 105, id: 'bs-left' },
                users: [
                    { ...this.MOBILE_USERS[0], x: 180, y: 535, w: 70, h: 70 },
                    { ...this.MOBILE_USERS[1], x: 390, y: 535, w: 70, h: 70 },
                    { ...this.MOBILE_USERS[2], x: 600, y: 535, w: 70, h: 70 }
                ]
            };

            this.coords.compareRight = {
                cloud: { x: 1210, y: 70, w: 450, h: 68, id: 'cloud-right' },
                core: { x: 1210, y: 172, w: 440, h: 26, id: 'core-right' },
                bs: { x: 1020, y: 360, w: 70, h: 105, id: 'bs-right' },
                mec: { x: 1330, y: 360, w: 320, h: 125, id: 'mec-right' },
                users: [
                    { ...this.MOBILE_USERS[3], x: 1010, y: 535, w: 70, h: 70 },
                    { ...this.MOBILE_USERS[4], x: 1210, y: 535, w: 70, h: 70 },
                    { ...this.MOBILE_USERS[5], x: 1410, y: 535, w: 70, h: 70 }
                ]
            };

            // Global reference for all 6 users
            this.coords.users = [
                ...this.coords.compareLeft.users,
                ...this.coords.compareRight.users
            ];
            return;
        }

        if (mode === 'cloud') {
            // FULL SCREEN TRADITIONAL CLOUD ARCHITECTURE
            // Remote Centralized Cloud at Top -> WAN -> Mobile Core -> Base Station -> 6 Users
            this.coords.cloud = { x: 800, y: 65, w: 600, h: 80, id: 'cloud' };
            this.coords.wan = { x: 800, y: 180, w: 680, h: 30, id: 'wan' };
            this.coords.core = { x: 800, y: 255, w: 680, h: 30, id: 'core' };
            this.coords.bs = { x: 800, y: 390, w: 80, h: 115, id: 'bs' };
            this.coords.mec = { x: -9999, y: -9999, w: 0, h: 0, id: 'mec' };
            this.coords.uav = { x: -9999, y: -9999, w: 0, h: 0, id: 'uav' };

            const userXCoords = [180, 428, 676, 924, 1172, 1420];
            this.coords.users = this.MOBILE_USERS.map((u, i) => ({
                ...u,
                x: userXCoords[i],
                y: 535,
                w: 70,
                h: 70,
                id: u.id,
                type: 'user'
            }));
            return;
        }

        // DEFAULT: MEC MODE (Co-located Edge Host at 5G Base Station, Cloud above for sync)
        this.coords.cloud = { x: 800, y: 55, w: 520, h: 76, id: 'cloud' };
        this.coords.core = { x: 800, y: 175, w: 640, h: 28, id: 'core' };
        this.coords.bs = { x: 520, y: 310, w: 80, h: 120, id: 'bs' };
        this.coords.mec = { x: 1080, y: 310, w: 560, h: 146, id: 'mec' };
        this.coords.uav = { x: 730, y: 435, w: 90, h: 48, id: 'uav' };

        const userXCoords = [180, 428, 676, 924, 1172, 1420];
        this.coords.users = this.MOBILE_USERS.map((u, i) => ({
            ...u,
            x: userXCoords[i],
            y: 525,
            w: 70,
            h: 70,
            id: u.id,
            type: 'user'
        }));
    }

    createSvg(tag, attrs = {}) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) {
            el.setAttribute(k, v);
        }
        return el;
    }

    buildSvgDom() {
        if (!this.svg) return;
        this.svg.innerHTML = '';

        // 1. Defs: Gradients & Patterns
        const defs = this.createSvg('defs');
        defs.innerHTML = `
            <!-- Subtle Grid Pattern -->
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.06)" stroke-width="1"/>
            </pattern>

            <!-- Gradients -->
            <linearGradient id="grad-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#241442" stop-opacity="0.96" />
                <stop offset="100%" stop-color="#120a22" stop-opacity="0.96" />
            </linearGradient>
            <linearGradient id="grad-mec" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#06271c" stop-opacity="0.96" />
                <stop offset="100%" stop-color="#041410" stop-opacity="0.96" />
            </linearGradient>
            <linearGradient id="grad-core" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#091830" stop-opacity="0.95" />
                <stop offset="50%" stop-color="#0f2648" stop-opacity="0.95" />
                <stop offset="100%" stop-color="#091830" stop-opacity="0.95" />
            </linearGradient>
            <linearGradient id="grad-wan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#1a1030" stop-opacity="0.95" />
                <stop offset="50%" stop-color="#2e104e" stop-opacity="0.95" />
                <stop offset="100%" stop-color="#1a1030" stop-opacity="0.95" />
            </linearGradient>
            <linearGradient id="grad-blade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#0e1f2f" />
                <stop offset="100%" stop-color="#07131e" />
            </linearGradient>
            <linearGradient id="grad-blade-active" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#0d3b28" />
                <stop offset="100%" stop-color="#061c14" />
            </linearGradient>
        `;
        this.svg.appendChild(defs);

        // 2. Background Grid Layer
        const bgRect = this.createSvg('rect', {
            width: '1600',
            height: '650',
            fill: 'url(#grid-pattern)'
        });
        this.svg.appendChild(bgRect);

        // 3. Wireless Coverage Zones Layer
        this.coverageLayer = this.createSvg('g', { id: 'wireless-coverage-layer' });
        this.svg.appendChild(this.coverageLayer);

        // 4. Network Connections / Data-flow Paths Layer
        this.linksLayer = this.createSvg('g', { id: 'network-links-layer' });
        this.svg.appendChild(this.linksLayer);

        // 5. Infrastructure Nodes Layer
        this.nodesLayer = this.createSvg('g', { id: 'nodes-layer' });
        this.svg.appendChild(this.nodesLayer);

        // 6. Flying SVG Packets Layer
        this.packetsLayer = this.createSvg('g', { id: 'packets-layer' });
        this.svg.appendChild(this.packetsLayer);

        // Delegate rendering according to mode
        if (this.sim.mode === 'compare') {
            this.renderCompareView();
        } else if (this.sim.mode === 'cloud') {
            this.renderCloudView();
        } else {
            this.renderMecView();
        }
    }

    // =========================================================================
    // 1. MEC MODE VIEW (SINGLE VIEW)
    // =========================================================================
    renderMecView() {
        // Architecture Header Callout
        const badge = this.createSvg('g', { id: 'architecture-callout-badge' });
        badge.innerHTML = `
            <rect x="24" y="16" width="280" height="26" rx="6" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="1.2"/>
            <text x="164" y="33.5" text-anchor="middle" fill="#34d399" font-family="'Outfit', sans-serif" font-size="12px" font-weight="800" letter-spacing="0.5px">⚡ NEARBY COMPUTING • CO-LOCATED EDGE</text>
        `;
        this.nodesLayer.appendChild(badge);

        // Coverage zones
        const bsCoverage = this.createSvg('g', { id: 'bs-coverage-rings', opacity: '0.18' });
        bsCoverage.innerHTML = `
            <circle cx="520" cy="230" r="110" fill="none" stroke="#00f0ff" stroke-width="1.2" stroke-dasharray="6,6"/>
            <circle cx="520" cy="230" r="175" fill="none" stroke="#00f0ff" stroke-width="1" stroke-dasharray="8,8"/>
        `;
        this.coverageLayer.appendChild(bsCoverage);

        if (this.sim.uavMode) {
            const uavCoverage = this.createSvg('g', { id: 'uav-coverage-ring', opacity: '0.22' });
            uavCoverage.innerHTML = `
                <circle cx="${this.coords.uav.x}" cy="${this.coords.uav.y}" r="85" fill="none" stroke="#f59e0b" stroke-width="1.4" stroke-dasharray="5,5"/>
            `;
            this.coverageLayer.appendChild(uavCoverage);
        }

        // Links
        const edgeLink = this.createSvg('g', { id: 'link-bs-mec' });
        edgeLink.innerHTML = `
            <line x1="560" y1="310" x2="800" y2="310" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
            <line class="flow-line-fast" x1="560" y1="310" x2="800" y2="310" stroke="#34d399" stroke-width="1.5" stroke-dasharray="8,8" opacity="0.9"/>
            <rect x="590" y="298" width="180" height="24" rx="5" fill="rgba(6, 11, 22, 0.94)" stroke="#10b981" stroke-width="1.2"/>
            <text x="680" y="314.5" text-anchor="middle" fill="#34d399" font-family="'Inter', sans-serif" font-size="11px" font-weight="700">⚡ HIGH-SPEED EDGE LINK</text>
        `;
        this.linksLayer.appendChild(edgeLink);

        const coreCloudLink = this.createSvg('g', { id: 'link-core-cloud' });
        coreCloudLink.innerHTML = `
            <line x1="800" y1="93" x2="800" y2="161" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/>
            <line class="flow-line-slow" x1="800" y1="93" x2="800" y2="161" stroke="#c084fc" stroke-width="1.2" stroke-dasharray="6,6" opacity="0.8"/>
        `;
        this.linksLayer.appendChild(coreCloudLink);

        const mecCoreLink = this.createSvg('g', { id: 'link-mec-core' });
        mecCoreLink.innerHTML = `
            <path class="flow-line-slow" d="M 1080 237 L 1080 189 L 1020 189" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round"/>
        `;
        this.linksLayer.appendChild(mecCoreLink);

        const bsCoreLink = this.createSvg('g', { id: 'link-bs-core' });
        bsCoreLink.innerHTML = `
            <path class="flow-line-slow" d="M 520 230 L 520 189 L 580 189" fill="none" stroke="#a855f7" stroke-width="1.8" stroke-dasharray="6,4" opacity="0.6"/>
        `;
        this.linksLayer.appendChild(bsCoreLink);

        // User to BS wireless paths
        this.coords.users.forEach((u) => {
            const userLink = this.createSvg('line', {
                x1: u.x,
                y1: u.y - 49,
                x2: 520,
                y2: 230,
                stroke: 'rgba(0, 240, 255, 0.35)',
                'stroke-width': '1.3',
                'stroke-dasharray': '6,6',
                'class': 'flow-line'
            });
            this.linksLayer.appendChild(userLink);
        });

        // UAV wireless paths
        if (this.sim.uavMode) {
            [1, 2, 3].forEach(idx => {
                const u = this.coords.users[idx];
                const uavLink = this.createSvg('line', {
                    x1: u.x,
                    y1: u.y - 49,
                    x2: this.coords.uav.x,
                    y2: this.coords.uav.y + 12,
                    stroke: 'rgba(245, 158, 11, 0.45)',
                    'stroke-width': '1.3',
                    'stroke-dasharray': '5,5',
                    'class': 'flow-line'
                });
                this.linksLayer.appendChild(uavLink);
            });
        }

        // Render infrastructure components
        this.renderCloudBox(800, 55, 520, 76, 'CLOUD DATA CENTER', 'Centralized Storage & Sync', false);
        this.renderCoreBar(800, 175, 640, 28, 'CORE NETWORK');
        this.renderBaseStationNode(520, 310, '5G BASE STATION (gNodeB)', 'Radio Access Network (RAN)');
        this.renderMecHostNode(1080, 310, 560, 146);
        this.renderUavNode(730, 435);
        this.renderUsersNodes(this.coords.users);
    }

    // =========================================================================
    // 2. TRADITIONAL CLOUD MODE VIEW (SINGLE VIEW)
    // =========================================================================
    renderCloudView() {
        // Architecture Header Callout (Purple)
        const badge = this.createSvg('g', { id: 'architecture-callout-badge' });
        badge.innerHTML = `
            <rect x="24" y="16" width="310" height="26" rx="6" fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" stroke-width="1.2"/>
            <text x="179" y="33.5" text-anchor="middle" fill="#c084fc" font-family="'Outfit', sans-serif" font-size="12px" font-weight="800" letter-spacing="0.5px">☁ REMOTE COMPUTING • CENTRALIZED CLOUD</text>
        `;
        this.nodesLayer.appendChild(badge);

        // BS Radio coverage
        const bsCoverage = this.createSvg('g', { id: 'bs-coverage-rings', opacity: '0.18' });
        bsCoverage.innerHTML = `
            <circle cx="800" cy="305" r="120" fill="none" stroke="#00f0ff" stroke-width="1.2" stroke-dasharray="6,6"/>
            <circle cx="800" cy="305" r="190" fill="none" stroke="#00f0ff" stroke-width="1" stroke-dasharray="8,8"/>
        `;
        this.coverageLayer.appendChild(bsCoverage);

        // Central Vertical WAN Backbone (Long 4-hop path)
        const wanPath = this.createSvg('g', { id: 'cloud-wan-backbone' });
        wanPath.innerHTML = `
            <!-- Cloud to WAN -->
            <line x1="800" y1="105" x2="800" y2="165" stroke="#a855f7" stroke-width="3" stroke-linecap="round"/>
            <line class="flow-line-slow" x1="800" y1="105" x2="800" y2="165" stroke="#c084fc" stroke-width="1.5" stroke-dasharray="6,6"/>
            
            <!-- WAN to Core -->
            <line x1="800" y1="195" x2="800" y2="240" stroke="#a855f7" stroke-width="3" stroke-linecap="round"/>
            <line class="flow-line-slow" x1="800" y1="195" x2="800" y2="240" stroke="#c084fc" stroke-width="1.5" stroke-dasharray="6,6"/>

            <!-- Core to BS -->
            <line x1="800" y1="270" x2="800" y2="305" stroke="#a855f7" stroke-width="3" stroke-linecap="round"/>
            <line class="flow-line-slow" x1="800" y1="270" x2="800" y2="305" stroke="#c084fc" stroke-width="1.5" stroke-dasharray="6,6"/>
            
            <!-- Long Distance Distance Callout Badge -->
            <rect x="670" y="202" width="260" height="22" rx="5" fill="rgba(15, 23, 42, 0.95)" stroke="#a855f7" stroke-width="1.2"/>
            <text x="800" y="217" text-anchor="middle" fill="#c084fc" font-family="'Inter', sans-serif" font-size="11px" font-weight="700">LONG WAN BACKHAUL (80 - 180ms)</text>
        `;
        this.linksLayer.appendChild(wanPath);

        // User to BS wireless paths
        this.coords.users.forEach((u) => {
            const userLink = this.createSvg('line', {
                x1: u.x,
                y1: u.y - 49,
                x2: 800,
                y2: 305,
                stroke: 'rgba(0, 240, 255, 0.35)',
                'stroke-width': '1.3',
                'stroke-dasharray': '6,6',
                'class': 'flow-line'
            });
            this.linksLayer.appendChild(userLink);
        });

        // 1. Cloud Data Center Node at Top
        this.renderCloudBox(800, 65, 600, 80, 'CLOUD DATA CENTER', 'Centralized Computing & Storage', true);

        // 2. Internet / WAN Bar
        this.renderWanBar(800, 180, 680, 30, 'INTERNET / WAN');

        // 3. Mobile Core Network Bar
        this.renderCoreBar(800, 255, 680, 30, 'MOBILE CORE NETWORK');

        // 4. 5G Base Station Node
        this.renderBaseStationNode(800, 390, '5G BASE STATION (gNodeB)', 'RADIO ACCESS NETWORK (RAN)');

        // 5. 6 Mobile Users
        this.renderUsersNodes(this.coords.users);
    }

    // =========================================================================
    // 3. SIDE-BY-SIDE COMPARE VIEW
    // =========================================================================
    renderCompareView() {
        const left = this.coords.compareLeft;
        const right = this.coords.compareRight;

        // Central Futuristic Neon Divider
        const divider = this.createSvg('g', { id: 'compare-divider' });
        divider.innerHTML = `
            <line x1="800" y1="0" x2="800" y2="650" stroke="rgba(56, 189, 248, 0.25)" stroke-width="2" stroke-dasharray="8,6"/>
            <line x1="800" y1="0" x2="800" y2="650" stroke="#38bdf8" stroke-width="1" opacity="0.4"/>
            <rect x="750" y="10" width="100" height="24" rx="12" fill="#0b1120" stroke="#38bdf8" stroke-width="1.2"/>
            <text x="800" y="26" text-anchor="middle" fill="#38bdf8" font-family="'Outfit', sans-serif" font-size="11px" font-weight="800">VS</text>
        `;
        this.linksLayer.appendChild(divider);

        // --- LEFT SIDE: TRADITIONAL CLOUD ARCHITECTURE ---
        const leftHeader = this.createSvg('g', { id: 'compare-left-header' });
        leftHeader.innerHTML = `
            <rect x="30" y="10" width="340" height="26" rx="6" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" stroke-width="1.2"/>
            <text x="200" y="27.5" text-anchor="middle" fill="#c084fc" font-family="'Outfit', sans-serif" font-size="12.5px" font-weight="800" letter-spacing="0.5px">TRADITIONAL CLOUD (REMOTE COMPUTING)</text>
            <text x="390" y="27" text-anchor="start" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="11px" font-weight="600">4 Hops • High Latency WAN</text>
        `;
        this.nodesLayer.appendChild(leftHeader);

        // Left Links
        const leftLinks = this.createSvg('g', { id: 'compare-left-links' });
        leftLinks.innerHTML = `
            <line x1="390" y1="104" x2="390" y2="159" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/>
            <line class="flow-line-slow" x1="390" y1="104" x2="390" y2="159" stroke="#c084fc" stroke-width="1.2" stroke-dasharray="6,6"/>
            <line x1="390" y1="185" x2="390" y2="233" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/>
            <line class="flow-line-slow" x1="390" y1="185" x2="390" y2="233" stroke="#c084fc" stroke-width="1.2" stroke-dasharray="6,6"/>
            <line x1="390" y1="259" x2="390" y2="305" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/>
            <line class="flow-line-slow" x1="390" y1="259" x2="390" y2="305" stroke="#c084fc" stroke-width="1.2" stroke-dasharray="6,6"/>
        `;
        this.linksLayer.appendChild(leftLinks);

        left.users.forEach((u) => {
            const userLink = this.createSvg('line', {
                x1: u.x,
                y1: u.y - 49,
                x2: 390,
                y2: 305,
                stroke: 'rgba(0, 240, 255, 0.35)',
                'stroke-width': '1.3',
                'stroke-dasharray': '6,6',
                'class': 'flow-line'
            });
            this.linksLayer.appendChild(userLink);
        });

        // Left Nodes
        this.renderCloudBox(390, 70, 460, 68, 'CLOUD DATA CENTER', 'Centralized Computing & Storage', true, 'left');
        this.renderWanBar(390, 172, 440, 26, 'INTERNET / WAN');
        this.renderCoreBar(390, 246, 440, 26, 'MOBILE CORE NETWORK');
        this.renderBaseStationNode(390, 380, '5G BASE STATION (RAN)', 'gNodeB Telecom Tower');
        this.renderUsersNodes(left.users);

        // --- RIGHT SIDE: MOBILE EDGE COMPUTING ARCHITECTURE ---
        const rightHeader = this.createSvg('g', { id: 'compare-right-header' });
        rightHeader.innerHTML = `
            <rect x="830" y="10" width="340" height="26" rx="6" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="1.2"/>
            <text x="1000" y="27.5" text-anchor="middle" fill="#34d399" font-family="'Outfit', sans-serif" font-size="12.5px" font-weight="800" letter-spacing="0.5px">MOBILE EDGE COMPUTING (NEARBY)</text>
            <text x="1190" y="27" text-anchor="start" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="11px" font-weight="600">1 Hop • Co-Located MEC Host</text>
        `;
        this.nodesLayer.appendChild(rightHeader);

        // Right Links (Edge interconnect)
        const rightLinks = this.createSvg('g', { id: 'compare-right-links' });
        rightLinks.innerHTML = `
            <!-- Core to Cloud Link (Backhaul) -->
            <line x1="1210" y1="104" x2="1210" y2="159" stroke="#a855f7" stroke-width="2"/>
            <!-- MEC to Core Link (Sync) -->
            <path class="flow-line-slow" d="M 1330 298 L 1330 185 L 1260 185" fill="none" stroke="#a855f7" stroke-width="1.8" stroke-dasharray="6,4"/>
            <!-- HIGH-SPEED DIRECT EDGE INTERCONNECT -->
            <line x1="1055" y1="360" x2="1170" y2="360" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
            <line class="flow-line-fast" x1="1055" y1="360" x2="1170" y2="360" stroke="#34d399" stroke-width="1.5" stroke-dasharray="6,6"/>
            <rect x="1070" y="348" width="85" height="22" rx="4" fill="rgba(6, 11, 22, 0.94)" stroke="#10b981" stroke-width="1"/>
            <text x="1112.5" y="363" text-anchor="middle" fill="#34d399" font-family="'Inter', sans-serif" font-size="9.5px" font-weight="700">⚡ 1-HOP LINK</text>
        `;
        this.linksLayer.appendChild(rightLinks);

        right.users.forEach((u) => {
            const userLink = this.createSvg('line', {
                x1: u.x,
                y1: u.y - 49,
                x2: 1020,
                y2: 280,
                stroke: 'rgba(0, 240, 255, 0.35)',
                'stroke-width': '1.3',
                'stroke-dasharray': '6,6',
                'class': 'flow-line'
            });
            this.linksLayer.appendChild(userLink);
        });

        // Right Nodes
        this.renderCloudBox(1210, 70, 450, 68, 'CLOUD DATA CENTER', 'Central Storage & Sync', false, 'right');
        this.renderCoreBar(1210, 172, 440, 26, 'CORE NETWORK');
        this.renderBaseStationNode(1020, 360, '5G BASE STATION', 'Radio Access Network (RAN)');
        this.renderCompareMecNode(1330, 360, 320, 125);
        this.renderUsersNodes(right.users);
    }

    // =========================================================================
    // HELPER RENDERING METHODS (REUSABLE ACROSS MODES)
    // =========================================================================
    renderCloudBox(cx, cy, w, h, title, subtitle, isFullCloudMode = false, sidePrefix = '') {
        const g = this.createSvg('g', {
            id: `node-cloud${sidePrefix ? '-' + sidePrefix : ''}`,
            class: 'svg-interactive-node',
            style: 'cursor: pointer;'
        });

        const bx = cx - w / 2;
        const by = cy - h / 2;

        let modulesHtml = '';
        if (w >= 450) {
            // 4 Modules: COMPUTE, STORAGE, AI / ML, DATABASE
            const modW = (w - 28) / 4;
            const mods = [
                { title: 'COMPUTE', icon: '⚡' },
                { title: 'STORAGE', icon: '💾' },
                { title: 'AI / ML', icon: '🧠' },
                { title: 'DATABASE', icon: '🗄️' }
            ];
            modulesHtml = `<g transform="translate(${bx + 12}, ${by + 34})">`;
            mods.forEach((m, i) => {
                const mx = i * modW;
                modulesHtml += `
                    <rect x="${mx}" y="0" width="${modW - 6}" height="28" rx="4" fill="rgba(15, 23, 42, 0.88)" stroke="rgba(168, 85, 247, 0.35)" stroke-width="1"/>
                    <text x="${mx + (modW - 6) / 2}" y="18" text-anchor="middle" fill="#e2e8f0" font-family="'Inter', sans-serif" font-size="10.5px" font-weight="700">${m.icon} ${m.title}</text>
                `;
            });
            modulesHtml += `</g>`;
        }

        g.innerHTML = `
            <rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="10" fill="url(#grad-cloud)" stroke="#a855f7" stroke-width="1.6"/>
            <text x="${bx + 18}" y="${by + 21}" fill="#ffffff" font-family="'Outfit', sans-serif" font-size="16px" font-weight="800">☁ ${title}</text>
            <text x="${bx + 205}" y="${by + 21}" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="11.5px" font-weight="500">${subtitle}</text>
            
            <!-- Cloud Status LED / Processing Badge -->
            <g id="cloud-status-badge${sidePrefix ? '-' + sidePrefix : ''}" transform="translate(${bx + w - 150}, ${by + 8})">
                <rect class="cloud-badge-bg" x="0" y="0" width="138" height="20" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="#a855f7" stroke-width="1"/>
                <circle class="cloud-badge-led" cx="12" cy="10" r="3.5" fill="#a855f7"/>
                <text class="cloud-badge-text" x="72" y="14" text-anchor="middle" fill="#c084fc" font-family="'Inter', sans-serif" font-size="10px" font-weight="700">CENTRAL CLOUD</text>
            </g>
            ${modulesHtml}
        `;

        g.addEventListener('click', () => {
            if (this.onNodeSelected) this.onNodeSelected({ type: 'cloud', data: { name: 'Cloud Data Center' } });
        });

        this.nodesLayer.appendChild(g);
    }

    renderWanBar(cx, cy, w, h, label) {
        const g = this.createSvg('g', { id: `node-wan-${cx}` });
        const bx = cx - w / 2;
        const by = cy - h / 2;

        g.innerHTML = `
            <rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="6" fill="url(#grad-wan)" stroke="rgba(168, 85, 247, 0.5)" stroke-width="1.2"/>
            <text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="#c084fc" font-family="'Outfit', sans-serif" font-size="13px" font-weight="800" letter-spacing="1.5px">🌍 ${label} (Wide Area Network)</text>
        `;
        this.nodesLayer.appendChild(g);
    }

    renderCoreBar(cx, cy, w, h, label) {
        const g = this.createSvg('g', { id: `node-core-${cx}` });
        const bx = cx - w / 2;
        const by = cy - h / 2;

        g.innerHTML = `
            <rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="6" fill="url(#grad-core)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1.2"/>
            <text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="#38bdf8" font-family="'Outfit', sans-serif" font-size="13px" font-weight="800" letter-spacing="1.5px">🌐 ${label}</text>
        `;
        this.nodesLayer.appendChild(g);
    }

    renderBaseStationNode(x, y, title, subtitle) {
        const g = this.createSvg('g', {
            id: `node-bs-${x}`,
            class: 'svg-interactive-node',
            style: 'cursor: pointer;'
        });

        g.innerHTML = `
            <!-- Antenna Array at Top (y: -80 to -60) -->
            <line x1="${x}" y1="${y - 94}" x2="${x}" y2="${y - 80}" stroke="#00f0ff" stroke-width="2.5"/>
            <circle cx="${x}" cy="${y - 95}" r="3" fill="#ffffff"/>
            <rect x="${x - 16}" y="${y - 80}" width="32" height="6" rx="2" fill="#00f0ff"/>
            <rect x="${x - 12}" y="${y - 74}" width="24" height="4" rx="1" fill="#38bdf8"/>

            <!-- 3 Directional Sector Panels -->
            <rect x="${x - 22}" y="${y - 70}" width="7" height="15" rx="1" fill="#0284c7" stroke="#00f0ff" stroke-width="0.8"/>
            <rect x="${x - 3.5}" y="${y - 70}" width="7" height="15" rx="1" fill="#0284c7" stroke="#00f0ff" stroke-width="0.8"/>
            <rect x="${x + 15}" y="${y - 70}" width="7" height="15" rx="1" fill="#0284c7" stroke="#00f0ff" stroke-width="0.8"/>

            <!-- Lattice Tower Mast Structure (y: -55 down to +12) -->
            <line x1="${x - 10}" y1="${y - 55}" x2="${x - 24}" y2="${y + 12}" stroke="#38bdf8" stroke-width="2"/>
            <line x1="${x + 10}" y1="${y - 55}" x2="${x + 24}" y2="${y + 12}" stroke="#38bdf8" stroke-width="2"/>
            
            <!-- Cross Struts -->
            <line x1="${x - 12}" y1="${y - 42}" x2="${x + 12}" y2="${y - 42}" stroke="#38bdf8" stroke-width="1.2"/>
            <line x1="${x - 16}" y1="${y - 24}" x2="${x + 16}" y2="${y - 24}" stroke="#38bdf8" stroke-width="1.2"/>
            <line x1="${x - 21}" y1="${y - 4}" x2="${x + 21}" y2="${y - 4}" stroke="#38bdf8" stroke-width="1.2"/>

            <!-- Ground RF Cabinet -->
            <rect x="${x - 26}" y="${y + 12}" width="52" height="18" rx="3" fill="#0f172a" stroke="#0284c7" stroke-width="1.2"/>
            <circle cx="${x - 16}" cy="${y + 21}" r="2" fill="#10b981"/>
            <circle cx="${x - 10}" cy="${y + 21}" r="2" fill="#00f0ff"/>

            <!-- Main Architecture Labels -->
            <text x="${x}" y="${y + 54}" text-anchor="middle" fill="#38bdf8" font-family="'Outfit', sans-serif" font-size="16px" font-weight="800">📡 ${title}</text>
            <text x="${x}" y="${y + 72}" text-anchor="middle" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="12px" font-weight="500">${subtitle}</text>
        `;

        g.addEventListener('click', () => {
            if (this.onNodeSelected) this.onNodeSelected({ type: 'bs', data: { name: title } });
        });

        this.nodesLayer.appendChild(g);
    }

    renderMecHostNode(cx, cy, w, h) {
        const g = this.createSvg('g', {
            id: 'node-mec',
            class: 'svg-interactive-node',
            style: 'cursor: pointer;'
        });

        const bx = cx - w / 2;
        const by = cy - h / 2;

        let html = `
            <rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="12" fill="url(#grad-mec)" stroke="#10b981" stroke-width="1.8"/>
            <circle cx="${bx}" cy="${cy}" r="5" fill="#10b981"/>
            
            <text x="${bx + 24}" y="${by + 28}" fill="#34d399" font-family="'Outfit', sans-serif" font-size="21px" font-weight="800">🖥 MEC HOST</text>
            <text x="${bx + 175}" y="${by + 28}" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="13.5px" font-weight="500">Mobile Edge Computing Platform</text>
            <circle cx="${bx + w - 24}" cy="${by + 24}" r="5" fill="#10b981"/>

            <!-- 5 Server Blades -->
            <g id="mec-blades-group" transform="translate(${bx + 16}, ${by + 44})">
        `;

        const modules = [
            { id: 'CPU', title: 'CPU', icon: '⚙️' },
            { id: 'GPU', title: 'GPU', icon: '🎮' },
            { id: 'EDGE APPLICATIONS', title: 'EDGE APPS', icon: '📦' },
            { id: 'CACHE', title: 'CACHE', icon: '⚡' },
            { id: 'AI SERVICES', title: 'AI SERVICES', icon: '🧠' }
        ];

        const slotW = (w - 32) / 5;

        modules.forEach((mod, i) => {
            const mx = i * slotW;
            const mw = slotW - 8;
            const mh = 86;

            html += `
                <g id="blade-${mod.id}" class="blade-server-unit" transform="translate(${mx}, 0)">
                    <rect class="blade-box" x="0" y="0" width="${mw}" height="${mh}" rx="6" fill="url(#grad-blade)" stroke="rgba(52, 211, 153, 0.4)" stroke-width="1.2"/>
                    <circle class="blade-led" cx="${mw / 2}" cy="15" r="3.5" fill="#10b981"/>
                    <text x="${mw / 2}" y="39" text-anchor="middle" font-size="16px">${mod.icon}</text>
                    <text class="blade-title" x="${mw / 2}" y="58" text-anchor="middle" fill="#ffffff" font-family="'Inter', sans-serif" font-size="11.5px" font-weight="700">${mod.title}</text>
                    <text class="blade-status" x="${mw / 2}" y="74" text-anchor="middle" fill="#34d399" font-family="'Inter', sans-serif" font-size="10px" font-weight="600">ONLINE</text>
                </g>
            `;
        });

        html += `</g>`;
        g.innerHTML = html;

        g.addEventListener('click', () => {
            if (this.onNodeSelected) this.onNodeSelected({ type: 'mec', data: { name: 'MEC Host' } });
        });

        this.nodesLayer.appendChild(g);
    }

    renderCompareMecNode(cx, cy, w, h) {
        const g = this.createSvg('g', {
            id: 'node-mec-compare',
            class: 'svg-interactive-node',
            style: 'cursor: pointer;'
        });

        const bx = cx - w / 2;
        const by = cy - h / 2;

        let html = `
            <rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="10" fill="url(#grad-mec)" stroke="#10b981" stroke-width="1.6"/>
            <circle cx="${bx}" cy="${cy}" r="4" fill="#10b981"/>
            
            <text x="${bx + 18}" y="${by + 24}" fill="#34d399" font-family="'Outfit', sans-serif" font-size="16px" font-weight="800">🖥 MEC HOST</text>
            <text x="${bx + 145}" y="${by + 24}" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="11px" font-weight="500">Edge Compute Node</text>

            <g transform="translate(${bx + 12}, ${by + 38})">
        `;

        const modules = [
            { id: 'CPU', title: 'CPU', icon: '⚙️' },
            { id: 'GPU', title: 'GPU', icon: '🎮' },
            { id: 'CACHE', title: 'CACHE', icon: '⚡' },
            { id: 'AI SERVICES', title: 'AI', icon: '🧠' }
        ];

        const slotW = (w - 24) / 4;

        modules.forEach((mod, i) => {
            const mx = i * slotW;
            const mw = slotW - 6;
            const mh = 72;

            html += `
                <g id="blade-comp-${mod.id}" class="blade-server-unit" transform="translate(${mx}, 0)">
                    <rect class="blade-box" x="0" y="0" width="${mw}" height="${mh}" rx="5" fill="url(#grad-blade)" stroke="rgba(52, 211, 153, 0.4)" stroke-width="1"/>
                    <circle class="blade-led" cx="${mw / 2}" cy="12" r="3" fill="#10b981"/>
                    <text x="${mw / 2}" y="33" text-anchor="middle" font-size="14px">${mod.icon}</text>
                    <text class="blade-title" x="${mw / 2}" y="50" text-anchor="middle" fill="#ffffff" font-family="'Inter', sans-serif" font-size="10px" font-weight="700">${mod.title}</text>
                    <text class="blade-status" x="${mw / 2}" y="64" text-anchor="middle" fill="#34d399" font-family="'Inter', sans-serif" font-size="9px" font-weight="600">ONLINE</text>
                </g>
            `;
        });

        html += `</g>`;
        g.innerHTML = html;

        g.addEventListener('click', () => {
            if (this.onNodeSelected) this.onNodeSelected({ type: 'mec', data: { name: 'MEC Host' } });
        });

        this.nodesLayer.appendChild(g);
    }

    renderUavNode(x, y) {
        if (!this.sim.uavMode) return;

        const g = this.createSvg('g', {
            id: 'node-uav',
            class: 'svg-interactive-node',
            style: 'cursor: pointer;'
        });

        g.innerHTML = `
            <line x1="${x - 28}" y1="${y - 8}" x2="${x + 28}" y2="${y + 8}" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="${x - 28}" y1="${y + 8}" x2="${x + 28}" y2="${y - 8}" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>

            <ellipse cx="${x - 28}" cy="${y - 8}" rx="11" ry="3.5" fill="none" stroke="rgba(245, 158, 11, 0.7)" stroke-width="1.2"/>
            <ellipse cx="${x + 28}" cy="${y - 8}" rx="11" ry="3.5" fill="none" stroke="rgba(245, 158, 11, 0.7)" stroke-width="1.2"/>
            <ellipse cx="${x - 28}" cy="${y + 8}" rx="11" ry="3.5" fill="none" stroke="rgba(245, 158, 11, 0.7)" stroke-width="1.2"/>
            <ellipse cx="${x + 28}" cy="${y + 8}" rx="11" ry="3.5" fill="none" stroke="rgba(245, 158, 11, 0.7)" stroke-width="1.2"/>

            <rect x="${x - 17}" y="${y - 9}" width="34" height="18" rx="4" fill="#1e293b" stroke="#f59e0b" stroke-width="1.8"/>
            <circle cx="${x}" cy="${y}" r="2.8" fill="#f59e0b"/>

            <rect x="${x - 9}" y="${y + 9}" width="18" height="6.5" rx="2" fill="#065f46" stroke="#10b981" stroke-width="1"/>
            <circle cx="${x}" cy="${y + 12.5}" r="1.6" fill="#34d399"/>

            <text x="${x}" y="${y - 17}" text-anchor="middle" fill="#f59e0b" font-family="'Outfit', sans-serif" font-size="16px" font-weight="800">🛸 UAV-MEC</text>
            <text x="${x}" y="${y + 30}" text-anchor="middle" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="12px" font-weight="600">Mobile Edge Node</text>
        `;

        g.addEventListener('click', () => {
            if (this.onNodeSelected) this.onNodeSelected({ type: 'uav', data: { name: 'UAV-MEC Mobile Edge Node' } });
        });

        this.nodesLayer.appendChild(g);
    }

    renderUsersNodes(userList) {
        userList.forEach((u) => {
            const g = this.createSvg('g', {
                id: `node-ue-${u.id}`,
                class: 'svg-interactive-node',
                style: 'cursor: pointer;'
            });

            const x = u.x;
            const y = u.y;

            const taskObj = this.PACKET_TYPES[u.primaryTask] || this.PACKET_TYPES.AI_REQUEST;
            const badgeColor = taskObj.color;

            g.innerHTML = `
                <!-- Smartphone Outer Shell -->
                <rect x="${x - 18}" y="${y - 49}" width="36" height="52" rx="7" fill="#091220" stroke="rgba(56, 189, 248, 0.45)" stroke-width="1.5"/>
                <rect x="${x - 15}" y="${y - 45}" width="30" height="40" rx="4" fill="rgba(2, 132, 199, 0.16)"/>
                
                <rect x="${x + 6}" y="${y - 42}" width="1.5" height="2" fill="#00f0ff"/>
                <rect x="${x + 8.5}" y="${y - 44}" width="1.5" height="4" fill="#00f0ff"/>
                <rect x="${x + 11}" y="${y - 46}" width="1.5" height="6" fill="#00f0ff"/>

                <text x="${x}" y="${y - 20}" text-anchor="middle" font-size="17px">${u.icon}</text>
                <text x="${x}" y="${y + 21}" text-anchor="middle" fill="#ffffff" font-family="'Outfit', sans-serif" font-size="14px" font-weight="800">${u.id}</text>

                <!-- Application Badge -->
                <rect x="${x - 54}" y="${y + 29}" width="108" height="24" rx="5" fill="rgba(15, 23, 42, 0.95)" stroke="${badgeColor}" stroke-width="1.2"/>
                <text x="${x}" y="${y + 45.5}" text-anchor="middle" fill="${badgeColor}" font-family="'Inter', sans-serif" font-size="13px" font-weight="700">${u.appLabel}</text>
            `;

            g.addEventListener('click', () => {
                if (this.onNodeSelected) this.onNodeSelected({ type: 'user', data: u });
            });

            this.nodesLayer.appendChild(g);
        });
    }

    // =========================================================================
    // PACKET POOL & MOVEMENT LOGIC
    // =========================================================================
    initPacketPool() {
        this.packetPool = [];
        this.maxPoolSize = 40;

        for (let i = 0; i < this.maxPoolSize; i++) {
            const g = this.createSvg('g', {
                class: 'svg-packet-item',
                style: 'display: none;'
            });

            g.innerHTML = `
                <circle class="pkt-halo" cx="0" cy="0" r="8" fill="rgba(0, 240, 255, 0.4)"/>
                <circle class="pkt-core" cx="0" cy="0" r="3.5" fill="#ffffff"/>
                <g class="pkt-badge" transform="translate(0, -20)">
                    <rect class="pkt-bg" x="-42" y="-9" width="84" height="18" rx="4" fill="rgba(6, 11, 22, 0.95)" stroke="#00f0ff" stroke-width="1"/>
                    <text class="pkt-txt" x="0" y="3.5" text-anchor="middle" fill="#ffffff" font-family="'Inter', sans-serif" font-size="10.5px" font-weight="700">Packet</text>
                </g>
            `;

            this.packetsLayer.appendChild(g);
            this.packetPool.push(g);
        }
    }

    renderPackets() {
        const packets = this.sim.packets;
        const poolLen = this.packetPool.length;

        packets.forEach((pkt, i) => {
            if (i >= poolLen) return;
            const el = this.packetPool[i];

            const pos = this.getPacketPosition(pkt);
            if (!pos) {
                el.style.display = 'none';
                return;
            }

            el.style.display = '';
            el.setAttribute('transform', `translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`);

            const typeInfo = pkt.type;
            const halo = el.querySelector('.pkt-halo');
            const bg = el.querySelector('.pkt-bg');
            const txt = el.querySelector('.pkt-txt');
            const badge = el.querySelector('.pkt-badge');

            if (halo) halo.setAttribute('fill', typeInfo.glow || 'rgba(0, 240, 255, 0.5)');
            if (bg) bg.setAttribute('stroke', typeInfo.color || '#00f0ff');
            if (txt) {
                txt.textContent = typeInfo.label;
                const txtW = Math.max(78, typeInfo.label.length * 7.5 + 16);
                bg.setAttribute('width', txtW);
                bg.setAttribute('x', -txtW / 2);
            }

            if (badge) {
                badge.style.display = (pkt.status === 'processing-at-node' && (pkt.currentFrom === 'MEC' || pkt.currentFrom === 'CLOUD')) ? 'none' : '';
            }
        });

        for (let j = packets.length; j < poolLen; j++) {
            this.packetPool[j].style.display = 'none';
        }
    }

    getPacketPosition(pkt) {
        const fromNode = this.resolveNodeCoord(pkt.currentFrom, pkt.user, pkt);
        const toNode = this.resolveNodeCoord(pkt.currentTo, pkt.user, pkt);

        if (!fromNode || !toNode) return null;

        // Straight horizontal segment for high-speed edge link (BS <-> MEC)
        if (this.sim.mode === 'mec') {
            if ((pkt.currentFrom === 'BS' && pkt.currentTo === 'MEC') || (pkt.currentFrom === 'MEC' && pkt.currentTo === 'BS')) {
                const bsPort = { x: 560, y: 310 };
                const mecPort = { x: 800, y: 310 };
                const from = (pkt.currentFrom === 'BS') ? bsPort : mecPort;
                const to = (pkt.currentTo === 'MEC') ? mecPort : bsPort;
                return {
                    x: from.x + (to.x - from.x) * pkt.progress,
                    y: from.y + (to.y - from.y) * pkt.progress
                };
            }
        } else if (this.sim.mode === 'compare' && (pkt.currentFrom === 'BS' || pkt.currentFrom === 'MEC') && (pkt.currentTo === 'MEC' || pkt.currentTo === 'BS')) {
            const bsPort = { x: 1055, y: 360 };
            const mecPort = { x: 1170, y: 360 };
            const from = (pkt.currentFrom === 'BS') ? bsPort : mecPort;
            const to = (pkt.currentTo === 'MEC') ? mecPort : bsPort;
            return {
                x: from.x + (to.x - from.x) * pkt.progress,
                y: from.y + (to.y - from.y) * pkt.progress
            };
        }

        // Linear interpolation for vertical/orthogonal paths
        if (pkt.currentFrom === 'CORE' || pkt.currentFrom === 'WAN' || pkt.currentFrom === 'CLOUD' ||
            pkt.currentTo === 'CORE' || pkt.currentTo === 'WAN' || pkt.currentTo === 'CLOUD') {
            return {
                x: fromNode.x + (toNode.x - fromNode.x) * pkt.progress,
                y: fromNode.y + (toNode.y - fromNode.y) * pkt.progress
            };
        }

        // Curved wireless arcs for user <-> base station / UAV
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = Math.min(fromNode.y, toNode.y) - 16;
        const t = pkt.progress;

        const inv = 1 - t;
        const x = inv * inv * fromNode.x + 2 * inv * t * midX + t * t * toNode.x;
        const y = inv * inv * fromNode.y + 2 * inv * t * midY + t * t * toNode.y;

        return { x, y };
    }

    resolveNodeCoord(tag, userRef, pkt = null) {
        const mode = this.sim.mode;

        // COMPARE MODE RESOLUTION
        if (mode === 'compare') {
            const isLeftCloud = (pkt && pkt.compareSide === 'cloud') || (userRef && ['UE-01', 'UE-02', 'UE-03'].includes(userRef.id));

            if (isLeftCloud) {
                // Left Side (Traditional Cloud)
                if (tag === 'USER') {
                    const u = this.coords.compareLeft.users.find(u => u.id === userRef.id) || this.coords.compareLeft.users[1];
                    return { x: u.x, y: u.y - 49 };
                }
                if (tag === 'BS') return { x: 390, y: 305 };
                if (tag === 'CORE') return { x: 390, y: 246 };
                if (tag === 'WAN') return { x: 390, y: 172 };
                if (tag === 'CLOUD') return { x: 390, y: 70 };
                return { x: 390, y: 300 };
            } else {
                // Right Side (MEC)
                if (tag === 'USER') {
                    const u = this.coords.compareRight.users.find(u => u.id === userRef.id) || this.coords.compareRight.users[1];
                    return { x: u.x, y: u.y - 49 };
                }
                if (tag === 'BS') return { x: 1020, y: 280 };
                if (tag === 'MEC') return { x: 1170, y: 360 };
                if (tag === 'CORE') return { x: 1210, y: 172 };
                if (tag === 'CLOUD') return { x: 1210, y: 70 };
                return { x: 1210, y: 300 };
            }
        }

        // TRADITIONAL CLOUD MODE RESOLUTION
        if (mode === 'cloud') {
            if (tag === 'USER') {
                const u = this.coords.users.find(u => u.id === userRef.id) || this.coords.users[0];
                return { x: u.x, y: u.y - 49 };
            }
            if (tag === 'BS') return { x: 800, y: 305 };
            if (tag === 'CORE') return { x: 800, y: 255 };
            if (tag === 'WAN') return { x: 800, y: 180 };
            if (tag === 'CLOUD') return { x: 800, y: 65 };
            return { x: 800, y: 300 };
        }

        // MEC MODE RESOLUTION
        if (tag === 'USER') {
            const u = this.coords.users.find(u => u.id === userRef.id) || this.coords.users[0];
            return { x: u.x, y: u.y - 49 };
        }
        if (tag === 'BS') return { x: 520, y: 230 };
        if (tag === 'UAV') return { x: this.coords.uav.x, y: this.coords.uav.y };
        if (tag === 'MEC') return { x: 800, y: 310 };
        if (tag === 'CORE') return { x: 800, y: 175 };
        if (tag === 'CLOUD') return { x: 800, y: 55 };

        return { x: 800, y: 325 };
    }

    updateDynamicStates(currentTime) {
        this.time = currentTime;
        this.rotorAngle = (currentTime * 0.035) % (Math.PI * 2);

        // 1. Update UAV hovering in MEC mode
        if (this.sim.mode === 'mec' && this.sim.uavMode) {
            const uavNode = document.getElementById('node-uav');
            if (uavNode) {
                const hoverOffset = Math.sin(currentTime * 0.003) * 3.5;
                uavNode.setAttribute('transform', `translate(0, ${hoverOffset.toFixed(1)})`);
            }
        }

        // 2. Update Cloud processing status badge in Traditional Cloud mode & Compare mode
        const isCloudProcessing = this.sim.cloudState.processing;
        const badges = [
            document.getElementById('cloud-status-badge'),
            document.getElementById('cloud-status-badge-left')
        ];

        badges.forEach(badge => {
            if (!badge) return;
            const led = badge.querySelector('.cloud-badge-led');
            const txt = badge.querySelector('.cloud-badge-text');
            const bg = badge.querySelector('.cloud-badge-bg');

            if (isCloudProcessing) {
                if (led) led.setAttribute('fill', '#ec4899');
                if (txt) {
                    txt.textContent = 'CLOUD PROCESSING';
                    txt.setAttribute('fill', '#f472b6');
                }
                if (bg) {
                    bg.setAttribute('stroke', '#ec4899');
                    bg.setAttribute('fill', 'rgba(236, 72, 153, 0.25)');
                }
            } else {
                if (led) led.setAttribute('fill', '#a855f7');
                if (txt) {
                    txt.textContent = 'CENTRAL CLOUD IDLE';
                    txt.setAttribute('fill', '#c084fc');
                }
                if (bg) {
                    bg.setAttribute('stroke', '#a855f7');
                    bg.setAttribute('fill', 'rgba(15, 23, 42, 0.85)');
                }
            }
        });

        // 3. Update MEC Host blade status indicators
        if (this.sim.mode === 'mec' || this.sim.mode === 'compare') {
            this.MEC_NODES.forEach(node => {
                const bladeEl = document.getElementById(`blade-${node.id}`) || document.getElementById(`blade-comp-${node.id}`);
                if (!bladeEl) return;

                const proc = this.sim.nodeProcessing[node.id];
                const isBusy = proc && proc.active;

                const box = bladeEl.querySelector('.blade-box');
                const statusTxt = bladeEl.querySelector('.blade-status');
                const led = bladeEl.querySelector('.blade-led');

                if (isBusy) {
                    if (box) {
                        box.setAttribute('fill', 'url(#grad-blade-active)');
                        box.setAttribute('stroke', '#34d399');
                    }
                    if (statusTxt) {
                        statusTxt.textContent = 'COMPUTING';
                        statusTxt.setAttribute('fill', '#34d399');
                    }
                    if (led) led.setAttribute('fill', '#34d399');
                } else {
                    if (box) {
                        box.setAttribute('fill', 'url(#grad-blade)');
                        box.setAttribute('stroke', 'rgba(52, 211, 153, 0.4)');
                    }
                    if (statusTxt) {
                        statusTxt.textContent = 'ONLINE';
                        statusTxt.setAttribute('fill', '#10b981');
                    }
                    if (led) led.setAttribute('fill', '#10b981');
                }
            });
        }
    }

    render(currentTime) {
        this.updateDynamicStates(currentTime);
        this.renderPackets();
    }

    refreshTopology() {
        this.setupCoordinates();
        this.buildSvgDom();
        this.initPacketPool();
    }

    resize(w, h) {
        // SVG utilizes viewBox="0 0 1600 650"
    }
}

window.NetworkRenderer = NetworkRenderer;
