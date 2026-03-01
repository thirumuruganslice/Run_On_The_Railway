/* ============================================================
   Game Entry Point — Run on the Railway
   Main loop, game flow, collision, collection, event wiring.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;
    var C = GAME.Config;
    var H = GAME.Helpers;
    var DOM = GAME.DOM;
    var state = GAME.State.state;
    var scene = GAME.Renderer.scene;
    var camera = GAME.Renderer.camera;
    var renderer = GAME.Renderer.renderer;
    var dirLight = GAME.Renderer.dirLight;

    /* ─── Collision Detection ─── */
    function checkCollisions() {
        var player = GAME.Player.getPlayer();
        if (!player) return false;
        var px = player.position.x;
        var py = player.position.y;
        var pz = player.position.z;
        var pH = state.rolling ? 0.6 : 2.2;
        var pHW = 0.35;
        var pHD = 0.25;
        var obstacles = GAME.Obstacles.obstacles;

        for (var i = 0; i < obstacles.length; i++) {
            var obs = obstacles[i];
            var oz = obs.mesh.position.z;
            var ox = obs.mesh.position.x;

            if (pz - pHD > oz + obs.halfD || pz + pHD < oz - obs.halfD) continue;
            if (px - pHW > ox + obs.halfW || px + pHW < ox - obs.halfW) continue;

            if (obs.type === "train") {
                if (py < 3.4) return true;
            } else if (obs.type === "upperBarrier") {
                var barY = obs.yCenter || 2.3;
                if (py + pH > barY - obs.halfH && py < barY + obs.halfH) return true;
            } else if (obs.type === "lowBarrier") {
                if (py < obs.halfH * 2 + 0.3) return true;
            } else if (obs.type === "barrier") {
                /* Striped sign board — player must jump above 1.5 to clear */
                if (py < 1.5) return true;
            }
        }
        return false;
    }

    /* ─── Coin / Powerup Collection ─── */
    function collectItems() {
        var player = GAME.Player.getPlayer();
        if (!player) return;
        var px = player.position.x;
        var py = player.position.y;
        var pz = player.position.z;
        var magnetRange = state.magnetTimer > 0 ? 5.0 : 1.3;
        var coins = GAME.Collectibles.coins;
        var powerups = GAME.Collectibles.powerups;
        var sfx = GAME.Audio.sfx;

        for (var ci = 0; ci < coins.length; ci++) {
            var c = coins[ci];
            if (c.collected) continue;
            var dx = c.mesh.position.x - px;
            var dy = c.mesh.position.y - (py + 1);
            var dz = c.mesh.position.z - pz;
            var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (state.magnetTimer > 0 && dist < magnetRange) {
                var pullStrength = 0.12 + (1 - dist / magnetRange) * 0.15;
                c.mesh.position.x = H.lerp(c.mesh.position.x, px, pullStrength);
                c.mesh.position.y = H.lerp(c.mesh.position.y, py + 1, pullStrength);
                c.mesh.position.z = H.lerp(c.mesh.position.z, pz, pullStrength);
                c.mesh.rotation.y += 0.15;
            }

            if (dist < 1.3) {
                c.collected = true;
                c.mesh.visible = false;
                var pts = 10 * state.multiplier;
                state.coins++;
                state.score += pts;
                sfx.coin();
                GAME.HUD.popCoinIcon();
                GAME.Particles.spawnSparks(c.mesh.position, 3);
                GAME.HUD.showFloatingText("+" + pts, c.mesh.position);
            }
        }

        for (var pi = 0; pi < powerups.length; pi++) {
            var p = powerups[pi];
            if (p.collected) continue;
            var pdx = p.mesh.position.x - px;
            var pdy = p.mesh.position.y - (py + 1);
            var pdz = p.mesh.position.z - pz;
            if (Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz) < 1.5) {
                p.collected = true;
                p.mesh.visible = false;
                sfx.powerup();
                GAME.Particles.spawnSparks(p.mesh.position, 10);
                if (p.type === "magnet") {
                    state.magnetTimer = C.MAGNET_DUR;
                    GAME.HUD.showPowerup("🧲 MAGNET");
                } else if (p.type === "multiplier") {
                    state.multiplierTimer = C.MULTI_DUR;
                    state.multiplier = 2;
                    GAME.HUD.showPowerup("×2 MULTIPLIER");
                }
            }
        }
    }

    /* ─── Game Flow ─── */
    var animating = false;
    var lastTime = 0;
    var TARGET_DT = 1000 / 60;

    function playTransition() {
        if (DOM.startScreen.classList.contains("transitioning")) return;
        GAME.Audio.initAudio();

        DOM.startScreen.classList.add("transitioning");
        DOM.charContainer.classList.remove("idle");
        DOM.charContainer.classList.add("running");

        setTimeout(function () {
            if (DOM.transitionFlash) DOM.transitionFlash.classList.add("active");
        }, 700);

        setTimeout(function () {
            DOM.startScreen.classList.add("fade-out");
        }, 900);

        setTimeout(function () {
            if (DOM.transitionFlash) DOM.transitionFlash.classList.remove("active");
            startGame();
        }, 1300);
    }

    function startGame() {
        GAME.Audio.initAudio();
        clearWorld();
        GAME.State.resetState();
        GAME.Player.createPlayer();

        for (var i = 0; i < 4; i++) {
            GAME.Ground.makeGroundChunk(-C.CHUNK_LEN * i + C.CHUNK_LEN / 2);
        }

        GAME.Spawner.resetSpawner();
        GAME.Scenery.resetScenery();
        GAME.Spawner.spawnWorld();

        state.running = true;
        DOM.startScreen.style.display = "none";
        DOM.gameOverScreen.style.display = "none";
        DOM.pauseScreen.style.display = "none";
        DOM.hud.classList.add("visible");

        setTimeout(function () { GAME.Audio.startBGM(); }, 200);

        lastTime = 0;
        if (!animating) { animating = true; requestAnimationFrame(animate); }
    }

    function clearWorld() {
        GAME.Audio.stopBGM();
        var obstacles = GAME.Obstacles.obstacles;
        var coins = GAME.Collectibles.coins;
        var powerups = GAME.Collectibles.powerups;
        var buildings = GAME.Buildings.buildings;
        var groundChunks = GAME.Ground.groundChunks;
        var sceneryObjs = GAME.Scenery.sceneryObjs;
        var floatingTexts = GAME.HUD.floatingTexts;
        var particles = GAME.Particles.particles;

        for (var i = 0; i < obstacles.length; i++) scene.remove(obstacles[i].mesh);
        for (var j = 0; j < coins.length; j++) scene.remove(coins[j].mesh);
        for (var k = 0; k < powerups.length; k++) scene.remove(powerups[k].mesh);
        for (var l = 0; l < buildings.length; l++) scene.remove(buildings[l].mesh);
        for (var m = 0; m < groundChunks.length; m++) scene.remove(groundChunks[m].group);
        for (var n = 0; n < sceneryObjs.length; n++) scene.remove(sceneryObjs[n].mesh);
        for (var o = 0; o < floatingTexts.length; o++) {
            scene.remove(floatingTexts[o].sprite);
            floatingTexts[o].sprite.material.dispose();
        }
        for (var p = 0; p < particles.length; p++) {
            scene.remove(particles[p].mesh);
            particles[p].mesh.material.dispose();
        }
        obstacles.length = 0;
        coins.length = 0;
        powerups.length = 0;
        buildings.length = 0;
        groundChunks.length = 0;
        sceneryObjs.length = 0;
        floatingTexts.length = 0;
        particles.length = 0;

        GAME.Player.dispose();
    }

    function gameOver() {
        state.gameOver = true;
        state.running = false;
        GAME.Audio.stopBGM();

        DOM.canvas.classList.remove("shaking");
        void DOM.canvas.offsetWidth;
        DOM.canvas.classList.add("shaking");
        setTimeout(function () { DOM.canvas.classList.remove("shaking"); }, 700);

        GAME.Audio.sfx.hit();

        DOM.flashOverlay.classList.add("active");
        setTimeout(function () { DOM.flashOverlay.classList.remove("active"); }, 450);

        var isNew = false;
        if (state.score > state.highScore) {
            state.highScore = state.score;
            localStorage.setItem("subwaySurfersHigh", state.highScore.toString());
            isNew = true;
        }

        DOM.finalScore.textContent = state.score.toLocaleString();
        DOM.finalCoins.textContent = state.coins.toLocaleString();
        DOM.finalBest.textContent = state.highScore.toLocaleString();
        DOM.newBestBadge.style.display = isNew ? "block" : "none";

        setTimeout(function () { DOM.hud.classList.remove("visible"); }, 300);
        setTimeout(function () { DOM.gameOverScreen.style.display = "flex"; }, 850);
    }

    function togglePause() {
        if (state.gameOver) return;
        state.paused = !state.paused;
        DOM.pauseScreen.style.display = state.paused ? "flex" : "none";
        if (state.paused) {
            GAME.Audio.stopBGM();
        } else if (!GAME.Audio.isMuted()) {
            GAME.Audio.startBGM();
        }
    }

    function goHome() {
        clearWorld();
        GAME.Audio.stopBGM();
        state.running = false;
        state.gameOver = false;
        DOM.gameOverScreen.style.display = "none";
        DOM.hud.classList.remove("visible");

        DOM.startScreen.classList.remove("transitioning", "fade-out");
        DOM.charContainer.classList.remove("running");
        DOM.charContainer.classList.add("idle");
        if (DOM.transitionFlash) DOM.transitionFlash.classList.remove("active");

        DOM.startScreen.style.display = "flex";
        showHighScore();
        initTitleScene();
    }

    function showHighScore() {
        DOM.startHigh.textContent = state.highScore > 0 ? "🏆 Best: " + state.highScore.toLocaleString() : "";
    }

    /* ─── Main Loop ─── */
    function animate(now) {
        if (!animating) return;
        requestAnimationFrame(animate);

        if (!state.running || state.paused || state.gameOver) {
            lastTime = now;
            renderer.render(scene, camera);
            return;
        }

        if (!lastTime) lastTime = now;
        var rawDt = now - lastTime;
        lastTime = now;
        var dt = Math.min(rawDt, 50) / TARGET_DT;

        var player = GAME.Player.getPlayer();
        var playerParts = GAME.Player.getPlayerParts();

        state.frame++;
        state.speed = Math.min(state.speed + C.SPEED_INC * dt, C.MAX_SPEED);

        var moveStep = state.speed * dt;
        player.position.z -= moveStep;
        state.distance += moveStep;

        if (state.frame % 6 === 0) state.score += state.multiplier;

        // Lane switching
        var targetX = C.LANES[state.targetLane];
        var laneError = targetX - player.position.x;
        var laneLerp = 1 - Math.pow(1 - C.LANE_SWITCH * (1 + Math.abs(laneError) * 0.3), dt);
        player.position.x += laneError * laneLerp;
        state.laneIndex = state.targetLane;

        // Jump / gravity
        if (state.jumping) {
            player.position.y += state.yVel * dt;
            state.yVel += C.GRAVITY * dt;
            if (playerParts) {
                playerParts.torso.rotation.x = state.yVel > 0 ? -0.08 : 0.06;
            }
            if (player.position.y <= C.GROUND_Y) {
                player.position.y = C.GROUND_Y;
                state.yVel = 0;
                state.jumping = false;
                GAME.Particles.spawnDust(player.position, 5);
                if (playerParts) playerParts.torso.rotation.x = 0;
            }
        }

        // Roll
        if (state.rolling) {
            state.rollTimer -= dt;
            if (state.rollTimer <= 0) state.rolling = false;
        }

        // Timers
        if (state.magnetTimer > 0) state.magnetTimer -= dt;
        if (state.multiplierTimer > 0) {
            state.multiplierTimer -= dt;
            if (state.multiplierTimer <= 0) state.multiplier = 1;
        }
        if (state.invulnTimer > 0) state.invulnTimer -= dt;

        // Dust trail
        if (state.frame % 8 === 0 && !state.jumping) {
            GAME.Particles.spawnDust(player.position, 2);
        }

        // Animate character
        GAME.Player.animatePlayer(state.frame);

        // Animate coins
        var pz = player.position.z;
        var coins = GAME.Collectibles.coins;
        for (var ci = 0; ci < coins.length; ci++) {
            var c = coins[ci];
            if (!c.collected && Math.abs(c.mesh.position.z - pz) < C.COIN_ANIM_RANGE) {
                c.mesh.rotation.y += C.COIN_SPIN;
                c.mesh.position.y = (c.baseY || 1.0) + Math.sin(state.frame * 0.04 + c.z * 0.5) * 0.12;
                var glowChild = c.mesh.children[c.mesh.children.length - 1];
                if (glowChild && glowChild.material) {
                    glowChild.material.opacity = 0.12 + Math.sin(state.frame * 0.06 + c.z) * 0.06;
                }
            }
        }

        // Animate powerups
        var powerups = GAME.Collectibles.powerups;
        for (var pi = 0; pi < powerups.length; pi++) {
            var p = powerups[pi];
            if (!p.collected) {
                p.mesh.rotation.y += 0.03;
                p.mesh.children[0].rotation.x += 0.015;
                p.mesh.children[0].rotation.z += 0.01;
                p.mesh.position.y = 1.5 + Math.sin(state.frame * 0.045) * 0.3;
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

        // Animate arrow indicators
        var obstacles = GAME.Obstacles.obstacles;
        for (var oi = 0; oi < obstacles.length; oi++) {
            var obs = obstacles[oi];
            if (obs.type === "train") continue;
            var children = obs.mesh.children;
            for (var ki = children.length - 1; ki >= 0; ki--) {
                var child = children[ki];
                if (child.userData && child.userData.isArrowIndicator) {
                    var pulse = 1.0 + Math.sin(state.frame * 0.1 + obs.z) * 0.1;
                    child.scale.setScalar(pulse);
                    var arrowMesh = child.children[0];
                    if (arrowMesh && arrowMesh.material) {
                        var brightness = 0.8 + Math.sin(state.frame * 0.12 + obs.z) * 0.2;
                        arrowMesh.material.color.setRGB(brightness, 0.05, 0.05);
                    }
                    break;
                }
            }
        }

        // Spawning & cleanup
        GAME.Spawner.spawnWorld();
        GAME.Ground.manageGround();
        collectItems();
        GAME.Particles.updateParticles(dt);
        GAME.HUD.checkMilestones();

        // Collision
        if (state.invulnTimer <= 0 && checkCollisions()) {
            gameOver();
            renderer.render(scene, camera);
            return;
        }

        if (state.frame % 20 === 0) GAME.Spawner.cleanBehind();

        GAME.HUD.updateFloatingTexts();

        // Camera follow
        var camTargetZ = player.position.z + C.CAM_Z;
        var camTargetX = player.position.x * 0.3;
        var camTargetY = C.CAM_Y + Math.abs(player.position.x) * 0.06 + (state.jumping ? state.yVel * 2 : 0);
        camera.position.z = H.lerp(camera.position.z, camTargetZ, 1 - Math.pow(1 - 0.09, dt));
        camera.position.x = H.lerp(camera.position.x, camTargetX, 1 - Math.pow(1 - 0.06, dt));
        camera.position.y = H.lerp(camera.position.y, camTargetY, 1 - Math.pow(1 - 0.05, dt));
        var lookX = H.lerp(camera.position.x, player.position.x * 0.2, 0.05);
        var lookY = H.lerp(C.CAM_LOOKAT_Y, C.CAM_LOOKAT_Y + (state.jumping ? 0.5 : 0), 0.1);
        camera.lookAt(lookX, lookY, player.position.z - 13);

        // Shadow update
        if (state.frame % C.SHADOW_UPDATE_INTERVAL === 0) {
            dirLight.position.set(player.position.x + 8, 18, player.position.z + 10);
            dirLight.target.position.set(player.position.x, 0, player.position.z - 5);
            dirLight.target.updateMatrixWorld();
            renderer.shadowMap.needsUpdate = true;
        }

        // Fog colour shift
        if (state.frame % 4 === 0) {
            var speedFactor = (state.speed - C.RUN_SPEED) / (C.MAX_SPEED - C.RUN_SPEED);
            var fogR = 0.72 + speedFactor * 0.04;
            var fogG = 0.83 + speedFactor * 0.03;
            var fogB = 0.91 + speedFactor * 0.02;
            var curBg = scene.background;
            scene.background.setRGB(
                H.lerp(curBg.r, fogR, 0.03),
                H.lerp(curBg.g, fogG, 0.03),
                H.lerp(curBg.b, fogB, 0.03)
            );
            scene.fog.color.copy(scene.background);
        }

        // HUD update every 2 frames
        if (state.frame % 2 === 0) GAME.HUD.updateHUD();

        renderer.render(scene, camera);
    }

    /* ─── Title Scene (cinematic camera orbit) ─── */
    function initTitleScene() {
        for (var i = 0; i < 3; i++) {
            GAME.Ground.makeGroundChunk(-C.CHUNK_LEN * i + C.CHUNK_LEN / 2);
        }
        for (var z = 0; z > -200; z -= H.rnd(4, 8)) {
            GAME.Buildings.spawnBuilding(z);
            if (Math.random() < 0.7) GAME.Buildings.spawnBuilding(z + H.rnd(-2, 2));
        }
        /* Spawn lamp posts only where no buildings exist nearby */
        var bldgs = GAME.Buildings.buildings;
        for (var z2 = -5; z2 > -200; z2 -= 15) {
            var lampClear = true;
            for (var bi = 0; bi < bldgs.length; bi++) {
                if (Math.abs(bldgs[bi].z - z2) < 10) { lampClear = false; break; }
            }
            if (lampClear) GAME.Scenery.spawnLampPost(z2, Math.random() < 0.5 ? -1 : 1);
        }
        /* Spawn arches only where no buildings exist nearby */
        for (var z3 = -20; z3 > -180; z3 -= H.rnd(30, 50)) {
            var archClear = true;
            for (var bi2 = 0; bi2 < bldgs.length; bi2++) {
                if (Math.abs(bldgs[bi2].z - z3) < 12) { archClear = false; break; }
            }
            if (archClear) GAME.Scenery.spawnDecoArch(z3);
        }
        for (var z4 = -8; z4 > -180; z4 -= H.rnd(14, 24)) {
            var side = Math.random() < 0.5 ? -1 : 1;
            GAME.Scenery.spawnSideTrain(z4, side);
            if (Math.random() < 0.6) GAME.Scenery.spawnSideTrain(z4 + H.rnd(-3, 3), -side);
        }

        var titleFrame = 0;
        function titleAnimate() {
            if (state.running) return;
            requestAnimationFrame(titleAnimate);
            titleFrame++;
            var orbitSpeed = 0.0015;
            camera.position.x = Math.sin(titleFrame * orbitSpeed) * 3.5;
            camera.position.y = C.CAM_Y + Math.sin(titleFrame * orbitSpeed * 2.5) * 0.5;
            camera.position.z = 9 + Math.sin(titleFrame * orbitSpeed * 1.8) * 2.5;
            camera.lookAt(0, C.CAM_LOOKAT_Y, -25);
            renderer.render(scene, camera);
        }
        titleAnimate();
    }

    /* ─── Event Listeners ─── */
    GAME.Input.setupInput();

    DOM.btnPlay.addEventListener("click", playTransition);
    DOM.btnRestart.addEventListener("click", startGame);
    DOM.btnHome.addEventListener("click", goHome);
    DOM.btnResume.addEventListener("click", togglePause);
    DOM.btnPause.addEventListener("click", togglePause);
    if (DOM.btnPauseHome) DOM.btnPauseHome.addEventListener("click", goHome);

    DOM.btnMute.addEventListener("click", function () {
        var muted = GAME.Audio.toggleMute();
        DOM.btnMute.textContent = muted ? "🔇" : "🔊";
        if (muted) {
            GAME.Audio.stopBGM();
        } else if (state.running && !state.paused && !state.gameOver) {
            GAME.Audio.startBGM();
        }
    });

    window.addEventListener("resize", function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    /* ─── Expose game flow for other modules (input.js uses togglePause) ─── */
    GAME.Flow = {
        startGame: startGame,
        gameOver: gameOver,
        togglePause: togglePause,
        goHome: goHome,
        clearWorld: clearWorld,
        playTransition: playTransition,
    };

    /* ─── Initialize ─── */
    showHighScore();
    initTitleScene();
    DOM.charContainer.classList.add("idle");
})();
