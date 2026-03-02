/* ============================================================
   Player Character — Railway Runner
   Cartoon-proportioned character with run-cycle animation.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;
    var C = GAME.Config;
    var H = GAME.Helpers;
    var mat = GAME.Materials.mat;
    var scene = GAME.Renderer.scene;
    var state = GAME.State.state;

    var player = null;
    var playerParts = null;

    /* ─── Create Player ─── */
    function createPlayer() {
        player = new THREE.Group();

        // --- Torso (bright hoodie) ---
        var torsoGeo = new THREE.BoxGeometry(0.92, 0.88, 0.54, 3, 3, 3);
        var tVerts = torsoGeo.attributes.position;
        for (var i = 0; i < tVerts.count; i++) {
            var x = tVerts.getX(i), y = tVerts.getY(i), z = tVerts.getZ(i);
            var len = Math.sqrt(x * x + y * y + z * z);
            var s = 1 + 0.06 / (len + 0.4);
            tVerts.setXYZ(i, x * s, y * s, z * s);
        }
        torsoGeo.computeVertexNormals();
        var torso = new THREE.Mesh(torsoGeo, mat.playerHoodie);
        torso.position.y = 1.24;
        torso.castShadow = true;
        player.add(torso);

        // Hoodie pocket
        var pocketMat = new THREE.MeshStandardMaterial({ color: 0x1A7868, roughness: 0.5 });
        var pocket = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.02), pocketMat);
        pocket.position.set(0, 1.02, -0.24);
        player.add(pocket);

        // Hoodie collar
        var collarMat = new THREE.MeshStandardMaterial({ color: 0x1A7868, roughness: 0.5 });
        var collar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.3), collarMat);
        collar.position.set(0, 1.62, 0);
        player.add(collar);

        // Hoodie drawstrings
        var stringMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.6 });
        [-0.06, 0.06].forEach(function (sx) {
            var str = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 4), stringMat);
            str.position.set(sx, 1.54, -0.22);
            player.add(str);
        });

        // --- Head ---
        var headGeo = new THREE.SphereGeometry(0.46, 20, 16);
        var head = new THREE.Mesh(headGeo, mat.playerHead);
        head.position.y = 2.12;
        head.castShadow = true;
        player.add(head);

        // Hair
        var hairMat = new THREE.MeshStandardMaterial({ color: 0xF0EEE8, roughness: 0.88 });
        var hairTop = new THREE.Mesh(
            new THREE.SphereGeometry(0.36, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45),
            hairMat
        );
        hairTop.position.set(0, 2.2, 0.02);
        player.add(hairTop);

        // Hair side tufts
        [-0.2, 0.2].forEach(function (sx) {
            var tuft = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), hairMat);
            tuft.position.set(sx, 2.28, -0.06);
            player.add(tuft);
        });

        // Cap (backwards)
        var capGeo = new THREE.SphereGeometry(0.36, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.35);
        var cap = new THREE.Mesh(capGeo, mat.playerCap);
        cap.position.set(0, 2.18, 0.02);
        cap.rotation.x = -0.1;
        cap.castShadow = true;
        player.add(cap);

        // Cap brim (backwards)
        var brimGeo = new THREE.CylinderGeometry(0.2, 0.26, 0.04, 16, 1, false, Math.PI * 0.4, Math.PI * 1.2);
        var brim = new THREE.Mesh(brimGeo, mat.playerCapBrim);
        brim.position.set(0, 2.1, 0.24);
        brim.rotation.x = 0.15;
        player.add(brim);

        // Cap button
        var capBtn = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat.playerCapBrim);
        capBtn.position.set(0, 2.36, 0.02);
        player.add(capBtn);

        // --- Eyes ---
        var eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
        var eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.1 });
        var irisMat = new THREE.MeshStandardMaterial({ color: 0x4858A0, roughness: 0.3 });
        [-0.13, 0.13].forEach(function (ex) {
            var eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), eyeWhiteMat);
            eyeW.position.set(ex, 2.06, -0.34);
            eyeW.scale.set(1, 1.15, 0.65);
            player.add(eyeW);
            var iris = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), irisMat);
            iris.position.set(ex, 2.06, -0.38);
            player.add(iris);
            var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyePupilMat);
            pupil.position.set(ex, 2.06, -0.40);
            player.add(pupil);
            var hl = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 6), eyeWhiteMat);
            hl.position.set(ex + 0.02, 2.08, -0.41);
            player.add(hl);
        });

        // Eyebrows
        var browMat = new THREE.MeshStandardMaterial({ color: 0xF0EEE8, roughness: 0.85 });
        [-0.13, 0.13].forEach(function (bx) {
            var brow = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.028, 0.02), browMat);
            brow.position.set(bx, 2.15, -0.34);
            brow.rotation.z = bx > 0 ? -0.15 : 0.15;
            player.add(brow);
        });

        // Nose
        var nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), mat.playerHead);
        nose.position.set(0, 1.98, -0.40);
        player.add(nose);

        // Mouth
        var mouthMat = new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.6 });
        var mouth = new THREE.Mesh(
            new THREE.TorusGeometry(0.065, 0.014, 6, 12, Math.PI),
            mouthMat
        );
        mouth.position.set(0, 1.9, -0.37);
        mouth.rotation.x = Math.PI;
        mouth.rotation.z = Math.PI;
        player.add(mouth);

        // Ears
        [-1, 1].forEach(function (sx) {
            var ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat.playerHead);
            ear.position.set(sx * 0.36, 2.02, -0.05);
            ear.scale.set(0.5, 0.8, 0.6);
            player.add(ear);
        });

        // --- Arms ---
        var armGeo = new THREE.CylinderGeometry(0.14, 0.13, 0.72, 10);
        var lArm = new THREE.Mesh(armGeo, mat.playerHoodie);
        lArm.position.set(-0.5, 1.2, 0);
        lArm.castShadow = true;
        player.add(lArm);

        var rArm = new THREE.Mesh(armGeo.clone(), mat.playerHoodie);
        rArm.position.set(0.5, 1.2, 0);
        rArm.castShadow = true;
        player.add(rArm);

        // Hands
        var handGeo = new THREE.SphereGeometry(0.1, 10, 8);
        var lHand = new THREE.Mesh(handGeo, mat.playerHead);
        lHand.position.set(-0.5, 0.84, 0);
        player.add(lHand);
        var rHand = new THREE.Mesh(handGeo.clone(), mat.playerHead);
        rHand.position.set(0.5, 0.84, 0);
        player.add(rHand);

        // --- Legs ---
        var legGeo = new THREE.CylinderGeometry(0.16, 0.15, 0.68, 10);
        var lLeg = new THREE.Mesh(legGeo, mat.playerPant);
        lLeg.position.set(-0.18, 0.54, 0);
        lLeg.castShadow = true;
        player.add(lLeg);

        var rLeg = new THREE.Mesh(legGeo.clone(), mat.playerPant);
        rLeg.position.set(0.18, 0.54, 0);
        rLeg.castShadow = true;
        player.add(rLeg);

        // --- Shoes ---
        var shoeGeo = new THREE.BoxGeometry(0.32, 0.2, 0.46, 2, 1, 2);
        var shoeV = shoeGeo.attributes.position;
        for (var si = 0; si < shoeV.count; si++) {
            var sy = shoeV.getY(si), sz = shoeV.getZ(si);
            if (sz < -0.12) shoeV.setY(si, sy + 0.04);
            if (sy > 0.05) shoeV.setX(si, shoeV.getX(si) * 0.9);
        }
        shoeGeo.computeVertexNormals();
        var lShoe = new THREE.Mesh(shoeGeo, mat.playerShoe);
        lShoe.position.set(-0.18, 0.08, -0.04);
        player.add(lShoe);
        var rShoe = new THREE.Mesh(shoeGeo.clone(), mat.playerShoe);
        rShoe.position.set(0.18, 0.08, -0.04);
        player.add(rShoe);

        // Soles
        var lSole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.42), mat.playerSole);
        lSole.position.set(-0.18, 0.015, -0.04);
        player.add(lSole);
        var rSole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.42), mat.playerSole);
        rSole.position.set(0.18, 0.015, -0.04);
        player.add(rSole);

        // Shoe swoosh
        var swooshMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
        [-0.18, 0.18].forEach(function (sx) {
            var swoosh = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.06, 0.2), swooshMat);
            swoosh.position.set(sx + (sx > 0 ? 0.13 : -0.13), 0.1, -0.04);
            swoosh.rotation.z = sx > 0 ? 0.2 : -0.2;
            player.add(swoosh);
        });

        // Shoe laces
        [-0.18, 0.18].forEach(function (sx) {
            for (var li = 0; li < 3; li++) {
                var lace = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.01), swooshMat);
                lace.position.set(sx, 0.15, -0.14 + li * 0.08);
                player.add(lace);
            }
        });

        // --- Backpack ---
        var bpGeo = new THREE.BoxGeometry(0.58, 0.62, 0.3, 3, 3, 3);
        var bpV = bpGeo.attributes.position;
        for (var bi = 0; bi < bpV.count; bi++) {
            var bx = bpV.getX(bi), by = bpV.getY(bi), bz = bpV.getZ(bi);
            var blen = Math.sqrt(bx * bx + by * by + bz * bz);
            var bs = 1 + 0.05 / (blen + 0.3);
            bpV.setXYZ(bi, bx * bs, by * bs, bz * bs);
        }
        bpGeo.computeVertexNormals();
        var bp = new THREE.Mesh(bpGeo, mat.playerBP);
        bp.position.set(0, 1.28, 0.35);
        bp.castShadow = true;
        player.add(bp);

        // Backpack straps
        [-0.16, 0.16].forEach(function (sx) {
            var strap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), mat.playerBP);
            strap.position.set(sx, 1.3, 0.2);
            player.add(strap);
        });

        // Backpack zipper
        var zipMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8, roughness: 0.2 });
        var zip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.01), zipMat);
        zip.position.set(0, 1.38, 0.48);
        player.add(zip);

        // Backpack pocket
        var bpPocketMat = new THREE.MeshStandardMaterial({ color: 0xC03820, roughness: 0.45 });
        var bpPocket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.04, 2, 2, 1), bpPocketMat);
        bpPocket.position.set(0, 1.12, 0.48);
        player.add(bpPocket);

        // Zip pull
        var zipPull = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.01), zipMat);
        zipPull.position.set(0.15, 1.38, 0.49);
        player.add(zipPull);

        playerParts = { torso: torso, head: head, cap: cap, lArm: lArm, rArm: rArm, lHand: lHand, rHand: rHand, lLeg: lLeg, rLeg: rLeg, lShoe: lShoe, rShoe: rShoe, bp: bp };
        player.position.set(0, C.GROUND_Y, 0);
        scene.add(player);
    }

    /* ─── Animate Player (smooth run cycle) ─── */
    function animatePlayer(frame) {
        if (!playerParts) return;
        var pp = playerParts;
        var spd = state.speed / C.RUN_SPEED;
        var t = frame * 0.18 * spd;
        var swing = Math.sin(t);
        var swingAbs = Math.abs(swing);

        if (state.rolling) {
            var rollScale = H.lerp(player.scale.y, 0.42, 0.15);
            player.scale.set(1, rollScale, 1);
            player.position.y = state.jumping ? player.position.y : C.GROUND_Y;
        } else {
            player.scale.y = H.lerp(player.scale.y, 1, 0.12);
            player.scale.x = H.lerp(player.scale.x, 1, 0.12);
            player.scale.z = H.lerp(player.scale.z, 1, 0.12);

            // Arms pump
            var armSwing = swing * 0.7;
            pp.lArm.rotation.x = armSwing;
            pp.rArm.rotation.x = -armSwing;
            pp.lArm.rotation.z = 0.08;
            pp.rArm.rotation.z = -0.08;
            pp.lHand.position.y = 0.84 + Math.sin(t + 0.2) * 0.08;
            pp.rHand.position.y = 0.84 - Math.sin(t + 0.2) * 0.08;
            pp.lHand.position.z = Math.sin(t) * 0.14;
            pp.rHand.position.z = -Math.sin(t) * 0.14;

            // Legs stride
            var legSwing = swing * 0.65;
            pp.lLeg.rotation.x = -legSwing;
            pp.rLeg.rotation.x = legSwing;
            pp.lShoe.rotation.x = -legSwing * 0.3 - swingAbs * 0.12;
            pp.rShoe.rotation.x = legSwing * 0.3 - swingAbs * 0.12;
            pp.lShoe.position.z = -0.04 - Math.sin(t) * 0.1;
            pp.rShoe.position.z = -0.04 + Math.sin(t) * 0.1;

            // Body bob
            var bobHeight = swingAbs * 0.06;
            pp.torso.position.y = 1.24 + bobHeight;
            pp.torso.rotation.y = swing * 0.02;
            pp.torso.rotation.z = swing * 0.015;
            var leanFwd = H.clamp((state.speed - C.RUN_SPEED) / (C.MAX_SPEED - C.RUN_SPEED), 0, 1) * 0.06;
            pp.torso.rotation.x = leanFwd;

            // Head bobs
            pp.head.position.y = 2.02 + bobHeight * 0.8;
            pp.head.rotation.y = Math.sin(t * 0.4) * 0.03;
            pp.head.rotation.z = swing * 0.01;
            pp.cap.position.y = 2.18 + bobHeight * 0.8;
            pp.cap.rotation.y = pp.head.rotation.y;

            // Backpack sway
            pp.bp.rotation.z = Math.sin(t * 0.9) * 0.03;
            pp.bp.rotation.x = -leanFwd * 0.3 + swingAbs * 0.025;
            pp.bp.position.y = 1.28 + bobHeight * 0.6;
        }
    }

    function getPlayer() { return player; }
    function getPlayerParts() { return playerParts; }

    function dispose() {
        if (player) {
            scene.remove(player);
            player = null;
            playerParts = null;
        }
    }

    GAME.Player = {
        createPlayer: createPlayer,
        animatePlayer: animatePlayer,
        getPlayer: getPlayer,
        getPlayerParts: getPlayerParts,
        dispose: dispose,
    };
})();
