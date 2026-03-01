/* ============================================================
   Materials Cache — Run on the Railway
   Pre-cached MeshStandardMaterials + scheme/graffiti pools.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;
    var Col = GAME.Colors;
    var Tex = GAME.Textures;

    var gravelTex = Tex.makeGravelTexture();
    var groundTex = Tex.makeGroundTexture();

    var mat = {
        /* ── Tracks & Ground ── */
        ground: new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.88, metalness: 0.05, color: Col.tracks.ground }),
        gravel: new THREE.MeshStandardMaterial({ map: gravelTex, roughness: 0.9, color: Col.tracks.gravel }),
        rail: new THREE.MeshStandardMaterial({ color: Col.tracks.rail, metalness: 0.85, roughness: 0.12 }),
        railSide: new THREE.MeshStandardMaterial({ color: Col.tracks.railSide, metalness: 0.7, roughness: 0.2 }),
        track: new THREE.MeshStandardMaterial({ color: Col.tracks.track, roughness: 0.88 }),
        sleeper: new THREE.MeshStandardMaterial({ color: Col.tracks.sleeper, roughness: 0.8 }),
        sleeperDark: new THREE.MeshStandardMaterial({ color: Col.tracks.sleeperDark, roughness: 0.85 }),

        /* ── Player ── */
        player: new THREE.MeshStandardMaterial({ color: Col.player.hoodie, roughness: 0.35, metalness: 0.1 }),
        playerHoodie: new THREE.MeshStandardMaterial({ color: Col.player.hoodie, roughness: 0.45, metalness: 0.05, emissive: Col.player.hoodieEmissive, emissiveIntensity: 0.1 }),
        playerHead: new THREE.MeshStandardMaterial({ color: Col.player.head, roughness: 0.55, metalness: 0.02 }),
        playerHair: new THREE.MeshStandardMaterial({ color: Col.player.hair, roughness: 0.9 }),
        playerShoe: new THREE.MeshStandardMaterial({ color: Col.player.shoe, roughness: 0.4, metalness: 0.15, emissive: Col.player.shoeEmissive, emissiveIntensity: 0.1 }),
        playerSole: new THREE.MeshStandardMaterial({ color: Col.player.sole, roughness: 0.6 }),
        playerPant: new THREE.MeshStandardMaterial({ color: Col.player.pant, roughness: 0.55 }),
        playerBP: new THREE.MeshStandardMaterial({ color: Col.player.backpack, roughness: 0.45, metalness: 0.05, emissive: Col.player.backpackEmissive, emissiveIntensity: 0.1 }),
        playerCap: new THREE.MeshStandardMaterial({ color: Col.player.cap, roughness: 0.4, metalness: 0.05, emissive: Col.player.capEmissive, emissiveIntensity: 0.1 }),
        playerCapBrim: new THREE.MeshStandardMaterial({ color: Col.player.capBrim, roughness: 0.45 }),

        /* ── Trains ── */
        train: new THREE.MeshStandardMaterial({ color: Col.trains.body, roughness: 0.35, metalness: 0.4 }),
        trainAlt: new THREE.MeshStandardMaterial({ color: Col.trains.bodyAlt, roughness: 0.35, metalness: 0.4 }),
        trainRoof: new THREE.MeshStandardMaterial({ color: Col.trains.roof, roughness: 0.4, metalness: 0.5 }),
        trainBottom: new THREE.MeshStandardMaterial({ color: Col.trains.bottom, roughness: 0.65, metalness: 0.3 }),
        trainWheel: new THREE.MeshStandardMaterial({ color: Col.trains.wheel, roughness: 0.3, metalness: 0.8 }),
        trainWindow: new THREE.MeshStandardMaterial({ color: Col.trains.window, emissive: Col.trains.windowEmissive, emissiveIntensity: 0.2, roughness: 0.1, metalness: 0.3 }),
        trainDoor: new THREE.MeshStandardMaterial({ color: Col.trains.door, roughness: 0.4, metalness: 0.5 }),
        trainStripe: new THREE.MeshStandardMaterial({ color: Col.trains.stripe, roughness: 0.3, metalness: 0.2 }),
        headlight: new THREE.MeshStandardMaterial({ color: Col.trains.headlight, emissive: Col.trains.headlightEmissive, emissiveIntensity: 1.0 }),

        /* ── Barriers / Obstacles ── */
        barrier: new THREE.MeshStandardMaterial({ color: Col.obstacles.barrier, roughness: 0.4, metalness: 0.1 }),
        barrierStripe: new THREE.MeshStandardMaterial({ color: Col.obstacles.barrierStripe, roughness: 0.6 }),
        barrierWarn: new THREE.MeshStandardMaterial({ color: Col.obstacles.barrierWarn, emissive: Col.obstacles.barrierWarnEmissive, emissiveIntensity: 0.2, roughness: 0.4 }),

        /* ── Coins & Powerups ── */
        coin: new THREE.MeshStandardMaterial({ color: Col.collectibles.coin, metalness: 0.92, roughness: 0.08, emissive: Col.collectibles.coinEmissive, emissiveIntensity: 0.35 }),
        coinEdge: new THREE.MeshStandardMaterial({ color: Col.collectibles.coinEdge, metalness: 0.95, roughness: 0.12 }),
        powerGreen: new THREE.MeshStandardMaterial({ color: Col.collectibles.powerGreen, emissive: Col.collectibles.powerGreenEmissive, emissiveIntensity: 0.5, roughness: 0.25 }),
        powerPurple: new THREE.MeshStandardMaterial({ color: Col.collectibles.powerPurple, emissive: Col.collectibles.powerPurpleEmissive, emissiveIntensity: 0.5, roughness: 0.25 }),

        /* ── Buildings ── */
        building: new THREE.MeshStandardMaterial({ color: Col.buildings.main, roughness: 0.82 }),
        buildAlt: new THREE.MeshStandardMaterial({ color: Col.buildings.alt, roughness: 0.82 }),
        buildBrick: new THREE.MeshStandardMaterial({ color: Col.buildings.brick, roughness: 0.85 }),
        buildConcrete: new THREE.MeshStandardMaterial({ color: Col.buildings.concrete, roughness: 0.88 }),
        window: new THREE.MeshStandardMaterial({ color: Col.buildings.window, emissive: Col.buildings.windowEmissive, emissiveIntensity: 0.4 }),
        windowDark: new THREE.MeshStandardMaterial({ color: Col.buildings.windowDark, roughness: 0.7 }),
        rooftop: new THREE.MeshStandardMaterial({ color: Col.buildings.rooftop, roughness: 0.8 }),
        antenna: new THREE.MeshStandardMaterial({ color: Col.buildings.antenna, metalness: 0.6, roughness: 0.3 }),
        neonRed: new THREE.MeshStandardMaterial({ color: Col.buildings.neonRed, emissive: Col.buildings.neonRedEmissive, emissiveIntensity: 0.8 }),
        neonBlue: new THREE.MeshStandardMaterial({ color: Col.buildings.neonBlue, emissive: Col.buildings.neonBlueEmissive, emissiveIntensity: 0.8 }),
        neonGreen: new THREE.MeshStandardMaterial({ color: Col.buildings.neonGreen, emissive: Col.buildings.neonGreenEmissive, emissiveIntensity: 0.8 }),

        /* ── Environment ── */
        fence: new THREE.MeshStandardMaterial({ color: Col.environment.fence, metalness: 0.55, roughness: 0.3 }),
        lampPost: new THREE.MeshStandardMaterial({ color: Col.environment.lampPost, metalness: 0.5, roughness: 0.3 }),
        lampGlow: new THREE.MeshStandardMaterial({ color: Col.environment.lampGlow, emissive: Col.environment.lampGlowEmissive, emissiveIntensity: 1.0 }),
        signal: new THREE.MeshStandardMaterial({ color: Col.environment.signal, metalness: 0.4, roughness: 0.4 }),
        signalRed: new THREE.MeshStandardMaterial({ color: Col.environment.signalRed, emissive: Col.environment.signalRedEmissive, emissiveIntensity: 0.7 }),
        signalGreen: new THREE.MeshStandardMaterial({ color: Col.environment.signalGreen, emissive: Col.environment.signalGreenEmissive, emissiveIntensity: 0.7 }),
        platform: new THREE.MeshStandardMaterial({ color: Col.tracks.platform, roughness: 0.75 }),
        platformEdge: new THREE.MeshStandardMaterial({ color: Col.tracks.platformEdge, roughness: 0.4, emissive: Col.tracks.platformEdgeEmissive, emissiveIntensity: 0.1 }),
        sidewalk: new THREE.MeshStandardMaterial({ color: Col.tracks.sidewalk, roughness: 0.8 }),
        wire: new THREE.MeshStandardMaterial({ color: Col.tracks.wire, metalness: 0.55, roughness: 0.35 }),

        /* ── Cached Train Detail Materials ── */
        chrome: new THREE.MeshStandardMaterial({ color: Col.trainDetails.chrome, metalness: 0.9, roughness: 0.1 }),
        seal: new THREE.MeshStandardMaterial({ color: Col.trainDetails.seal, roughness: 0.95 }),
        safety: new THREE.MeshStandardMaterial({ color: Col.trainDetails.safety, roughness: 0.4, metalness: 0.1 }),
        wiper: new THREE.MeshStandardMaterial({ color: Col.trainDetails.wiper, roughness: 0.7 }),
        dstBorder: new THREE.MeshStandardMaterial({ color: Col.trainDetails.dstBorder, roughness: 0.6, metalness: 0.3 }),
        dstDisplay: new THREE.MeshStandardMaterial({ color: Col.trainDetails.dstDisplay, emissive: Col.trainDetails.dstDisplayEmissive, emissiveIntensity: 0.45 }),
        amber: new THREE.MeshStandardMaterial({ color: Col.trainDetails.amber, emissive: Col.trainDetails.amberEmissive, emissiveIntensity: 0.6 }),
        grille: new THREE.MeshStandardMaterial({ color: Col.trainDetails.grille, roughness: 0.6, metalness: 0.4 }),
        ditchLight: new THREE.MeshStandardMaterial({ color: Col.trainDetails.ditchLight, emissive: Col.trainDetails.ditchLightEmissive, emissiveIntensity: 0.7 }),
        pilot: new THREE.MeshStandardMaterial({ color: Col.trainDetails.pilot, roughness: 0.5, metalness: 0.4 }),
        numberPlate: new THREE.MeshStandardMaterial({ color: Col.trainDetails.numberPlate, roughness: 0.4, metalness: 0.5 }),
        tailLight: new THREE.MeshStandardMaterial({ color: Col.trainDetails.tailLight, emissive: Col.trainDetails.tailLightEmissive, emissiveIntensity: 1.0 }),
        rearSafety: new THREE.MeshStandardMaterial({ color: Col.trainDetails.rearSafety, roughness: 0.4 }),
        trainWinDark: new THREE.MeshStandardMaterial({ color: Col.trains.winDark, emissive: Col.trains.winDarkEmissive, emissiveIntensity: 0.35, roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.88 }),
        sideTrainWin: new THREE.MeshStandardMaterial({ color: Col.trains.sideTrainWin, emissive: Col.trains.sideTrainWinEmissive, emissiveIntensity: 0.15, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.88 }),

        /* ── Cached Obstacle Detail Materials ── */
        concrete: new THREE.MeshStandardMaterial({ color: Col.obstacles.concrete, roughness: 0.7, metalness: 0.05 }),
        warnPanel: new THREE.MeshStandardMaterial({ color: Col.obstacles.warnPanel, emissive: Col.obstacles.warnPanelEmissive, emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.2 }),
        warnRed: new THREE.MeshStandardMaterial({ color: Col.obstacles.warnRed, emissive: Col.obstacles.warnRedEmissive, emissiveIntensity: 1.8 }),
        warnRedSphere: new THREE.MeshStandardMaterial({ color: Col.obstacles.warnRedSphere, emissive: Col.obstacles.warnRedEmissive, emissiveIntensity: 1.8 }),
        hazardYellow: new THREE.MeshStandardMaterial({ color: Col.obstacles.hazardYellow, emissive: Col.obstacles.hazardYellowEmissive, emissiveIntensity: 0.2, roughness: 0.35 }),
        hazardBlack: new THREE.MeshStandardMaterial({ color: Col.obstacles.hazardBlack, roughness: 0.4 }),
        topStripOrange: new THREE.MeshStandardMaterial({ color: Col.obstacles.topStripOrange, emissive: Col.obstacles.topStripOrangeEmissive, emissiveIntensity: 0.35, roughness: 0.25 }),
        ubRedStripe: new THREE.MeshStandardMaterial({ color: Col.obstacles.ubRedStripe, emissive: Col.obstacles.ubRedStripeEmissive, emissiveIntensity: 0.4, roughness: 0.3 }),
        ubWhiteStripe: new THREE.MeshStandardMaterial({ color: Col.obstacles.ubWhiteStripe, roughness: 0.3 }),

        /* ── Cached Scenery Detail Materials ── */
        archTrim: new THREE.MeshStandardMaterial({ color: Col.environment.archTrim, roughness: 0.3, metalness: 0.3 }),
        lanternGlow: new THREE.MeshStandardMaterial({ color: Col.environment.lanternGlow, emissive: Col.environment.lanternGlowEmissive, emissiveIntensity: 0.6 }),
        lanternGlowSphere: new THREE.MeshStandardMaterial({ color: Col.environment.lanternGlow, emissive: Col.environment.lanternGlowEmissive, emissiveIntensity: 0.8, transparent: true, opacity: 0.7 }),

        /* ── Cached Building Detail Materials ── */
        roofSlabGrey: new THREE.MeshStandardMaterial({ color: Col.buildings.roofSlab, roughness: 0.85 }),
        cornice: new THREE.MeshStandardMaterial({ color: Col.buildings.cornice, roughness: 0.65 }),
        tankWood: new THREE.MeshStandardMaterial({ color: Col.buildings.tankWood, roughness: 0.85 }),
        blinkRed: new THREE.MeshStandardMaterial({ color: Col.buildings.blinkRed, emissive: Col.buildings.blinkRed, emissiveIntensity: 0.8 }),
        chimneyBrick: new THREE.MeshStandardMaterial({ color: Col.buildings.chimneyBrick, roughness: 0.85 }),
        fireEscape: new THREE.MeshStandardMaterial({ color: Col.buildings.fireEscape, metalness: 0.5, roughness: 0.4 }),
        buildBase: new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0.08 }),
    };

    /* ── Pre-cached train color scheme materials ── */
    var trainSchemes = Col.trains.schemes.map(function (s) {
        return {
            bodyMat: new THREE.MeshStandardMaterial({ color: s.body, roughness: 0.3, metalness: 0.35, emissive: s.accent, emissiveIntensity: 0.08 }),
            stripeMat: new THREE.MeshStandardMaterial({ color: s.stripe, roughness: 0.25, metalness: 0.2 }),
            accentMat: new THREE.MeshStandardMaterial({ color: s.accent, roughness: 0.35, metalness: 0.4 }),
        };
    });

    var sideTrainSchemes = Col.trains.sideSchemes.map(function (s) {
        return {
            bodyMat: new THREE.MeshStandardMaterial({ color: s.body, roughness: 0.3, metalness: 0.35 }),
            stripeMat: new THREE.MeshStandardMaterial({ color: s.stripe, roughness: 0.25, metalness: 0.2 }),
        };
    });

    var graffitiMats = Col.trains.graffiti.map(function (c) {
        return new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.1, emissive: c, emissiveIntensity: 0.08 });
    });

    var sideGraffitiMats = Col.trains.sideGraffiti.map(function (c) {
        return new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, emissive: c, emissiveIntensity: 0.06 });
    });

    var archMats = Col.environment.arches.map(function (c) {
        return new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.1, emissive: c, emissiveIntensity: 0.05 });
    });

    var archBannerMats = Col.environment.arches.map(function (c) {
        return new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, emissive: c, emissiveIntensity: 0.03 });
    });

    var awningMats = Col.buildings.awnings.map(function (c) {
        return new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, side: THREE.DoubleSide });
    });

    GAME.Materials = {
        mat: mat,
        trainSchemes: trainSchemes,
        sideTrainSchemes: sideTrainSchemes,
        graffitiMats: graffitiMats,
        sideGraffitiMats: sideGraffitiMats,
        archMats: archMats,
        archBannerMats: archBannerMats,
        awningMats: awningMats,
    };
})();
