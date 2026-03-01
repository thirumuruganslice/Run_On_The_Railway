/* ============================================================
   Buildings — Run on the Railway
   Procedural building spawner with rooftop details.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;
    var C = GAME.Config;
    var H = GAME.Helpers;
    var mat = GAME.Materials.mat;
    var awningMats = GAME.Materials.awningMats;
    var scene = GAME.Renderer.scene;
    var Tex = GAME.Textures;

    var buildings = [];
    var buildColors = GAME.Colors.buildings.base;

    function spawnBuilding(z) {
        var side = Math.random() < 0.5 ? -1 : 1;
        var w = H.rnd(4, 10);
        var h = H.rnd(10, 32);
        var d = H.rnd(5, 12);
        var floors = Math.max(2, Math.floor(h / 3));
        var cols = Math.max(2, Math.floor(w / 2));
        var bColor = H.pick(buildColors);

        var pool = Tex.getBuildTexPool();
        var buildTex = pool[Math.floor(Math.random() * pool.length)];
        var buildMat = mat.buildBase.clone(); buildMat.map = buildTex;

        var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildMat);
        mesh.position.set(side * (C.LANE_WIDTH * 1.5 + 6.5 + w / 2 + H.rnd(0, 2)), h / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        var roofGroup = new THREE.Group();

        var roofSlab = new THREE.Mesh(
            new THREE.BoxGeometry(w + 0.3, 0.15, d + 0.3),
            mat.roofSlabGrey
        );
        roofSlab.position.set(0, h / 2 + 0.07, 0);
        roofGroup.add(roofSlab);

        var cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.2, d + 0.5), mat.cornice);
        cornice.position.set(0, h / 2 - 0.1, 0);
        roofGroup.add(cornice);

        var acCount = Math.random() < 0.6 ? H.rndInt(1, 3) : 0;
        for (var i = 0; i < acCount; i++) {
            var ac = new THREE.Mesh(
                new THREE.BoxGeometry(H.rnd(0.5, 1.4), H.rnd(0.35, 0.65), H.rnd(0.5, 1.0)),
                mat.rooftop
            );
            ac.position.set(H.rnd(-w / 3, w / 3), h / 2 + 0.35, H.rnd(-d / 3, d / 3));
            ac.castShadow = true;
            roofGroup.add(ac);
        }

        if (Math.random() < 0.3 && h > 14) {
            var tankGroup = new THREE.Group();
            var txs = [-0.3, 0.3];
            var tzs = [-0.3, 0.3];
            for (var txi = 0; txi < txs.length; txi++) {
                for (var tzi = 0; tzi < tzs.length; tzi++) {
                    var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), mat.antenna);
                    leg.position.set(txs[txi], h / 2 + 0.6, tzs[tzi]);
                    tankGroup.add(leg);
                }
            }
            var tank = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 1.2, 8), mat.tankWood);
            tank.position.set(H.rnd(-w / 4, w / 4), h / 2 + 1.2, H.rnd(-d / 4, d / 4));
            tank.castShadow = true;
            tankGroup.add(tank);
            var lid = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.05, 8), mat.rooftop);
            lid.position.set(tank.position.x, h / 2 + 1.82, tank.position.z);
            tankGroup.add(lid);
            roofGroup.add(tankGroup);
        }

        if (Math.random() < 0.4) {
            var ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, H.rnd(2.0, 4.5), 4), mat.antenna);
            ant.position.set(H.rnd(-w / 3, w / 3), h / 2 + 1.8, H.rnd(-d / 3, d / 3));
            roofGroup.add(ant);
            var blink = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat.blinkRed);
            blink.position.set(ant.position.x, h / 2 + 3.5, ant.position.z);
            roofGroup.add(blink);
        }

        if (Math.random() < 0.25) {
            var chimney = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), mat.chimneyBrick);
            chimney.position.set(H.rnd(-w / 3, w / 3), h / 2 + 0.8, H.rnd(-d / 4, d / 4));
            chimney.castShadow = true;
            roofGroup.add(chimney);
        }

        if (Math.random() < 0.4) {
            var neonMat = H.pick([mat.neonRed, mat.neonBlue, mat.neonGreen]);
            var neon = new THREE.Mesh(new THREE.BoxGeometry(H.rnd(1.2, 3.0), H.rnd(0.35, 0.7), 0.06), neonMat);
            var ny = H.rnd(h * 0.3, h * 0.7);
            neon.position.set(0, ny - h / 2, side > 0 ? -d / 2 - 0.04 : d / 2 + 0.04);
            if (side < 0) neon.rotation.y = Math.PI;
            mesh.add(neon);
        }

        if (Math.random() < 0.3 && floors > 3) {
            var feSide = side > 0 ? -d / 2 - 0.08 : d / 2 + 0.08;
            for (var f = 0; f < Math.min(floors, 5); f++) {
                var feY = 1.5 + f * 3;
                var fePlat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.7), mat.fireEscape);
                fePlat.position.set(H.rnd(-w / 4, w / 4), feY - h / 2, feSide);
                mesh.add(fePlat);
                var feRail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.03), mat.fireEscape);
                feRail.position.set(fePlat.position.x, feY + 0.3 - h / 2, feSide + (side > 0 ? -0.35 : 0.35));
                mesh.add(feRail);
            }
        }

        if (Math.random() < 0.45) {
            var aw = new THREE.Mesh(new THREE.BoxGeometry(H.rnd(2, w * 0.8), 0.04, 1.2), H.pick(awningMats));
            aw.position.set(0, 2.0 - h / 2, side > 0 ? -d / 2 - 0.6 : d / 2 + 0.6);
            aw.rotation.z = side * 0.05;
            mesh.add(aw);
        }

        mesh.add(roofGroup);
        buildings.push({ mesh: mesh, z: z });
    }

    GAME.Buildings = {
        buildings: buildings,
        spawnBuilding: spawnBuilding,
    };
})();
