/* ============================================
   TSP EXPLORER v2 — Full Interactive Engine
   Aligned with academic report chapters 1-9
   ============================================ */

// ============= GLOBAL STATE =============
let cities = [];
let bestPath = [];
let currentPath = [];
let isRunning = false;
let permutationsChecked = 0;

// ============= PARTICLE BACKGROUND =============
(function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.8 + 0.4;
            this.speedX = (Math.random() - 0.5) * 0.35; this.speedY = (Math.random() - 0.5) * 0.35;
            this.opacity = Math.random() * 0.4 + 0.1; this.hue = Math.random() * 60 + 230;
        }
        update() { this.x += this.speedX; this.y += this.speedY; if (this.x < 0 || this.x > canvas.width) this.speedX *= -1; if (this.y < 0 || this.y > canvas.height) this.speedY *= -1; }
        draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fillStyle = `hsla(${this.hue},70%,65%,${this.opacity})`; ctx.fill(); }
    }
    for (let i = 0; i < 70; i++) particles.push(new Particle());
    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 140) { ctx.strokeStyle = `rgba(99,102,241,${(1 - d / 140) * 0.1})`; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); }
            }
        }
    }
    (function animate() { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw(); }); connectParticles(); requestAnimationFrame(animate); })();
})();

// ============= HERO CANVAS =============
(function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    const ctx = canvas.getContext('2d');
    let W, H, heroCities = [], heroPath = [], pathProgress = 0, trailParticles = [];

    function resize() { const r = canvas.getBoundingClientRect(); W = r.width; H = r.height; canvas.width = W * 2; canvas.height = H * 2; ctx.scale(2, 2); }
    resize(); window.addEventListener('resize', resize);

    function generate() {
        heroCities = []; const pad = 45;
        for (let i = 0; i < 12; i++) heroCities.push({ x: pad + Math.random() * (W - pad * 2), y: pad + Math.random() * (H - pad * 2), phase: Math.random() * Math.PI * 2, ps: 0.018 + Math.random() * 0.015 });
        heroPath = nnSolve(heroCities);
    }
    function nnSolve(pts) {
        const n = pts.length, vis = new Array(n).fill(false), path = [0]; vis[0] = true;
        for (let s = 1; s < n; s++) { let l = path[path.length - 1], near = -1, nd = Infinity; for (let i = 0; i < n; i++) if (!vis[i]) { const d = dist(pts[l], pts[i]); if (d < nd) { nd = d; near = i; } } vis[near] = true; path.push(near); }
        return path;
    }
    class Trail { constructor(x, y) { this.x = x; this.y = y; this.life = 1; this.decay = 0.014 + Math.random() * 0.008; this.vx = (Math.random() - 0.5) * 1.2; this.vy = (Math.random() - 0.5) * 1.2; this.size = Math.random() * 2.2 + 0.4; } update() { this.life -= this.decay; this.x += this.vx; this.y += this.vy; this.vx *= 0.97; this.vy *= 0.97; } draw(c) { if (this.life <= 0) return; c.beginPath(); c.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2); c.fillStyle = `hsla(260,80%,70%,${this.life * 0.5})`; c.fill(); } }

    function draw() {
        ctx.clearRect(0, 0, W, H); pathProgress += 0.003; if (pathProgress > 1) pathProgress = 0;
        const totalSeg = heroPath.length, curSeg = pathProgress * totalSeg;
        for (let i = 0; i < heroPath.length; i++) {
            const from = heroCities[heroPath[i]], to = heroCities[heroPath[(i + 1) % heroPath.length]];
            const seg = Math.max(0, Math.min(1, curSeg - i));
            ctx.save(); ctx.shadowColor = 'rgba(99,102,241,0.4)'; ctx.shadowBlur = 12;
            ctx.strokeStyle = `rgba(99,102,241,${0.12 + seg * 0.3})`; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); ctx.restore();
            if (seg > 0) {
                const ex = from.x + (to.x - from.x) * seg, ey = from.y + (to.y - from.y) * seg;
                const g = ctx.createLinearGradient(from.x, from.y, ex, ey);
                g.addColorStop(0, 'rgba(139,92,246,0.3)'); g.addColorStop(1, 'rgba(236,72,153,0.8)');
                ctx.strokeStyle = g; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(ex, ey); ctx.stroke();
                if (Math.random() > 0.5) trailParticles.push(new Trail(ex, ey));
            }
        }
        trailParticles = trailParticles.filter(p => p.life > 0); trailParticles.forEach(p => { p.update(); p.draw(ctx); });
        heroCities.forEach((c, i) => {
            c.phase += c.ps; const pulse = Math.sin(c.phase) * 0.3 + 0.7, r = 5 * (0.8 + pulse * 0.3);
            const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r * 3.5);
            glow.addColorStop(0, `rgba(139,92,246,${0.2 * pulse})`); glow.addColorStop(1, 'rgba(139,92,246,0)');
            ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(c.x, c.y, r * 3.5, 0, Math.PI * 2); ctx.fill();
            const cg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
            cg.addColorStop(0, '#fff'); cg.addColorStop(0.4, 'rgba(168,85,247,0.9)'); cg.addColorStop(1, 'rgba(99,102,241,0.6)');
            ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,${0.5 + pulse * 0.3})`; ctx.font = '600 9px Inter'; ctx.textAlign = 'center'; ctx.fillText(i + 1, c.x, c.y + r + 12);
        });
        const dotSeg = Math.floor(pathProgress * totalSeg) % totalSeg, dotT = (pathProgress * totalSeg) % 1;
        const fc = heroCities[heroPath[dotSeg]], tc = heroCities[heroPath[(dotSeg + 1) % totalSeg]];
        const dx = fc.x + (tc.x - fc.x) * dotT, dy = fc.y + (tc.y - fc.y) * dotT;
        const sg = ctx.createRadialGradient(dx, dy, 0, dx, dy, 16);
        sg.addColorStop(0, 'rgba(236,72,153,0.5)'); sg.addColorStop(1, 'rgba(236,72,153,0)');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(dx, dy, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ec4899'; ctx.beginPath(); ctx.arc(dx, dy, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dx, dy, 2, 0, Math.PI * 2); ctx.fill();
        requestAnimationFrame(draw);
    }
    generate(); draw();
    setInterval(() => { generate(); pathProgress = 0; }, 14000);
})();

// ============= HERO FACTORIAL COUNTER =============
(function () {
    const el = document.getElementById('factorialDisplay');
    const detail = document.getElementById('factorialDetail');
    let n = 3, dir = 1;
    function fact(k) { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; }
    function fmt(num) { if (num >= 1e18) return (num / 1e18).toFixed(1) + '×10¹⁸'; if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T'; if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B'; if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'; return num.toLocaleString(); }
    setInterval(() => { n += dir; if (n >= 15) dir = -1; if (n <= 3) dir = 1; el.textContent = fmt(fact(n - 1) / 2); detail.textContent = `với ${n} thành phố`; }, 1200);
})();

// ============= UTILITIES =============
function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
function totalDistance(path, pts) { let d = 0; for (let i = 0; i < path.length; i++) d += dist(pts[path[i]], pts[path[(i + 1) % path.length]]); return d; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function getAnimSpeed() { return 101 - document.getElementById('speedSlider').value; }

// ============= MAIN TSP CANVAS =============
const tspCanvas = document.getElementById('tspCanvas');
const tspCtx = tspCanvas.getContext('2d');
let tspW, tspH;

function resizeTSPCanvas() {
    const r = tspCanvas.getBoundingClientRect();
    tspW = r.width; tspH = r.height;
    tspCanvas.width = tspW * 2; tspCanvas.height = tspH * 2;
    tspCtx.scale(2, 2); drawTSP();
}
resizeTSPCanvas(); window.addEventListener('resize', resizeTSPCanvas);

tspCanvas.addEventListener('click', (e) => {
    if (isRunning) return;
    const r = tspCanvas.getBoundingClientRect();
    cities.push({ x: e.clientX - r.left, y: e.clientY - r.top });
    bestPath = []; currentPath = []; drawTSP();
    document.getElementById('canvasOverlay').style.opacity = cities.length > 0 ? '0' : '1';
});

function generateRandom(n) {
    if (isRunning) return;
    cities = []; bestPath = []; currentPath = [];
    const pad = 35;
    for (let i = 0; i < n; i++) cities.push({ x: pad + Math.random() * (tspW - pad * 2), y: pad + Math.random() * (tspH - pad * 2) });
    drawTSP(); document.getElementById('canvasOverlay').style.opacity = '0'; resetResults();
}
function clearCities() { if (isRunning) return; cities = []; bestPath = []; currentPath = []; drawTSP(); document.getElementById('canvasOverlay').style.opacity = '1'; resetResults(); }
function resetResults() { ['resultAlgo', 'resultDist', 'resultTime', 'resultPerms'].forEach(id => document.getElementById(id).textContent = '—'); }

function drawTSP(highlightPath, highlightColor, animProgress = 1) {
    tspCtx.clearRect(0, 0, tspW, tspH);
    // Grid
    tspCtx.strokeStyle = 'rgba(255,255,255,0.015)'; tspCtx.lineWidth = 0.5;
    for (let x = 0; x < tspW; x += 50) { tspCtx.beginPath(); tspCtx.moveTo(x, 0); tspCtx.lineTo(x, tspH); tspCtx.stroke(); }
    for (let y = 0; y < tspH; y += 50) { tspCtx.beginPath(); tspCtx.moveTo(0, y); tspCtx.lineTo(tspW, y); tspCtx.stroke(); }
    // Current exploration
    if (currentPath.length > 1) {
        tspCtx.strokeStyle = 'rgba(239,68,68,0.15)'; tspCtx.lineWidth = 1; tspCtx.setLineDash([4, 4]);
        tspCtx.beginPath(); currentPath.forEach((ci, i) => { const c = cities[ci]; i === 0 ? tspCtx.moveTo(c.x, c.y) : tspCtx.lineTo(c.x, c.y); }); tspCtx.stroke(); tspCtx.setLineDash([]);
    }
    // Best path
    const pathToDraw = highlightPath || bestPath;
    if (pathToDraw.length > 1) {
        const segs = Math.floor(pathToDraw.length * animProgress);
        for (let i = 0; i < segs; i++) {
            const from = cities[pathToDraw[i]], to = cities[pathToDraw[(i + 1) % pathToDraw.length]];
            tspCtx.save(); tspCtx.shadowColor = highlightColor || 'rgba(99,102,241,0.4)'; tspCtx.shadowBlur = 10;
            tspCtx.strokeStyle = highlightColor || 'rgba(99,102,241,0.5)'; tspCtx.lineWidth = 2.5;
            tspCtx.beginPath(); tspCtx.moveTo(from.x, from.y); tspCtx.lineTo(to.x, to.y); tspCtx.stroke(); tspCtx.restore();
            const g = tspCtx.createLinearGradient(from.x, from.y, to.x, to.y);
            g.addColorStop(0, 'rgba(139,92,246,0.7)'); g.addColorStop(1, 'rgba(6,182,212,0.7)');
            tspCtx.strokeStyle = g; tspCtx.lineWidth = 1.5; tspCtx.beginPath(); tspCtx.moveTo(from.x, from.y); tspCtx.lineTo(to.x, to.y); tspCtx.stroke();
        }
    }
    // Cities
    cities.forEach((c, i) => {
        const glow = tspCtx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 20);
        glow.addColorStop(0, 'rgba(139,92,246,0.2)'); glow.addColorStop(1, 'rgba(139,92,246,0)');
        tspCtx.fillStyle = glow; tspCtx.beginPath(); tspCtx.arc(c.x, c.y, 20, 0, Math.PI * 2); tspCtx.fill();
        tspCtx.strokeStyle = 'rgba(139,92,246,0.3)'; tspCtx.lineWidth = 1.5;
        tspCtx.beginPath(); tspCtx.arc(c.x, c.y, 9, 0, Math.PI * 2); tspCtx.stroke();
        const cg = tspCtx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 6);
        cg.addColorStop(0, '#fff'); cg.addColorStop(0.5, '#a78bfa'); cg.addColorStop(1, '#6366f1');
        tspCtx.fillStyle = cg; tspCtx.beginPath(); tspCtx.arc(c.x, c.y, 6, 0, Math.PI * 2); tspCtx.fill();
        tspCtx.fillStyle = 'rgba(255,255,255,0.8)'; tspCtx.font = '700 10px Inter'; tspCtx.textAlign = 'center'; tspCtx.textBaseline = 'middle';
        tspCtx.fillText(String.fromCharCode(65 + i), c.x, c.y);
    });
    // Total distance label
    if (pathToDraw.length > 1 && animProgress >= 1) {
        const d = totalDistance(pathToDraw, cities);
        tspCtx.fillStyle = 'rgba(6,6,24,0.7)'; tspCtx.beginPath(); tspCtx.roundRect(tspW - 180, 8, 170, 32, 8); tspCtx.fill();
        tspCtx.strokeStyle = 'rgba(99,102,241,0.3)'; tspCtx.lineWidth = 1; tspCtx.stroke();
        tspCtx.fillStyle = '#a78bfa'; tspCtx.font = '600 11px JetBrains Mono'; tspCtx.textAlign = 'right'; tspCtx.fillText(`Tổng: ${d.toFixed(1)} px`, tspW - 18, 29);
    }
}

// ============= ALGORITHMS =============
async function runAlgorithm(type) {
    if (isRunning) return;
    if (cities.length < 3) { alert('Cần ít nhất 3 thành phố!'); return; }
    isRunning = true; bestPath = []; currentPath = []; permutationsChecked = 0;
    const startTime = performance.now();
    const pBar = document.getElementById('progressBar'), pFill = document.getElementById('progressFill');
    pBar.classList.add('active'); pFill.style.width = '0%';
    let algoName = '';
    try {
        switch (type) {
            case 'bruteforce': algoName = 'Brute Force'; if (cities.length > 11) { alert('Brute Force tối đa 11 TP!'); isRunning = false; pBar.classList.remove('active'); return; } await bruteForce(); break;
            case 'heldkarp': algoName = 'Held-Karp (DP)'; if (cities.length > 20) { alert('Held-Karp tối đa 20 TP!'); isRunning = false; pBar.classList.remove('active'); return; } await heldKarp(); break;
            case 'nearest': algoName = 'Nearest Neighbor'; await nearestNeighbor(); break;
            case 'twoopt': algoName = '2-Opt'; await twoOpt(); break;
            case 'genetic': algoName = 'Genetic Algorithm'; await geneticAlgorithm(); break;
            case 'simulated': algoName = 'Simulated Annealing'; await simulatedAnnealing(); break;
            case 'aco': algoName = 'Ant Colony (ACO)'; await antColony(); break;
        }
    } catch(e) { console.error(e); }
    const elapsed = performance.now() - startTime;
    pFill.style.width = '100%';
    for (let i = 0; i <= 25; i++) { drawTSP(bestPath, null, i / 25); await sleep(18); }
    document.getElementById('resultAlgo').textContent = algoName;
    document.getElementById('resultDist').textContent = totalDistance(bestPath, cities).toFixed(1) + ' px';
    document.getElementById('resultTime').textContent = elapsed < 1000 ? elapsed.toFixed(1) + ' ms' : (elapsed / 1000).toFixed(2) + ' s';
    document.getElementById('resultPerms').textContent = permutationsChecked.toLocaleString();
    setTimeout(() => pBar.classList.remove('active'), 1000);
    isRunning = false;
}

function factorial(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }

// Brute Force
async function bruteForce() {
    const n = cities.length, indices = Array.from({ length: n - 1 }, (_, i) => i + 1);
    let bestDist = Infinity, total = factorial(n - 1), count = 0, divider = Math.max(1, Math.floor(total / 400));
    function* perms(arr) { if (arr.length <= 1) { yield arr; return; } for (let i = 0; i < arr.length; i++) { const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]; for (const p of perms(rest)) yield [arr[i], ...p]; } }
    for (const perm of perms(indices)) {
        const path = [0, ...perm]; const d = totalDistance(path, cities); count++; permutationsChecked = count;
        if (d < bestDist) { bestDist = d; bestPath = [...path]; }
        if (count % divider === 0) { currentPath = path; document.getElementById('progressFill').style.width = (count / total * 100) + '%'; drawTSP(); await sleep(getAnimSpeed() * 0.3); }
    }
    currentPath = [];
}

// Held-Karp (DP) — O(n²·2ⁿ)
async function heldKarp() {
    const n = cities.length;
    const dp = new Array(1 << n).fill(null).map(() => new Array(n).fill(Infinity));
    const parent = new Array(1 << n).fill(null).map(() => new Array(n).fill(-1));
    dp[1][0] = 0; // Start at city 0
    const totalStates = (1 << n) * n;
    let statesProcessed = 0;

    for (let mask = 1; mask < (1 << n); mask++) {
        for (let u = 0; u < n; u++) {
            if (!(mask & (1 << u)) || dp[mask][u] === Infinity) continue;
            for (let v = 0; v < n; v++) {
                if (mask & (1 << v)) continue;
                const newMask = mask | (1 << v);
                const newDist = dp[mask][u] + dist(cities[u], cities[v]);
                if (newDist < dp[newMask][v]) {
                    dp[newMask][v] = newDist;
                    parent[newMask][v] = u;
                }
            }
            statesProcessed++;
            permutationsChecked = statesProcessed;
        }
        if (mask % 500 === 0) {
            document.getElementById('progressFill').style.width = (mask / (1 << n) * 100) + '%';
            await sleep(1);
        }
    }

    const fullMask = (1 << n) - 1;
    let bestDist = Infinity, lastCity = -1;
    for (let u = 1; u < n; u++) {
        const d = dp[fullMask][u] + dist(cities[u], cities[0]);
        if (d < bestDist) { bestDist = d; lastCity = u; }
    }

    // Reconstruct path
    bestPath = [];
    let mask = fullMask, cur = lastCity;
    while (cur !== -1) {
        bestPath.push(cur);
        const prev = parent[mask][cur];
        mask = mask ^ (1 << cur);
        cur = prev;
    }
    bestPath.reverse();
}

// Nearest Neighbor
async function nearestNeighbor() {
    const n = cities.length; let overallBest = Infinity;
    for (let start = 0; start < n; start++) {
        const vis = new Array(n).fill(false), path = [start]; vis[start] = true;
        for (let step = 1; step < n; step++) {
            const last = path[path.length - 1]; let near = -1, nd = Infinity;
            for (let i = 0; i < n; i++) if (!vis[i]) { const d = dist(cities[last], cities[i]); if (d < nd) { nd = d; near = i; } }
            vis[near] = true; path.push(near); permutationsChecked++;
            currentPath = [...path]; drawTSP(); await sleep(getAnimSpeed() * 1.5);
        }
        const d = totalDistance(path, cities);
        if (d < overallBest) { overallBest = d; bestPath = [...path]; }
        document.getElementById('progressFill').style.width = ((start + 1) / n * 100) + '%';
    }
    currentPath = [];
}

// 2-Opt
async function twoOpt() {
    const n = cities.length, vis = new Array(n).fill(false);
    bestPath = [0]; vis[0] = true;
    for (let s = 1; s < n; s++) { const l = bestPath[bestPath.length - 1]; let near = -1, nd = Infinity; for (let i = 0; i < n; i++) if (!vis[i]) { const d = dist(cities[l], cities[i]); if (d < nd) { nd = d; near = i; } } vis[near] = true; bestPath.push(near); }
    let improved = true, iters = 0, maxIter = n * n * 3;
    while (improved && iters < maxIter) {
        improved = false;
        for (let i = 0; i < n - 1; i++) for (let j = i + 2; j < n; j++) {
            iters++; permutationsChecked = iters;
            const d1 = dist(cities[bestPath[i]], cities[bestPath[i + 1]]) + dist(cities[bestPath[j]], cities[bestPath[(j + 1) % n]]);
            const d2 = dist(cities[bestPath[i]], cities[bestPath[j]]) + dist(cities[bestPath[i + 1]], cities[bestPath[(j + 1) % n]]);
            if (d2 < d1) { let l = i + 1, r = j; while (l < r) { [bestPath[l], bestPath[r]] = [bestPath[r], bestPath[l]]; l++; r--; } improved = true; drawTSP(); await sleep(getAnimSpeed() * 0.4); }
        }
        document.getElementById('progressFill').style.width = Math.min(100, iters / maxIter * 100) + '%';
    }
}

// Genetic Algorithm
async function geneticAlgorithm() {
    const n = cities.length, POP = 100, GENS = 150, MUT = 0.15;
    let pop = [];
    for (let i = 0; i < POP; i++) { const p = Array.from({ length: n }, (_, j) => j); for (let k = n - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [p[k], p[r]] = [p[r], p[k]]; } pop.push(p); }
    let bestDist = Infinity;
    for (let gen = 0; gen < GENS; gen++) {
        const fit = pop.map(p => ({ path: p, dist: totalDistance(p, cities) })).sort((a, b) => a.dist - b.dist);
        if (fit[0].dist < bestDist) { bestDist = fit[0].dist; bestPath = [...fit[0].path]; }
        permutationsChecked += POP;
        const newPop = [fit[0].path, fit[1].path];
        while (newPop.length < POP) { const p1 = tSelect(fit), p2 = tSelect(fit); let child = oxCross(p1, p2, n); if (Math.random() < MUT) child = mutate(child); newPop.push(child); }
        pop = newPop;
        document.getElementById('progressFill').style.width = ((gen + 1) / GENS * 100) + '%'; drawTSP(); await sleep(getAnimSpeed() * 0.25);
    }
}
function tSelect(fit) { let best = null; for (let i = 0; i < 5; i++) { const idx = Math.floor(Math.random() * fit.length); if (!best || fit[idx].dist < best.dist) best = fit[idx]; } return best.path; }
function oxCross(p1, p2, n) { const s = Math.floor(Math.random() * n), e = s + Math.floor(Math.random() * (n - s)), child = new Array(n).fill(-1); for (let i = s; i <= e; i++) child[i] = p1[i]; let pos = (e + 1) % n; for (let i = 0; i < n; i++) { const g = p2[(e + 1 + i) % n]; if (!child.includes(g)) { child[pos] = g; pos = (pos + 1) % n; } } return child; }
function mutate(p) { const n = p.length, i = Math.floor(Math.random() * n), j = Math.floor(Math.random() * n), np = [...p]; [np[i], np[j]] = [np[j], np[i]]; return np; }

// Simulated Annealing
async function simulatedAnnealing() {
    const n = cities.length;
    let cur = Array.from({ length: n }, (_, i) => i);
    for (let k = n - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [cur[k], cur[r]] = [cur[r], cur[k]]; }
    let curDist = totalDistance(cur, cities); bestPath = [...cur]; let bestDist = curDist;
    let temp = 10000; const cool = 0.9995, minT = 0.01, maxIter = 30000;
    for (let iter = 0; iter < maxIter && temp > minT; iter++) {
        const i = Math.floor(Math.random() * n), j = Math.floor(Math.random() * n); if (i === j) continue;
        const nb = [...cur]; [nb[i], nb[j]] = [nb[j], nb[i]]; const nbD = totalDistance(nb, cities);
        if (nbD < curDist || Math.random() < Math.exp(-(nbD - curDist) / temp)) { cur = nb; curDist = nbD; if (curDist < bestDist) { bestDist = curDist; bestPath = [...cur]; } }
        temp *= cool; permutationsChecked = iter;
        if (iter % 200 === 0) { document.getElementById('progressFill').style.width = (iter / maxIter * 100) + '%'; drawTSP(); await sleep(getAnimSpeed() * 0.08); }
    }
}

// Ant Colony Optimization (ACO) — Dorigo 1996
async function antColony() {
    const n = cities.length, ANTS = 30, ITERS = 80, ALPHA = 1, BETA = 3, RHO = 0.15, Q = 100;
    const dists = []; for (let i = 0; i < n; i++) { dists[i] = []; for (let j = 0; j < n; j++) dists[i][j] = dist(cities[i], cities[j]); }
    const pheromone = []; for (let i = 0; i < n; i++) { pheromone[i] = []; for (let j = 0; j < n; j++) pheromone[i][j] = 1; }
    let bestDist = Infinity;
    for (let iter = 0; iter < ITERS; iter++) {
        const allPaths = [];
        for (let ant = 0; ant < ANTS; ant++) {
            const vis = new Set(), path = [Math.floor(Math.random() * n)]; vis.add(path[0]);
            while (path.length < n) {
                const cur = path[path.length - 1]; let probs = [], sum = 0;
                for (let j = 0; j < n; j++) { if (vis.has(j)) { probs.push(0); continue; }
                    const p = Math.pow(pheromone[cur][j], ALPHA) * Math.pow(1 / (dists[cur][j] + 0.001), BETA); probs.push(p); sum += p; }
                probs = probs.map(p => p / sum); let r = Math.random(), cumul = 0, next = 0;
                for (let j = 0; j < n; j++) { cumul += probs[j]; if (cumul >= r) { next = j; break; } }
                path.push(next); vis.add(next);
            }
            const d = totalDistance(path, cities); allPaths.push({ path, dist: d });
            if (d < bestDist) { bestDist = d; bestPath = [...path]; }
            permutationsChecked++;
        }
        // Evaporation
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) pheromone[i][j] *= (1 - RHO);
        // Update pheromone
        allPaths.forEach(({ path, dist: d }) => { const deposit = Q / d; for (let i = 0; i < path.length; i++) { const a = path[i], b = path[(i + 1) % path.length]; pheromone[a][b] += deposit; pheromone[b][a] += deposit; } });
        document.getElementById('progressFill').style.width = ((iter + 1) / ITERS * 100) + '%'; drawTSP(); await sleep(getAnimSpeed() * 0.4);
    }
}

// ============= HELD-KARP STEP-BY-STEP DEMO =============
async function runHeldKarpDemo() {
    const container = document.getElementById('hkSteps');
    container.innerHTML = '';
    const d = [[0,10,15,20],[10,0,35,25],[15,35,0,30],[20,25,30,0]];

    function addStep(title, content, isFinal = false) {
        const div = document.createElement('div');
        div.className = `hk-step ${isFinal ? 'final' : ''}`;
        div.innerHTML = `<div class="hk-step-title">${title}</div><div class="hk-step-content">${content}</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    addStep('Khởi tạo', 'Ma trận khoảng cách 4 thành phố (1,2,3,4). Xuất phát từ TP 1.'); await sleep(600);
    addStep('Bước 1 — Trường hợp cơ sở', 'C({2}, 2) = d₁₂ = <span class="highlight">10</span><br>C({3}, 3) = d₁₃ = <span class="highlight">15</span><br>C({4}, 4) = d₁₄ = <span class="highlight">20</span>'); await sleep(800);
    addStep('Bước 2 — Tập S có 2 phần tử', 'C({2,3}, 3) = C({2},2) + d₂₃ = 10 + 35 = <span class="highlight">45</span><br>C({2,3}, 2) = C({3},3) + d₃₂ = 15 + 35 = <span class="highlight">50</span><br>C({2,4}, 4) = C({2},2) + d₂₄ = 10 + 25 = <span class="highlight">35</span><br>C({2,4}, 2) = C({4},4) + d₄₂ = 20 + 25 = <span class="highlight">45</span><br>C({3,4}, 4) = C({3},3) + d₃₄ = 15 + 30 = <span class="highlight">45</span><br>C({3,4}, 3) = C({4},4) + d₄₃ = 20 + 30 = <span class="highlight">50</span>'); await sleep(1000);
    addStep('Bước 3 — Tập S có 3 phần tử', 'C({2,3,4}, 4) = min(45+30, 50+25) = min(75, 75) = <span class="highlight">75</span><br>C({2,3,4}, 3) = min(35+30, 45+35) = min(65, 80) = <span class="highlight">65</span><br>C({2,3,4}, 2) = min(45+25, 50+35) = min(70, 85) = <span class="highlight">70</span>'); await sleep(1000);
    addStep('Bước 4 — Nghiệm tối ưu', 'OPT = min(C({2,3,4},4)+d₄₁, C({2,3,4},3)+d₃₁, C({2,3,4},2)+d₂₁)<br>= min(75+20, 65+15, 70+10)<br>= min(95, <span class="highlight">80</span>, <span class="highlight">80</span>) = <span class="highlight">80</span>', true); await sleep(800);
    addStep('🏆 Kết quả', 'Hành trình tối ưu: <span class="highlight">1 → 2 → 4 → 3 → 1</span><br>(hoặc 1 → 3 → 4 → 2 → 1)<br>Tổng khoảng cách = 10 + 25 + 30 + 15 = <span class="highlight">80</span><br><br>Độ phức tạp: O(n²·2ⁿ) = O(16·16) = 256 phép tính<br>So với Brute Force: O(n!) = O(24) = 24 hoán vị<br><br>Với n=20: DP cần ~400M phép tính, BF cần ~2.4×10¹⁸ 🤯', true);
}

