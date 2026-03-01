/* ============================================================
   Ground Chunk Builder & Recycler — Run on the Railway
   Creates detailed railway track ground segments.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;
    var C = GAME.Config;
    var mat = GAME.Materials.mat;
    var scene = GAME.Renderer.scene;
    var LANES = C.LANES;
    var CHUNK_LEN = C.CHUNK_LEN;
    var GROUND_W = C.GROUND_W;

    var groundChunks = [];

    function makeGroundChunk(zPos) {
        var group = new THREE.Group();

        var g = new THREE.Mesh(
            new THREE.PlaneGeometry(GROUND_W, CHUNK_LEN, 1, 1),
            mat.ground
        );
        g.rotation.x = -Math.PI / 2;
        g.position.set(0, -0.02, 0);
        g.receiveShadow = true;
        group.add(g);

        var gravel = new THREE.Mesh(
            new THREE.BoxGeometry(C.LANE_WIDTH * 3 + 3, 0.08, CHUNK_LEN),
            mat.gravel
        );
        gravel.position.set(0, 0.02, 0);
        gravel.receiveShadow = true;
        group.add(gravel);

        for (var sxi = 0; sxi < 2; sxi++) {
            var sx = sxi === 0 ? -1 : 1;
            var platEdge = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.35, CHUNK_LEN),
                mat.platformEdge
            );
            platEdge.position.set(sx * (C.LANE_WIDTH * 1.5 + 1.6), 0.17, 0);
            platEdge.receiveShadow = true;
            group.add(platEdge);

            var platBody = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, 0.3, CHUNK_LEN),
                mat.platform
            );
            platBody.position.set(sx * (C.LANE_WIDTH * 1.5 + 2.85), 0.15, 0);
            platBody.receiveShadow = true;
            group.add(platBody);

            var sidewalk = new THREE.Mesh(
                new THREE.BoxGeometry(4, 0.06, CHUNK_LEN),
                mat.sidewalk || mat.platform
            );
            sidewalk.position.set(sx * (C.LANE_WIDTH * 1.5 + 5.5), 0.03, 0);
            sidewalk.receiveShadow = true;
            group.add(sidewalk);

            for (var rxi = 0; rxi < 2; rxi++) {
                var rx = rxi === 0 ? -0.5 : 0.5;
                var sideRail = new THREE.Mesh(
                    new THREE.BoxGeometry(0.06, 0.04, CHUNK_LEN),
                    mat.rail
                );
                sideRail.position.set(sx * (C.LANE_WIDTH * 1.5 + 2.8) + rx, 0.08, 0);
                group.add(sideRail);
            }
        }

        for (var li = 0; li < 3; li++) {
            var lx = LANES[li];
            for (var rxi = 0; rxi < 2; rxi++) {
                var rx = rxi === 0 ? -0.55 : 0.55;
                var railHead = new THREE.Mesh(
                    new THREE.BoxGeometry(0.07, 0.04, CHUNK_LEN),
                    mat.rail
                );
                railHead.position.set(lx + rx, 0.1, 0);
                group.add(railHead);
                var railWeb = new THREE.Mesh(
                    new THREE.BoxGeometry(0.03, 0.06, CHUNK_LEN),
                    mat.railSide
                );
                railWeb.position.set(lx + rx, 0.07, 0);
                group.add(railWeb);
                var railBase = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 0.02, CHUNK_LEN),
                    mat.railSide
                );
                railBase.position.set(lx + rx, 0.05, 0);
                group.add(railBase);
            }
            for (var s = -CHUNK_LEN / 2; s < CHUNK_LEN / 2; s += 3.5) {
                var slMat = Math.random() < 0.3 ? mat.sleeperDark : mat.sleeper;
                var sl = new THREE.Mesh(
                    new THREE.BoxGeometry(1.7, 0.07, 0.22),
                    slMat
                );
                sl.position.set(lx, 0.035, s);
                sl.receiveShadow = true;
                group.add(sl);
            }
        }

        for (var pz = -CHUNK_LEN / 2; pz < CHUNK_LEN / 2; pz += 70) {
            for (var sxi = 0; sxi < 2; sxi++) {
                var sx = sxi === 0 ? -1 : 1;
                var pole = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.07, 0.09, 11, 8),
                    mat.lampPost
                );
                pole.position.set(sx * (C.LANE_WIDTH * 1.5 + 1.2), 5.5, pz);
                pole.castShadow = true;
                group.add(pole);
                var arm = new THREE.Mesh(
                    new THREE.BoxGeometry(Math.abs(sx * 2.8), 0.07, 0.07),
                    mat.wire
                );
                arm.position.set(sx * (C.LANE_WIDTH * 1.5 - 0.2), 10.8, pz);
                group.add(arm);
                var brace = new THREE.Mesh(
                    new THREE.BoxGeometry(0.03, 0.03, 2.0),
                    mat.wire
                );
                brace.position.set(sx * (C.LANE_WIDTH * 1.5 + 0.5), 9.8, pz);
                brace.rotation.x = 0.5 * sx;
                group.add(brace);
            }
            var wire = new THREE.Mesh(
                new THREE.BoxGeometry(C.LANE_WIDTH * 3 + 3, 0.025, 0.025),
                mat.wire
            );
            wire.position.set(0, 10.8, pz);
            group.add(wire);
            var midZ = pz + 35;
            if (midZ < CHUNK_LEN / 2) {
                var sagWire = new THREE.Mesh(
                    new THREE.BoxGeometry(C.LANE_WIDTH * 3 + 2.5, 0.018, 0.018),
                    mat.wire
                );
                sagWire.position.set(0, 10.5, midZ);
                group.add(sagWire);
            }
        }

        group.position.z = zPos;
        scene.add(group);
        groundChunks.push({ group: group, z: zPos });
        return group;
    }

    function manageGround() {
        var player = GAME.Player.getPlayer();
        if (!player) return;
        var pz = player.position.z;
        for (var i = 0; i < groundChunks.length; i++) {
            var c = groundChunks[i];
            if (c.group.position.z > pz + CHUNK_LEN) {
                c.group.position.z -= CHUNK_LEN * groundChunks.length;
            }
        }
        var minZ = Infinity;
        for (var i = 0; i < groundChunks.length; i++) {
            if (groundChunks[i].group.position.z < minZ) minZ = groundChunks[i].group.position.z;
        }
        if (minZ > pz - CHUNK_LEN * 1.5) {
            makeGroundChunk(minZ - CHUNK_LEN);
        }
    }

    GAME.Ground = {
        groundChunks: groundChunks,
        makeGroundChunk: makeGroundChunk,
        manageGround: manageGround,
    };
})();
