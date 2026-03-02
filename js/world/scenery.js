/* ============================================================
   Scenery Objects — Railway Runner
   Lamp posts, signals, fences, side trains, decorative arches.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;
    var C = GAME.Config;
    var H = GAME.Helpers;
    var mat = GAME.Materials.mat;
    var scene = GAME.Renderer.scene;
    var sideTrainSchemes = GAME.Materials.sideTrainSchemes;
    var sideGraffitiMats = GAME.Materials.sideGraffitiMats;
    var archMats = GAME.Materials.archMats;
    var archBannerMats = GAME.Materials.archBannerMats;

    var sceneryObjs = [];
    var nextSceneryZ = -15;
    var nextSideTrainZ = -25;

    /* Check if any building is near a given Z (avoids overlap) */
    function isBuildingNearZ(z, margin) {
        var buildings = GAME.Buildings ? GAME.Buildings.buildings : [];
        for (var i = 0; i < buildings.length; i++) {
            if (Math.abs(buildings[i].z - z) < margin) return true;
        }
        return false;
    }

    function spawnLampPost(z, side) {
        var g = new THREE.Group();
        var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.5, 8), mat.lampPost);
        pole.position.y = 2.25;
        pole.castShadow = true;
        g.add(pole);
        var arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.2), mat.lampPost);
        arm.position.set(side * -0.5, 4.4, 0);
        arm.rotation.z = side * 0.3;
        g.add(arm);
        var lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), mat.lampGlow);
        lamp.position.set(side * -0.9, 4.3, 0);
        g.add(lamp);
        g.position.set(side * (C.LANE_WIDTH * 1.5 + 4.2), 0, z);
        scene.add(g);
        sceneryObjs.push({ mesh: g, z: z });
    }

    function spawnSignalLight(z) {
        var g = new THREE.Group();
        var pole = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 0.1), mat.signal);
        pole.position.y = 2;
        g.add(pole);
        var box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.2), mat.signal);
        box.position.y = 3.8;
        g.add(box);
        var isRed = Math.random() < 0.5;
        var redLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), isRed ? mat.signalRed : mat.signal);
        redLight.position.set(0, 4.0, 0.11);
        g.add(redLight);
        var greenLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), !isRed ? mat.signalGreen : mat.signal);
        greenLight.position.set(0, 3.7, 0.11);
        g.add(greenLight);
        var side = Math.random() < 0.5 ? -1 : 1;
        g.position.set(side * (C.LANE_WIDTH * 1.5 + 0.8), 0, z);
        scene.add(g);
        sceneryObjs.push({ mesh: g, z: z });
    }

    function spawnFenceSegment(z, side) {
        var g = new THREE.Group();
        var len = 8;
        for (var i = 0; i <= 2; i++) {
            var post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 0.08), mat.fence);
            post.position.set(0, 0.8, -len / 2 + i * (len / 2));
            post.castShadow = true;
            g.add(post);
        }
        var barYs = [0.4, 0.9, 1.4];
        for (var yi = 0; yi < barYs.length; yi++) {
            var bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, len), mat.fence);
            bar.position.y = barYs[yi];
            g.add(bar);
        }
        g.position.set(side * (C.LANE_WIDTH * 1.5 + 5.0), 0, z);
        scene.add(g);
        sceneryObjs.push({ mesh: g, z: z });
    }

    function spawnSideTrain(z, side) {
        var trainLen = H.rnd(12, 22);
        var g = new THREE.Group();
        var scheme = H.pick(sideTrainSchemes);
        var bodyMat = scheme.bodyMat;
        var stripeMat = scheme.stripeMat;
        var winMat = mat.sideTrainWin;
        var chromeMat = mat.chrome;

        var chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.25, trainLen), mat.trainBottom);
        chassis.position.y = 0.22;
        g.add(chassis);

        var body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.8, trainLen), bodyMat);
        body.position.y = 1.8;
        body.castShadow = true;
        body.receiveShadow = true;
        g.add(body);

        var stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.5, trainLen + 0.02), stripeMat);
        stripe.position.y = 2.1;
        g.add(stripe);

        var trimYs = [1.8, 2.4];
        for (var ti = 0; ti < trimYs.length; ti++) {
            var trim = new THREE.Mesh(new THREE.BoxGeometry(2.03, 0.03, trainLen + 0.02), chromeMat);
            trim.position.y = trimYs[ti];
            g.add(trim);
        }

        var roof = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.16, trainLen + 0.1), mat.trainRoof);
        roof.position.y = 3.25;
        g.add(roof);

        var facingSide = side > 0 ? -1.01 : 1.01;
        var winSpacing = 1.65;
        var winCount = Math.max(2, Math.floor((trainLen - 2) / winSpacing));
        var winStartZ = -(winCount - 1) * winSpacing * 0.5;
        for (var i = 0; i < winCount; i++) {
            var wz = winStartZ + i * winSpacing;
            var win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), winMat);
            win.position.set(facingSide, 2.5, wz);
            win.rotation.y = facingSide > 0 ? -Math.PI / 2 : Math.PI / 2;
            g.add(win);
        }

        if (Math.random() < 0.8) {
            var grafCount = H.rndInt(1, 3);
            for (var gi = 0; gi < grafCount; gi++) {
                var gMat = H.pick(sideGraffitiMats);
                var gw = H.rnd(1.0, 2.8), gh = H.rnd(0.4, 1.0);
                var gPanel = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), gMat);
                gPanel.position.set(facingSide * 1.001, H.rnd(0.8, 1.6), H.rnd(-trainLen / 2 + 2, trainLen / 2 - 2));
                gPanel.rotation.y = facingSide > 0 ? -Math.PI / 2 : Math.PI / 2;
                g.add(gPanel);
            }
        }

        var bogieZs = [-trainLen / 2 + 2.0, trainLen / 2 - 2.0];
        for (var bi = 0; bi < bogieZs.length; bi++) {
            var bz = bogieZs[bi];
            var wxs = [-0.6, 0.6];
            for (var wxi = 0; wxi < wxs.length; wxi++) {
                var wzs = [-0.5, 0.5];
                for (var wzi = 0; wzi < wzs.length; wzi++) {
                    var wheel = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.3, 0.3, 0.18, 8),
                        mat.trainWheel
                    );
                    wheel.rotation.z = Math.PI / 2;
                    wheel.position.set(wxs[wxi], 0.12, bz + wzs[wzi]);
                    g.add(wheel);
                }
            }
        }

        var xPos = side * (C.LANE_WIDTH * 1.5 + 1.6 + H.rnd(0.2, 0.8));
        g.position.set(xPos, C.GROUND_Y, z);
        scene.add(g);
        sceneryObjs.push({ mesh: g, z: z });
    }

    function spawnDecoArch(z) {
        var g = new THREE.Group();
        var archIdx = H.rndInt(0, archMats.length - 1);
        var archMat = archMats[archIdx];
        var archTrimMat = mat.archTrim;

        var pillarX = C.LANE_WIDTH * 1.5 + 5.5; /* pillars on sidewalk edge, clear of buildings */
        var pillarH = 13;                        /* tall pillars */
        var beamY = 12.5;                        /* high overhead beam */
        var topY = 13.0;

        var sides = [-1, 1];
        for (var si = 0; si < sides.length; si++) {
            var sx = sides[si];
            var pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, pillarH, 8), archMat);
            pillar.position.set(sx * pillarX, pillarH / 2, 0);
            pillar.castShadow = true;
            g.add(pillar);
            var base = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.55), archMat);
            base.position.set(sx * pillarX, 0.12, 0);
            g.add(base);
        }

        var beam = new THREE.Mesh(new THREE.BoxGeometry(pillarX * 2 + 0.5, 0.3, 0.4), archMat);
        beam.position.set(0, beamY, 0);
        beam.castShadow = true;
        g.add(beam);

        var topBeam = new THREE.Mesh(new THREE.BoxGeometry(pillarX * 2 + 1.0, 0.15, 0.55), archMat);
        topBeam.position.set(0, topY, 0);
        g.add(topBeam);

        var trimYs = [beamY - 0.25, beamY + 0.25];
        for (var ti = 0; ti < trimYs.length; ti++) {
            var trim = new THREE.Mesh(new THREE.BoxGeometry(pillarX * 2, 0.04, 0.45), archTrimMat);
            trim.position.set(0, trimYs[ti], 0);
            g.add(trim);
        }

        var lanternXs = [-3.5, 0, 3.5];
        for (var li = 0; li < lanternXs.length; li++) {
            var lx = lanternXs[li];
            var lantern = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.3), mat.lanternGlow);
            lantern.position.set(lx, beamY - 0.5, 0);
            g.add(lantern);
            var glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), mat.lanternGlowSphere);
            glow.position.set(lx, beamY - 0.8, 0);
            g.add(glow);
        }

        var bannerMat = archBannerMats[archIdx] || archBannerMats[0];
        for (var si2 = 0; si2 < sides.length; si2++) {
            var sx2 = sides[si2];
            var banner = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2.2), bannerMat);
            banner.position.set(sx2 * pillarX, beamY - 2.5, 0.3);
            g.add(banner);
        }

        g.position.z = z;
        scene.add(g);
        sceneryObjs.push({ mesh: g, z: z });
    }

    function spawnScenery() {
        var player = GAME.Player.getPlayer();
        var ahead = player ? player.position.z - C.SPAWN_DIST - 20 : -200;
        while (nextSceneryZ > ahead) {
            var r = Math.random();
            var hasBldg = isBuildingNearZ(nextSceneryZ, 10);
            if (r < 0.18 && !hasBldg) {
                spawnLampPost(nextSceneryZ, Math.random() < 0.5 ? -1 : 1);
            } else if (r < 0.3) {
                spawnSignalLight(nextSceneryZ);
            } else if (r < 0.42 && !hasBldg) {
                spawnFenceSegment(nextSceneryZ, Math.random() < 0.5 ? -1 : 1);
            } else if (r < 0.55 && !hasBldg) {
                spawnDecoArch(nextSceneryZ);
            }
            nextSceneryZ -= H.rnd(12, 22);
        }
        while (nextSideTrainZ > ahead) {
            var side = Math.random() < 0.5 ? -1 : 1;
            spawnSideTrain(nextSideTrainZ, side);
            if (Math.random() < 0.4) {
                spawnSideTrain(nextSideTrainZ + H.rnd(-3, 3), -side);
            }
            nextSideTrainZ -= H.rnd(20, 38);
        }
    }

    function resetScenery() {
        nextSceneryZ = -15;
        nextSideTrainZ = -25;
    }

    GAME.Scenery = {
        sceneryObjs: sceneryObjs,
        spawnLampPost: spawnLampPost,
        spawnSignalLight: spawnSignalLight,
        spawnFenceSegment: spawnFenceSegment,
        spawnSideTrain: spawnSideTrain,
        spawnDecoArch: spawnDecoArch,
        spawnScenery: spawnScenery,
        resetScenery: resetScenery,
    };
})();