// ============= ALGORITHM RACE =============
async function startRace() {
    const cityCount = parseInt(document.getElementById('raceCityCount').value);
    const raceCities = []; const pad = 25;
    for (let i = 0; i < cityCount; i++) raceCities.push({ x: pad + Math.random() * (200 - pad * 2), y: pad + Math.random() * (170 - pad * 2) });
    document.getElementById('raceWinner').style.display = 'none';
    ['nn', '2opt', 'ga', 'sa'].forEach(id => { document.getElementById(`raceDist-${id}`).textContent = 'Đang chạy...'; document.getElementById(`raceTime-${id}`).textContent = ''; document.getElementById(`raceFill-${id}`).style.width = '0%'; document.getElementById(`track-${id}`).classList.remove('winner'); });
    const results = {};
    const algos = [{ id: 'nn', name: 'Nearest Neighbor', fn: raceNN }, { id: '2opt', name: '2-Opt', fn: raceTwoOpt }, { id: 'ga', name: 'Genetic Algorithm', fn: raceGA }, { id: 'sa', name: 'Simulated Annealing', fn: raceSA }];
    const promises = algos.map(async algo => {
        const canvas = document.getElementById(`raceCanvas-${algo.id}`);
        const ctx = canvas.getContext('2d'); const r = canvas.getBoundingClientRect();
        canvas.width = r.width * 2; canvas.height = r.height * 2; ctx.scale(2, 2);
        const w = r.width, h = r.height;
        const scaled = raceCities.map(c => ({ x: (c.x / 200) * w, y: (c.y / 170) * h }));
        const start = performance.now(); const path = await algo.fn(scaled, ctx, w, h, algo.id);
        const elapsed = performance.now() - start; const d = totalDistance(path, scaled);
        results[algo.id] = { dist: d, time: elapsed, name: algo.name };
        document.getElementById(`raceDist-${algo.id}`).textContent = `${d.toFixed(1)} px`;
        document.getElementById(`raceTime-${algo.id}`).textContent = `${elapsed.toFixed(0)} ms`;
        document.getElementById(`raceFill-${algo.id}`).style.width = '100%';
        await animateRace(ctx, scaled, path, w, h);
    });
    await Promise.all(promises);
    let winner = null, minD = Infinity;
    for (const [id, r] of Object.entries(results)) if (r.dist < minD) { minD = r.dist; winner = { id, ...r }; }
    if (winner) {
        document.getElementById(`track-${winner.id}`).classList.add('winner');
        document.getElementById('raceWinner').style.display = 'block';
        document.getElementById('winnerText').textContent = `${winner.name} chiến thắng! Khoảng cách: ${winner.dist.toFixed(1)} px — ${winner.time.toFixed(0)} ms`;
    }
}
function drawRaceC(ctx, pts, w, h) { ctx.clearRect(0, 0, w, h); pts.forEach(c => { const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 10); g.addColorStop(0, 'rgba(139,92,246,0.2)'); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, 10, 0, Math.PI * 2); ctx.fill(); const cg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 3.5); cg.addColorStop(0, '#fff'); cg.addColorStop(1, '#6366f1'); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2); ctx.fill(); }); }
function drawRP(ctx, pts, path, w, h, color) { drawRaceC(ctx, pts, w, h); if (path.length < 2) return; ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 6; ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); path.forEach((i, idx) => { const c = pts[i]; idx === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y); }); ctx.lineTo(pts[path[0]].x, pts[path[0]].y); ctx.stroke(); ctx.restore(); }
async function animateRace(ctx, pts, path, w, h) {
    for (let i = 0; i <= 18; i++) {
        drawRaceC(ctx, pts, w, h); const segs = Math.floor(path.length * (i / 18));
        ctx.save(); ctx.shadowColor = 'rgba(6,182,212,0.4)'; ctx.shadowBlur = 6;
        const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(99,102,241,0.7)'); g.addColorStop(1, 'rgba(236,72,153,0.7)');
        ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath();
        for (let j = 0; j <= segs; j++) { const c = pts[path[j % path.length]]; j === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y); }
        if (i === 18) ctx.lineTo(pts[path[0]].x, pts[path[0]].y);
        ctx.stroke(); ctx.restore(); await sleep(22);
    }
}
// Race implementations (compact versions)
async function raceNN(pts, ctx, w, h, id) { const n = pts.length; let best = null, bestD = Infinity; for (let s = 0; s < n; s++) { const vis = new Array(n).fill(false), p = [s]; vis[s] = true; for (let step = 1; step < n; step++) { const l = p[p.length - 1]; let near = -1, nd = Infinity; for (let i = 0; i < n; i++) if (!vis[i]) { const d = dist(pts[l], pts[i]); if (d < nd) { nd = d; near = i; } } vis[near] = true; p.push(near); } const d = totalDistance(p, pts); if (d < bestD) { bestD = d; best = [...p]; } document.getElementById(`raceFill-${id}`).style.width = ((s + 1) / n * 100) + '%'; drawRP(ctx, pts, p, w, h, 'rgba(34,211,238,0.4)'); await sleep(25); } return best; }
async function raceTwoOpt(pts, ctx, w, h, id) { const n = pts.length; const vis = new Array(n).fill(false); let p = [0]; vis[0] = true; for (let s = 1; s < n; s++) { const l = p[p.length - 1]; let near = -1, nd = Infinity; for (let i = 0; i < n; i++) if (!vis[i]) { const d = dist(pts[l], pts[i]); if (d < nd) { nd = d; near = i; } } vis[near] = true; p.push(near); } let imp = true, iter = 0, mx = n * n * 2; while (imp && iter < mx) { imp = false; for (let i = 0; i < n - 1; i++) for (let j = i + 2; j < n; j++) { iter++; if (dist(pts[p[i]], pts[p[i + 1]]) + dist(pts[p[j]], pts[p[(j + 1) % n]]) > dist(pts[p[i]], pts[p[j]]) + dist(pts[p[i + 1]], pts[p[(j + 1) % n]])) { let l = i + 1, r = j; while (l < r) { [p[l], p[r]] = [p[r], p[l]]; l++; r--; } imp = true; if (iter % 40 === 0) { drawRP(ctx, pts, p, w, h, 'rgba(245,158,11,0.4)'); document.getElementById(`raceFill-${id}`).style.width = Math.min(100, iter / mx * 100) + '%'; await sleep(4); } } } } return p; }
async function raceGA(pts, ctx, w, h, id) { const n = pts.length, POP = 80, GENS = 100; let pop = []; for (let i = 0; i < POP; i++) { const p = Array.from({ length: n }, (_, j) => j); for (let k = n - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [p[k], p[r]] = [p[r], p[k]]; } pop.push(p); } let best = null, bestD = Infinity; for (let g = 0; g < GENS; g++) { const fit = pop.map(p => ({ path: p, dist: totalDistance(p, pts) })).sort((a, b) => a.dist - b.dist); if (fit[0].dist < bestD) { bestD = fit[0].dist; best = [...fit[0].path]; } const np = [fit[0].path, fit[1].path]; while (np.length < POP) { const p1 = tSelect(fit), p2 = tSelect(fit); let c = oxCross(p1, p2, n); if (Math.random() < 0.15) c = mutate(c); np.push(c); } pop = np; if (g % 4 === 0) { drawRP(ctx, pts, best, w, h, 'rgba(16,185,129,0.4)'); document.getElementById(`raceFill-${id}`).style.width = ((g + 1) / GENS * 100) + '%'; await sleep(4); } } return best; }
async function raceSA(pts, ctx, w, h, id) { const n = pts.length; let cur = Array.from({ length: n }, (_, i) => i); for (let k = n - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [cur[k], cur[r]] = [cur[r], cur[k]]; } let curD = totalDistance(cur, pts), best = [...cur], bestD = curD, temp = 5000, mx = 18000; for (let it = 0; it < mx; it++) { const i = Math.floor(Math.random() * n), j = Math.floor(Math.random() * n); if (i === j) continue; const nb = [...cur]; [nb[i], nb[j]] = [nb[j], nb[i]]; const nd = totalDistance(nb, pts); if (nd < curD || Math.random() < Math.exp(-(nd - curD) / temp)) { cur = nb; curD = nd; if (curD < bestD) { bestD = curD; best = [...cur]; } } temp *= 0.9993; if (it % 400 === 0) { drawRP(ctx, pts, best, w, h, 'rgba(236,72,153,0.4)'); document.getElementById(`raceFill-${id}`).style.width = (it / mx * 100) + '%'; await sleep(4); } } return best; }

