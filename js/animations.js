// Visual Animation Helpers & Particle Effects
// Manages wireless wave propagation, particle trails, and procedural oscillation

class WaveEmitter {
    constructor() {
        this.waves = [];
    }

    emit(x, y, color = '#00f0ff', maxRadius = 120, speed = 1.2) {
        this.waves.push({
            x,
            y,
            radius: 5,
            maxRadius,
            color,
            speed,
            alpha: 0.8
        });
    }

    update() {
        for (let i = this.waves.length - 1; i >= 0; i--) {
            const w = this.waves[i];
            w.radius += w.speed;
            w.alpha = Math.max(0, 0.8 * (1 - (w.radius / w.maxRadius)));

            if (w.radius >= w.maxRadius || w.alpha <= 0.01) {
                this.waves.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        for (const w of this.waves) {
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
            ctx.strokeStyle = w.color;
            ctx.globalAlpha = w.alpha;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Inner harmonic ring
            if (w.radius > 20) {
                ctx.beginPath();
                ctx.arc(w.x, w.y, w.radius * 0.65, 0, Math.PI * 2);
                ctx.strokeStyle = w.color;
                ctx.globalAlpha = w.alpha * 0.45;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        ctx.restore();
    }
}

class BackgroundGrid {
    constructor() {
        this.time = 0;
    }

    draw(ctx, width, height) {
        ctx.save();
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.05)';
        ctx.lineWidth = 1;

        const gridSize = 45;
        const offsetX = 0;
        const offsetY = 0;

        ctx.beginPath();
        for (let x = 0; x <= width; x += gridSize) {
            ctx.moveTo(x + offsetX, 0);
            ctx.lineTo(x + offsetX, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
            ctx.moveTo(0, y + offsetY);
            ctx.lineTo(width, y + offsetY);
        }
        ctx.stroke();

        // Subtle glowing crosshairs at some intersections
        ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
        for (let x = gridSize * 2; x < width; x += gridSize * 4) {
            for (let y = gridSize * 2; y < height; y += gridSize * 4) {
                ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
            }
        }

        ctx.restore();
    }
}

// Math helper for quadratic bezier interpolation
function getBezierPoint(p0, p1, p2, t) {
    const inv = 1 - t;
    return {
        x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
        y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y
    };
}

function getCubicBezierPoint(p0, p1, p2, p3, t) {
    const inv = 1 - t;
    const inv2 = inv * inv;
    const t2 = t * t;
    return {
        x: inv2 * inv * p0.x + 3 * inv2 * t * p1.x + 3 * inv * t2 * p2.x + t2 * t * p3.x,
        y: inv2 * inv * p0.y + 3 * inv2 * t * p1.y + 3 * inv * t2 * p2.y + t2 * t * p3.y
    };
}

// Global export for local file:// execution and modular imports
window.MecAnimations = {
    WaveEmitter,
    BackgroundGrid,
    getBezierPoint,
    getCubicBezierPoint
};
