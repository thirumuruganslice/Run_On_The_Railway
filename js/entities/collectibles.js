/* ============================================================
   Collectibles — Run on the Railway
   Coins and powerups.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;
    var C = GAME.Config;
    var H = GAME.Helpers;
    var mat = GAME.Materials.mat;
    var geo = GAME.Geometry.geo;
    var scene = GAME.Renderer.scene;

    var coins = [];
    var powerups = [];

    var coinStarMat = new THREE.MeshStandardMaterial({
        color: 0xffe066, emissive: 0xffcc00, emissiveIntensity: 0.4,
        metalness: 0.9, roughness: 0.1,
    });

    function createCoinMesh() {
        var coinG = new THREE.Group();

        var face = new THREE.Mesh(geo.coin, mat.coin);
        face.rotation.x = Math.PI / 2;
        face.scale.set(1, 1, 1.1);
        coinG.add(face);

        var inner = new THREE.Mesh(geo.coinInner, mat.coinEdge);
        inner.rotation.x = Math.PI / 2;
        inner.position.y = 0.001;
        inner.scale.set(1, 1.2, 1);
        coinG.add(inner);

        var star = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), coinStarMat);
        star.position.y = 0.0;
        star.rotation.y = Math.PI / 4;
        coinG.add(star);

        var rim = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.03, 6, 16), mat.coinEdge);
        coinG.add(rim);

        var glowMat = new THREE.SpriteMaterial({
            color: 0xFFB800, transparent: true, opacity: 0.18, depthWrite: false,
        });
        var glow = new THREE.Sprite(glowMat);
        glow.scale.set(0.9, 0.9, 1);
        coinG.add(glow);

        return coinG;
    }

    function spawnCoinRow(lane, z, count) {
        count = count || 5;
        for (var i = 0; i < count; i++) {
            var coinG = createCoinMesh();
            coinG.position.set(C.LANES[lane], 1.0, z - i * 1.8);
            scene.add(coinG);
            coins.push({ mesh: coinG, lane: lane, z: z - i * 1.8, collected: false, baseY: 1.0 });
        }
    }

    function spawnCoinArc(lane, z) {
        for (var i = 0; i < 6; i++) {
            var t = i / 5;
            var yOff = Math.sin(t * Math.PI) * 2.5;
            var coinG = createCoinMesh();
            coinG.position.set(C.LANES[lane], 1.0 + yOff, z - i * 1.8);
            scene.add(coinG);
            coins.push({ mesh: coinG, lane: lane, z: z - i * 1.8, collected: false, baseY: 1.0 + yOff });
        }
    }

    function spawnPowerup(lane, z) {
        var type = Math.random() < 0.5 ? "magnet" : "multiplier";
        var m = type === "magnet" ? mat.powerGreen : mat.powerPurple;
        var g = new THREE.Group();

        var core = new THREE.Mesh(geo.powerup, m);
        core.castShadow = true;
        g.add(core);

        var ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.03, 8, 16), m.clone());
        ring.material.transparent = true;
        ring.material.opacity = 0.45;
        g.add(ring);

        var ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.02, 6, 16), m.clone());
        ring2.material.transparent = true;
        ring2.material.opacity = 0.3;
        ring2.rotation.x = Math.PI / 2;
        g.add(ring2);

        var glowMat = new THREE.SpriteMaterial({
            color: type === "magnet" ? 0x33ff88 : 0xaa44ff,
            transparent: true, opacity: 0.4, depthWrite: false,
        });
        var glow = new THREE.Sprite(glowMat);
        glow.scale.set(2.0, 2.0, 1);
        g.add(glow);

        g.position.set(C.LANES[lane], 1.5, z);
        scene.add(g);
        powerups.push({ mesh: g, lane: lane, z: z, type: type, collected: false });
    }

    GAME.Collectibles = {
        coins: coins,
        powerups: powerups,
        spawnCoinRow: spawnCoinRow,
        spawnCoinArc: spawnCoinArc,
        spawnPowerup: spawnPowerup,
    };
})();