// ============= COMPLEXITY CHART =============
(function initChart() {
    const canvas = document.getElementById('complexityChart');
    const ctx = canvas.getContext('2d');
    function resize() { const r = canvas.getBoundingClientRect(); canvas.width = r.width * 2; canvas.height = r.height * 2; ctx.scale(2, 2); draw(r.width, r.height); }
    function draw(w, h) {
        ctx.clearRect(0, 0, w, h);
        const pad = { top: 35, right: 25, bottom: 55, left: 70 }, cW = w - pad.left - pad.right, cH = h - pad.top - pad.bottom;
        const nVals = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        const facts = nVals.map(n => { let f = 1; for (let i = 2; i < n; i++) f *= i; return f / 2; });
        const nSq = nVals.map(n => n * n), nCu = nVals.map(n => n ** 3), twoN = nVals.map(n => 2 ** n);
        const hkDP = nVals.map(n => n * n * (2 ** n));
        const maxLog = Math.log10(facts[facts.length - 1]);
        function xP(i) { return pad.left + (i / (nVals.length - 1)) * cW; }
        function yP(v) { if (v <= 0) return pad.top + cH; return pad.top + cH - (Math.log10(v) / maxLog) * cH; }
        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 0.5;
        for (let i = 0; i < nVals.length; i++) { const x = xP(i); ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + cH); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '500 9px JetBrains Mono'; ctx.textAlign = 'right';
        for (let p = 0; p <= maxLog; p += 2) { const y = pad.top + cH - (p / maxLog) * cH; ctx.fillText(`10^${p}`, pad.left - 8, y + 3); ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke(); }
        ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let i = 0; i < nVals.length; i++) ctx.fillText(nVals[i], xP(i), pad.top + cH + 16);
        ctx.fillText('Số thành phố (n)', pad.left + cW / 2, pad.top + cH + 40);
        function drawLine(data, color, label, dash = []) {
            ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.setLineDash(dash);
            ctx.beginPath(); data.forEach((v, i) => { const x = xP(i), y = Math.max(pad.top, yP(v)); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }); ctx.stroke(); ctx.setLineDash([]);
            if (!dash.length) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.strokeStyle = color.replace(/[\d.]+\)$/, '0.2)'); ctx.lineWidth = 5; ctx.beginPath(); data.forEach((v, i) => { const x = xP(i), y = Math.max(pad.top, yP(v)); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }); ctx.stroke(); ctx.restore(); }
        }
        drawLine(nSq, 'rgba(16,185,129,0.7)', 'O(n²)', [5, 3]);
        drawLine(nCu, 'rgba(6,182,212,0.7)', 'O(n³)', [5, 3]);
        drawLine(twoN, 'rgba(245,158,11,0.7)', 'O(2ⁿ)', [3, 2]);
        drawLine(hkDP, 'rgba(34,211,238,0.8)', 'O(n²·2ⁿ)');
        drawLine(facts, 'rgba(239,68,68,0.8)', 'O(n!)');
        // Labels
        const labels = [{ data: nSq, label: 'O(n²)', c: 'rgba(16,185,129,0.7)' }, { data: nCu, label: 'O(n³)', c: 'rgba(6,182,212,0.7)' }, { data: twoN, label: 'O(2ⁿ)', c: 'rgba(245,158,11,0.7)' }, { data: hkDP, label: 'Held-Karp', c: 'rgba(34,211,238,0.8)' }, { data: facts, label: 'O(n!)', c: 'rgba(239,68,68,0.8)' }];
        labels.forEach(({ data, label, c }) => { const li = data.length - 1, ly = Math.max(pad.top + 8, yP(data[li])); ctx.fillStyle = c; ctx.font = '600 9px Inter'; ctx.textAlign = 'right'; ctx.fillText(label, xP(li) - 2, ly - 6); });
        // Dots on factorial
        ctx.fillStyle = '#ef4444'; facts.forEach((v, i) => { ctx.beginPath(); ctx.arc(xP(i), Math.max(pad.top, yP(v)), 3, 0, Math.PI * 2); ctx.fill(); });
        // Title
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '700 12px Inter'; ctx.textAlign = 'center';
        ctx.fillText('So sánh tốc độ tăng (thang log) — bao gồm Held-Karp', w / 2, 22);
    }
    resize(); window.addEventListener('resize', resize);
})();

