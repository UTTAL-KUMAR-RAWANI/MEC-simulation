// MEC Simulation Data & Constants
// Behavioral simulation parameters and definitions for academic presentation

const PACKET_TYPES = {
    SENSOR: {
        id: 'sensor',
        label: 'Sensor Data',
        color: '#00f0ff', // Cyan
        glow: 'rgba(0, 240, 255, 0.7)',
        icon: '📡',
        size: '1.2 KB',
        mecProcessingMs: 12,
        cloudProcessingMs: 85,
        targetNode: 'CACHE',
        description: 'Sensor data processed at edge cache.'
    },
    VIDEO: {
        id: 'video',
        label: 'Video Data',
        color: '#3b82f6', // Blue
        glow: 'rgba(59, 130, 246, 0.7)',
        icon: '📹',
        size: '4.8 MB',
        mecProcessingMs: 22,
        cloudProcessingMs: 140,
        targetNode: 'GPU',
        description: 'High-bandwidth live video processed at edge GPU.'
    },
    AI_REQUEST: {
        id: 'ai_request',
        label: 'AI Request',
        color: '#f59e0b', // Orange
        glow: 'rgba(245, 158, 11, 0.7)',
        icon: '🧠',
        size: '512 KB',
        mecProcessingMs: 18,
        cloudProcessingMs: 160,
        targetNode: 'AI SERVICES',
        description: 'Low-latency AI inference processed near real-time.'
    },
    IOT: {
        id: 'iot',
        label: 'IoT Data',
        color: '#14b8a6', // Teal / Cyan tint
        glow: 'rgba(20, 184, 166, 0.7)',
        icon: '🏭',
        size: '64 KB',
        mecProcessingMs: 10,
        cloudProcessingMs: 90,
        targetNode: 'CPU',
        description: 'Industrial IoT control packet.'
    },
    AR_DATA: {
        id: 'ar_data',
        label: 'AR Data',
        color: '#ec4899', // Pink
        glow: 'rgba(236, 72, 153, 0.7)',
        icon: '🥽',
        size: '2.4 MB',
        mecProcessingMs: 15,
        cloudProcessingMs: 125,
        targetNode: 'EDGE APPLICATIONS',
        description: 'Spatial rendering packet.'
    },
    RESULT: {
        id: 'result',
        label: 'Edge Result',
        color: '#10b981', // Green
        glow: 'rgba(16, 185, 129, 0.8)',
        icon: '⚡',
        size: '12 KB',
        mecProcessingMs: 0,
        cloudProcessingMs: 0,
        targetNode: null,
        description: 'Processed decision returned to user.'
    },
    CLOUD_SYNC: {
        id: 'cloud_sync',
        label: 'Cloud Sync',
        color: '#a855f7', // Purple
        glow: 'rgba(168, 85, 247, 0.7)',
        icon: '☁️',
        size: '15 MB',
        mecProcessingMs: 0,
        cloudProcessingMs: 180,
        targetNode: 'CLOUD',
        description: 'MEC Host to Cloud Data Center synchronization.'
    }
};

const MEC_NODES = [
    { id: 'CPU', name: 'CPU', type: 'General Compute', load: 38, icon: '⚙️', color: '#10b981' },
    { id: 'GPU', name: 'GPU', type: 'Video & Vision', load: 52, icon: '🎮', color: '#38bdf8' },
    { id: 'EDGE APPLICATIONS', name: 'EDGE APPLICATIONS', type: 'Microservices', load: 30, icon: '📦', color: '#a855f7' },
    { id: 'CACHE', name: 'CACHE', type: 'Ultra-low Latency', load: 45, icon: '⚡', color: '#00f0ff' },
    { id: 'AI SERVICES', name: 'AI SERVICES', type: 'NPU / Neural Engine', load: 42, icon: '🧠', color: '#f59e0b' }
];

const CLOUD_NODES = [
    { id: 'COMPUTE', name: 'COMPUTE', type: 'Hyperscale Virtual Machines', icon: '⚡', color: '#c084fc' },
    { id: 'STORAGE', name: 'STORAGE', type: 'Distributed Exabyte Store', icon: '💾', color: '#a855f7' },
    { id: 'AI / ML', name: 'AI / ML', type: 'Foundational Model Training', icon: '🧠', color: '#818cf8' },
    { id: 'DATABASE', name: 'DATABASE', type: 'Centralized Database Engine', icon: '🗄️', color: '#38bdf8' }
];

const MOBILE_USERS = [
    { id: 'UE-01', name: 'UE-01', appLabel: 'Video Data', primaryTask: 'VIDEO', icon: '📱', signal: 98 },
    { id: 'UE-02', name: 'UE-02', appLabel: 'AI Request', primaryTask: 'AI_REQUEST', icon: '📱', signal: 94 },
    { id: 'UE-03', name: 'UE-03', appLabel: 'Sensor Data', primaryTask: 'SENSOR', icon: '📡', signal: 92 },
    { id: 'UE-04', name: 'UE-04', appLabel: 'AR Data', primaryTask: 'AR_DATA', icon: '🥽', signal: 89 },
    { id: 'UE-05', name: 'UE-05', appLabel: 'IoT Data', primaryTask: 'IOT', icon: '🏭', signal: 95 },
    { id: 'UE-06', name: 'UE-06', appLabel: 'Vehicle Data', primaryTask: 'AI_REQUEST', icon: '🚗', signal: 88 }
];

const COMPARISON_TASK = {
    title: 'AI Video Analysis',
    input: 'Video Stream',
    processing: 'Object Detection',
    output: 'Vehicle Detected',
    cloudPath: ['User', '5G Base Station', 'Mobile Core', 'Internet / WAN', 'Cloud Data Center', 'Cloud Processing', 'Result Returned'],
    mecPath: ['User', '5G Base Station', 'MEC Host', 'Edge AI Processing', 'Result Returned']
};

// Global export for local file:// execution and modular scripts
window.MecData = {
    PACKET_TYPES,
    MEC_NODES,
    CLOUD_NODES,
    MOBILE_USERS,
    COMPARISON_TASK
};
