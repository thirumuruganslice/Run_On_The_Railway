/* ============================================================
   Obstacles — Run on the Railway
   Trains, barriers, and obstacle spawning.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;
    var C = GAME.Config;
    var H = GAME.Helpers;
    var mat = GAME.Materials.mat;
    var trainSchemes = GAME.Materials.trainSchemes;
    var graffitiMats = GAME.Materials.graffitiMats;
    var scene = GAME.Renderer.scene;

    var obstacles = [];

    /* ── Arrow mesh builder (flat arrow on obstacle face) ── */
    function createSurfaceArrow(direction, scale) {
        var s = scale || 1.0;
        var g = new THREE.Group();

        var arrowShape = new THREE.Shape();
        arrowShape.moveTo(0, 0.48 * s);
        arrowShape.lineTo(-0.42 * s, 0.0);
        arrowShape.lineTo(-0.18 * s, 0.0);
        arrowShape.lineTo(-0.18 * s, -0.44 * s);
        arrowShape.lineTo(0.18 * s, -0.44 * s);
        arrowShape.lineTo(0.18 * s, 0.0);
        arrowShape.lineTo(0.42 * s, 0.0);
        arrowShape.lineTo(0, 0.48 * s);

        var arrowMat = new THREE.MeshBasicMaterial({ color: 0xff1111, side: THREE.DoubleSide, depthTest: true });
        var arrowGeo = new THREE.ShapeGeometry(arrowShape);
        var arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
        if (direction === "down") arrowMesh.rotation.z = Math.PI;
        g.add(arrowMesh);

        var outlineShape = new THREE.Shape();
        var os = s * 1.15;
        outlineShape.moveTo(0, 0.48 * os);
        outlineShape.lineTo(-0.42 * os, 0.0);
        outlineShape.lineTo(-0.18 * os, 0.0);
        outlineShape.lineTo(-0.18 * os, -0.44 * os);
        outlineShape.lineTo(0.18 * os, -0.44 * os);
        outlineShape.lineTo(0.18 * os, 0.0);
        outlineShape.lineTo(0.42 * os, 0.0);
        outlineShape.lineTo(0, 0.48 * os);

        var outlineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        var outlineGeo = new THREE.ShapeGeometry(outlineShape);
        var outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
        if (direction === "down") outlineMesh.rotation.z = Math.PI;
        outlineMesh.position.z = -0.005;
        g.add(outlineMesh);

        g.userData.isArrowIndicator = true;
        g.userData._baseScale = 1.0;
        return g;
    }

    /* ── Spawn Train ── */
    function spawnTrain(lane, z) {
        var trainLen = H.rnd(10, 18);
        var g = new THREE.Group();

        var scheme = H.pick(trainSchemes);
        var bodyMat = scheme.bodyMat;
        var stripeMat = scheme.stripeMat;
        var accentMat = scheme.accentMat;
        var winMat = mat.trainWinDark;
        var chromeMat = mat.chrome;

        /* Undercarriage */
        var chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.28, trainLen + 0.3), mat.trainBottom);
        chassis.position.y = 0.22;
        g.add(chassis);

        /* Wheel bogies */
        var bogieZs = [-trainLen / 2 + 2.0, trainLen / 2 - 2.0];
        for (var bi = 0; bi < bogieZs.length; bi++) {
            var bz = bogieZs[bi];
            var frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 2.3), mat.trainBottom);
            frame.position.set(0, 0.14, bz);
            g.add(frame);
            var wxArr = [-0.65, 0.65];
            var wzArr = [-0.6, 0.6];
            for (var wi = 0; wi < wxArr.length; wi++) {
                for (var wj = 0; wj < wzArr.length; wj++) {
                    var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 8), mat.trainWheel);
                    wheel.rotation.z = Math.PI / 2;
                    wheel.position.set(wxArr[wi], 0.12, bz + wzArr[wj]);
                    g.add(wheel);
                    var flange = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.07, 8), mat.rail);
                    flange.rotation.z = Math.PI / 2;
                    flange.position.set(wxArr[wi], 0.12, bz + wzArr[wj]);
                    g.add(flange);
                }
            }
        }

        /* Main body */
        var body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.0, trainLen), bodyMat);
        body.position.y = 1.85;
        body.castShadow = true;
        body.receiveShadow = true;
        g.add(body);

        /* Stripe band */
        var stripe = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.55, trainLen + 0.04), stripeMat);
        stripe.position.y = 2.2;
        g.add(stripe);
        var stripe2 = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.12, trainLen + 0.04), stripeMat);
        stripe2.position.y = 2.9;
        g.add(stripe2);

        /* Chrome trim */
        var trimYs = [1.85, 2.48, 2.95];
        for (var ti = 0; ti < trimYs.length; ti++) {
            var trim = new THREE.Mesh(new THREE.BoxGeometry(2.13, 0.03, trainLen + 0.04), chromeMat);
            trim.position.y = trimYs[ti];
            g.add(trim);
        }

        /* Roof */
        var roof = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.18, trainLen + 0.12), mat.trainRoof);
        roof.position.y = 3.4;
        g.add(roof);
        [-1, 1].forEach(function (rx) {
            var bev = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, trainLen + 0.12), mat.trainRoof);
            bev.position.set(rx * 0.98, 3.36, 0);
            bev.rotation.z = rx * 0.22;
            g.add(bev);
        });
        [-trainLen * 0.28, trainLen * 0.28].forEach(function (az) {
            var ac = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 2.0), mat.trainRoof);
            ac.position.set(0, 3.5, az);
            g.add(ac);
        });
        var panBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.55), mat.wire);
        panBase.position.set(0, 3.5, 0);
        g.add(panBase);

        /* Windows & doors */
        var winSpacing = 1.65;
        var winCount = Math.max(2, Math.floor((trainLen - 2.6) / winSpacing));
        var winStartZ = -(winCount - 1) * winSpacing * 0.5;
        for (var wi2 = 0; wi2 < winCount; wi2++) {
            var wz = winStartZ + wi2 * winSpacing;
            var isDoor = (wi2 === Math.floor(winCount / 3) || wi2 === Math.floor(winCount * 2 / 3));
            [-1.06, 1.06].forEach(function (sx) {
                if (isDoor) {
                    var sealV = new THREE.Mesh(new THREE.BoxGeometry(0.015, 2.3, 0.05), mat.seal);
                    sealV.position.set(sx, 1.65, wz - 0.38);
                    g.add(sealV);
                    var dw = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.85), winMat);
                    dw.position.set(sx * 1.001, 2.4, wz);
                    dw.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
                    g.add(dw);
                    var dp = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.4), accentMat);
                    dp.position.set(sx * 1.001, 1.5, wz);
                    dp.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
                    g.add(dp);
                } else {
                    var win = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.85), winMat);
                    win.position.set(sx * 1.001, 2.6, wz);
                    win.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
                    g.add(win);
                    var wf = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.92, 1.2), chromeMat);
                    wf.position.set(sx, 2.6, wz);
                    g.add(wf);
                }
            });
        }

        /* Graffiti panels */
        if (Math.random() < 0.7) {
            var grafCount = H.rndInt(2, 4);
            for (var gi = 0; gi < grafCount; gi++) {
                var gMat = H.pick(graffitiMats);
                var gw = H.rnd(0.8, 2.5), gh = H.rnd(0.4, 1.2);
                var gPanel = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), gMat);
                var gSide = Math.random() < 0.5 ? -1.06 : 1.06;
                var gz = H.rnd(-trainLen / 2 + 2, trainLen / 2 - 2);
                var gy = H.rnd(0.8, 1.8);
                gPanel.position.set(gSide * 1.002, gy, gz);
                gPanel.rotation.y = gSide > 0 ? -Math.PI / 2 : Math.PI / 2;
                g.add(gPanel);
            }
        }

        /* Safety stripe */
        [-1.06, 1.06].forEach(function (sx) {
            var saf = new THREE.Mesh(new THREE.PlaneGeometry(trainLen - 0.9, 0.08), mat.safety);
            saf.position.set(sx * 1.001, 0.43, 0);
            saf.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
            g.add(saf);
        });

        /* ── Front nose / cab face ── */
        var fz = -trainLen / 2;

        var frontBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.0, 0.4), bodyMat);
        frontBody.position.set(0, 1.85, fz - 0.2);
        g.add(frontBody);

        var nosePlate = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.5, 0.35), accentMat);
        nosePlate.position.set(0, 0.55, fz - 0.22);
        nosePlate.rotation.x = 0.18;
        g.add(nosePlate);

        var frontStripe = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.55, 0.06), stripeMat);
        frontStripe.position.set(0, 2.2, fz - 0.38);
        g.add(frontStripe);

        var bumper = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 0.06), chromeMat);
        bumper.position.set(0, 0.36, fz - 0.38);
        g.add(bumper);

        /* Windshield */
        [-0.35, 0.35].forEach(function (wx) {
            var ws = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.92), winMat);
            ws.position.set(wx, 2.48, fz - 0.41);
            g.add(ws);
        });
        var wsDivider = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 0.06), chromeMat);
        wsDivider.position.set(0, 2.48, fz - 0.39);
        g.add(wsDivider);
        var wsFrameTop = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 0.06), chromeMat);
        wsFrameTop.position.set(0, 2.96, fz - 0.39);
        g.add(wsFrameTop);
        var wsFrameBot = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 0.06), chromeMat);
        wsFrameBot.position.set(0, 2.0, fz - 0.39);
        g.add(wsFrameBot);
        [-0.66, 0.66].forEach(function (sx) {
            var wsFrameSide = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.02, 0.06), chromeMat);
            wsFrameSide.position.set(sx, 2.48, fz - 0.39);
            g.add(wsFrameSide);
        });

        /* Wipers */
        [-0.3, 0.3].forEach(function (wx) {
            var wiper = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.48, 0.015), mat.wiper);
            wiper.position.set(wx, 2.28, fz - 0.42);
            wiper.rotation.z = wx > 0 ? 0.25 : -0.25;
            g.add(wiper);
        });

        /* Destination display */
        var dstBorder = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.32, 0.03), mat.dstBorder);
        dstBorder.position.set(0, 2.88, fz - 0.395);
        g.add(dstBorder);
        var dst = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.22, 0.02), mat.dstDisplay);
        dst.position.set(0, 2.88, fz - 0.40);
        g.add(dst);

        /* Headlights */
        [-0.62, 0.62].forEach(function (hx) {
            var bezel = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 6, 12), chromeMat);
            bezel.position.set(hx, 1.0, fz - 0.40);
            g.add(bezel);
            var hlFace = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 8), mat.headlight);
            hlFace.rotation.x = Math.PI / 2;
            hlFace.position.set(hx, 1.0, fz - 0.40);
            g.add(hlFace);
            var reflector = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.08, 6), chromeMat);
            reflector.rotation.x = Math.PI / 2;
            reflector.position.set(hx, 1.0, fz - 0.36);
            g.add(reflector);
        });

        /* Marker lights */
        [-0.85, 0.85].forEach(function (hx) {
            var topMarker = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 6), mat.headlight);
            topMarker.rotation.x = Math.PI / 2;
            topMarker.position.set(hx, 2.82, fz - 0.40);
            g.add(topMarker);
            var botMarker = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 6), mat.amber);
            botMarker.rotation.x = Math.PI / 2;
            botMarker.position.set(hx, 0.58, fz - 0.40);
            g.add(botMarker);
        });

        /* Air intake grilles */
        for (var gy = 1.32; gy < 1.82; gy += 0.08) {
            var slat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.03), mat.grille);
            slat.position.set(0, gy, fz - 0.41);
            g.add(slat);
        }
        [1.28, 1.82].forEach(function (gy2) {
            var gTrim = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.025, 0.04), chromeMat);
            gTrim.position.set(0, gy2, fz - 0.40);
            g.add(gTrim);
        });
        [-0.38, 0.38].forEach(function (gx) {
            var gTrimV = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.56, 0.04), chromeMat);
            gTrimV.position.set(gx, 1.55, fz - 0.40);
            g.add(gTrimV);
        });

        /* Ditch lights */
        [-0.34, 0.34].forEach(function (hx) {
            var dl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.02), mat.ditchLight);
            dl.position.set(hx, 0.65, fz - 0.41);
            g.add(dl);
            var dlBezel = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.13, 0.015), chromeMat);
            dlBezel.position.set(hx, 0.65, fz - 0.405);
            g.add(dlBezel);
        });

        /* Front coupler */
        var coupFront = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.3), mat.trainBottom);
        coupFront.position.set(0, 0.28, fz - 0.35);
        g.add(coupFront);
        var coupKnuckle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 6), mat.trainWheel);
        coupKnuckle.rotation.x = Math.PI / 2;
        coupKnuckle.position.set(0, 0.28, fz - 0.52);
        g.add(coupKnuckle);

        /* Pilot / cowcatcher */
        var pilot = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.25), mat.pilot);
        pilot.position.set(0, 0.20, fz - 0.42);
        pilot.rotation.x = 0.15;
        g.add(pilot);

        /* Number plate */
        var plate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.02), mat.numberPlate);
        plate.position.set(0, 0.82, fz - 0.41);
        g.add(plate);

        /* ── Rear face ── */
        var rz = trainLen / 2;

        var rearBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.0, 0.35), accentMat);
        rearBody.position.set(0, 1.85, rz + 0.17);
        rearBody.castShadow = true;
        g.add(rearBody);

        var rearStripe = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.55, 0.06), stripeMat);
        rearStripe.position.set(0, 2.2, rz + 0.33);
        g.add(rearStripe);

        var rearWin = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), winMat);
        rearWin.position.set(0, 2.45, rz + 0.36);
        rearWin.rotation.y = Math.PI;
        g.add(rearWin);

        var rwfTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.04), chromeMat);
        rwfTop.position.set(0, 2.82, rz + 0.35);
        g.add(rwfTop);
        var rwfBot = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.04), chromeMat);
        rwfBot.position.set(0, 2.08, rz + 0.35);
        g.add(rwfBot);
        [-0.53, 0.53].forEach(function (sx) {
            var rwfSide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.78, 0.04), chromeMat);
            rwfSide.position.set(sx, 2.45, rz + 0.35);
            g.add(rwfSide);
        });

        /* Tail lights */
        [-0.65, 0.65].forEach(function (hx) {
            var tBezel = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 6, 10), chromeMat);
            tBezel.position.set(hx, 1.0, rz + 0.35);
            g.add(tBezel);
            var tail = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 8), mat.tailLight);
            tail.rotation.x = Math.PI / 2;
            tail.position.set(hx, 1.0, rz + 0.35);
            g.add(tail);
        });

        /* Upper tail lights */
        [-0.4, 0.4].forEach(function (hx) {
            var upperTail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.03), mat.tailLight);
            upperTail.position.set(hx, 2.88, rz + 0.36);
            g.add(upperTail);
        });

        var rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.06), chromeMat);
        rearBumper.position.set(0, 0.38, rz + 0.35);
        g.add(rearBumper);

        for (var rgy = 1.4; rgy < 1.8; rgy += 0.08) {
            var rSlat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.025, 0.025), mat.grille);
            rSlat.position.set(0, rgy, rz + 0.36);
            g.add(rSlat);
        }

        var rPlate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.02), mat.numberPlate);
        rPlate.position.set(0, 0.62, rz + 0.36);
        g.add(rPlate);

        var rSafety = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.02), mat.rearSafety);
        rSafety.position.set(0, 0.48, rz + 0.36);
        g.add(rSafety);

        /* Rear coupling */
        var coup = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.45), mat.trainBottom);
        coup.position.set(0, 0.46, rz + 0.45);
        g.add(coup);
        var coupKnuckleR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 6), mat.trainWheel);
        coupKnuckleR.rotation.x = Math.PI / 2;
        coupKnuckleR.position.set(0, 0.46, rz + 0.7);
        g.add(coupKnuckleR);

        g.position.set(C.LANES[lane], C.GROUND_Y, z);
        scene.add(g);

        obstacles.push({
            mesh: g, type: "train", lane: lane, z: z,
            halfW: 1.05, halfH: 1.7, halfD: trainLen / 2 + 0.2,
        });
    }

    /* ── Spawn Barrier (jump over) ── */
    function spawnBarrier(lane, z) {
        var g = new THREE.Group();
        var barrierW = 2.0;
        var barrierH = 2.4;

        [-barrierW / 2, barrierW / 2].forEach(function (px) {
            var post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, barrierH, 8), mat.barrier);
            post.position.set(px, barrierH / 2, 0);
            post.castShadow = true;
            g.add(post);
            var capMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat.barrierWarn);
            capMesh.position.set(px, barrierH + 0.05, 0);
            g.add(capMesh);
            var base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.1, 8), mat.barrierStripe);
            base.position.set(px, 0.05, 0);
            g.add(base);
        });

        var barThick = new THREE.CylinderGeometry(0.07, 0.07, barrierW, 6);
        for (var bi = 0; bi < 5; bi++) {
            var bar = new THREE.Mesh(barThick, bi % 2 === 0 ? mat.barrier : mat.barrierStripe);
            bar.rotation.z = Math.PI / 2;
            bar.position.set(0, 0.35 + bi * 0.45, 0);
            bar.castShadow = true;
            g.add(bar);
        }

        var warnPanel = new THREE.Mesh(new THREE.BoxGeometry(barrierW - 0.2, 0.5, 0.06), mat.warnPanel);
        warnPanel.position.set(0, 1.5, 0.08);
        g.add(warnPanel);

        for (var si = 0; si < 6; si++) {
            var strp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.46, 0.02), mat.hazardYellow);
            strp.position.set(-0.6 + si * 0.24, 1.5, 0.12);
            strp.rotation.z = 0.35;
            g.add(strp);
        }

        var upArrow = createSurfaceArrow("up", 0.5);
        upArrow.position.set(0, 1.5, 0.14);
        g.add(upArrow);

        var warnLight = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), mat.warnRed);
        warnLight.position.set(0, barrierH + 0.2, 0);
        g.add(warnLight);

        g.position.set(C.LANES[lane], C.GROUND_Y, z);
        scene.add(g);

        obstacles.push({
            mesh: g, type: "barrier", lane: lane, z: z,
            halfW: 1.0, halfH: 1.2, halfD: 0.25,
            canRollUnder: false, canJumpOver: true,
        });
    }

    /* ── Spawn Low Barrier (jump over) ── */
    function spawnLowBarrier(lane, z) {
        var g = new THREE.Group();
        var barW = 2.2, barH = 0.75, barD = 0.6;

        var barGeo = new THREE.BoxGeometry(barW, barH, barD, 2, 2, 2);
        var barV = barGeo.attributes.position;
        for (var vi = 0; vi < barV.count; vi++) {
            var yy = barV.getY(vi);
            var xx = barV.getX(vi);
            if (yy > barH * 0.35) barV.setX(vi, xx * 0.92);
        }
        barGeo.computeVertexNormals();
        var bar = new THREE.Mesh(barGeo, mat.concrete);
        bar.position.y = barH / 2;
        bar.castShadow = true;
        bar.receiveShadow = true;
        g.add(bar);

        var chevCount = 8;
        for (var ci = 0; ci < chevCount; ci++) {
            var isYellow = ci % 2 === 0;
            var chevMat = isYellow ? mat.hazardYellow : mat.hazardBlack;
            var chev = new THREE.Mesh(new THREE.BoxGeometry(0.18, barH - 0.1, 0.02), chevMat);
            chev.position.set(-barW / 2 + 0.2 + ci * (barW - 0.4) / (chevCount - 1), barH / 2, barD / 2 + 0.01);
            chev.rotation.z = isYellow ? 0.3 : -0.3;
            g.add(chev);
        }

        var upArrow = createSurfaceArrow("up", 0.4);
        upArrow.position.set(0, barH / 2, barD / 2 + 0.03);
        g.add(upArrow);

        var topStrip = new THREE.Mesh(new THREE.BoxGeometry(barW + 0.05, 0.06, barD + 0.05), mat.topStripOrange);
        topStrip.position.y = barH + 0.03;
        g.add(topStrip);

        g.position.set(C.LANES[lane], C.GROUND_Y, z);
        scene.add(g);

        obstacles.push({
            mesh: g, type: "lowBarrier", lane: lane, z: z,
            halfW: 1.1, halfH: 0.4, halfD: 0.3,
            canRollUnder: false, canJumpOver: true,
        });
    }

    /* ── Spawn Upper Barrier (roll under) ── */
    function spawnUpperBarrier(lane, z) {
        var g = new THREE.Group();
        var ubW = 2.2;

        [-ubW / 2, ubW / 2].forEach(function (px) {
            var post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 8), mat.barrier);
            post.position.set(px, 1.6, 0);
            post.castShadow = true;
            g.add(post);
            var brace = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.3), mat.barrier);
            brace.position.set(px * 0.7, 1.0, 0);
            brace.rotation.z = px > 0 ? -0.4 : 0.4;
            g.add(brace);
        });

        var beam = new THREE.Mesh(new THREE.BoxGeometry(ubW, 0.35, 0.5), mat.barrier);
        beam.position.y = 1.6;
        beam.castShadow = true;
        g.add(beam);

        for (var si = 0; si < 8; si++) {
            var stripeM = si % 2 === 0 ? mat.ubRedStripe : mat.ubWhiteStripe;
            var beamStripe = new THREE.Mesh(new THREE.BoxGeometry(ubW / 8, 0.33, 0.02), stripeM);
            beamStripe.position.set(-ubW / 2 + ubW / 16 + si * (ubW / 8), 1.6, 0.26);
            g.add(beamStripe);
        }

        var downArrow = createSurfaceArrow("down", 0.35);
        downArrow.position.set(0, 1.6, 0.28);
        g.add(downArrow);

        [-ubW / 2 + 0.15, ubW / 2 - 0.15].forEach(function (px) {
            var warnLt = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat.warnRedSphere);
            warnLt.position.set(px, 1.9, 0.2);
            g.add(warnLt);
        });

        g.position.set(C.LANES[lane], C.GROUND_Y, z);
        scene.add(g);

        obstacles.push({
            mesh: g, type: "upperBarrier", lane: lane, z: z,
            halfW: 1.1, halfH: 0.25, halfD: 0.25,
            yCenter: 1.6, canRollUnder: true, canJumpOver: false,
        });
    }

    GAME.Obstacles = {
        obstacles: obstacles,
        spawnTrain: spawnTrain,
        spawnBarrier: spawnBarrier,
        spawnLowBarrier: spawnLowBarrier,
        spawnUpperBarrier: spawnUpperBarrier,
    };
})();
