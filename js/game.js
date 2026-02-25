/* ============================================================
   SUBWAY SURFERS — Run on the Railway  (Enhanced Edition)
   Full 3D Endless-Runner Game Engine (Three.js r128)
   ============================================================ */

(() => {
    "use strict";

    /* ─────────── constants ─────────── */
    const LANE_WIDTH = 2.4;
    const LANES = [-LANE_WIDTH, 0, LANE_WIDTH];
    const RUN_SPEED = 0.38;
    const SPEED_INC = 0.0001;
    const MAX_SPEED = 0.72;
    const JUMP_VEL = 0.28;
    const GRAVITY = -0.012;
    const ROLL_DUR = 32;
    const LANE_SWITCH = 0.22;
    const COIN_SPIN = 0.06;
    const GROUND_Y = 0;
    const CAM_Y = 4.8;
    const CAM_Z = 9.5;
    const CAM_LOOKAT_Y = 1.4;
    const FOG_NEAR = 35;
    const FOG_FAR = 120;
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
        coin() { playTone(1200, 0.08, "square", 0.18); setTimeout(() => playTone(1600, 0.08, "square", 0.12), 50); },
        jump() { playTone(400, 0.15, "triangle", 0.22); },
        roll() { playTone(180, 0.12, "sawtooth", 0.12); },
        lane() { playTone(600, 0.06, "sine", 0.08); },
        hit() { playTone(100, 0.4, "sawtooth", 0.3); },
        powerup() { playTone(800, 0.1, "sine", 0.18); setTimeout(() => playTone(1200, 0.15, "sine", 0.12), 80); },
    };

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

    function makeBuildingTexture(color, floors, cols) {
        const c = document.createElement("canvas");
        c.width = 256; c.height = 512;
        const ctx = c.getContext("2d");
        // Base
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 256, 512);
        // Brick-like lines
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 0.5;
        for (let y = 0; y < 512; y += 16) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
            const off = (Math.floor(y / 16) % 2) * 16;
            for (let x = off; x < 256; x += 32) {
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 16); ctx.stroke();
            }
        }
        // Windows
        const ww = 20, wh = 28, gap = 8;
        const totalW = cols * (ww + gap);
        const startX = (256 - totalW) / 2 + gap / 2;
        for (let r = 0; r < floors; r++) {
            for (let cc = 0; cc < cols; cc++) {
                const lit = Math.random() > 0.25;
                ctx.fillStyle = lit ? "#ffeeaa" : "#222233";
                ctx.fillRect(startX + cc * (ww + gap), 30 + r * 50, ww, wh);
                if (lit) {
                    ctx.fillStyle = "rgba(255,238,170,0.3)";
                    ctx.fillRect(startX + cc * (ww + gap) - 2, 30 + r * 50 - 2, ww + 4, wh + 4);
                }
            }
        }
        const tex = new THREE.CanvasTexture(c);
        return tex;
    }

    /* ─────────── Three.js setup ─────────── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0820);
    scene.fog = new THREE.FogExp2(0x0d0820, 0.012);

    const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 180);
    camera.position.set(0, CAM_Y, CAM_Z);
    camera.lookAt(0, CAM_LOOKAT_Y, -10);

    /* ─── lighting (enhanced) ─── */
    const ambLight = new THREE.AmbientLight(0x556688, 0.45);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.1);
    dirLight.position.set(8, 18, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.bias = -0.001;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);
    scene.add(dirLight.target);

    const hemiLight = new THREE.HemisphereLight(0x8866cc, 0x224433, 0.5);
    scene.add(hemiLight);

    // Rim light (back light for depth)
    const rimLight = new THREE.DirectionalLight(0x6644bb, 0.35);
    rimLight.position.set(-5, 8, -15);
    scene.add(rimLight);

    // Warm point light following player for atmosphere
    const playerLight = new THREE.PointLight(0xffa040, 0.6, 18);
    playerLight.position.set(0, 3, 0);
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
        player: new THREE.MeshStandardMaterial({ color: 0x2288ee, roughness: 0.35, metalness: 0.1 }),
        playerHoodie: new THREE.MeshStandardMaterial({ color: 0x2288ee, roughness: 0.45 }),
        playerHead: new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.55 }),
        playerHair: new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.75 }),
        playerShoe: new THREE.MeshStandardMaterial({ color: 0xff2233, roughness: 0.45, metalness: 0.1 }),
        playerSole: new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.6 }),
        playerPant: new THREE.MeshStandardMaterial({ color: 0x1a1a44, roughness: 0.5 }),
        playerBP: new THREE.MeshStandardMaterial({ color: 0xff6633, roughness: 0.45 }),
        playerCap: new THREE.MeshStandardMaterial({ color: 0xff3344, roughness: 0.4 }),
        playerCapBrim: new THREE.MeshStandardMaterial({ color: 0xdd2233, roughness: 0.5 }),
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
        coin: new THREE.MeshStandardMaterial({ color: 0xffdd33, metalness: 0.85, roughness: 0.15, emissive: 0xffaa00, emissiveIntensity: 0.4 }),
        coinEdge: new THREE.MeshStandardMaterial({ color: 0xddbb00, metalness: 0.9, roughness: 0.2 }),
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

    /* ─────────── geometry (cached) ─────────── */
    const geo = {
        box: new THREE.BoxGeometry(1, 1, 1),
        coin: new THREE.CylinderGeometry(0.38, 0.38, 0.1, 24),
        sphere: new THREE.SphereGeometry(0.35, 16, 16),
        powerup: new THREE.OctahedronGeometry(0.45, 1),
        wheel: new THREE.CylinderGeometry(0.3, 0.3, 0.12, 12),
    };

    /* ─────────── helpers ─────────── */
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function rndInt(a, b) { return Math.floor(rnd(a, b + 1)); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    /* ─────────── particle system (dust/sparks) ─────────── */
    const particles = [];
    const particleGeo = new THREE.SphereGeometry(0.04, 4, 4);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xccbb99, transparent: true, opacity: 0.6 });
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.8 });

    function spawnDust(pos, count = 3) {
        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(particleGeo, particleMat.clone());
            mesh.position.set(
                pos.x + rnd(-0.3, 0.3),
                pos.y + rnd(0, 0.2),
                pos.z + rnd(0.3, 0.8)
            );
            mesh.scale.setScalar(rnd(0.5, 1.5));
            scene.add(mesh);
            particles.push({
                mesh,
                vx: rnd(-0.02, 0.02),
                vy: rnd(0.01, 0.04),
                vz: rnd(0.02, 0.06),
                life: rndInt(15, 30),
                maxLife: 30,
            });
        }
    }

    function spawnSparks(pos, count = 5) {
        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(particleGeo, sparkMat.clone());
            mesh.position.set(pos.x + rnd(-0.5, 0.5), pos.y + rnd(0.5, 1.5), pos.z + rnd(-0.3, 0.3));
            mesh.scale.setScalar(rnd(0.3, 0.8));
            scene.add(mesh);
            particles.push({
                mesh,
                vx: rnd(-0.05, 0.05),
                vy: rnd(0.03, 0.08),
                vz: rnd(-0.03, 0.03),
                life: rndInt(10, 20),
                maxLife: 20,
            });
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.mesh.position.x += p.vx;
            p.mesh.position.y += p.vy;
            p.mesh.position.z += p.vz;
            p.vy -= 0.001;
            p.life--;
            p.mesh.material.opacity = (p.life / p.maxLife) * 0.6;
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

            // Sleepers (wooden ties — alternating shades)
            for (let s = -CHUNK_LEN / 2; s < CHUNK_LEN / 2; s += 2.0) {
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
        // Lamp head
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), mat.lampGlow);
        lamp.position.set(side * -0.9, 4.3, 0);
        g.add(lamp);
        // Actual point light
        const light = new THREE.PointLight(0xffddaa, 0.4, 10);
        light.position.set(side * -0.9, 4.0, 0);
        g.add(light);

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
    const buildColors = ["#334455", "#443355", "#884433", "#555566", "#3a3a55", "#4a3344"];

    function spawnBuilding(z) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const w = rnd(4, 9);
        const h = rnd(8, 28);
        const d = rnd(5, 12);
        const floors = Math.floor(h / 3);
        const cols = Math.floor(w / 2);
        const bColor = pick(buildColors);

        const buildTex = makeBuildingTexture(bColor, floors, cols);
        const buildMat = new THREE.MeshStandardMaterial({ map: buildTex, roughness: 0.88 });

        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildMat);
        mesh.position.set(side * (GROUND_W / 2 - w / 2 + rnd(0, 4)), h / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        // Rooftop details
        const roofGroup = new THREE.Group();

        // AC units / vents
        if (Math.random() < 0.6) {
            const ac = new THREE.Mesh(new THREE.BoxGeometry(rnd(0.5, 1.2), rnd(0.4, 0.7), rnd(0.5, 0.8)), mat.rooftop);
            ac.position.set(rnd(-w / 3, w / 3), h / 2 + 0.3, rnd(-d / 3, d / 3));
            ac.castShadow = true;
            roofGroup.add(ac);
        }

        // Water tank
        if (Math.random() < 0.3) {
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8), mat.rooftop);
            tank.position.set(rnd(-w / 4, w / 4), h / 2 + 0.8, rnd(-d / 4, d / 4));
            tank.castShadow = true;
            roofGroup.add(tank);
        }

        // Antenna
        if (Math.random() < 0.4) {
            const ant = new THREE.Mesh(new THREE.BoxGeometry(0.04, rnd(1.5, 3.5), 0.04), mat.antenna);
            ant.position.set(rnd(-w / 3, w / 3), h / 2 + 1.5, rnd(-d / 3, d / 3));
            roofGroup.add(ant);
        }

        // Neon sign on side
        if (Math.random() < 0.35) {
            const neonMat = pick([mat.neonRed, mat.neonBlue, mat.neonGreen]);
            const neon = new THREE.Mesh(new THREE.BoxGeometry(rnd(1, 2.5), rnd(0.3, 0.6), 0.06), neonMat);
            const ny = rnd(h * 0.3, h * 0.7);
            neon.position.set(0, ny - h / 2, side > 0 ? -d / 2 - 0.04 : d / 2 + 0.04);
            if (side < 0) neon.rotation.y = Math.PI;
            mesh.add(neon);

            // Neon glow light
            const neonLight = new THREE.PointLight(neonMat.emissive.getHex(), 0.3, 6);
            neonLight.position.copy(neon.position);
            mesh.add(neonLight);
        }

        mesh.add(roofGroup);
        buildings.push({ mesh, z });
    }

    /* ─────────── player character (enhanced) ─────────── */
    let player, playerParts;

    function createPlayer() {
        player = new THREE.Group();

        // Body (torso / hoodie)
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.92, 0.48), mat.playerHoodie);
        torso.position.y = 1.28;
        torso.castShadow = true;
        player.add(torso);

        // Hoodie details — collar
        const collar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.35), mat.playerHoodie);
        collar.position.y = 1.77;
        player.add(collar);

        // Hood (behind head)
        const hood = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.35, 0.3), mat.playerHoodie);
        hood.position.set(0, 1.9, 0.18);
        player.add(hood);

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), mat.playerHead);
        head.position.y = 2.0;
        head.castShadow = true;
        player.add(head);

        // Cap
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.12, 0.48), mat.playerCap);
        cap.position.set(0, 2.18, -0.02);
        cap.castShadow = true;
        player.add(cap);

        // Cap brim
        const brim = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.2), mat.playerCapBrim);
        brim.position.set(0, 2.14, -0.28);
        player.add(brim);

        // Eyes (two small spheres)
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
        for (const ex of [-0.1, 0.1]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
            eye.position.set(ex, 2.02, -0.27);
            player.add(eye);
        }

        // Left arm
        const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.78, 0.22), mat.playerHoodie);
        lArm.position.set(-0.48, 1.25, 0);
        lArm.castShadow = true;
        player.add(lArm);

        // Right arm
        const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.78, 0.22), mat.playerHoodie);
        rArm.position.set(0.48, 1.25, 0);
        rArm.castShadow = true;
        player.add(rArm);

        // Hands
        const handMat = mat.playerHead;
        const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), handMat);
        lHand.position.set(-0.48, 0.82, 0);
        player.add(lHand);
        const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), handMat);
        rHand.position.set(0.48, 0.82, 0);
        player.add(rHand);

        // Left leg
        const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.72, 0.26), mat.playerPant);
        lLeg.position.set(-0.18, 0.56, 0);
        lLeg.castShadow = true;
        player.add(lLeg);

        // Right leg
        const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.72, 0.26), mat.playerPant);
        rLeg.position.set(0.18, 0.56, 0);
        rLeg.castShadow = true;
        player.add(rLeg);

        // Shoes
        const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.38), mat.playerShoe);
        lShoe.position.set(-0.18, 0.08, 0.04);
        player.add(lShoe);
        const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.38), mat.playerShoe);
        rShoe.position.set(0.18, 0.08, 0.04);
        player.add(rShoe);

        // Shoe soles
        const lSole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.4), mat.playerSole);
        lSole.position.set(-0.18, 0.02, 0.04);
        player.add(lSole);
        const rSole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.4), mat.playerSole);
        rSole.position.set(0.18, 0.02, 0.04);
        player.add(rSole);

        // Backpack
        const bp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.25), mat.playerBP);
        bp.position.set(0, 1.3, 0.35);
        bp.castShadow = true;
        player.add(bp);

        // Backpack straps
        for (const sx of [-0.18, 0.18]) {
            const strap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.04), mat.playerBP);
            strap.position.set(sx, 1.35, 0.18);
            player.add(strap);
        }

        playerParts = { torso, head, cap, hood, lArm, rArm, lHand, rHand, lLeg, rLeg, lShoe, rShoe, bp };
        player.position.set(0, GROUND_Y, 0);
        scene.add(player);
    }

    /* ─── animate player (run cycle — enhanced) ─── */
    function animatePlayer(frame) {
        if (!playerParts) return;
        const { lArm, rArm, lHand, rHand, lLeg, rLeg, lShoe, rShoe, torso, head, cap, hood, bp } = playerParts;
        const spd = state.speed / RUN_SPEED;
        const t = frame * 0.2 * spd;
        const swing = Math.sin(t) * 0.55;

        if (state.rolling) {
            player.scale.set(1, 0.45, 1);
            player.position.y = state.jumping ? player.position.y : GROUND_Y;
        } else {
            player.scale.set(1, 1, 1);
            // Arms pump
            lArm.rotation.x = swing * 0.9;
            rArm.rotation.x = -swing * 0.9;
            lHand.rotation.x = swing * 0.5;
            rHand.rotation.x = -swing * 0.5;
            lHand.position.y = 0.82 + Math.sin(t) * 0.05;
            rHand.position.y = 0.82 - Math.sin(t) * 0.05;
            // Legs stride
            lLeg.rotation.x = -swing * 0.85;
            rLeg.rotation.x = swing * 0.85;
            lShoe.rotation.x = -swing * 0.35;
            rShoe.rotation.x = swing * 0.35;
            // Body bob & twist
            torso.rotation.z = Math.sin(t) * 0.025;
            torso.rotation.y = Math.sin(t) * 0.02;
            torso.position.y = 1.28 + Math.abs(Math.sin(t)) * 0.06;
            // Head slight bob
            head.position.y = 2.0 + Math.abs(Math.sin(t)) * 0.04;
            head.rotation.y = Math.sin(t * 0.35) * 0.04;
            cap.position.y = 2.18 + Math.abs(Math.sin(t)) * 0.04;
            hood.position.y = 1.9 + Math.abs(Math.sin(t)) * 0.04;
            // Backpack sway
            bp.rotation.z = Math.sin(t * 0.8) * 0.03;
            bp.position.y = 1.3 + Math.abs(Math.sin(t)) * 0.03;
        }
    }

    /* ─────────── obstacles (enhanced) ─────────── */
    const obstacles = [];

    function spawnTrain(lane, z) {
        const trainLen = rnd(8, 16);
        const g = new THREE.Group();
        const isAlt = Math.random() < 0.5;
        const bodyMat = isAlt ? mat.trainAlt : mat.train;

        // Side textures
        const sideTex = makeTrainSideTexture(null, isAlt);
        const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.35, metalness: 0.35 });

        // Undercarriage / chassis
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.2, trainLen + 0.2), mat.trainBottom);
        chassis.position.y = 0.25;
        g.add(chassis);

        // Wheel bogies (front and back)
        for (const bz of [-trainLen / 2 + 1.5, trainLen / 2 - 1.5]) {
            const bogieFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 1.8), mat.trainBottom);
            bogieFrame.position.set(0, 0.16, bz);
            g.add(bogieFrame);
            // 4 wheels per bogie
            for (const wx of [-0.65, 0.65]) {
                for (const wz of [-0.5, 0.5]) {
                    const wheel = new THREE.Mesh(geo.wheel, mat.trainWheel);
                    wheel.rotation.z = Math.PI / 2;
                    wheel.position.set(wx, 0.12, bz + wz);
                    g.add(wheel);
                }
            }
        }

        // Main body
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.5, trainLen), bodyMat);
        body.position.y = 1.6;
        body.castShadow = true;
        body.receiveShadow = true;
        g.add(body);

        // Side panels with texture (left & right)
        for (const sx of [-0.93, 0.93]) {
            const sidePanel = new THREE.Mesh(
                new THREE.PlaneGeometry(trainLen, 2.5),
                sideMat.clone()
            );
            sidePanel.position.set(sx, 1.6, 0);
            sidePanel.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
            g.add(sidePanel);
        }

        // Rounded roof (using multiple segments for curve illusion)
        const roofW = 1.7;
        const roofMain = new THREE.Mesh(
            new THREE.BoxGeometry(roofW, 0.1, trainLen + 0.1),
            mat.trainRoof
        );
        roofMain.position.y = 2.9;
        g.add(roofMain);

        // Roof bevels
        for (const rx of [-1, 1]) {
            const bevel = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.08, trainLen + 0.1),
                mat.trainRoof
            );
            bevel.position.set(rx * 0.85, 2.86, 0);
            bevel.rotation.z = rx * 0.25;
            g.add(bevel);
        }

        // AC unit on roof
        const ac = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 2), mat.trainRoof);
        ac.position.set(0, 3.0, 0);
        g.add(ac);

        // Windows (recessed look)
        const winSpacing = 1.6;
        const winCount = Math.floor(trainLen / winSpacing) - 1;
        for (let i = 0; i < winCount; i++) {
            const wz = -trainLen / 2 + 1.3 + i * winSpacing;
            const isDoor = (i === Math.floor(winCount / 3) || i === Math.floor(winCount * 2 / 3));

            for (const sx of [-0.935, 0.935]) {
                if (isDoor) {
                    // Door
                    const door = new THREE.Mesh(
                        new THREE.PlaneGeometry(0.7, 2.0),
                        mat.trainDoor
                    );
                    door.position.set(sx, 1.35, wz);
                    door.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
                    g.add(door);
                    // Door window
                    const dw = new THREE.Mesh(
                        new THREE.PlaneGeometry(0.45, 0.6),
                        mat.trainWindow
                    );
                    dw.position.set(sx * 1.001, 1.9, wz);
                    dw.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
                    g.add(dw);
                } else {
                    // Window
                    const win = new THREE.Mesh(
                        new THREE.PlaneGeometry(0.9, 0.65),
                        mat.trainWindow
                    );
                    win.position.set(sx * 1.001, 2.0, wz);
                    win.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
                    g.add(win);
                }
            }
        }

        // Accent stripe along bottom
        for (const sx of [-0.94, 0.94]) {
            const stripe = new THREE.Mesh(
                new THREE.PlaneGeometry(trainLen - 0.5, 0.08),
                mat.trainStripe
            );
            stripe.position.set(sx, 0.55, 0);
            stripe.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
            g.add(stripe);
        }

        // Front face
        const front = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 2.5), bodyMat);
        front.position.set(0, 1.6, -trainLen / 2 - 0.01);
        g.add(front);

        // Headlights
        for (const hx of [-0.5, 0.5]) {
            const hl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), mat.headlight);
            hl.position.set(hx, 1.0, -trainLen / 2 - 0.05);
            g.add(hl);
        }
        // Front number plate / indicator
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.02), mat.trainStripe);
        plate.position.set(0, 2.4, -trainLen / 2 - 0.02);
        g.add(plate);

        // Coupling at back
        const coupling = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), mat.trainBottom);
        coupling.position.set(0, 0.4, trainLen / 2 + 0.1);
        g.add(coupling);

        g.position.set(LANES[lane], GROUND_Y, z);
        scene.add(g);

        obstacles.push({
            mesh: g,
            type: "train",
            lane,
            z,
            halfW: 0.92,
            halfH: 1.5,
            halfD: trainLen / 2,
        });
    }

    function spawnBarrier(lane, z) {
        const g = new THREE.Group();

        // Posts (cylindrical)
        for (const px of [-0.7, 0.7]) {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8), mat.barrier);
            post.position.set(px, 0.8, 0);
            post.castShadow = true;
            g.add(post);
            // Base
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 8), mat.barrierStripe);
            base.position.set(px, 0.04, 0);
            g.add(base);
        }

        // Horizontal bars (alternating warning stripes)
        for (let i = 0; i < 3; i++) {
            const bar = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 0.1, 0.08),
                i % 2 === 0 ? mat.barrier : mat.barrierStripe
            );
            bar.position.set(0, 0.4 + i * 0.4, 0);
            bar.castShadow = true;
            g.add(bar);
        }

        // Warning diamond
        const diamond = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.25, 0.04),
            mat.barrierWarn
        );
        diamond.rotation.z = Math.PI / 4;
        diamond.position.set(0, 1.35, -0.06);
        g.add(diamond);

        g.position.set(LANES[lane], GROUND_Y, z);
        scene.add(g);

        obstacles.push({
            mesh: g,
            type: "barrier",
            lane,
            z,
            halfW: 0.8,
            halfH: 0.8,
            halfD: 0.2,
            canRollUnder: false,
            canJumpOver: true,
        });
    }

    function spawnLowBarrier(lane, z) {
        const g = new THREE.Group();

        const bar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.3), mat.barrierStripe);
        bar.position.y = 0.18;
        bar.castShadow = true;
        g.add(bar);

        // Warning stripes
        for (let i = 0; i < 5; i++) {
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.36, 0.02), i % 2 === 0 ? mat.barrier : mat.barrierStripe);
            stripe.position.set(-0.6 + i * 0.3, 0.18, -0.16);
            g.add(stripe);
        }

        g.position.set(LANES[lane], GROUND_Y, z);
        scene.add(g);

        obstacles.push({
            mesh: g,
            type: "lowBarrier",
            lane,
            z,
            halfW: 0.9,
            halfH: 0.2,
            halfD: 0.15,
            canRollUnder: false,
            canJumpOver: true,
        });
    }

    function spawnUpperBarrier(lane, z) {
        const g = new THREE.Group();

        for (const px of [-0.8, 0.8]) {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 8), mat.barrier);
            post.position.set(px, 1.4, 0);
            g.add(post);
        }

        const bar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.32, 0.18), mat.barrier);
        bar.position.y = 1.5;
        bar.castShadow = true;
        g.add(bar);

        // Warning tape effect
        const tape = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.02), mat.barrierWarn);
        tape.position.set(0, 1.68, -0.1);
        g.add(tape);

        g.position.set(LANES[lane], GROUND_Y, z);
        scene.add(g);

        obstacles.push({
            mesh: g,
            type: "upperBarrier",
            lane,
            z,
            halfW: 0.9,
            halfH: 0.18,
            halfD: 0.1,
            yCenter: 1.5,
            canRollUnder: true,
            canJumpOver: false,
        });
    }

    /* ─────────── coins (enhanced) ─────────── */
    const coins = [];

    function spawnCoinRow(lane, z, count = 5) {
        for (let i = 0; i < count; i++) {
            const coinG = new THREE.Group();
            // Main coin face
            const face = new THREE.Mesh(geo.coin, mat.coin);
            face.rotation.x = Math.PI / 2;
            coinG.add(face);
            // Edge ring
            const edge = new THREE.Mesh(
                new THREE.TorusGeometry(0.38, 0.04, 8, 24),
                mat.coinEdge
            );
            coinG.add(edge);
            // Inner star
            const star = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.12, 0),
                new THREE.MeshStandardMaterial({ color: 0xffee00, emissive: 0xffcc00, emissiveIntensity: 0.5 })
            );
            star.position.y = 0.0;
            coinG.add(star);

            // Glow sprite
            const glowMat = new THREE.SpriteMaterial({
                color: 0xffdd44,
                transparent: true,
                opacity: 0.25,
                depthWrite: false,
            });
            const glow = new THREE.Sprite(glowMat);
            glow.scale.set(1.2, 1.2, 1);
            coinG.add(glow);

            coinG.position.set(LANES[lane], 1.0, z - i * 1.8);
            scene.add(coinG);
            coins.push({ mesh: coinG, lane, z: z - i * 1.8, collected: false });
        }
    }

    function spawnCoinArc(lane, z) {
        for (let i = 0; i < 6; i++) {
            const t = i / 5;
            const yOff = Math.sin(t * Math.PI) * 2.5;
            const coinG = new THREE.Group();
            const face = new THREE.Mesh(geo.coin, mat.coin);
            face.rotation.x = Math.PI / 2;
            coinG.add(face);
            const edge = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 8, 24), mat.coinEdge);
            coinG.add(edge);

            const glowMat = new THREE.SpriteMaterial({ color: 0xffdd44, transparent: true, opacity: 0.2, depthWrite: false });
            const glow = new THREE.Sprite(glowMat);
            glow.scale.set(1.0, 1.0, 1);
            coinG.add(glow);

            coinG.position.set(LANES[lane], 1.0 + yOff, z - i * 1.8);
            scene.add(coinG);
            coins.push({ mesh: coinG, lane, z: z - i * 1.8, collected: false });
        }
    }

    /* ─────────── powerups (enhanced) ─────────── */
    const powerups = [];

    function spawnPowerup(lane, z) {
        const type = Math.random() < 0.5 ? "magnet" : "multiplier";
        const m = type === "magnet" ? mat.powerGreen : mat.powerPurple;
        const g = new THREE.Group();

        const core = new THREE.Mesh(geo.powerup, m);
        core.castShadow = true;
        g.add(core);

        // Outer ring
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.55, 0.04, 8, 24),
            m.clone()
        );
        ring.material.transparent = true;
        ring.material.opacity = 0.5;
        g.add(ring);

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
                if (py < 3.0) return true;
            } else if (obs.type === "upperBarrier") {
                const barY = obs.yCenter || 1.5;
                if (py + pH > barY - obs.halfH && py < barY + obs.halfH) return true;
            } else if (obs.type === "lowBarrier") {
                if (py < obs.halfH * 2 + 0.1) return true;
            } else if (obs.type === "barrier") {
                if (py < 1.4) return true;
            }
        }
        return false;
    }

    /* ─────────── coin / powerup collection ─────────── */
    function collectItems() {
        const px = player.position.x;
        const py = player.position.y;
        const pz = player.position.z;
        const magnetRange = state.magnetTimer > 0 ? 4.5 : 1.2;

        for (const c of coins) {
            if (c.collected) continue;
            const dx = c.mesh.position.x - px;
            const dy = c.mesh.position.y - (py + 1);
            const dz = c.mesh.position.z - pz;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (state.magnetTimer > 0 && dist < magnetRange) {
                c.mesh.position.x = lerp(c.mesh.position.x, px, 0.18);
                c.mesh.position.y = lerp(c.mesh.position.y, py + 1, 0.18);
                c.mesh.position.z = lerp(c.mesh.position.z, pz, 0.18);
            }

            if (dist < 1.2) {
                c.collected = true;
                c.mesh.visible = false;
                const pts = 10 * state.multiplier;
                state.coins++;
                state.score += pts;
                sfx.coin();
                spawnSparks(c.mesh.position, 4);
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
                spawnSparks(p.mesh.position, 8);
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

    /* ─────────── floating text ─────────── */
    const floatingTexts = [];

    function showFloatingText(text, pos) {
        const c = document.createElement("canvas");
        c.width = 128; c.height = 48;
        const ctx = c.getContext("2d");
        ctx.font = "bold 28px Poppins, sans-serif";
        ctx.fillStyle = "#ffe94a";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeText(text, 64, 24);
        ctx.fillText(text, 64, 24);

        const tex = new THREE.CanvasTexture(c);
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.5, 0.6, 1);
        sprite.position.copy(pos);
        sprite.position.y += 1.5;
        scene.add(sprite);
        floatingTexts.push({ sprite, life: 40 });
    }

    function updateFloatingTexts() {
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];
            ft.sprite.position.y += 0.04;
            ft.sprite.material.opacity = ft.life / 40;
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

        if (!animating) { animating = true; animate(); }
    }

    function clearWorld() {
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
        hud.classList.remove("visible");
        sfx.hit();

        flashOverlay.classList.add("active");
        setTimeout(() => flashOverlay.classList.remove("active"), 300);

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

        setTimeout(() => { gameOverScreen.style.display = "flex"; }, 600);
    }

    function togglePause() {
        if (state.gameOver) return;
        state.paused = !state.paused;
        pauseScreen.style.display = state.paused ? "flex" : "none";
    }

    function goHome() {
        clearWorld();
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

    function animate() {
        if (!animating) return;
        requestAnimationFrame(animate);

        if (!state.running || state.paused || state.gameOver) {
            renderer.render(scene, camera);
            return;
        }

        state.frame++;

        // Speed ramp
        state.speed = Math.min(state.speed + SPEED_INC, MAX_SPEED);

        // Move forward
        player.position.z -= state.speed;
        state.distance += state.speed;

        // Score from distance
        if (state.frame % 6 === 0) state.score += state.multiplier;

        // Lane switching
        const targetX = LANES[state.targetLane];
        player.position.x = lerp(player.position.x, targetX, LANE_SWITCH);
        state.laneIndex = state.targetLane;

        // Jump / gravity
        if (state.jumping) {
            player.position.y += state.yVel;
            state.yVel += GRAVITY;
            if (player.position.y <= GROUND_Y) {
                player.position.y = GROUND_Y;
                state.yVel = 0;
                state.jumping = false;
                spawnDust(player.position, 4);
            }
        }

        // Roll
        if (state.rolling) {
            state.rollTimer--;
            if (state.rollTimer <= 0) state.rolling = false;
        }

        // Timers
        if (state.magnetTimer > 0) state.magnetTimer--;
        if (state.multiplierTimer > 0) {
            state.multiplierTimer--;
            if (state.multiplierTimer <= 0) state.multiplier = 1;
        }
        if (state.invulnTimer > 0) state.invulnTimer--;

        // Dust particles while running (every few frames)
        if (state.frame % 4 === 0 && !state.jumping) {
            spawnDust(player.position, 1);
        }

        // Animate character
        animatePlayer(state.frame);

        // Animate coins (spin + bob)
        for (const c of coins) {
            if (!c.collected) {
                c.mesh.rotation.y += COIN_SPIN;
                c.mesh.position.y = c.mesh.position.y + Math.sin(state.frame * 0.05 + c.z) * 0.002;
            }
        }

        // Animate powerups
        for (const p of powerups) {
            if (!p.collected) {
                p.mesh.rotation.y += 0.04;
                p.mesh.children[0].rotation.x += 0.02;
                p.mesh.position.y = 1.5 + Math.sin(state.frame * 0.06) * 0.35;
                // Ring rotation
                if (p.mesh.children[1]) {
                    p.mesh.children[1].rotation.x += 0.03;
                    p.mesh.children[1].rotation.z += 0.02;
                }
            }
        }

        // Spawning & cleanup
        spawnWorld();
        manageGround();
        collectItems();
        updateParticles();

        // Collision
        if (state.invulnTimer <= 0 && checkCollisions()) {
            gameOver();
            renderer.render(scene, camera);
            return;
        }

        if (state.frame % 60 === 0) cleanBehind();

        updateFloatingTexts();

        // Camera follow (smooth with slight tilt)
        const camTargetZ = player.position.z + CAM_Z;
        const camTargetX = player.position.x * 0.35;
        camera.position.z = lerp(camera.position.z, camTargetZ, 0.12);
        camera.position.x = lerp(camera.position.x, camTargetX, 0.08);
        camera.position.y = lerp(camera.position.y, CAM_Y + Math.abs(player.position.x) * 0.08, 0.06);
        camera.lookAt(
            player.position.x * 0.25,
            CAM_LOOKAT_Y,
            player.position.z - 12
        );

        // Player light follows
        playerLight.position.set(player.position.x, 3, player.position.z + 2);

        // Directional light follows
        dirLight.position.set(player.position.x + 8, 18, player.position.z + 10);
        dirLight.target.position.set(player.position.x, 0, player.position.z - 5);
        dirLight.target.updateMatrixWorld();

        // Dynamic fog color shift based on speed
        const speedFactor = (state.speed - RUN_SPEED) / (MAX_SPEED - RUN_SPEED);
        const fogR = 0.05 + speedFactor * 0.03;
        const fogG = 0.03 + speedFactor * 0.01;
        const fogB = 0.12 + speedFactor * 0.03;
        scene.background.setRGB(fogR, fogG, fogB);
        scene.fog.color.setRGB(fogR, fogG, fogB);

        updateHUD();
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
    });

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    /* ─────────── initial scene (title screen background) ─────────── */
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
            camera.position.x = Math.sin(titleFrame * 0.002) * 3;
            camera.position.y = CAM_Y + Math.sin(titleFrame * 0.004) * 0.6;
            camera.position.z = 8 + Math.sin(titleFrame * 0.003) * 2;
            camera.lookAt(0, CAM_LOOKAT_Y, -25);
            renderer.render(scene, camera);
        }
        titleAnimate();
    }

    showHighScore();
    initTitleScene();
})();
