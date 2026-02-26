/* ============================================================
   SUBWAY SURFERS — Run on the Railway  (Enhanced Edition)
   Full 3D Endless-Runner Game Engine (Three.js r128)
   ============================================================ */

(() => {
    "use strict";

    // Enable Three.js asset cache for geometry/texture reuse
    if (typeof THREE !== "undefined" && THREE.Cache) THREE.Cache.enabled = true;

    /* ─────────── constants ─────────── */
    const LANE_WIDTH = 2.4;
    const LANES = [-LANE_WIDTH, 0, LANE_WIDTH];
    const RUN_SPEED = 0.38;
    const SPEED_INC = 0.0001;
    const MAX_SPEED = 0.72;
    const JUMP_VEL = 0.26;
    const GRAVITY = -0.011;
    const ROLL_DUR = 28;
    const LANE_SWITCH = 0.14;
    const COIN_SPIN = 0.045;
    const GROUND_Y = 0;
    const CAM_Y = 6.5;
    const CAM_Z = 11.0;
    const CAM_LOOKAT_Y = 2.0;
    const FOG_NEAR = 50;
    const FOG_FAR = 160;
    const CHUNK_LEN = 200;
    const SPAWN_DIST = 110;
    const OBS_GAP_MIN = 12;
    const OBS_GAP_MAX = 26;
    const COIN_GAP = 6;
    const POWERUP_CHANCE = 0.06;
    const MAGNET_DUR = 480;
    const MULTI_DUR = 480;
    const INVULN_DUR = 180;
    const GROUND_W = 28;
    const MILESTONES = [500, 1000, 2500, 5000, 10000, 25000, 50000];
    const MAX_PARTICLES = 48;        // hard cap — prevents particle GC spikes
    const COIN_ANIM_RANGE = 35;      // only animate coins this close to player
    const SHADOW_UPDATE_INTERVAL = 2; // re-render shadow map every N frames
    const SMOOTH_FACTOR = 0.08;       // universal smooth interpolation

    /* ─────────── DOM refs ─────────── */
    const canvas = document.getElementById("gameCanvas");
    const flashOverlay = document.getElementById("flashOverlay");
    const hud = document.getElementById("hud");
    const hudScore = document.getElementById("hudScore");
    const hudCoins = document.getElementById("hudCoins");
    const hudDistance = document.getElementById("hudDistance");
    const hudMultiplier = document.getElementById("hudMultiplier");
    const hudPowerup = document.getElementById("hudPowerup");
    const btnPause = document.getElementById("btnPause");
    const btnMute = document.getElementById("btnMute");
    const startScreen = document.getElementById("startScreen");
    const startHigh = document.getElementById("startHigh");
    const gameOverScreen = document.getElementById("gameOverScreen");
    const pauseScreen = document.getElementById("pauseScreen");
    const btnPlay = document.getElementById("btnPlay");
    const btnRestart = document.getElementById("btnRestart");
    const btnHome = document.getElementById("btnHome");
    const btnResume = document.getElementById("btnResume");
    const finalScore = document.getElementById("finalScore");
    const finalCoins = document.getElementById("finalCoins");
    const finalBest = document.getElementById("finalBest");
    const newBestBadge = document.getElementById("newBestBadge");
    const goldFlash = document.getElementById("goldFlash");
    const milestoneNotif = document.getElementById("milestoneNotif");

    /* ─────────── audio (Web Audio API synth) ─────────── */
    let audioCtx, masterGain;
    let muted = false;

    function initAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.35;
        masterGain.connect(audioCtx.destination);
    }

    function playTone(freq, dur, type = "square", vol = 0.3) {
        if (!audioCtx || muted) return;
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(vol, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        osc.connect(g).connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + dur);
    }

    const sfx = {
        coin() {
            if (!audioCtx || muted) return;
            // 3-note ascending jingle (like original game)
            const notes = [880, 1108, 1760];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioCtx.createOscillator();
                    const g = audioCtx.createGain();
                    osc.type = "sine";
                    osc.frequency.value = freq;
                    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                    osc.connect(g).connect(masterGain);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
                }, i * 48);
            });
        },
        jump() {
            if (!audioCtx || muted) return;
            // Rising whoosh
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(280, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(620, audioCtx.currentTime + 0.22);
            g.gain.setValueAtTime(0.22, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.24);
            osc.connect(g).connect(masterGain);
            osc.start(); osc.stop(audioCtx.currentTime + 0.25);
        },
        roll() {
            if (!audioCtx || muted) return;
            // Sliding swoosh
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.18);
            g.gain.setValueAtTime(0.14, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            osc.connect(g).connect(masterGain);
            osc.start(); osc.stop(audioCtx.currentTime + 0.2);
        },
        lane() {
            if (!audioCtx || muted) return;
            playTone(680, 0.07, "sine", 0.09);
        },
        hit() {
            if (!audioCtx || muted) return;
            // Low boom crash
            const boom = audioCtx.createOscillator();
            const boomG = audioCtx.createGain();
            boom.type = "sawtooth";
            boom.frequency.setValueAtTime(160, audioCtx.currentTime);
            boom.frequency.exponentialRampToValueAtTime(38, audioCtx.currentTime + 0.7);
            boomG.gain.setValueAtTime(0.55, audioCtx.currentTime);
            boomG.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.85);
            boom.connect(boomG).connect(masterGain);
            boom.start(); boom.stop(audioCtx.currentTime + 0.85);
            // Descending whistle
            setTimeout(() => {
                if (!audioCtx || muted) return;
                const w = audioCtx.createOscillator();
                const wG = audioCtx.createGain();
                w.type = "square";
                w.frequency.setValueAtTime(620, audioCtx.currentTime);
                w.frequency.exponentialRampToValueAtTime(90, audioCtx.currentTime + 0.55);
                wG.gain.setValueAtTime(0.28, audioCtx.currentTime);
                wG.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
                w.connect(wG).connect(masterGain);
                w.start(); w.stop(audioCtx.currentTime + 0.6);
            }, 140);
            // Metal crunch noise burst
            setTimeout(() => {
                if (!audioCtx || muted) return;
                const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.18, audioCtx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
                const src = audioCtx.createBufferSource();
                src.buffer = buf;
                const filt = audioCtx.createBiquadFilter();
                filt.type = "bandpass";
                filt.frequency.value = 800;
                filt.Q.value = 0.5;
                const ng = audioCtx.createGain();
                ng.gain.value = 0.18;
                src.connect(filt).connect(ng).connect(masterGain);
                src.start();
            }, 60);
        },
        powerup() {
            if (!audioCtx || muted) return;
            // Ascending arpeggio
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioCtx.createOscillator();
                    const g = audioCtx.createGain();
                    osc.type = "sine";
                    osc.frequency.value = freq;
                    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
                    osc.connect(g).connect(masterGain);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.22);
                }, i * 68);
            });
        },
        milestone() {
            if (!audioCtx || muted) return;
            // Win fanfare — ascending chord burst
            const chord = [523, 659, 784, 1047, 1319];
            chord.forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioCtx.createOscillator();
                    const g = audioCtx.createGain();
                    osc.type = "triangle";
                    osc.frequency.value = freq;
                    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
                    osc.connect(g).connect(masterGain);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.45);
                }, i * 58);
            });
            // Final high shimmer
            setTimeout(() => {
                if (!audioCtx || muted) return;
                playTone(2093, 0.5, "sine", 0.12);
            }, chord.length * 58 + 20);
        },
    };

    /* ─────────── background music (Web Audio looping beat) ─────────── */
    let bgmActive = false;
    let bgmLoopId = null;

    function startBGM() {
        if (bgmActive || !audioCtx || muted) return;
        bgmActive = true;
        scheduleBGMLoop();
    }

    function stopBGM() {
        bgmActive = false;
        if (bgmLoopId) { clearTimeout(bgmLoopId); bgmLoopId = null; }
    }

    function scheduleBGMLoop() {
        if (!bgmActive || !audioCtx || muted) return;
        const bpm = 138;
        const step = 60 / bpm * 0.5; // 8th notes
        const now = audioCtx.currentTime;

        // Bass ostinato (low-end drive)
        const bass = [41.2, 41.2, 55, 41.2, 36.7, 41.2, 61.7, 41.2];
        bass.forEach((freq, i) => {
            const t = now + i * step;
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = "sawtooth";
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0.042, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + step * 0.85);
            osc.connect(g).connect(masterGain);
            osc.start(t); osc.stop(t + step);
        });

        // Kick drum on beats 1 & 3
        [0, 2, 4, 6].forEach(beat => {
            const t = now + beat * step;
            const kick = audioCtx.createOscillator();
            const kG = audioCtx.createGain();
            kick.type = "sine";
            kick.frequency.setValueAtTime(160, t);
            kick.frequency.exponentialRampToValueAtTime(28, t + 0.22);
            kG.gain.setValueAtTime(0.09, t);
            kG.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
            kick.connect(kG).connect(masterGain);
            kick.start(t); kick.stop(t + 0.28);
        });

        // Hi-hat (every other 8th)
        [1, 3, 5, 7].forEach(beat => {
            if (!audioCtx) return;
            const t = now + beat * step;
            const buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.04), audioCtx.sampleRate);
            const d = buf.getChannelData(0);
            for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / d.length);
            const src = audioCtx.createBufferSource();
            src.buffer = buf;
            const hf = audioCtx.createBiquadFilter();
            hf.type = "highpass"; hf.frequency.value = 7000;
            const hg = audioCtx.createGain(); hg.gain.value = 0.025;
            src.connect(hf).connect(hg).connect(masterGain);
            src.start(t);
        });

        // Melodic hook (every 2 loops)
        const loopDur = bass.length * step;
        bgmLoopId = setTimeout(scheduleBGMLoop, (loopDur - 0.05) * 1000);
    }

    /* ─────────── Texture generators ─────────── */
    function makeGravelTexture() {
        const c = document.createElement("canvas");
        c.width = 256; c.height = 256;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#3a3a4a";
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1200; i++) {
            const shade = 40 + Math.random() * 35;
            ctx.fillStyle = `rgb(${shade},${shade},${shade + 8})`;
            const s = 1 + Math.random() * 3;
            ctx.fillRect(Math.random() * 256, Math.random() * 256, s, s);
        }
        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(12, 100);
        return tex;
    }

    function makeGroundTexture() {
        const c = document.createElement("canvas");
        c.width = 512; c.height = 512;
        const ctx = c.getContext("2d");
        // Base dark asphalt
        ctx.fillStyle = "#2a2a38";
        ctx.fillRect(0, 0, 512, 512);
        // Noise
        for (let i = 0; i < 3000; i++) {
            const shade = 30 + Math.random() * 25;
            ctx.fillStyle = `rgb(${shade},${shade},${shade + 5})`;
            const s = 1 + Math.random() * 2;
            ctx.fillRect(Math.random() * 512, Math.random() * 512, s, s);
        }
        // Occasional cracks
        ctx.strokeStyle = "rgba(20,20,30,0.4)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            let x = Math.random() * 512, y = Math.random() * 512;
            ctx.moveTo(x, y);
            for (let j = 0; j < 5; j++) {
                x += (Math.random() - 0.5) * 60;
                y += (Math.random() - 0.5) * 60;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(6, 50);
        return tex;
    }

    function makeTrainSideTexture(bodyColor, isAlt) {
        const c = document.createElement("canvas");
        c.width = 512; c.height = 256;
        const ctx = c.getContext("2d");
        // Body color
        ctx.fillStyle = isAlt ? "#2a55aa" : "#bb2222";
        ctx.fillRect(0, 0, 512, 256);
        // Metallic stripe at bottom
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(0, 200, 512, 56);
        // Horizontal accent stripe
        ctx.fillStyle = isAlt ? "#ffcc00" : "#ffffff";
        ctx.fillRect(0, 80, 512, 6);
        ctx.fillRect(0, 170, 512, 4);
        // Graffiti-like splashes
        for (let i = 0; i < 3; i++) {
            const cols = ["#ff6644", "#44ccff", "#ffee33", "#ff44aa", "#44ff88"];
            ctx.fillStyle = cols[Math.floor(Math.random() * cols.length)];
            ctx.globalAlpha = 0.12 + Math.random() * 0.15;
            ctx.beginPath();
            const gx = 40 + Math.random() * 400;
            const gy = 90 + Math.random() * 80;
            ctx.ellipse(gx, gy, 30 + Math.random() * 50, 15 + Math.random() * 25, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Rivet dots along top
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        for (let x = 10; x < 512; x += 24) {
            ctx.beginPath();
            ctx.arc(x, 8, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        const tex = new THREE.CanvasTexture(c);
        return tex;
    }

    /* Pre-bake a pool of building textures once, reuse them — avoids expensive
       canvas generation for each of the many buildings in the scene.           */
    let _buildTexPool = null;
    function getBuildTexPool() {
        if (_buildTexPool) return _buildTexPool;
        _buildTexPool = [];
        const poolColors = ["#3a5070", "#bb5533", "#554488", "#667788", "#446688", "#885544", "#4a6655", "#708090"];
        const poolFloors = [4, 6, 5, 7, 4, 6, 5, 7];
        const poolCols = [2, 3, 3, 3, 2, 3, 2, 3];
        for (let k = 0; k < poolColors.length; k++) {
            _buildTexPool.push(makeBuildingTexture(poolColors[k], poolFloors[k], poolCols[k]));
        }
        return _buildTexPool;
    }

    function makeBuildingTexture(color, floors, cols) {
        const c = document.createElement("canvas");
        c.width = 256; c.height = 512;
        const ctx = c.getContext("2d");

        // Base wall with vertical gradient (lighter at top, darker at base)
        const baseGrad = ctx.createLinearGradient(0, 0, 0, 512);
        baseGrad.addColorStop(0, color);
        baseGrad.addColorStop(0.85, color);
        baseGrad.addColorStop(1, "#1a1a2a");
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, 256, 512);

        // Subtle brick / panel pattern
        ctx.strokeStyle = "rgba(0,0,0,0.07)";
        ctx.lineWidth = 0.5;
        for (let y = 0; y < 512; y += 12) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
            const off = (Math.floor(y / 12) % 2) * 12;
            for (let x = off; x < 256; x += 24) {
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 12); ctx.stroke();
            }
        }

        // Floor separation ledges
        const floorH = Math.floor(440 / Math.max(floors, 1));
        for (let f = 0; f < floors; f++) {
            const fy = 18 + f * floorH;
            // Dark line (shadow under ledge)
            ctx.fillStyle = "rgba(0,0,0,0.14)";
            ctx.fillRect(0, fy + floorH - 4, 256, 4);
            // Light line (top of ledge — highlights)
            ctx.fillStyle = "rgba(255,255,255,0.07)";
            ctx.fillRect(0, fy + floorH - 5, 256, 1);
        }

        // Windows with frames and depth
        const ww = 18, wh = 24, gap = 6;
        const totalW = cols * (ww + gap);
        const startX = (256 - totalW) / 2 + gap / 2;
        for (let r = 0; r < floors; r++) {
            const fy = 24 + r * floorH;
            for (let cc = 0; cc < cols; cc++) {
                const wx = startX + cc * (ww + gap);

                // Window frame (light trim)
                ctx.fillStyle = "rgba(255,255,255,0.13)";
                ctx.fillRect(wx - 2, fy - 2, ww + 4, wh + 4);

                // Window sill (small ledge at bottom)
                ctx.fillStyle = "rgba(180,180,180,0.2)";
                ctx.fillRect(wx - 3, fy + wh, ww + 6, 3);

                const lit = Math.random() > 0.28;
                if (lit) {
                    // Warm lit window with gradient
                    const wGrad = ctx.createLinearGradient(wx, fy, wx, fy + wh);
                    wGrad.addColorStop(0, "#ffeeaa");
                    wGrad.addColorStop(0.6, "#ffdd66");
                    wGrad.addColorStop(1, "#eebb33");
                    ctx.fillStyle = wGrad;
                    ctx.fillRect(wx, fy, ww, wh);
                    // Warm glow halo
                    ctx.fillStyle = "rgba(255,230,140,0.18)";
                    ctx.fillRect(wx - 4, fy - 4, ww + 8, wh + 8);
                    // Window cross divider
                    ctx.fillStyle = "rgba(0,0,0,0.14)";
                    ctx.fillRect(wx + ww / 2 - 0.5, fy, 1, wh);
                    ctx.fillRect(wx, fy + wh / 2 - 0.5, ww, 1);
                } else {
                    // Dark window
                    ctx.fillStyle = "#1a2236";
                    ctx.fillRect(wx, fy, ww, wh);
                    // Faint reflection
                    ctx.fillStyle = "rgba(80,100,130,0.15)";
                    ctx.fillRect(wx + 2, fy + 2, ww * 0.38, wh * 0.45);
                }
            }
        }

        // Ground floor (storefront / darker base)
        const gfY = 512 - 55;
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.fillRect(0, gfY, 256, 55);
        if (Math.random() < 0.65) {
            // Shop window
            ctx.fillStyle = "rgba(255,240,180,0.3)";
            ctx.fillRect(55, gfY + 10, 146, 36);
            // Door
            ctx.fillStyle = "rgba(60,45,30,0.7)";
            ctx.fillRect(112, gfY + 12, 32, 34);
            // Door knob
            ctx.fillStyle = "rgba(200,180,100,0.5)";
            ctx.fillRect(138, gfY + 28, 3, 3);
        }

        // Roof cornice (decorative top edge)
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(0, 0, 256, 6);
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(0, 6, 256, 2);

        const tex = new THREE.CanvasTexture(c);
        return tex;
    }

    /* ─────────── Three.js setup ─────────── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0820);
    scene.fog = new THREE.FogExp2(0x0d0820, 0.006);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 200);
    camera.position.set(0, CAM_Y, CAM_Z);
    camera.lookAt(0, CAM_LOOKAT_Y, -10);

    /* ─── lighting (cinematic quality) ─── */
    const ambLight = new THREE.AmbientLight(0x8899cc, 0.85);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xfff0dd, 1.6);
    dirLight.position.set(8, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -28;
    dirLight.shadow.camera.right = 28;
    dirLight.shadow.camera.top = 28;
    dirLight.shadow.camera.bottom = -28;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);
    scene.add(dirLight.target);

    const hemiLight = new THREE.HemisphereLight(0x9988dd, 0x336644, 0.8);
    scene.add(hemiLight);

    // Rim light (backlight for depth separation)
    const rimLight = new THREE.DirectionalLight(0x8866dd, 0.55);
    rimLight.position.set(-6, 10, -18);
    scene.add(rimLight);

    // Fill light from front-right for better obstacle visibility
    const fillLight = new THREE.DirectionalLight(0xaabbff, 0.35);
    fillLight.position.set(5, 6, -10);
    scene.add(fillLight);

    // Warm point light following player
    const playerLight = new THREE.PointLight(0xffa040, 0.9, 25);
    playerLight.position.set(0, 4, 0);
    scene.add(playerLight);

    /* ─────────── materials (cached — enhanced) ─────────── */
    const gravelTex = makeGravelTexture();
    const groundTex = makeGroundTexture();

    const mat = {
        ground: new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.92, metalness: 0.05 }),
        gravel: new THREE.MeshStandardMaterial({ map: gravelTex, roughness: 0.95, color: 0x555566 }),
        rail: new THREE.MeshStandardMaterial({ color: 0xaaaabb, metalness: 0.85, roughness: 0.15 }),
        railSide: new THREE.MeshStandardMaterial({ color: 0x777788, metalness: 0.7, roughness: 0.25 }),
        track: new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.92 }),
        sleeper: new THREE.MeshStandardMaterial({ color: 0x5a4a38, roughness: 0.85 }),
        sleeperDark: new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.9 }),
        player: new THREE.MeshStandardMaterial({ color: 0x0088ff, roughness: 0.35, metalness: 0.1 }),
        playerHoodie: new THREE.MeshStandardMaterial({ color: 0x0088ff, roughness: 0.45, metalness: 0.05, emissive: 0x001133, emissiveIntensity: 0.1 }),
        playerHead: new THREE.MeshStandardMaterial({ color: 0xffd5b8, roughness: 0.55, metalness: 0.02 }),
        playerHair: new THREE.MeshStandardMaterial({ color: 0x221100, roughness: 0.9 }),
        playerShoe: new THREE.MeshStandardMaterial({ color: 0xff2244, roughness: 0.4, metalness: 0.15, emissive: 0x220000, emissiveIntensity: 0.1 }),
        playerSole: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.6 }),
        playerPant: new THREE.MeshStandardMaterial({ color: 0x222266, roughness: 0.55 }),
        playerBP: new THREE.MeshStandardMaterial({ color: 0xff6622, roughness: 0.45, metalness: 0.05, emissive: 0x220800, emissiveIntensity: 0.1 }),
        playerCap: new THREE.MeshStandardMaterial({ color: 0xff2244, roughness: 0.4, metalness: 0.05, emissive: 0x220000, emissiveIntensity: 0.1 }),
        playerCapBrim: new THREE.MeshStandardMaterial({ color: 0xdd1133, roughness: 0.45 }),
        train: new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.35, metalness: 0.4 }),
        trainAlt: new THREE.MeshStandardMaterial({ color: 0x2255bb, roughness: 0.35, metalness: 0.4 }),
        trainRoof: new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.4, metalness: 0.5 }),
        trainBottom: new THREE.MeshStandardMaterial({ color: 0x333340, roughness: 0.7, metalness: 0.3 }),
        trainWheel: new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.3, metalness: 0.8 }),
        trainWindow: new THREE.MeshStandardMaterial({ color: 0xaaddff, emissive: 0x88bbee, emissiveIntensity: 0.25, roughness: 0.1, metalness: 0.3 }),
        trainDoor: new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.5 }),
        trainStripe: new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.3, metalness: 0.2 }),
        headlight: new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffcc, emissiveIntensity: 1.0 }),
        barrier: new THREE.MeshStandardMaterial({ color: 0xffaa22, roughness: 0.4, metalness: 0.1 }),
        barrierStripe: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 }),
        barrierWarn: new THREE.MeshStandardMaterial({ color: 0xff4422, emissive: 0xff2200, emissiveIntensity: 0.2, roughness: 0.4 }),
        coin: new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.92, roughness: 0.08, emissive: 0xffaa00, emissiveIntensity: 0.35 }),
        coinEdge: new THREE.MeshStandardMaterial({ color: 0xeebb00, metalness: 0.95, roughness: 0.12 }),
        powerGreen: new THREE.MeshStandardMaterial({ color: 0x33ff88, emissive: 0x22cc66, emissiveIntensity: 0.5, roughness: 0.25 }),
        powerPurple: new THREE.MeshStandardMaterial({ color: 0xaa44ff, emissive: 0x8833cc, emissiveIntensity: 0.5, roughness: 0.25 }),
        building: new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.88 }),
        buildAlt: new THREE.MeshStandardMaterial({ color: 0x443355, roughness: 0.88 }),
        buildBrick: new THREE.MeshStandardMaterial({ color: 0x884433, roughness: 0.9 }),
        buildConcrete: new THREE.MeshStandardMaterial({ color: 0x666677, roughness: 0.92 }),
        window: new THREE.MeshStandardMaterial({ color: 0xffeeaa, emissive: 0xffdd88, emissiveIntensity: 0.35 }),
        windowDark: new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.8 }),
        rooftop: new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.85 }),
        antenna: new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 }),
        neonRed: new THREE.MeshStandardMaterial({ color: 0xff3344, emissive: 0xff2233, emissiveIntensity: 0.8 }),
        neonBlue: new THREE.MeshStandardMaterial({ color: 0x33aaff, emissive: 0x2299ee, emissiveIntensity: 0.8 }),
        neonGreen: new THREE.MeshStandardMaterial({ color: 0x44ff66, emissive: 0x33ee55, emissiveIntensity: 0.8 }),
        fence: new THREE.MeshStandardMaterial({ color: 0x666677, metalness: 0.6, roughness: 0.35 }),
        lampPost: new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.5, roughness: 0.3 }),
        lampGlow: new THREE.MeshStandardMaterial({ color: 0xffeecc, emissive: 0xffddaa, emissiveIntensity: 1.0 }),
        signal: new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.4, roughness: 0.4 }),
        signalRed: new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.7 }),
        signalGreen: new THREE.MeshStandardMaterial({ color: 0x22ff44, emissive: 0x00ff22, emissiveIntensity: 0.7 }),
        platform: new THREE.MeshStandardMaterial({ color: 0x555560, roughness: 0.85 }),
        platformEdge: new THREE.MeshStandardMaterial({ color: 0xffee44, roughness: 0.5 }),
        wire: new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.5, roughness: 0.4 }),
    };

    /* ─────────── geometry (cached — higher quality) ─────────── */
    const geo = {
        box: new THREE.BoxGeometry(1, 1, 1),
        coin: new THREE.CylinderGeometry(0.48, 0.48, 0.1, 32),
        coinInner: new THREE.CylinderGeometry(0.38, 0.38, 0.11, 32),
        sphere: new THREE.SphereGeometry(0.4, 20, 20),
        powerup: new THREE.OctahedronGeometry(0.55, 2),
        wheel: new THREE.CylinderGeometry(0.3, 0.3, 0.12, 16),
        capsule: new THREE.CylinderGeometry(0.18, 0.18, 0.5, 12),
        headSphere: new THREE.SphereGeometry(0.38, 16, 14),
    };

    /* ─────────── helpers ─────────── */
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function rndInt(a, b) { return Math.floor(rnd(a, b + 1)); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    /* ─────────── particle system (polished dust/sparks) ─────────── */
    const particles = [];
    const particleGeo = new THREE.SphereGeometry(0.035, 6, 6);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xccbb99, transparent: true, opacity: 0.5 });
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.75 });

    function spawnDust(pos, count = 3) {
        if (particles.length >= MAX_PARTICLES) return;
        const allowed = Math.min(count, MAX_PARTICLES - particles.length);
        for (let i = 0; i < allowed; i++) {
            const mesh = new THREE.Mesh(particleGeo, particleMat.clone());
            mesh.position.set(
                pos.x + rnd(-0.25, 0.25),
                pos.y + rnd(0, 0.15),
                pos.z + rnd(0.2, 0.7)
            );
            mesh.scale.setScalar(rnd(0.4, 1.2));
            scene.add(mesh);
            particles.push({
                mesh,
                vx: rnd(-0.015, 0.015),
                vy: rnd(0.015, 0.035),
                vz: rnd(0.02, 0.05),
                life: rndInt(18, 35),
                maxLife: 35,
            });
        }
    }

    function spawnSparks(pos, count = 5) {
        if (particles.length >= MAX_PARTICLES) return;
        const allowed = Math.min(count, MAX_PARTICLES - particles.length);
        for (let i = 0; i < allowed; i++) {
            const mesh = new THREE.Mesh(particleGeo, sparkMat.clone());
            mesh.position.set(pos.x + rnd(-0.4, 0.4), pos.y + rnd(0.3, 1.2), pos.z + rnd(-0.2, 0.2));
            mesh.scale.setScalar(rnd(0.2, 0.7));
            scene.add(mesh);
            particles.push({
                mesh,
                vx: rnd(-0.04, 0.04),
                vy: rnd(0.04, 0.09),
                vz: rnd(-0.025, 0.025),
                life: rndInt(12, 24),
                maxLife: 24,
            });
        }
    }

    function updateParticles(dtScale) {
        const d = dtScale || 1;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.mesh.position.x += p.vx * d;
            p.mesh.position.y += p.vy * d;
            p.mesh.position.z += p.vz * d;
            p.vy -= 0.0008 * d;
            p.life -= d;
            const lifeRatio = Math.max(0, p.life / p.maxLife);
            p.mesh.material.opacity = lifeRatio * lifeRatio * 0.6;
            p.mesh.scale.setScalar(p.mesh.scale.x * Math.pow(0.97, d));
            if (p.life <= 0) {
                scene.remove(p.mesh);
                p.mesh.material.dispose();
                particles.splice(i, 1);
            }
        }
    }

    /* ─────────── build ground + track chunks (enhanced) ─────────── */
    const groundChunks = [];

    function makeGroundChunk(zPos) {
        const group = new THREE.Group();

        // Main ground surface with texture
        const g = new THREE.Mesh(
            new THREE.PlaneGeometry(GROUND_W, CHUNK_LEN, 1, 1),
            mat.ground
        );
        g.rotation.x = -Math.PI / 2;
        g.position.set(0, -0.02, 0);
        g.receiveShadow = true;
        group.add(g);

        // Gravel bed under tracks
        const gravel = new THREE.Mesh(
            new THREE.BoxGeometry(LANE_WIDTH * 3 + 3, 0.08, CHUNK_LEN),
            mat.gravel
        );
        gravel.position.set(0, 0.02, 0);
        gravel.receiveShadow = true;
        group.add(gravel);

        // Platform edges on both sides
        for (const sx of [-1, 1]) {
            const platEdge = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.35, CHUNK_LEN),
                mat.platformEdge
            );
            platEdge.position.set(sx * (LANE_WIDTH * 1.5 + 1.6), 0.17, 0);
            platEdge.receiveShadow = true;
            group.add(platEdge);

            const platBody = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, 0.3, CHUNK_LEN),
                mat.platform
            );
            platBody.position.set(sx * (LANE_WIDTH * 1.5 + 2.85), 0.15, 0);
            platBody.receiveShadow = true;
            group.add(platBody);
        }

        // Rail tracks — 3 lanes (detailed)
        for (let li = 0; li < 3; li++) {
            const lx = LANES[li];

            // Two rails per lane (realistic profile)
            for (const rx of [-0.55, 0.55]) {
                // Rail head (top)
                const railHead = new THREE.Mesh(
                    new THREE.BoxGeometry(0.07, 0.04, CHUNK_LEN),
                    mat.rail
                );
                railHead.position.set(lx + rx, 0.1, 0);
                group.add(railHead);

                // Rail web (middle)
                const railWeb = new THREE.Mesh(
                    new THREE.BoxGeometry(0.03, 0.06, CHUNK_LEN),
                    mat.railSide
                );
                railWeb.position.set(lx + rx, 0.07, 0);
                group.add(railWeb);

                // Rail base (foot)
                const railBase = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 0.02, CHUNK_LEN),
                    mat.railSide
                );
                railBase.position.set(lx + rx, 0.05, 0);
                group.add(railBase);
            }

            // Sleepers (wooden ties — alternating shades, coarser spacing for perf)
            for (let s = -CHUNK_LEN / 2; s < CHUNK_LEN / 2; s += 3.5) {
                const slMat = Math.random() < 0.3 ? mat.sleeperDark : mat.sleeper;
                const sl = new THREE.Mesh(
                    new THREE.BoxGeometry(1.7, 0.07, 0.22),
                    slMat
                );
                sl.position.set(lx, 0.035, s);
                sl.receiveShadow = true;
                group.add(sl);
            }
        }

        // Overhead wire catenary poles every 30 units
        for (let pz = -CHUNK_LEN / 2; pz < CHUNK_LEN / 2; pz += 30) {
            for (const sx of [-1, 1]) {
                // Pole
                const pole = new THREE.Mesh(
                    new THREE.BoxGeometry(0.12, 7, 0.12),
                    mat.lampPost
                );
                pole.position.set(sx * (LANE_WIDTH * 1.5 + 1.2), 3.5, pz);
                pole.castShadow = true;
                group.add(pole);

                // Cross arm
                const arm = new THREE.Mesh(
                    new THREE.BoxGeometry(sx * -2.5, 0.06, 0.06),
                    mat.wire
                );
                arm.position.set(sx * (LANE_WIDTH * 1.5 + 0), 6.8, pz);
                group.add(arm);
            }

            // Overhead wires across all lanes
            const wire = new THREE.Mesh(
                new THREE.BoxGeometry(LANE_WIDTH * 3 + 2.5, 0.02, 0.02),
                mat.wire
            );
            wire.position.set(0, 6.8, pz);
            group.add(wire);
        }

        group.position.z = zPos;
        scene.add(group);
        groundChunks.push({ group, z: zPos });
        return group;
    }

    /* ─────────── scenery objects ─────────── */
    const sceneryObjs = [];

    function spawnLampPost(z, side) {
        const g = new THREE.Group();
        // Pole
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.5, 8), mat.lampPost);
        pole.position.y = 2.25;
        pole.castShadow = true;
        g.add(pole);
        // Arm
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.2), mat.lampPost);
        arm.position.set(side * -0.5, 4.4, 0);
        arm.rotation.z = side * 0.3;
        g.add(arm);
        // Lamp head (emissive glow mesh — no PointLight to keep draw calls low)
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), mat.lampGlow);
        lamp.position.set(side * -0.9, 4.3, 0);
        g.add(lamp);

        g.position.set(side * (GROUND_W / 2 - 2.5), 0, z);
        scene.add(g);
        sceneryObjs.push({ mesh: g, z });
    }

    function spawnSignalLight(z) {
        const g = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 0.1), mat.signal);
        pole.position.y = 2;
        g.add(pole);
        // Signal box
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.2), mat.signal);
        box.position.y = 3.8;
        g.add(box);
        // Lights
        const isRed = Math.random() < 0.5;
        const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), isRed ? mat.signalRed : mat.signal);
        redLight.position.set(0, 4.0, 0.11);
        g.add(redLight);
        const greenLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), !isRed ? mat.signalGreen : mat.signal);
        greenLight.position.set(0, 3.7, 0.11);
        g.add(greenLight);

        const side = Math.random() < 0.5 ? -1 : 1;
        g.position.set(side * (LANE_WIDTH * 1.5 + 0.8), 0, z);
        scene.add(g);
        sceneryObjs.push({ mesh: g, z });
    }

    function spawnFenceSegment(z, side) {
        const g = new THREE.Group();
        const len = 8;
        // Posts
        for (let i = 0; i <= 2; i++) {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 0.08), mat.fence);
            post.position.set(0, 0.8, -len / 2 + i * (len / 2));
            post.castShadow = true;
            g.add(post);
        }
        // Horizontal bars
        for (const y of [0.4, 0.9, 1.4]) {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, len), mat.fence);
            bar.position.y = y;
            g.add(bar);
        }
        g.position.set(side * (GROUND_W / 2 - 1), 0, z);
        scene.add(g);
        sceneryObjs.push({ mesh: g, z });
    }

    let nextSceneryZ = -15;

    function spawnScenery() {
        const ahead = player ? player.position.z - SPAWN_DIST - 20 : -200;
        while (nextSceneryZ > ahead) {
            const r = Math.random();
            if (r < 0.25) {
                spawnLampPost(nextSceneryZ, Math.random() < 0.5 ? -1 : 1);
            } else if (r < 0.4) {
                spawnSignalLight(nextSceneryZ);
            } else if (r < 0.65) {
                spawnFenceSegment(nextSceneryZ, Math.random() < 0.5 ? -1 : 1);
            }
            nextSceneryZ -= rnd(10, 22);
        }
    }

    /* ─────────── buildings (enhanced scenery) ─────────── */
    const buildings = [];
    const buildColors = ["#3a5070", "#554488", "#bb5533", "#667788", "#446688", "#885544", "#4a6655", "#886644", "#5a4a6a", "#708090"];

    function spawnBuilding(z) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const w = rnd(4, 10);
        const h = rnd(10, 32);
        const d = rnd(5, 12);
        const floors = Math.max(2, Math.floor(h / 3));
        const cols = Math.max(2, Math.floor(w / 2));
        const bColor = pick(buildColors);

        // Pick from pre-baked pool
        const pool = getBuildTexPool();
        const buildTex = pool[Math.floor(Math.random() * pool.length)];
        const buildMat = new THREE.MeshStandardMaterial({ map: buildTex, roughness: 0.82, metalness: 0.05 });

        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildMat);
        mesh.position.set(side * (GROUND_W / 2 - w / 2 + rnd(0, 4)), h / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        // Rooftop group
        const roofGroup = new THREE.Group();

        // Flat roof slab (slightly wider for overhang)
        const roofSlab = new THREE.Mesh(
            new THREE.BoxGeometry(w + 0.3, 0.15, d + 0.3),
            new THREE.MeshStandardMaterial({ color: 0x444450, roughness: 0.9 })
        );
        roofSlab.position.set(0, h / 2 + 0.07, 0);
        roofGroup.add(roofSlab);

        // Building ledge / cornice at top
        const corniceMat = new THREE.MeshStandardMaterial({ color: 0x667777, roughness: 0.7 });
        const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.2, d + 0.5), corniceMat);
        cornice.position.set(0, h / 2 - 0.1, 0);
        roofGroup.add(cornice);

        // AC units / vents (multiple)
        const acCount = Math.random() < 0.6 ? rndInt(1, 3) : 0;
        for (let i = 0; i < acCount; i++) {
            const ac = new THREE.Mesh(
                new THREE.BoxGeometry(rnd(0.5, 1.4), rnd(0.35, 0.65), rnd(0.5, 1.0)),
                mat.rooftop
            );
            ac.position.set(rnd(-w / 3, w / 3), h / 2 + 0.35, rnd(-d / 3, d / 3));
            ac.castShadow = true;
            roofGroup.add(ac);
        }

        // Water tank
        if (Math.random() < 0.3 && h > 14) {
            const tankGroup = new THREE.Group();
            // Tank legs
            for (const tx of [-0.3, 0.3]) {
                for (const tz of [-0.3, 0.3]) {
                    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), mat.antenna);
                    leg.position.set(tx, h / 2 + 0.6, tz);
                    tankGroup.add(leg);
                }
            }
            // Tank body (wooden barrel style)
            const tankMat = new THREE.MeshStandardMaterial({ color: 0x6a5540, roughness: 0.85 });
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 1.2, 10), tankMat);
            tank.position.set(rnd(-w / 4, w / 4), h / 2 + 1.2, rnd(-d / 4, d / 4));
            tank.castShadow = true;
            tankGroup.add(tank);
            // Tank lid
            const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.05, 10), mat.rooftop);
            lid.position.set(tank.position.x, h / 2 + 1.82, tank.position.z);
            tankGroup.add(lid);
            roofGroup.add(tankGroup);
        }

        // Antenna / satellite dish
        if (Math.random() < 0.4) {
            const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, rnd(2.0, 4.5), 4), mat.antenna);
            ant.position.set(rnd(-w / 3, w / 3), h / 2 + 1.8, rnd(-d / 3, d / 3));
            roofGroup.add(ant);
            // Blinking red light on top
            const blink = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 6, 6),
                new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 })
            );
            blink.position.set(ant.position.x, h / 2 + 3.5, ant.position.z);
            roofGroup.add(blink);
        }

        // Chimney
        if (Math.random() < 0.25) {
            const chimney = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 1.6, 0.5),
                new THREE.MeshStandardMaterial({ color: 0x884433, roughness: 0.85 })
            );
            chimney.position.set(rnd(-w / 3, w / 3), h / 2 + 0.8, rnd(-d / 4, d / 4));
            chimney.castShadow = true;
            roofGroup.add(chimney);
        }

        // Neon sign on building face
        if (Math.random() < 0.4) {
            const neonMat = pick([mat.neonRed, mat.neonBlue, mat.neonGreen]);
            const neon = new THREE.Mesh(new THREE.BoxGeometry(rnd(1.2, 3.0), rnd(0.35, 0.7), 0.06), neonMat);
            const ny = rnd(h * 0.3, h * 0.7);
            neon.position.set(0, ny - h / 2, side > 0 ? -d / 2 - 0.04 : d / 2 + 0.04);
            if (side < 0) neon.rotation.y = Math.PI;
            mesh.add(neon);

            const neonLight = new THREE.PointLight(neonMat.emissive.getHex(), 0.35, 7);
            neonLight.position.copy(neon.position);
            mesh.add(neonLight);
        }

        // Fire escape (metal ladder on side — adds realism)
        if (Math.random() < 0.3 && floors > 3) {
            const feMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.5, roughness: 0.4 });
            const feSide = side > 0 ? -d / 2 - 0.08 : d / 2 + 0.08;
            for (let f = 0; f < Math.min(floors, 5); f++) {
                const feY = 1.5 + f * 3;
                // Platform
                const fePlat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.7), feMat);
                fePlat.position.set(rnd(-w / 4, w / 4), feY - h / 2, feSide);
                mesh.add(fePlat);
                // Railing
                const feRail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.03), feMat);
                feRail.position.set(fePlat.position.x, feY + 0.3 - h / 2, feSide + (side > 0 ? -0.35 : 0.35));
                mesh.add(feRail);
            }
        }

        // Awning over ground floor (colorful like Subway Surfers)
        if (Math.random() < 0.45) {
            const awningColors = [0xcc3333, 0x3366cc, 0x33aa44, 0xcc8833, 0x9933aa];
            const awMat = new THREE.MeshStandardMaterial({
                color: pick(awningColors), roughness: 0.5, side: THREE.DoubleSide
            });
            const aw = new THREE.Mesh(new THREE.BoxGeometry(rnd(2, w * 0.8), 0.04, 1.2), awMat);
            aw.position.set(0, 2.0 - h / 2, side > 0 ? -d / 2 - 0.6 : d / 2 + 0.6);
            aw.rotation.z = side * 0.05;
            mesh.add(aw);
        }

        mesh.add(roofGroup);
        buildings.push({ mesh, z });
    }

    /* ─────────── player character (Subway Surfers style — cartoon proportioned) ─────────── */
    let player, playerParts;

    function createPlayer() {
        player = new THREE.Group();

        // --- Torso (bright hoodie — wider, more visible 3D look) ---
        const torsoGeo = new THREE.BoxGeometry(0.92, 0.88, 0.54, 3, 3, 3);
        const tVerts = torsoGeo.attributes.position;
        for (let i = 0; i < tVerts.count; i++) {
            const x = tVerts.getX(i), y = tVerts.getY(i), z = tVerts.getZ(i);
            const len = Math.sqrt(x * x + y * y + z * z);
            const s = 1 + 0.06 / (len + 0.4);
            tVerts.setXYZ(i, x * s, y * s, z * s);
        }
        torsoGeo.computeVertexNormals();
        const torso = new THREE.Mesh(torsoGeo, mat.playerHoodie);
        torso.position.y = 1.24;
        torso.castShadow = true;
        player.add(torso);

        // Hoodie pocket (kangaroo style)
        const pocketMat = new THREE.MeshStandardMaterial({ color: 0x0077dd, roughness: 0.5 });
        const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.02), pocketMat);
        pocket.position.set(0, 1.02, -0.24);
        player.add(pocket);

        // Hoodie collar / neckline
        const collarMat = new THREE.MeshStandardMaterial({ color: 0x005599, roughness: 0.5 });
        const collar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.3), collarMat);
        collar.position.set(0, 1.62, 0);
        player.add(collar);

        // Hoodie drawstrings
        const stringMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.6 });
        for (const sx of [-0.06, 0.06]) {
            const str = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 4), stringMat);
            str.position.set(sx, 1.54, -0.22);
            player.add(str);
        }

        // --- Head (BIG sphere — cartoon proportioned, larger) ---
        const headGeo = new THREE.SphereGeometry(0.46, 20, 16);
        const head = new THREE.Mesh(headGeo, mat.playerHead);
        head.position.y = 2.12;
        head.castShadow = true;
        player.add(head);

        // Hair (dark brown, styled spiky top)
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x221100, roughness: 0.88 });
        const hairTop = new THREE.Mesh(
            new THREE.SphereGeometry(0.36, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45),
            hairMat
        );
        hairTop.position.set(0, 2.2, 0.02);
        player.add(hairTop);

        // Hair side tufts
        for (const sx of [-0.2, 0.2]) {
            const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), hairMat);
            tuft.position.set(sx, 2.28, -0.06);
            player.add(tuft);
        }

        // Cap (backwards — iconic Subway Surfers style!)
        const capGeo = new THREE.SphereGeometry(0.36, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.35);
        const cap = new THREE.Mesh(capGeo, mat.playerCap);
        cap.position.set(0, 2.18, 0.02);
        cap.rotation.x = -0.1;
        cap.castShadow = true;
        player.add(cap);

        // Cap brim (pointing BACKWARDS — Subway Surfers signature)
        const brimGeo = new THREE.CylinderGeometry(0.2, 0.26, 0.04, 16, 1, false, Math.PI * 0.4, Math.PI * 1.2);
        const brim = new THREE.Mesh(brimGeo, mat.playerCapBrim);
        brim.position.set(0, 2.1, 0.24);
        brim.rotation.x = 0.15;
        player.add(brim);

        // Cap button on top
        const capBtn = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat.playerCapBrim);
        capBtn.position.set(0, 2.36, 0.02);
        player.add(capBtn);

        // --- Eyes (big, expressive, cartoon style) ---
        const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
        const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.1 });
        const irisMat = new THREE.MeshStandardMaterial({ color: 0x3366aa, roughness: 0.3 });
        for (const ex of [-0.13, 0.13]) {
            const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), eyeWhiteMat);
            eyeW.position.set(ex, 2.06, -0.34);
            eyeW.scale.set(1, 1.15, 0.65);
            player.add(eyeW);
            const iris = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), irisMat);
            iris.position.set(ex, 2.06, -0.38);
            player.add(iris);
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyePupilMat);
            pupil.position.set(ex, 2.06, -0.40);
            player.add(pupil);
            // Eye highlight (catches light)
            const hl = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 6), eyeWhiteMat);
            hl.position.set(ex + 0.02, 2.08, -0.41);
            player.add(hl);
        }

        // Eyebrows (expressive, slightly angled)
        const browMat = new THREE.MeshStandardMaterial({ color: 0x221100, roughness: 0.85 });
        for (const bx of [-0.13, 0.13]) {
            const brow = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.028, 0.02), browMat);
            brow.position.set(bx, 2.15, -0.34);
            brow.rotation.z = bx > 0 ? -0.15 : 0.15;
            player.add(brow);
        }

        // Nose (small bump)
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), mat.playerHead);
        nose.position.set(0, 1.98, -0.40);
        player.add(nose);

        // Mouth (cheeky grin — curved)
        const mouthMat = new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.6 });
        const mouth = new THREE.Mesh(
            new THREE.TorusGeometry(0.065, 0.014, 6, 12, Math.PI),
            mouthMat
        );
        mouth.position.set(0, 1.9, -0.37);
        mouth.rotation.x = Math.PI;
        mouth.rotation.z = Math.PI;
        player.add(mouth);

        // Ears (small bumps on sides)
        for (const sx of [-1, 1]) {
            const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat.playerHead);
            ear.position.set(sx * 0.36, 2.02, -0.05);
            ear.scale.set(0.5, 0.8, 0.6);
            player.add(ear);
        }

        // --- Arms (hoodie sleeves — thicker, more visible) ---
        const armGeo = new THREE.CylinderGeometry(0.14, 0.13, 0.72, 10);
        const lArm = new THREE.Mesh(armGeo, mat.playerHoodie);
        lArm.position.set(-0.5, 1.2, 0);
        lArm.castShadow = true;
        player.add(lArm);

        const rArm = new THREE.Mesh(armGeo.clone(), mat.playerHoodie);
        rArm.position.set(0.5, 1.2, 0);
        rArm.castShadow = true;
        player.add(rArm);

        // Hands (bigger, more visible skin-colored spheres)
        const handGeo = new THREE.SphereGeometry(0.1, 10, 8);
        const lHand = new THREE.Mesh(handGeo, mat.playerHead);
        lHand.position.set(-0.5, 0.84, 0);
        player.add(lHand);
        const rHand = new THREE.Mesh(handGeo.clone(), mat.playerHead);
        rHand.position.set(0.5, 0.84, 0);
        player.add(rHand);

        // --- Legs (dark jeans, thicker for 3D visibility) ---
        const legGeo = new THREE.CylinderGeometry(0.16, 0.15, 0.68, 10);
        const lLeg = new THREE.Mesh(legGeo, mat.playerPant);
        lLeg.position.set(-0.18, 0.54, 0);
        lLeg.castShadow = true;
        player.add(lLeg);

        const rLeg = new THREE.Mesh(legGeo.clone(), mat.playerPant);
        rLeg.position.set(0.18, 0.54, 0);
        rLeg.castShadow = true;
        player.add(rLeg);

        // --- Shoes (chunky athletic sneakers — Subway Surfers style, bigger) ---
        const shoeGeo = new THREE.BoxGeometry(0.32, 0.2, 0.46, 2, 1, 2);
        const shoeV = shoeGeo.attributes.position;
        for (let i = 0; i < shoeV.count; i++) {
            const y = shoeV.getY(i), z = shoeV.getZ(i);
            if (z < -0.12) shoeV.setY(i, y + 0.04);
            if (y > 0.05) shoeV.setX(i, shoeV.getX(i) * 0.9);
        }
        shoeGeo.computeVertexNormals();
        const lShoe = new THREE.Mesh(shoeGeo, mat.playerShoe);
        lShoe.position.set(-0.18, 0.08, -0.04);
        player.add(lShoe);
        const rShoe = new THREE.Mesh(shoeGeo.clone(), mat.playerShoe);
        rShoe.position.set(0.18, 0.08, -0.04);
        player.add(rShoe);

        // Shoe soles (thick white rubber)
        const lSole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.42), mat.playerSole);
        lSole.position.set(-0.18, 0.015, -0.04);
        player.add(lSole);
        const rSole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.42), mat.playerSole);
        rSole.position.set(0.18, 0.015, -0.04);
        player.add(rSole);

        // Shoe swoosh accent (white stripe on each side)
        const swooshMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
        for (const sx of [-0.18, 0.18]) {
            const swoosh = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.06, 0.2), swooshMat);
            swoosh.position.set(sx + (sx > 0 ? 0.13 : -0.13), 0.1, -0.04);
            swoosh.rotation.z = sx > 0 ? 0.2 : -0.2;
            player.add(swoosh);
        }

        // Shoe laces (thin white details)
        for (const sx of [-0.18, 0.18]) {
            for (let i = 0; i < 3; i++) {
                const lace = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.01), swooshMat);
                lace.position.set(sx, 0.15, -0.14 + i * 0.08);
                player.add(lace);
            }
        }

        // --- Backpack (rounded, prominent, with details — bigger) ---
        const bpGeo = new THREE.BoxGeometry(0.58, 0.62, 0.3, 3, 3, 3);
        const bpV = bpGeo.attributes.position;
        for (let i = 0; i < bpV.count; i++) {
            const x = bpV.getX(i), y = bpV.getY(i), z = bpV.getZ(i);
            const len = Math.sqrt(x * x + y * y + z * z);
            const s = 1 + 0.05 / (len + 0.3);
            bpV.setXYZ(i, x * s, y * s, z * s);
        }
        bpGeo.computeVertexNormals();
        const bp = new THREE.Mesh(bpGeo, mat.playerBP);
        bp.position.set(0, 1.28, 0.35);
        bp.castShadow = true;
        player.add(bp);

        // Backpack straps
        for (const sx of [-0.16, 0.16]) {
            const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), mat.playerBP);
            strap.position.set(sx, 1.3, 0.2);
            player.add(strap);
        }

        // Backpack zipper (horizontal)
        const zipMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8, roughness: 0.2 });
        const zip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.01), zipMat);
        zip.position.set(0, 1.38, 0.48);
        player.add(zip);

        // Backpack front pocket
        const bpPocketMat = new THREE.MeshStandardMaterial({ color: 0xff5511, roughness: 0.45 });
        const bpPocket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.04, 2, 2, 1), bpPocketMat);
        bpPocket.position.set(0, 1.12, 0.48);
        player.add(bpPocket);

        // Backpack zip pull (small metallic tab)
        const zipPull = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.01), zipMat);
        zipPull.position.set(0.15, 1.38, 0.49);
        player.add(zipPull);

        playerParts = { torso, head, cap, lArm, rArm, lHand, rHand, lLeg, rLeg, lShoe, rShoe, bp };
        player.position.set(0, GROUND_Y, 0);
        scene.add(player);
    }

    /* ─── animate player (smooth run cycle — professional quality) ─── */
    function animatePlayer(frame) {
        if (!playerParts) return;
        const { lArm, rArm, lHand, rHand, lLeg, rLeg, lShoe, rShoe, torso, head, cap, bp } = playerParts;
        const spd = state.speed / RUN_SPEED;
        const t = frame * 0.18 * spd;
        const swing = Math.sin(t);
        const swingAbs = Math.abs(swing);
        const swingCos = Math.cos(t);

        if (state.rolling) {
            const rollScale = lerp(player.scale.y, 0.42, 0.15);
            player.scale.set(1, rollScale, 1);
            player.position.y = state.jumping ? player.position.y : GROUND_Y;
        } else {
            player.scale.y = lerp(player.scale.y, 1, 0.12);
            player.scale.x = lerp(player.scale.x, 1, 0.12);
            player.scale.z = lerp(player.scale.z, 1, 0.12);

            // Arms pump forward/back (opposite to legs)
            const armSwing = swing * 0.7;
            lArm.rotation.x = armSwing;
            rArm.rotation.x = -armSwing;
            lArm.rotation.z = 0.08;
            rArm.rotation.z = -0.08;
            // Hands follow arms
            lHand.position.y = 0.84 + Math.sin(t + 0.2) * 0.08;
            rHand.position.y = 0.84 - Math.sin(t + 0.2) * 0.08;
            lHand.position.z = Math.sin(t) * 0.14;
            rHand.position.z = -Math.sin(t) * 0.14;

            // Legs stride
            const legSwing = swing * 0.65;
            lLeg.rotation.x = -legSwing;
            rLeg.rotation.x = legSwing;
            lShoe.rotation.x = -legSwing * 0.3 - swingAbs * 0.12;
            rShoe.rotation.x = legSwing * 0.3 - swingAbs * 0.12;
            lShoe.position.z = -0.04 - Math.sin(t) * 0.1;
            rShoe.position.z = -0.04 + Math.sin(t) * 0.1;

            // Body bob
            const bobHeight = swingAbs * 0.06;
            torso.position.y = 1.24 + bobHeight;
            torso.rotation.y = swing * 0.02;
            torso.rotation.z = swing * 0.015;
            const leanFwd = clamp((state.speed - RUN_SPEED) / (MAX_SPEED - RUN_SPEED), 0, 1) * 0.06;
            torso.rotation.x = leanFwd;

            // Head bobs with body
            head.position.y = 2.02 + bobHeight * 0.8;
            head.rotation.y = Math.sin(t * 0.4) * 0.03;
            head.rotation.z = swing * 0.01;
            cap.position.y = 2.18 + bobHeight * 0.8;
            cap.rotation.y = head.rotation.y;

            // Backpack sways
            bp.rotation.z = Math.sin(t * 0.9) * 0.03;
            bp.rotation.x = -leanFwd * 0.3 + swingAbs * 0.025;
            bp.position.y = 1.28 + bobHeight * 0.6;
        }
    }

    /* ─────────── obstacles (enhanced) ─────────── */
    const obstacles = [];

    function spawnTrain(lane, z) {
        const trainLen = rnd(10, 18);
        const g = new THREE.Group();

        // Subway Surfers style — bright colorful trains
        const trainBodyColors = [
            { body: 0x2266cc, stripe: 0xffcc00, accent: 0x1144aa },  // Blue with gold
            { body: 0xcc2222, stripe: 0xffffff, accent: 0x991111 },  // Red with white
            { body: 0x22aa44, stripe: 0xffee00, accent: 0x118833 },  // Green with yellow
            { body: 0x8833aa, stripe: 0xff66cc, accent: 0x662288 },  // Purple with pink
            { body: 0xee7722, stripe: 0xffffff, accent: 0xcc5500 },  // Orange with white
            { body: 0x2299bb, stripe: 0xffdd33, accent: 0x117799 },  // Teal with gold
        ];
        const scheme = trainBodyColors[Math.floor(Math.random() * trainBodyColors.length)];

        const bodyMat = new THREE.MeshStandardMaterial({
            color: scheme.body, roughness: 0.3, metalness: 0.35,
            emissive: scheme.accent, emissiveIntensity: 0.08
        });
        const stripeMat = new THREE.MeshStandardMaterial({
            color: scheme.stripe, roughness: 0.25, metalness: 0.2
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: scheme.accent, roughness: 0.35, metalness: 0.4
        });

        // Dark window glass
        const winMat = new THREE.MeshStandardMaterial({
            color: 0x152030, emissive: 0x1a3355, emissiveIntensity: 0.35,
            roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.88,
        });

        /* ── Undercarriage ── */
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.28, trainLen + 0.3), mat.trainBottom);
        chassis.position.y = 0.22;
        g.add(chassis);

        /* ── Wheel bogies ── */
        for (const bz of [-trainLen / 2 + 2.0, trainLen / 2 - 2.0]) {
            const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 2.3), mat.trainBottom);
            frame.position.set(0, 0.14, bz);
            g.add(frame);
            for (const wx of [-0.65, 0.65]) {
                for (const wz of [-0.6, 0.6]) {
                    const wheel = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.34, 0.34, 0.2, 18),
                        mat.trainWheel
                    );
                    wheel.rotation.z = Math.PI / 2;
                    wheel.position.set(wx, 0.12, bz + wz);
                    g.add(wheel);
                    const flange = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.38, 0.38, 0.07, 18),
                        mat.rail
                    );
                    flange.rotation.z = Math.PI / 2;
                    flange.position.set(wx, 0.12, bz + wz);
                    g.add(flange);
                }
            }
        }

        /* ── Main body — colorful! (taller for 3D presence) ── */
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.0, trainLen), bodyMat);
        body.position.y = 1.85;
        body.castShadow = true;
        body.receiveShadow = true;
        g.add(body);

        /* ── Bold stripe band (signature look) ── */
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.55, trainLen + 0.04), stripeMat);
        stripe.position.y = 2.2;
        g.add(stripe);

        // Second thinner accent stripe below windows
        const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.12, trainLen + 0.04), stripeMat);
        stripe2.position.y = 2.9;
        g.add(stripe2);

        /* ── Chrome trim lines ── */
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xddddee, metalness: 0.9, roughness: 0.1 });
        for (const dy of [1.85, 2.48, 2.95]) {
            const trim = new THREE.Mesh(new THREE.BoxGeometry(2.13, 0.03, trainLen + 0.04), chromeMat);
            trim.position.y = dy;
            g.add(trim);
        }

        /* ── Roof (rounded feel) ── */
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.18, trainLen + 0.12), mat.trainRoof);
        roof.position.y = 3.4;
        g.add(roof);
        for (const rx of [-1, 1]) {
            const bev = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, trainLen + 0.12), mat.trainRoof);
            bev.position.set(rx * 0.98, 3.36, 0);
            bev.rotation.z = rx * 0.22;
            g.add(bev);
        }
        // AC units
        for (const az of [-trainLen * 0.28, trainLen * 0.28]) {
            const ac = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 2.0), mat.trainRoof);
            ac.position.set(0, 3.5, az);
            g.add(ac);
        }
        // Pantograph
        const panBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.55), mat.wire);
        panBase.position.set(0, 3.5, 0);
        g.add(panBase);

        /* ── Windows & doors ── */
        const winSpacing = 1.65;
        const winCount = Math.max(2, Math.floor((trainLen - 2.6) / winSpacing));
        const winStartZ = -(winCount - 1) * winSpacing * 0.5;
        for (let i = 0; i < winCount; i++) {
            const wz = winStartZ + i * winSpacing;
            const isDoor = (i === Math.floor(winCount / 3) || i === Math.floor(winCount * 2 / 3));
            for (const sx of [-1.06, 1.06]) {
                if (isDoor) {
                    // Door rubber seal
                    const sealMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
                    const sealV = new THREE.Mesh(new THREE.BoxGeometry(0.015, 2.3, 0.05), sealMat);
                    sealV.position.set(sx, 1.65, wz - 0.38);
                    g.add(sealV);
                    // Door window (bigger)
                    const dw = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.85), winMat);
                    dw.position.set(sx * 1.001, 2.4, wz);
                    dw.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
                    g.add(dw);
                    // Door panel
                    const dp = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.4), accentMat);
                    dp.position.set(sx * 1.001, 1.5, wz);
                    dp.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
                    g.add(dp);
                } else {
                    // Large window
                    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.85), winMat);
                    win.position.set(sx * 1.001, 2.6, wz);
                    win.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
                    g.add(win);
                    // Window frame
                    const wf = new THREE.Mesh(
                        new THREE.BoxGeometry(0.018, 0.92, 1.2),
                        chromeMat
                    );
                    wf.position.set(sx, 2.6, wz);
                    g.add(wf);
                }
            }
        }

        /* ── Graffiti panels (colorful rectangles — Subway Surfers signature!) ── */
        const graffitiColors = [0xff4488, 0x44ddff, 0xffee33, 0x66ff44, 0xff8833, 0xaa55ff, 0xff3333];
        if (Math.random() < 0.7) {
            const grafCount = rndInt(2, 4);
            for (let gi = 0; gi < grafCount; gi++) {
                const gColor = graffitiColors[Math.floor(Math.random() * graffitiColors.length)];
                const gMat = new THREE.MeshStandardMaterial({
                    color: gColor, roughness: 0.55, metalness: 0.1,
                    emissive: gColor, emissiveIntensity: 0.08
                });
                const gw = rnd(0.8, 2.5), gh = rnd(0.4, 1.2);
                const gPanel = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), gMat);
                const gSide = Math.random() < 0.5 ? -1.06 : 1.06;
                const gz = rnd(-trainLen / 2 + 2, trainLen / 2 - 2);
                const gy = rnd(0.8, 1.8);
                gPanel.position.set(gSide * 1.002, gy, gz);
                gPanel.rotation.y = gSide > 0 ? -Math.PI / 2 : Math.PI / 2;
                g.add(gPanel);
            }
        }

        /* ── Safety stripe ── */
        const safetyMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.4, metalness: 0.1 });
        for (const sx of [-1.06, 1.06]) {
            const saf = new THREE.Mesh(new THREE.PlaneGeometry(trainLen - 0.9, 0.08), safetyMat);
            saf.position.set(sx * 1.001, 0.43, 0);
            saf.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
            g.add(saf);
        }

        /* ── Front nose / cab face (detailed realistic train front) ── */
        const fz = -trainLen / 2; // front z reference

        // Main front body
        const frontBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.0, 0.4), bodyMat);
        frontBody.position.set(0, 1.85, fz - 0.2);
        g.add(frontBody);

        // Slight nose taper — angled bottom plate for aerodynamic look
        const nosePlate = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.5, 0.35), accentMat);
        nosePlate.position.set(0, 0.55, fz - 0.22);
        nosePlate.rotation.x = 0.18;
        g.add(nosePlate);

        // Front stripe band
        const frontStripe = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.55, 0.06), stripeMat);
        frontStripe.position.set(0, 2.2, fz - 0.38);
        g.add(frontStripe);

        // Chrome bumper
        const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 0.06), chromeMat);
        bumper.position.set(0, 0.36, fz - 0.38);
        g.add(bumper);

        // ── Windshield (large split-pane cab window) ──
        // Main windshield glass (two panes with center divider)
        for (const wx of [-0.35, 0.35]) {
            const ws = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.92), winMat.clone());
            ws.position.set(wx, 2.48, fz - 0.41);
            g.add(ws);
        }
        // Center divider (thick pillar)
        const wsDivider = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 0.06), chromeMat);
        wsDivider.position.set(0, 2.48, fz - 0.39);
        g.add(wsDivider);

        // Window frame surround (chrome frame around entire windshield)
        // Top frame
        const wsFrameTop = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 0.06), chromeMat);
        wsFrameTop.position.set(0, 2.96, fz - 0.39);
        g.add(wsFrameTop);
        // Bottom frame
        const wsFrameBot = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 0.06), chromeMat);
        wsFrameBot.position.set(0, 2.0, fz - 0.39);
        g.add(wsFrameBot);
        // Side frames
        for (const sx of [-0.66, 0.66]) {
            const wsFrameSide = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.02, 0.06), chromeMat);
            wsFrameSide.position.set(sx, 2.48, fz - 0.39);
            g.add(wsFrameSide);
        }

        // Windshield wipers (two thin arcs)
        const wiperMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
        for (const wx of [-0.3, 0.3]) {
            const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.48, 0.015), wiperMat);
            wiper.position.set(wx, 2.28, fz - 0.42);
            wiper.rotation.z = wx > 0 ? 0.25 : -0.25;
            g.add(wiper);
        }

        // ── Route / destination display board ──
        const dstBorderMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.6, metalness: 0.3 });
        const dstBorder = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.32, 0.03), dstBorderMat);
        dstBorder.position.set(0, 2.88, fz - 0.395);
        g.add(dstBorder);
        const dstMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, emissive: 0xffddaa, emissiveIntensity: 0.45 });
        const dst = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.22, 0.02), dstMat);
        dst.position.set(0, 2.88, fz - 0.40);
        g.add(dst);

        // ── Headlights (large circular with chrome bezels) ──
        for (const hx of [-0.62, 0.62]) {
            // Chrome bezel ring
            const bezel = new THREE.Mesh(
                new THREE.TorusGeometry(0.15, 0.025, 8, 20),
                chromeMat
            );
            bezel.position.set(hx, 1.0, fz - 0.40);
            g.add(bezel);
            // Headlight lens
            const hlFace = new THREE.Mesh(
                new THREE.CylinderGeometry(0.13, 0.13, 0.05, 16),
                mat.headlight
            );
            hlFace.rotation.x = Math.PI / 2;
            hlFace.position.set(hx, 1.0, fz - 0.40);
            g.add(hlFace);
            // Inner reflector (depth effect)
            const reflector = new THREE.Mesh(
                new THREE.CylinderGeometry(0.09, 0.06, 0.08, 12),
                chromeMat
            );
            reflector.rotation.x = Math.PI / 2;
            reflector.position.set(hx, 1.0, fz - 0.36);
            g.add(reflector);
            // Actual light
            const hlLight = new THREE.PointLight(0xffffee, 1.0, 8);
            hlLight.position.set(hx, 1.0, fz - 0.55);
            g.add(hlLight);
        }

        // ── Marker / signal lights (small colored circles at corners) ──
        for (const hx of [-0.85, 0.85]) {
            // Top marker (white)
            const topMarker = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10),
                mat.headlight
            );
            topMarker.rotation.x = Math.PI / 2;
            topMarker.position.set(hx, 2.82, fz - 0.40);
            g.add(topMarker);
            // Bottom marker (amber)
            const amberMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.6 });
            const botMarker = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10),
                amberMat
            );
            botMarker.rotation.x = Math.PI / 2;
            botMarker.position.set(hx, 0.58, fz - 0.40);
            g.add(botMarker);
        }

        // ── Air intake grilles (horizontal slats below windshield) ──
        const grilleMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.6, metalness: 0.4 });
        for (let gy = 1.32; gy < 1.82; gy += 0.08) {
            const slat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.03), grilleMat);
            slat.position.set(0, gy, fz - 0.41);
            g.add(slat);
        }
        // Grille border frame (chrome trim pieces)
        for (const gy of [1.28, 1.82]) {
            const gTrim = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.025, 0.04), chromeMat);
            gTrim.position.set(0, gy, fz - 0.40);
            g.add(gTrim);
        }
        for (const gx of [-0.38, 0.38]) {
            const gTrimV = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.56, 0.04), chromeMat);
            gTrimV.position.set(gx, 1.55, fz - 0.40);
            g.add(gTrimV);
        }

        // ── Ditch / fog lights (small rectangles lower on face) ──
        const ditchLightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.7 });
        for (const hx of [-0.34, 0.34]) {
            const dl = new THREE.Mesh(
                new THREE.BoxGeometry(0.14, 0.08, 0.02),
                ditchLightMat
            );
            dl.position.set(hx, 0.65, fz - 0.41);
            g.add(dl);
            // Chrome surround for ditch light
            const dlBezel = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.13, 0.015), chromeMat);
            dlBezel.position.set(hx, 0.65, fz - 0.405);
            g.add(dlBezel);
        }

        // ── Front coupler / coupling mechanism ──
        const coupFront = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.3), mat.trainBottom);
        coupFront.position.set(0, 0.28, fz - 0.35);
        g.add(coupFront);
        const coupKnuckle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10),
            mat.trainWheel
        );
        coupKnuckle.rotation.x = Math.PI / 2;
        coupKnuckle.position.set(0, 0.28, fz - 0.52);
        g.add(coupKnuckle);

        // ── Pilot / cowcatcher (angled deflector at bottom) ──
        const pilotMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.5, metalness: 0.4 });
        const pilot = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.25), pilotMat);
        pilot.position.set(0, 0.20, fz - 0.42);
        pilot.rotation.x = 0.15;
        g.add(pilot);

        // ── Number / logo plate on front face ──
        const plateMat = new THREE.MeshStandardMaterial({ color: 0xddddcc, roughness: 0.4, metalness: 0.5 });
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.02), plateMat);
        plate.position.set(0, 0.82, fz - 0.41);
        g.add(plate);

        /* ── Rear face — full 3D detailed (what the player sees approaching) ── */
        const rz = trainLen / 2; // rear z reference

        // Main rear body panel
        const rearBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.0, 0.35), accentMat);
        rearBody.position.set(0, 1.85, rz + 0.17);
        rearBody.castShadow = true;
        g.add(rearBody);

        // Rear stripe band (matches the side)
        const rearStripe = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.55, 0.06), stripeMat);
        rearStripe.position.set(0, 2.2, rz + 0.33);
        g.add(rearStripe);

        // Rear window (smaller than windshield)
        const rearWin = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), winMat.clone());
        rearWin.position.set(0, 2.45, rz + 0.36);
        rearWin.rotation.y = Math.PI;
        g.add(rearWin);

        // Rear window chrome frame
        const rwfTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.04), chromeMat);
        rwfTop.position.set(0, 2.82, rz + 0.35);
        g.add(rwfTop);
        const rwfBot = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.04), chromeMat);
        rwfBot.position.set(0, 2.08, rz + 0.35);
        g.add(rwfBot);
        for (const sx of [-0.53, 0.53]) {
            const rwfSide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.78, 0.04), chromeMat);
            rwfSide.position.set(sx, 2.45, rz + 0.35);
            g.add(rwfSide);
        }

        // Tail lights (large red circles with chrome bezels)
        const tailLightMat = new THREE.MeshStandardMaterial({
            color: 0xff0011, emissive: 0xff0011, emissiveIntensity: 1.0
        });
        for (const hx of [-0.65, 0.65]) {
            // Chrome bezel
            const tBezel = new THREE.Mesh(
                new THREE.TorusGeometry(0.13, 0.02, 8, 16),
                chromeMat
            );
            tBezel.position.set(hx, 1.0, rz + 0.35);
            g.add(tBezel);
            // Red tail light lens
            const tail = new THREE.Mesh(
                new THREE.CylinderGeometry(0.11, 0.11, 0.05, 14),
                tailLightMat
            );
            tail.rotation.x = Math.PI / 2;
            tail.position.set(hx, 1.0, rz + 0.35);
            g.add(tail);
        }

        // Upper tail / brake lights (thin rectangles)
        for (const hx of [-0.4, 0.4]) {
            const upperTail = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.08, 0.03),
                tailLightMat
            );
            upperTail.position.set(hx, 2.88, rz + 0.36);
            g.add(upperTail);
        }

        // Rear chrome bumper
        const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.06), chromeMat);
        rearBumper.position.set(0, 0.38, rz + 0.35);
        g.add(rearBumper);

        // Rear grille / ventilation slats
        const rGrilleMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.6, metalness: 0.4 });
        for (let gy = 1.4; gy < 1.8; gy += 0.08) {
            const slat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.025, 0.025), rGrilleMat);
            slat.position.set(0, gy, rz + 0.36);
            g.add(slat);
        }

        // Rear number plate
        const rPlate = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.18, 0.02),
            new THREE.MeshStandardMaterial({ color: 0xddddcc, roughness: 0.4, metalness: 0.4 })
        );
        rPlate.position.set(0, 0.62, rz + 0.36);
        g.add(rPlate);

        // Rear safety stripe
        const rSafety = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.06, 0.02),
            new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.4 })
        );
        rSafety.position.set(0, 0.48, rz + 0.36);
        g.add(rSafety);

        /* ── Coupling ── */
        const coup = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.45), mat.trainBottom);
        coup.position.set(0, 0.46, rz + 0.45);
        g.add(coup);
        const coupKnuckleR = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10),
            mat.trainWheel
        );
        coupKnuckleR.rotation.x = Math.PI / 2;
        coupKnuckleR.position.set(0, 0.46, rz + 0.7);
        g.add(coupKnuckleR);

        g.position.set(LANES[lane], GROUND_Y, z);
        scene.add(g);

        obstacles.push({
            mesh: g,
            type: "train",
            lane,
            z,
            halfW: 1.05,
            halfH: 1.7,
            halfD: trainLen / 2 + 0.2,
        });
    }

    function spawnBarrier(lane, z) {
        const g = new THREE.Group();

        // --- BIG, VISIBLE barrier gate (like Subway Surfers) ---
        const barrierW = 2.0; // full lane width
        const barrierH = 2.4; // tall enough to clearly see

        // Thick support posts (bright orange tubes)
        for (const px of [-barrierW / 2, barrierW / 2]) {
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.12, barrierH, 12),
                mat.barrier
            );
            post.position.set(px, barrierH / 2, 0);
            post.castShadow = true;
            g.add(post);
            // Post cap (rounded top)
            const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat.barrierWarn);
            cap.position.set(px, barrierH, 0);
            g.add(cap);
            // Heavy base plate
            const base = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.24, 0.1, 12),
                mat.barrierStripe
            );
            base.position.set(px, 0.05, 0);
            g.add(base);
        }

        // Thick horizontal bars (alternating bold yellow/black)
        const barThick = new THREE.CylinderGeometry(0.07, 0.07, barrierW, 10);
        for (let i = 0; i < 5; i++) {
            const bar = new THREE.Mesh(
                barThick,
                i % 2 === 0 ? mat.barrier : mat.barrierStripe
            );
            bar.rotation.z = Math.PI / 2;
            bar.position.set(0, 0.35 + i * 0.45, 0);
            bar.castShadow = true;
            g.add(bar);
        }

        // Big bold reflective warning panel on front
        const warnPanel = new THREE.Mesh(
            new THREE.BoxGeometry(barrierW - 0.2, 0.5, 0.06),
            new THREE.MeshStandardMaterial({
                color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.5,
                roughness: 0.2, metalness: 0.2
            })
        );
        warnPanel.position.set(0, 1.5, -0.08);
        g.add(warnPanel);

        // Diagonal hazard stripes on panel
        const hazardMat = new THREE.MeshStandardMaterial({
            color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.2,
            roughness: 0.35
        });
        for (let i = 0; i < 6; i++) {
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.46, 0.02), hazardMat);
            stripe.position.set(-0.6 + i * 0.24, 1.5, -0.12);
            stripe.rotation.z = 0.35;
            g.add(stripe);
        }

        // Glowing warning light on top center
        const warnLight = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 10, 8),
            new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 1.2 })
        );
        warnLight.position.set(0, barrierH + 0.1, 0);
        g.add(warnLight);

        g.position.set(LANES[lane], GROUND_Y, z);
        scene.add(g);

        obstacles.push({
            mesh: g,
            type: "barrier",
            lane,
            z,
            halfW: 1.0,
            halfH: 1.2,
            halfD: 0.25,
            canRollUnder: false,
            canJumpOver: true,
        });
    }

    function spawnLowBarrier(lane, z) {
        const g = new THREE.Group();

        // --- Chunky concrete road barrier (clearly visible) ---
        const barW = 2.2, barH = 0.75, barD = 0.6;

        // Main concrete block (bigger, more solid)
        const barGeo = new THREE.BoxGeometry(barW, barH, barD, 2, 2, 2);
        const barV = barGeo.attributes.position;
        // Slight bevel on top edges
        for (let i = 0; i < barV.count; i++) {
            const y = barV.getY(i);
            const x = barV.getX(i);
            if (y > barH * 0.35) {
                barV.setX(i, x * 0.92);
            }
        }
        barGeo.computeVertexNormals();
        const concreteBarMat = new THREE.MeshStandardMaterial({
            color: 0x888888, roughness: 0.7, metalness: 0.05
        });
        const bar = new THREE.Mesh(barGeo, concreteBarMat);
        bar.position.y = barH / 2;
        bar.castShadow = true;
        bar.receiveShadow = true;
        g.add(bar);

        // Bold yellow/black chevron stripes on front face
        const chevCount = 8;
        for (let i = 0; i < chevCount; i++) {
            const isYellow = i % 2 === 0;
            const chevMat = new THREE.MeshStandardMaterial({
                color: isYellow ? 0xffcc00 : 0x222222,
                emissive: isYellow ? 0xff9900 : 0x000000,
                emissiveIntensity: isYellow ? 0.2 : 0,
                roughness: 0.4
            });
            const chev = new THREE.Mesh(new THREE.BoxGeometry(0.18, barH - 0.1, 0.02), chevMat);
            chev.position.set(-barW / 2 + 0.2 + i * (barW - 0.4) / (chevCount - 1), barH / 2, -barD / 2 - 0.01);
            chev.rotation.z = isYellow ? 0.3 : -0.3;
            g.add(chev);
        }

        // Reflective orange strip on top
        const topStripMat = new THREE.MeshStandardMaterial({
            color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 0.35,
            roughness: 0.25
        });
        const topStrip = new THREE.Mesh(new THREE.BoxGeometry(barW + 0.05, 0.06, barD + 0.05), topStripMat);
        topStrip.position.y = barH + 0.03;
        g.add(topStrip);

        g.position.set(LANES[lane], GROUND_Y, z);
        scene.add(g);

        obstacles.push({
            mesh: g,
            type: "lowBarrier",
            lane,
            z,
            halfW: 1.1,
            halfH: 0.4,
            halfD: 0.3,
            canRollUnder: false,
            canJumpOver: true,
        });
    }

    function spawnUpperBarrier(lane, z) {
        const g = new THREE.Group();

        const ubW = 2.2; // wider to match lane

        // Heavy steel support poles
        for (const px of [-ubW / 2, ubW / 2]) {
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.1, 3.2, 12),
                mat.barrier
            );
            post.position.set(px, 1.6, 0);
            post.castShadow = true;
            g.add(post);
            // Cross brace
            const brace = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.04, 0.3),
                mat.barrier
            );
            brace.position.set(px * 0.7, 1.0, 0);
            brace.rotation.z = px > 0 ? -0.4 : 0.4;
            g.add(brace);
        }

        // Thick overhead beam (the main obstacle)
        const beam = new THREE.Mesh(
            new THREE.BoxGeometry(ubW, 0.35, 0.5),
            mat.barrier
        );
        beam.position.y = 1.6;
        beam.castShadow = true;
        g.add(beam);

        // Bold red/white warning stripes on beam face
        const redMat = new THREE.MeshStandardMaterial({
            color: 0xff2222, emissive: 0xff1100, emissiveIntensity: 0.4,
            roughness: 0.3
        });
        const whiteMat = new THREE.MeshStandardMaterial({
            color: 0xffffff, roughness: 0.3
        });
        for (let i = 0; i < 8; i++) {
            const stripeM = i % 2 === 0 ? redMat : whiteMat;
            const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(ubW / 8, 0.33, 0.02),
                stripeM
            );
            stripe.position.set(-ubW / 2 + ubW / 16 + i * (ubW / 8), 1.6, -0.26);
            g.add(stripe);
        }

        // Big danger sign hanging below
        const signMat = new THREE.MeshStandardMaterial({
            color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.15,
            roughness: 0.35
        });
        const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.04), signMat);
        sign.position.set(0, 1.2, -0.2);
        g.add(sign);
        // ⚠ Triangle
        const tri = new THREE.Mesh(
            new THREE.ConeGeometry(0.13, 0.22, 3),
            new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff2200, emissiveIntensity: 0.3, roughness: 0.4 })
        );
        tri.position.set(0, 1.22, -0.22);
        g.add(tri);

        // Flashing warning lights on both ends
        for (const px of [-ubW / 2 + 0.15, ubW / 2 - 0.15]) {
            const warnLt = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 })
            );
            warnLt.position.set(px, 1.85, -0.2);
            g.add(warnLt);
        }

        g.position.set(LANES[lane], GROUND_Y, z);
        scene.add(g);

        obstacles.push({
            mesh: g,
            type: "upperBarrier",
            lane,
            z,
            halfW: 1.1,
            halfH: 0.25,
            halfD: 0.25,
            yCenter: 1.6,
            canRollUnder: true,
            canJumpOver: false,
        });
    }

    /* ─────────── coins (professional gold coins) ─────────── */
    const coins = [];

    // Pre-build a reusable coin prototype for instancing
    const coinStarMat = new THREE.MeshStandardMaterial({
        color: 0xffe066, emissive: 0xffcc00, emissiveIntensity: 0.4,
        metalness: 0.9, roughness: 0.1
    });

    function createCoinMesh() {
        const coinG = new THREE.Group();

        // Main coin disc (slightly convex via scale)
        const face = new THREE.Mesh(geo.coin, mat.coin);
        face.rotation.x = Math.PI / 2;
        face.scale.set(1, 1, 1.1);
        coinG.add(face);

        // Raised inner circle (like a real coin)
        const inner = new THREE.Mesh(geo.coinInner, mat.coinEdge);
        inner.rotation.x = Math.PI / 2;
        inner.position.y = 0.001;
        inner.scale.set(1, 1.2, 1);
        coinG.add(inner);

        // Center dollar sign / star emblem
        const star = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.09, 0),
            coinStarMat
        );
        star.position.y = 0.0;
        star.rotation.y = Math.PI / 4;
        coinG.add(star);

        // Rim highlight (thin torus)
        const rim = new THREE.Mesh(
            new THREE.TorusGeometry(0.47, 0.03, 8, 32),
            mat.coinEdge
        );
        coinG.add(rim);

        // Soft glow sprite (smaller, more subtle)
        const glowMat = new THREE.SpriteMaterial({
            color: 0xffdd44,
            transparent: true,
            opacity: 0.18,
            depthWrite: false,
        });
        const glow = new THREE.Sprite(glowMat);
        glow.scale.set(0.9, 0.9, 1);
        coinG.add(glow);

        return coinG;
    }

    function spawnCoinRow(lane, z, count = 5) {
        for (let i = 0; i < count; i++) {
            const coinG = createCoinMesh();
            coinG.position.set(LANES[lane], 1.0, z - i * 1.8);
            scene.add(coinG);
            coins.push({ mesh: coinG, lane, z: z - i * 1.8, collected: false, baseY: 1.0 });
        }
    }

    function spawnCoinArc(lane, z) {
        for (let i = 0; i < 6; i++) {
            const t = i / 5;
            const yOff = Math.sin(t * Math.PI) * 2.5;
            const coinG = createCoinMesh();
            coinG.position.set(LANES[lane], 1.0 + yOff, z - i * 1.8);
            scene.add(coinG);
            coins.push({ mesh: coinG, lane, z: z - i * 1.8, collected: false, baseY: 1.0 + yOff });
        }
    }

    /* ─────────── powerups (polished floating gems) ─────────── */
    const powerups = [];

    function spawnPowerup(lane, z) {
        const type = Math.random() < 0.5 ? "magnet" : "multiplier";
        const m = type === "magnet" ? mat.powerGreen : mat.powerPurple;
        const g = new THREE.Group();

        // Core gem (higher-poly octahedron)
        const core = new THREE.Mesh(geo.powerup, m);
        core.castShadow = true;
        g.add(core);

        // Outer ring (smooth torus)
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.55, 0.03, 12, 32),
            m.clone()
        );
        ring.material.transparent = true;
        ring.material.opacity = 0.45;
        g.add(ring);

        // Second ring (perpendicular)
        const ring2 = new THREE.Mesh(
            new THREE.TorusGeometry(0.48, 0.02, 10, 28),
            m.clone()
        );
        ring2.material.transparent = true;
        ring2.material.opacity = 0.3;
        ring2.rotation.x = Math.PI / 2;
        g.add(ring2);

        // Inner glow
        const glowMat = new THREE.SpriteMaterial({
            color: type === "magnet" ? 0x33ff88 : 0xaa44ff,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
        });
        const glow = new THREE.Sprite(glowMat);
        glow.scale.set(2.0, 2.0, 1);
        g.add(glow);

        g.position.set(LANES[lane], 1.5, z);
        scene.add(g);
        powerups.push({ mesh: g, lane, z, type, collected: false });
    }

    /* ─────────── world spawner ─────────── */
    let nextObstacleZ = -30;
    let nextCoinZ = -20;
    let nextBuildingZ = -20;
    let nextPowerZ = -80;

    function spawnWorld() {
        const ahead = player.position.z - SPAWN_DIST;

        while (nextObstacleZ > ahead) {
            const laneIdx = rndInt(0, 2);
            const r = Math.random();
            if (r < 0.35) {
                spawnTrain(laneIdx, nextObstacleZ);
            } else if (r < 0.55) {
                spawnBarrier(laneIdx, nextObstacleZ);
            } else if (r < 0.72) {
                spawnLowBarrier(laneIdx, nextObstacleZ);
            } else if (r < 0.85) {
                spawnUpperBarrier(laneIdx, nextObstacleZ);
            } else {
                const l2 = (laneIdx + pick([1, 2])) % 3;
                spawnBarrier(laneIdx, nextObstacleZ);
                spawnLowBarrier(l2, nextObstacleZ);
            }
            nextObstacleZ -= rnd(OBS_GAP_MIN, OBS_GAP_MAX);
        }

        while (nextCoinZ > ahead) {
            const cl = rndInt(0, 2);
            if (Math.random() < 0.3) {
                spawnCoinArc(cl, nextCoinZ);
            } else {
                spawnCoinRow(cl, nextCoinZ, rndInt(3, 7));
            }
            nextCoinZ -= rnd(COIN_GAP, COIN_GAP * 3);
        }

        while (nextBuildingZ > ahead) {
            spawnBuilding(nextBuildingZ);
            nextBuildingZ -= rnd(6, 14);
        }

        while (nextPowerZ > ahead) {
            if (Math.random() < POWERUP_CHANCE * 3) {
                spawnPowerup(rndInt(0, 2), nextPowerZ);
            }
            nextPowerZ -= rnd(40, 80);
        }

        spawnScenery();
    }

    function cleanBehind() {
        const behind = player.position.z + 15;

        for (let i = obstacles.length - 1; i >= 0; i--) {
            if (obstacles[i].mesh.position.z > behind) {
                scene.remove(obstacles[i].mesh);
                obstacles.splice(i, 1);
            }
        }
        for (let i = coins.length - 1; i >= 0; i--) {
            if (coins[i].mesh.position.z > behind || coins[i].collected) {
                scene.remove(coins[i].mesh);
                coins.splice(i, 1);
            }
        }
        for (let i = powerups.length - 1; i >= 0; i--) {
            if (powerups[i].mesh.position.z > behind || powerups[i].collected) {
                scene.remove(powerups[i].mesh);
                powerups.splice(i, 1);
            }
        }
        for (let i = buildings.length - 1; i >= 0; i--) {
            if (buildings[i].z > behind + 30) {
                scene.remove(buildings[i].mesh);
                buildings.splice(i, 1);
            }
        }
        for (let i = sceneryObjs.length - 1; i >= 0; i--) {
            if (sceneryObjs[i].z > behind + 20) {
                scene.remove(sceneryObjs[i].mesh);
                sceneryObjs.splice(i, 1);
            }
        }
    }

    /* ─────────── ground chunk recycling ─────────── */
    function manageGround() {
        const pz = player.position.z;
        for (const c of groundChunks) {
            if (c.group.position.z > pz + CHUNK_LEN) {
                c.group.position.z -= CHUNK_LEN * groundChunks.length;
            }
        }
        const minZ = Math.min(...groundChunks.map(c => c.group.position.z));
        if (minZ > pz - CHUNK_LEN * 1.5) {
            makeGroundChunk(minZ - CHUNK_LEN);
        }
    }

    /* ─────────── game state ─────────── */
    const state = {
        running: false,
        paused: false,
        gameOver: false,
        score: 0,
        coins: 0,
        distance: 0,
        speed: RUN_SPEED,
        laneIndex: 1,
        targetLane: 1,
        yVel: 0,
        jumping: false,
        rolling: false,
        rollTimer: 0,
        frame: 0,
        magnetTimer: 0,
        multiplierTimer: 0,
        multiplier: 1,
        invulnTimer: 0,
        highScore: parseInt(localStorage.getItem("subwaySurfersHigh") || "0"),
    };

    function resetState() {
        state.score = 0;
        state.coins = 0;
        state.distance = 0;
        state.speed = RUN_SPEED;
        state.laneIndex = 1;
        state.targetLane = 1;
        state.yVel = 0;
        state.jumping = false;
        state.rolling = false;
        state.rollTimer = 0;
        state.frame = 0;
        state.magnetTimer = 0;
        state.multiplierTimer = 0;
        state.multiplier = 1;
        state.invulnTimer = 0;
        state.gameOver = false;
        state.paused = false;
        nextMilestoneIdx = 0;
    }

    /* ─────────── collision ─────────── */
    function checkCollisions() {
        const px = player.position.x;
        const py = player.position.y;
        const pz = player.position.z;
        const pH = state.rolling ? 0.6 : 2.2;
        const pHW = 0.35;
        const pHD = 0.25;

        for (const obs of obstacles) {
            const oz = obs.mesh.position.z;
            const ox = obs.mesh.position.x;

            if (pz - pHD > oz + obs.halfD || pz + pHD < oz - obs.halfD) continue;
            if (px - pHW > ox + obs.halfW || px + pHW < ox - obs.halfW) continue;

            if (obs.type === "train") {
                if (py < 3.4) return true;
            } else if (obs.type === "upperBarrier") {
                const barY = obs.yCenter || 1.6;
                if (py + pH > barY - obs.halfH && py < barY + obs.halfH) return true;
            } else if (obs.type === "lowBarrier") {
                if (py < obs.halfH * 2 + 0.3) return true;
            } else if (obs.type === "barrier") {
                if (py < 2.0) return true;
            }
        }
        return false;
    }

    /* ─────────── coin / powerup collection ─────────── */
    function collectItems() {
        const px = player.position.x;
        const py = player.position.y;
        const pz = player.position.z;
        const magnetRange = state.magnetTimer > 0 ? 5.0 : 1.3;

        for (const c of coins) {
            if (c.collected) continue;
            const dx = c.mesh.position.x - px;
            const dy = c.mesh.position.y - (py + 1);
            const dz = c.mesh.position.z - pz;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (state.magnetTimer > 0 && dist < magnetRange) {
                // Smooth magnetic pull with acceleration
                const pullStrength = 0.12 + (1 - dist / magnetRange) * 0.15;
                c.mesh.position.x = lerp(c.mesh.position.x, px, pullStrength);
                c.mesh.position.y = lerp(c.mesh.position.y, py + 1, pullStrength);
                c.mesh.position.z = lerp(c.mesh.position.z, pz, pullStrength);
                c.mesh.rotation.y += 0.15;
            }

            if (dist < 1.3) {
                c.collected = true;
                c.mesh.visible = false;
                const pts = 10 * state.multiplier;
                state.coins++;
                state.score += pts;
                sfx.coin();
                popCoinIcon();
                spawnSparks(c.mesh.position, 3);
                showFloatingText(`+${pts}`, c.mesh.position);
            }
        }

        for (const p of powerups) {
            if (p.collected) continue;
            const dx = p.mesh.position.x - px;
            const dy = p.mesh.position.y - (py + 1);
            const dz = p.mesh.position.z - pz;
            if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 1.5) {
                p.collected = true;
                p.mesh.visible = false;
                sfx.powerup();
                spawnSparks(p.mesh.position, 10);
                if (p.type === "magnet") {
                    state.magnetTimer = MAGNET_DUR;
                    showPowerup("🧲 MAGNET");
                } else if (p.type === "multiplier") {
                    state.multiplierTimer = MULTI_DUR;
                    state.multiplier = 2;
                    showPowerup("×2 MULTIPLIER");
                }
            }
        }
    }

    /* ─────────── floating text (high-quality, professional) ─────────── */
    const floatingTexts = [];
    // Pre-create a reusable canvas for floating text to reduce GC
    const _ftCanvas = document.createElement("canvas");
    _ftCanvas.width = 256;
    _ftCanvas.height = 80;

    function showFloatingText(text, pos) {
        const c = _ftCanvas;
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);

        // Draw text with glow effect
        ctx.save();
        ctx.font = "bold 42px 'Poppins', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Outer glow
        ctx.shadowColor = "rgba(255, 200, 0, 0.8)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#fff8e0";
        ctx.fillText(text, 128, 40);

        // Main text with gradient
        ctx.shadowBlur = 0;
        const grad = ctx.createLinearGradient(0, 20, 0, 60);
        grad.addColorStop(0, "#fff8e0");
        grad.addColorStop(0.5, "#ffd700");
        grad.addColorStop(1, "#ff9900");
        ctx.fillStyle = grad;
        ctx.fillText(text, 128, 40);

        // Subtle dark outline for readability
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(80, 50, 0, 0.5)";
        ctx.strokeText(text, 128, 40);
        ctx.restore();

        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        const spriteMat = new THREE.SpriteMaterial({
            map: tex.clone(),
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.6, 0.5, 1);
        sprite.position.copy(pos);
        sprite.position.y += 1.8;
        sprite.position.x += (Math.random() - 0.5) * 0.3; // slight random offset
        scene.add(sprite);
        floatingTexts.push({ sprite, life: 50, maxLife: 50, startY: sprite.position.y });
    }

    function updateFloatingTexts() {
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];
            const progress = 1 - (ft.life / ft.maxLife);
            // Ease-out upward movement (fast start, slow end)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            ft.sprite.position.y = ft.startY + easeOut * 2.0;
            // Scale up slightly then back down
            const scaleEase = progress < 0.15 ? (1 + (progress / 0.15) * 0.3) : (1.3 - (progress - 0.15) * 0.35);
            ft.sprite.scale.set(1.6 * scaleEase, 0.5 * scaleEase, 1);
            // Fade out in last 40%
            ft.sprite.material.opacity = progress > 0.6 ? (1 - (progress - 0.6) / 0.4) : 1;
            ft.life--;
            if (ft.life <= 0) {
                scene.remove(ft.sprite);
                ft.sprite.material.map.dispose();
                ft.sprite.material.dispose();
                floatingTexts.splice(i, 1);
            }
        }
    }

    /* ─────────── HUD updates ─────────── */
    function showPowerup(text) {
        hudPowerup.textContent = text;
        hudPowerup.classList.add("visible");
        setTimeout(() => hudPowerup.classList.remove("visible"), 2000);
    }

    /* ─────────── coin collect pop on HUD icon ─────────── */
    const coinIconHUD = document.querySelector(".coin-icon-hud");
    function popCoinIcon() {
        if (!coinIconHUD) return;
        coinIconHUD.classList.remove("pop");
        void coinIconHUD.offsetWidth; // reflow
        coinIconHUD.classList.add("pop");
        setTimeout(() => coinIconHUD.classList.remove("pop"), 250);
    }

    /* ─────────── gold flash overlay ─────────── */
    function flashGold() {
        if (!goldFlash) return;
        goldFlash.classList.add("active");
        setTimeout(() => goldFlash.classList.remove("active"), 220);
    }

    /* ─────────── milestone notification text ─────────── */
    let milestoneTimeout = null;
    function showMilestoneText(text) {
        if (!milestoneNotif) return;
        clearTimeout(milestoneTimeout);
        milestoneNotif.classList.remove("active", "fade-out");
        milestoneNotif.textContent = text;
        void milestoneNotif.offsetWidth;
        milestoneNotif.classList.add("active");
        milestoneTimeout = setTimeout(() => {
            milestoneNotif.classList.remove("active");
            milestoneNotif.classList.add("fade-out");
            setTimeout(() => milestoneNotif.classList.remove("fade-out"), 500);
        }, 1400);
    }

    /* ─────────── milestone celebration ─────────── */
    let nextMilestoneIdx = 0;

    function checkMilestones() {
        if (nextMilestoneIdx >= MILESTONES.length) return;
        if (state.score >= MILESTONES[nextMilestoneIdx]) {
            celebrateMilestone(MILESTONES[nextMilestoneIdx]);
            nextMilestoneIdx++;
        }
    }

    function celebrateMilestone(score) {
        sfx.milestone();
        flashGold();
        if (player) {
            for (let i = 0; i < 4; i++) spawnSparks(player.position, 14);
        }
        const labels = ["NICE!", "AWESOME!", "INCREDIBLE!", "LEGENDARY!", "UNSTOPPABLE!", "DEITY MODE!", "TRANSCENDENT!"];
        const label = labels[Math.min(nextMilestoneIdx, labels.length - 1)];
        showMilestoneText(`${label}  ${score.toLocaleString()}`);
        state.invulnTimer = Math.max(state.invulnTimer, 90);
    }

    function updateHUD() {
        hudScore.textContent = state.score.toLocaleString();
        hudCoins.textContent = state.coins.toLocaleString();
        hudDistance.textContent = Math.floor(state.distance) + "m";

        if (state.multiplier > 1 && state.multiplierTimer > 0) {
            hudMultiplier.textContent = `×${state.multiplier} (${Math.ceil(state.multiplierTimer / 60)}s)`;
            hudMultiplier.classList.add("visible");
        } else {
            hudMultiplier.classList.remove("visible");
        }
    }

    /* ─────────── input ─────────── */
    const keys = {};

    function handleKeyDown(e) {
        if (!state.running || state.gameOver) return;
        keys[e.code] = true;

        if (e.code === "KeyP" || e.code === "Escape") {
            togglePause();
            return;
        }
        if (state.paused) return;

        switch (e.code) {
            case "ArrowLeft": case "KeyA": moveLeft(); break;
            case "ArrowRight": case "KeyD": moveRight(); break;
            case "ArrowUp": case "KeyW": case "Space": jump(); break;
            case "ArrowDown": case "KeyS": roll(); break;
        }
        e.preventDefault();
    }

    function handleKeyUp(e) { keys[e.code] = false; }

    let touchStartX = 0, touchStartY = 0, touchStartTime = 0;

    function handleTouchStart(e) {
        if (!state.running) return;
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        touchStartTime = Date.now();
    }

    function handleTouchEnd(e) {
        if (!state.running || state.paused || state.gameOver) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        const dt = Date.now() - touchStartTime;

        if (dt > 500) return;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const minSwipe = 30;

        if (absDx > absDy && absDx > minSwipe) {
            dx > 0 ? moveRight() : moveLeft();
        } else if (absDy > absDx && absDy > minSwipe) {
            dy < 0 ? jump() : roll();
        }
    }

    function moveLeft() { if (state.targetLane > 0) { state.targetLane--; sfx.lane(); } }
    function moveRight() { if (state.targetLane < 2) { state.targetLane++; sfx.lane(); } }
    function jump() {
        if (!state.jumping && !state.rolling) {
            state.yVel = JUMP_VEL;
            state.jumping = true;
            sfx.jump();
        }
    }
    function roll() {
        if (!state.rolling && !state.jumping) {
            state.rolling = true;
            state.rollTimer = ROLL_DUR;
            sfx.roll();
        }
    }

    /* ─────────── game flow ─────────── */
    function startGame() {
        initAudio();
        clearWorld();
        resetState();
        createPlayer();

        for (let i = 0; i < 4; i++) {
            makeGroundChunk(-CHUNK_LEN * i + CHUNK_LEN / 2);
        }

        nextObstacleZ = -30;
        nextCoinZ = -15;
        nextBuildingZ = -10;
        nextPowerZ = -60;
        nextSceneryZ = -15;

        spawnWorld();

        state.running = true;
        startScreen.style.display = "none";
        gameOverScreen.style.display = "none";
        pauseScreen.style.display = "none";
        hud.classList.add("visible");

        // Start background music
        setTimeout(startBGM, 200);

        lastTime = 0;
        if (!animating) { animating = true; requestAnimationFrame(animate); }
    }

    function clearWorld() {
        stopBGM();
        for (const o of obstacles) scene.remove(o.mesh);
        for (const c of coins) scene.remove(c.mesh);
        for (const p of powerups) scene.remove(p.mesh);
        for (const b of buildings) scene.remove(b.mesh);
        for (const g of groundChunks) scene.remove(g.group);
        for (const s of sceneryObjs) scene.remove(s.mesh);
        for (const ft of floatingTexts) { scene.remove(ft.sprite); ft.sprite.material.dispose(); }
        for (const p of particles) { scene.remove(p.mesh); p.mesh.material.dispose(); }
        obstacles.length = 0;
        coins.length = 0;
        powerups.length = 0;
        buildings.length = 0;
        groundChunks.length = 0;
        sceneryObjs.length = 0;
        floatingTexts.length = 0;
        particles.length = 0;
        if (player) { scene.remove(player); player = null; playerParts = null; }
    }

    function gameOver() {
        state.gameOver = true;
        state.running = false;
        stopBGM();

        // Dramatic screen shake
        canvas.classList.remove("shaking");
        void canvas.offsetWidth;
        canvas.classList.add("shaking");
        setTimeout(() => canvas.classList.remove("shaking"), 700);

        sfx.hit();

        // Red flash with smooth fade
        flashOverlay.classList.add("active");
        setTimeout(() => flashOverlay.classList.remove("active"), 450);

        let isNew = false;
        if (state.score > state.highScore) {
            state.highScore = state.score;
            localStorage.setItem("subwaySurfersHigh", state.highScore.toString());
            isNew = true;
        }

        finalScore.textContent = state.score.toLocaleString();
        finalCoins.textContent = state.coins.toLocaleString();
        finalBest.textContent = state.highScore.toLocaleString();
        newBestBadge.style.display = isNew ? "block" : "none";

        // Delayed HUD hide and game over screen for dramatic effect
        setTimeout(() => { hud.classList.remove("visible"); }, 300);
        setTimeout(() => { gameOverScreen.style.display = "flex"; }, 850);
    }

    function togglePause() {
        if (state.gameOver) return;
        state.paused = !state.paused;
        pauseScreen.style.display = state.paused ? "flex" : "none";
        if (state.paused) { stopBGM(); } else if (!muted) { startBGM(); }
    }

    function goHome() {
        clearWorld();
        stopBGM();
        state.running = false;
        state.gameOver = false;
        gameOverScreen.style.display = "none";
        hud.classList.remove("visible");
        startScreen.style.display = "flex";
        showHighScore();
        initTitleScene();
    }

    function showHighScore() {
        startHigh.textContent = state.highScore > 0 ? `🏆 Best: ${state.highScore.toLocaleString()}` : "";
    }

    /* ─────────── main loop ─────────── */
    let animating = false;
    let lastTime = 0;
    const TARGET_DT = 1000 / 60; // 60 fps baseline

    function animate(now) {
        if (!animating) return;
        requestAnimationFrame(animate);

        if (!state.running || state.paused || state.gameOver) {
            lastTime = now;
            renderer.render(scene, camera);
            return;
        }

        // Delta-time: smooth frame-rate independent movement
        if (!lastTime) lastTime = now;
        const rawDt = now - lastTime;
        lastTime = now;
        // Clamp dt to avoid spiral of death on tab-switch / stutter
        const dt = Math.min(rawDt, 50) / TARGET_DT; // 1.0 at 60fps

        state.frame++;

        // Speed ramp (dt-scaled)
        state.speed = Math.min(state.speed + SPEED_INC * dt, MAX_SPEED);

        // Move forward (dt-scaled)
        const moveStep = state.speed * dt;
        player.position.z -= moveStep;
        state.distance += moveStep;

        // Score from distance
        if (state.frame % 6 === 0) state.score += state.multiplier;

        // Lane switching (smooth ease with acceleration, dt-scaled)
        const targetX = LANES[state.targetLane];
        const laneError = targetX - player.position.x;
        const laneLerp = 1 - Math.pow(1 - LANE_SWITCH * (1 + Math.abs(laneError) * 0.3), dt);
        player.position.x += laneError * laneLerp;
        state.laneIndex = state.targetLane;

        // Jump / gravity (with smooth landing, dt-scaled)
        if (state.jumping) {
            player.position.y += state.yVel * dt;
            state.yVel += GRAVITY * dt;
            // Tilt character slightly when in air
            if (playerParts) {
                playerParts.torso.rotation.x = state.yVel > 0 ? -0.08 : 0.06;
            }
            if (player.position.y <= GROUND_Y) {
                player.position.y = GROUND_Y;
                state.yVel = 0;
                state.jumping = false;
                spawnDust(player.position, 5);
                // Landing squash effect
                if (playerParts) {
                    playerParts.torso.rotation.x = 0;
                }
            }
        }

        // Roll (dt-scaled)
        if (state.rolling) {
            state.rollTimer -= dt;
            if (state.rollTimer <= 0) state.rolling = false;
        }

        // Timers (dt-scaled)
        if (state.magnetTimer > 0) state.magnetTimer -= dt;
        if (state.multiplierTimer > 0) {
            state.multiplierTimer -= dt;
            if (state.multiplierTimer <= 0) state.multiplier = 1;
        }
        if (state.invulnTimer > 0) state.invulnTimer -= dt;

        // Dust particles while running (subtle trail — every 8 frames)
        if (state.frame % 8 === 0 && !state.jumping) {
            spawnDust(player.position, 2);
        }

        // Animate character
        animatePlayer(state.frame);

        // Animate coins (smooth spin + gentle bob) — only within visible range
        const pz = player.position.z;
        for (const c of coins) {
            if (!c.collected && Math.abs(c.mesh.position.z - pz) < COIN_ANIM_RANGE) {
                c.mesh.rotation.y += COIN_SPIN;
                // Smooth sine bob (per-coin phase offset for variety)
                c.mesh.position.y = (c.baseY || 1.0) + Math.sin(state.frame * 0.04 + c.z * 0.5) * 0.12;
                // Subtle glow pulse on the sprite child
                const glowChild = c.mesh.children[c.mesh.children.length - 1];
                if (glowChild && glowChild.material) {
                    glowChild.material.opacity = 0.12 + Math.sin(state.frame * 0.06 + c.z) * 0.06;
                }
            }
        }

        // Animate powerups (smooth rotation + bob)
        for (const p of powerups) {
            if (!p.collected) {
                p.mesh.rotation.y += 0.03;
                p.mesh.children[0].rotation.x += 0.015;
                p.mesh.children[0].rotation.z += 0.01;
                p.mesh.position.y = 1.5 + Math.sin(state.frame * 0.045) * 0.3;
                // Rings orbit smoothly
                if (p.mesh.children[1]) {
                    p.mesh.children[1].rotation.x += 0.025;
                    p.mesh.children[1].rotation.z += 0.015;
                }
                if (p.mesh.children[2]) {
                    p.mesh.children[2].rotation.y += 0.02;
                    p.mesh.children[2].rotation.z += 0.03;
                }
            }
        }

        // Spawning & cleanup
        spawnWorld();
        manageGround();
        collectItems();
        updateParticles(dt);
        checkMilestones();

        // Collision
        if (state.invulnTimer <= 0 && checkCollisions()) {
            gameOver();
            renderer.render(scene, camera);
            return;
        }

        if (state.frame % 30 === 0) cleanBehind(); // twice as often keeps scene lean

        updateFloatingTexts();

        // Camera follow (silky smooth with dynamic framing, dt-scaled)
        const camTargetZ = player.position.z + CAM_Z;
        const camTargetX = player.position.x * 0.3;
        const camTargetY = CAM_Y + Math.abs(player.position.x) * 0.06 + (state.jumping ? state.yVel * 2 : 0);
        camera.position.z = lerp(camera.position.z, camTargetZ, 1 - Math.pow(1 - 0.09, dt));
        camera.position.x = lerp(camera.position.x, camTargetX, 1 - Math.pow(1 - 0.06, dt));
        camera.position.y = lerp(camera.position.y, camTargetY, 1 - Math.pow(1 - 0.05, dt));
        // Look-at with smooth transition (slight look-ahead based on lane)
        const lookX = lerp(camera.position.x, player.position.x * 0.2, 0.05);
        const lookY = lerp(CAM_LOOKAT_Y, CAM_LOOKAT_Y + (state.jumping ? 0.5 : 0), 0.1);
        camera.lookAt(lookX, lookY, player.position.z - 13);

        // Player light follows every frame (cheap position set)
        playerLight.position.set(player.position.x, 3, player.position.z + 2);

        // Directional light + shadow map — update every N frames only
        if (state.frame % SHADOW_UPDATE_INTERVAL === 0) {
            dirLight.position.set(player.position.x + 8, 18, player.position.z + 10);
            dirLight.target.position.set(player.position.x, 0, player.position.z - 5);
            dirLight.target.updateMatrixWorld();
            renderer.shadowMap.needsUpdate = true;
        }

        // Fog colour shift — smooth atmospheric transition
        if (state.frame % 4 === 0) {
            const speedFactor = (state.speed - RUN_SPEED) / (MAX_SPEED - RUN_SPEED);
            const fogR = 0.05 + speedFactor * 0.04;
            const fogG = 0.03 + speedFactor * 0.015;
            const fogB = 0.12 + speedFactor * 0.04;
            const curBg = scene.background;
            scene.background.setRGB(
                lerp(curBg.r, fogR, 0.05),
                lerp(curBg.g, fogG, 0.05),
                lerp(curBg.b, fogB, 0.05)
            );
            scene.fog.color.copy(scene.background);
        }

        // HUD DOM updates — every 2 frames is unnoticeable and halves layout work
        if (state.frame % 2 === 0) updateHUD();

        renderer.render(scene, camera);
    }

    /* ─────────── event listeners ─────────── */
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });

    btnPlay.addEventListener("click", startGame);
    btnRestart.addEventListener("click", startGame);
    btnHome.addEventListener("click", goHome);
    btnResume.addEventListener("click", togglePause);
    btnPause.addEventListener("click", togglePause);

    btnMute.addEventListener("click", () => {
        muted = !muted;
        btnMute.textContent = muted ? "🔇" : "🔊";
        if (masterGain) masterGain.gain.value = muted ? 0 : 0.35;
        if (muted) { stopBGM(); } else if (state.running && !state.paused && !state.gameOver) { startBGM(); }
    });

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    /* ─────────── initial scene (cinematic title screen) ─────────── */
    function initTitleScene() {
        for (let i = 0; i < 3; i++) {
            makeGroundChunk(-CHUNK_LEN * i + CHUNK_LEN / 2);
        }
        for (let z = 0; z > -200; z -= 10) {
            spawnBuilding(z);
        }
        for (let z = -5; z > -200; z -= 18) {
            spawnLampPost(z, Math.random() < 0.5 ? -1 : 1);
        }
        let titleFrame = 0;
        function titleAnimate() {
            if (state.running) return;
            requestAnimationFrame(titleAnimate);
            titleFrame++;
            // Smoother, more cinematic camera orbit
            const orbitSpeed = 0.0015;
            camera.position.x = Math.sin(titleFrame * orbitSpeed) * 3.5;
            camera.position.y = CAM_Y + Math.sin(titleFrame * orbitSpeed * 2.5) * 0.5;
            camera.position.z = 9 + Math.sin(titleFrame * orbitSpeed * 1.8) * 2.5;
            camera.lookAt(0, CAM_LOOKAT_Y, -25);
            renderer.render(scene, camera);
        }
        titleAnimate();
    }

    showHighScore();
    initTitleScene();
})();