// ============= COMPLEXITY CALCULATOR =============
function updateCalculator() {
    const n = parseInt(document.getElementById('calcSlider').value);
    document.getElementById('calcCityCount').textContent = n;
    let paths = 1n; for (let i = 2n; i < BigInt(n); i++) paths *= i; paths = paths / 2n;
    document.getElementById('calcPaths').textContent = fmtBig(paths);
    const secBF = Number(paths) / 1e9;
    document.getElementById('calcTimeBF').textContent = fmtTime(secBF);
    const hkOps = BigInt(n) * BigInt(n) * (1n << BigInt(n));
    const secHK = Number(hkOps) / 1e9;
    document.getElementById('calcTimeHK').textContent = fmtTime(secHK);
    document.getElementById('calcComparison').textContent = getComparison(secBF);
    updateMilestones(n);
}
function fmtBig(n) { const s = n.toString(); if (s.length <= 15) return Number(n).toLocaleString(); return `${s[0]}.${s.substring(1, 4)} × 10^${s.length - 1}`; }
function fmtTime(s) { if (s < 0.001) return '< 1 µs'; if (s < 1) return (s * 1000).toFixed(2) + ' ms'; if (s < 60) return s.toFixed(2) + ' giây'; if (s < 3600) return (s / 60).toFixed(1) + ' phút'; if (s < 86400) return (s / 3600).toFixed(1) + ' giờ'; const y = 86400 * 365; if (s < y) return (s / 86400).toFixed(1) + ' ngày'; if (s < y * 1e3) return (s / y).toFixed(1) + ' năm'; if (s < y * 1e6) return (s / (y * 1e3)).toFixed(1) + ' nghìn năm'; if (s < y * 1e9) return (s / (y * 1e6)).toFixed(1) + ' triệu năm'; if (s < y * 1e12) return (s / (y * 1e9)).toFixed(1) + ' tỷ năm'; return (s / (y * 1e9)).toExponential(2) + ' tỷ năm'; }
function getComparison(s) { const uAge = 13.8e9 * 365 * 86400; if (s < 1) return '⚡ Rất nhanh!'; if (s < 60) return '☕ Uống ngụm cà phê'; if (s < 3600) return '🍿 Xem 1 bộ phim'; if (s < 86400 * 365) return '📅 Trong đời người'; if (s < uAge) return '🌍 Trong tuổi Trái Đất'; if (s < uAge * 1e10) return '🌌 Lâu hơn tuổi vũ trụ!'; return '💀 KHÔNG BAO GIỜ xong!'; }
function updateMilestones(n) {
    const c = document.getElementById('milestoneCards');
    const ms = [
        { n: 10, icon: '✅', text: '<strong>10 TP:</strong> BF < 1ms. Held-Karp tối ưu dễ dàng' },
        { n: 15, icon: '⚠️', text: '<strong>15 TP:</strong> BF mất vài phút. HK vẫn OK' },
        { n: 20, icon: '🔥', text: '<strong>20 TP:</strong> BF bất khả thi. HK ≈ vài giây' },
        { n: 25, icon: '💀', text: '<strong>25 TP:</strong> BF: ~triệu năm. HK giới hạn bộ nhớ' },
        { n: 30, icon: '🌌', text: '<strong>30 TP:</strong> Chỉ heuristic! BF: > tuổi vũ trụ' },
    ];
    c.innerHTML = ms.map(m => `<div class="milestone ${n >= m.n ? 'active' : ''}"><span class="milestone-icon">${m.icon}</span><span class="milestone-text">${m.text}</span></div>`).join('');
}
updateCalculator();

// ============= VARIANT DEMOS =============
function showVariantDemo(type) {
    const modal = document.getElementById('variantModal');
    const canvas = document.getElementById('variantCanvas');
    const ctx = canvas.getContext('2d');
    const title = document.getElementById('modalTitle');
    const desc = document.getElementById('modalDesc');
    modal.style.display = 'flex';
    const variants = {
        stsp: { title: '🔁 Symmetric TSP (STSP)', desc: 'Dạng cơ bản nhất: d_ij = d_ji. Khoảng cách Euclid trên mặt phẳng. Số hành trình: (n-1)!/2. Đây là dạng được nghiên cứu nhiều nhất.', draw: (c, w, h) => { const pts = genPts(8, w, h); const p = [0,1,2,3,4,5,6,7]; for (let i = 0; i < p.length; i++) { const f = pts[p[i]], t = pts[p[(i+1)%p.length]]; c.save(); c.shadowColor='rgba(99,102,241,0.4)'; c.shadowBlur=8; c.strokeStyle='rgba(99,102,241,0.6)'; c.lineWidth=2; c.beginPath(); c.moveTo(f.x,f.y); c.lineTo(t.x,t.y); c.stroke(); c.restore(); const mx=(f.x+t.x)/2,my=(f.y+t.y)/2; c.fillStyle='rgba(255,255,255,0.3)'; c.font='500 9px JetBrains Mono'; c.textAlign='center'; c.fillText(dist(f,t).toFixed(0),mx,my-6); } drawVCities(c, pts); } },
        atsp: { title: '↗️ Asymmetric TSP (ATSP)', desc: 'dᵢⱼ ≠ dⱼᵢ. Đường một chiều, gió ngược khi bay, chi phí vận chuyển lên dốc vs xuống dốc. Tổng quát hơn và khó hơn STSP.', draw: (c, w, h) => { const pts = genPts(6, w, h); for (let i = 0; i < pts.length; i++) { const f = pts[i], t = pts[(i+1)%pts.length]; drawArrow(c, f, t, 'rgba(99,102,241,0.6)', 2); const a = Math.atan2(t.y-f.y,t.x-f.x), mx=(f.x+t.x)/2, my=(f.y+t.y)/2; c.fillStyle='rgba(34,211,238,0.8)'; c.font='600 9px JetBrains Mono'; c.textAlign='center'; c.fillText(`→${Math.floor(dist(f,t)*0.8+Math.random()*30)}`, mx+Math.sin(a)*10, my-Math.cos(a)*10); c.fillStyle='rgba(239,68,68,0.7)'; c.fillText(`←${Math.floor(dist(f,t)*1.3+Math.random()*30)}`, mx-Math.sin(a)*10, my+Math.cos(a)*10); } drawVCities(c, pts); } },
        mtsp: { title: '👥 Multiple TSP (mTSP)', desc: 'm người xuất phát từ depot. Phân chia thành phố sao cho tổng khoảng cách nhỏ nhất. Tiền thân tự nhiên của VRP, ứng dụng trong robotics và quản lý nhân lực.', draw: (c, w, h) => { const depot={x:w/2,y:h/2}; const pts = genPts(12,w,h,35); const cols=['rgba(99,102,241,0.6)','rgba(239,68,68,0.6)','rgba(16,185,129,0.6)']; for (let g=0;g<3;g++){c.save();c.shadowColor=cols[g];c.shadowBlur=8;c.strokeStyle=cols[g];c.lineWidth=2;c.beginPath();c.moveTo(depot.x,depot.y);for(let i=g;i<pts.length;i+=3)c.lineTo(pts[i].x,pts[i].y);c.lineTo(depot.x,depot.y);c.stroke();c.restore();} c.fillStyle='#f59e0b';c.font='14px serif';c.textAlign='center';c.textBaseline='middle';c.fillText('🏠',depot.x,depot.y); pts.forEach((p,i)=>{c.fillStyle=cols[i%3];c.beginPath();c.arc(p.x,p.y,5,0,Math.PI*2);c.fill();}); } },
        vrp: { title: '🚚 CVRP (Capacitated Vehicle Routing)', desc: 'k xe tải, sức chứa C. Σdᵢ ≤ C cho mỗi tuyến. Tổng quát hóa quan trọng nhất của TSP trong logistics. Giảm chi phí vận chuyển 10-30%.', draw: (c,w,h) => { const depot={x:40,y:h/2}; const pts=genPts(10,w,h,45); const demands=pts.map(()=>Math.floor(Math.random()*4)+1); const cols=['rgba(99,102,241,0.6)','rgba(236,72,153,0.6)','rgba(16,185,129,0.6)']; const routes=[[],[],[]]; const vis=new Set(); let ri=0; for(let i=0;i<pts.length;i++){if(!vis.has(i)){routes[ri%3].push(i);vis.add(i);if(routes[ri%3].length>=4)ri++;}} routes.forEach((r,ri)=>{c.save();c.shadowColor=cols[ri];c.shadowBlur=6;c.strokeStyle=cols[ri];c.lineWidth=2;c.beginPath();c.moveTo(depot.x,depot.y);r.forEach(i=>c.lineTo(pts[i].x,pts[i].y));c.lineTo(depot.x,depot.y);c.stroke();c.restore();}); c.fillStyle='#f59e0b';c.font='14px serif';c.textAlign='center';c.textBaseline='middle';c.fillText('🏭',depot.x,depot.y); pts.forEach((p,i)=>{c.fillStyle='#6366f1';c.beginPath();c.arc(p.x,p.y,7,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.font='700 8px Inter';c.textAlign='center';c.textBaseline='middle';c.fillText(demands[i],p.x,p.y);}); } },
        tspw: { title: '⏰ TSP with Time Windows', desc: 'Mỗi TP có khung [aᵢ, bᵢ]. Đến sớm = chờ, đến muộn = vi phạm. Rất phổ biến trong giao hàng e-commerce, lịch trình bệnh viện.', draw: (c,w,h) => { const pts=genPts(8,w,h); for(let i=0;i<pts.length;i++){const f=pts[i],t=pts[(i+1)%pts.length];c.save();c.shadowColor='rgba(99,102,241,0.3)';c.shadowBlur=6;c.strokeStyle='rgba(99,102,241,0.5)';c.lineWidth=2;c.beginPath();c.moveTo(f.x,f.y);c.lineTo(t.x,t.y);c.stroke();c.restore();} pts.forEach((p,i)=>{const tw={s:i*2,e:i*2+3};c.strokeStyle='rgba(245,158,11,0.5)';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,14,-Math.PI/2,-Math.PI/2+Math.PI*2*((tw.e-tw.s)/24));c.stroke();c.fillStyle='#6366f1';c.beginPath();c.arc(p.x,p.y,7,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.font='600 7px Inter';c.textAlign='center';c.textBaseline='middle';c.fillText(i+1,p.x,p.y);c.fillStyle='rgba(245,158,11,0.8)';c.font='500 8px JetBrains Mono';c.fillText(`${tw.s}h-${tw.e}h`,p.x,p.y+20);}); } },
        pcsp: { title: '💰 Prize-Collecting TSP', desc: 'Bỏ qua TP i → phạt πᵢ. Tối thiểu: khoảng cách + tổng phạt. Không bắt buộc thăm tất cả.', draw: (c,w,h) => { const pts=genPts(10,w,h); const visited=[0,2,4,5,7]; for(let i=0;i<visited.length;i++){const f=pts[visited[i]],t=pts[visited[(i+1)%visited.length]];c.save();c.shadowColor='rgba(16,185,129,0.4)';c.shadowBlur=8;c.strokeStyle='rgba(16,185,129,0.6)';c.lineWidth=2;c.beginPath();c.moveTo(f.x,f.y);c.lineTo(t.x,t.y);c.stroke();c.restore();} pts.forEach((p,i)=>{const v=visited.includes(i);c.fillStyle=v?'#10b981':'rgba(239,68,68,0.3)';c.beginPath();c.arc(p.x,p.y,7,0,Math.PI*2);c.fill();c.fillStyle=v?'rgba(16,185,129,0.8)':'rgba(239,68,68,0.5)';c.font='600 8px JetBrains Mono';c.textAlign='center';c.fillText(v?'✓ +$'+(Math.floor(Math.random()*80)+20):'✗ -$'+(Math.floor(Math.random()*30)+10),p.x,p.y+16);}); } },
        op: { title: '🎯 Orienteering Problem', desc: 'Ngân sách B giới hạn tổng khoảng cách. Mỗi TP có điểm thưởng sᵢ. Tối đa hóa tổng thưởng thu thập. Du lịch, trinh sát, sensor.', draw: (c,w,h) => { const pts=genPts(10,w,h); const scores=pts.map(()=>Math.floor(Math.random()*50)+10); const visited=[0,3,5,8]; for(let i=0;i<visited.length-1;i++){const f=pts[visited[i]],t=pts[visited[i+1]];c.strokeStyle='rgba(6,182,212,0.6)';c.lineWidth=2;c.beginPath();c.moveTo(f.x,f.y);c.lineTo(t.x,t.y);c.stroke();} pts.forEach((p,i)=>{const v=visited.includes(i);const r=v?8:5;c.fillStyle=v?'rgba(6,182,212,0.15)':'rgba(255,255,255,0.03)';c.beginPath();c.arc(p.x,p.y,18,0,Math.PI*2);c.fill();c.fillStyle=v?'#06b6d4':'rgba(255,255,255,0.2)';c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fill();c.fillStyle=v?'#22d3ee':'rgba(255,255,255,0.3)';c.font='600 9px JetBrains Mono';c.textAlign='center';c.fillText(`🎯${scores[i]}`,p.x,p.y+20);}); c.fillStyle='rgba(255,255,255,0.4)';c.font='500 10px Inter';c.textAlign='center';c.fillText(`Budget B = 300px | Collected: ${visited.reduce((s,i)=>s+scores[i],0)} pts`,w/2,h-15); } },
        gtsp: { title: '🎲 Generalized TSP (GTSP)', desc: 'TP chia thành nhóm (cluster). Chọn đúng 1 TP mỗi nhóm, tối thiểu khoảng cách. Ứng dụng: chọn nhà cung cấp, đường bay.', draw: (c,w,h) => { const groups=[{pts:[{x:80,y:60},{x:130,y:40},{x:100,y:100}],col:'rgba(99,102,241,0.3)',sel:1},{pts:[{x:w/2-20,y:50},{x:w/2+30,y:90},{x:w/2,y:120}],col:'rgba(236,72,153,0.3)',sel:0},{pts:[{x:w-130,y:60},{x:w-80,y:40},{x:w-100,y:110}],col:'rgba(16,185,129,0.3)',sel:2},{pts:[{x:w/2,y:h-60},{x:w/2-40,y:h-90},{x:w/2+40,y:h-80}],col:'rgba(245,158,11,0.3)',sel:1}]; groups.forEach(g=>{c.fillStyle=g.col;c.beginPath();const cx=g.pts.reduce((s,p)=>s+p.x,0)/g.pts.length,cy=g.pts.reduce((s,p)=>s+p.y,0)/g.pts.length;c.arc(cx,cy,55,0,Math.PI*2);c.fill();c.strokeStyle=g.col.replace('0.3','0.5');c.lineWidth=1;c.setLineDash([4,3]);c.stroke();c.setLineDash([]);g.pts.forEach((p,i)=>{const isSel=i===g.sel;c.fillStyle=isSel?'#fff':'rgba(255,255,255,0.2)';c.beginPath();c.arc(p.x,p.y,isSel?7:4,0,Math.PI*2);c.fill();if(isSel){c.strokeStyle='rgba(255,255,255,0.5)';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,10,0,Math.PI*2);c.stroke();}});}); const selPts=groups.map(g=>g.pts[g.sel]); c.strokeStyle='rgba(6,182,212,0.6)';c.lineWidth=2;c.beginPath();selPts.forEach((p,i)=>{i===0?c.moveTo(p.x,p.y):c.lineTo(p.x,p.y);});c.lineTo(selPts[0].x,selPts[0].y);c.stroke(); } },
        dtsp: { title: '⚡ Dynamic TSP', desc: 'Thành phố mới xuất hiện, đường thay đổi theo thời gian thực. On-demand delivery, xe tự lái. Cần re-optimize liên tục.', draw: (c,w,h) => { const pts=genPts(8,w,h); const newPts=[{x:w*0.3,y:h*0.7},{x:w*0.7,y:h*0.3}]; for(let i=0;i<pts.length;i++){const f=pts[i],t=pts[(i+1)%pts.length];c.strokeStyle='rgba(99,102,241,0.5)';c.lineWidth=2;c.beginPath();c.moveTo(f.x,f.y);c.lineTo(t.x,t.y);c.stroke();} drawVCities(c,pts); newPts.forEach(p=>{c.save();const t=Date.now()/500;c.strokeStyle=`rgba(239,68,68,${0.3+Math.sin(t)*0.3})`;c.lineWidth=2;c.setLineDash([4,4]);c.beginPath();c.arc(p.x,p.y,15,0,Math.PI*2);c.stroke();c.setLineDash([]);c.fillStyle='rgba(239,68,68,0.6)';c.beginPath();c.arc(p.x,p.y,6,0,Math.PI*2);c.fill();c.fillStyle='#ef4444';c.font='600 9px Inter';c.textAlign='center';c.fillText('NEW!',p.x,p.y+22);c.restore();}); } }
    };
    const v = variants[type]; title.textContent = v.title; desc.textContent = v.desc;
    setTimeout(() => { const r = canvas.getBoundingClientRect(); canvas.width = r.width * 2; canvas.height = r.height * 2; ctx.scale(2, 2); v.draw(ctx, r.width, r.height); }, 100);
}
function closeVariantModal() { document.getElementById('variantModal').style.display = 'none'; }
function genPts(n, w, h, pad = 30) { const pts = []; for (let i = 0; i < n; i++) pts.push({ x: pad + Math.random() * (w - pad * 2), y: pad + Math.random() * (h - pad * 2) }); return pts; }
function drawArrow(ctx, from, to, color, width) { const a = Math.atan2(to.y - from.y, to.x - from.x), hl = 10, len = dist(from, to); const r = (len - 10) / len; const ex = from.x + (to.x - from.x) * r, ey = from.y + (to.y - from.y) * r; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - hl * Math.cos(a - 0.35), ey - hl * Math.sin(a - 0.35)); ctx.lineTo(ex - hl * Math.cos(a + 0.35), ey - hl * Math.sin(a + 0.35)); ctx.closePath(); ctx.fill(); }
function drawVCities(ctx, pts) { pts.forEach((p, i) => { const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12); g.addColorStop(0, 'rgba(139,92,246,0.2)'); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill(); const cg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 5); cg.addColorStop(0, '#fff'); cg.addColorStop(1, '#6366f1'); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '600 7px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String.fromCharCode(65 + i), p.x, p.y); }); }

// ============= NAV & SCROLL ANIMATIONS =============
document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => { document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active')); link.classList.add('active'); }));
const sects = document.querySelectorAll('section[id]');
const navObs = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active')); const l = document.querySelector(`.nav-link[href="#${e.target.id}"]`); if (l) l.classList.add('active'); } }); }, { threshold: 0.2 });
sects.forEach(s => navObs.observe(s));

const fadeObs = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; } }); }, { threshold: 0.1 });
document.querySelectorAll('.barrier-card, .variant-card, .stat-card, .app-card, .timeline-item, .research-card').forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(25px)'; el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'; fadeObs.observe(el); });

console.log('🗺️ TSP Explorer v2 loaded! Based on academic report chapters 1-9.');
