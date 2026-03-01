/* ============================================================
   Color Palette — Run on the Railway
   Centralized color definitions for the entire game.
   All hex color values used by materials, lights, and effects.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME || (window.GAME = {});

    GAME.Colors = {

        /* ── Scene & Atmosphere ── */
        scene: {
            skyBackground: 0xB8D4E8,
            fog: 0xD0E5EE,
            ambientLight: 0xdde0e8,
            directionalLight: 0xfff8ee,
            hemiSky: 0xc8d8f0,
            hemiGround: 0x88aa77,
        },

        /* ── Tracks & Ground ── */
        tracks: {
            ground: 0x504030,
            gravel: 0x7A6A58,
            rail: 0x8A8A90,
            railSide: 0xB0B0B8,
            track: 0x6A5A48,
            sleeper: 0x6A4A28,
            sleeperDark: 0x4A2E10,
            platform: 0x504030,
            platformEdge: 0xF5C000,
            platformEdgeEmissive: 0xFFB830,
            sidewalk: 0x9A8A70,
            wire: 0x2A2828,
        },

        /* ── Player Character ── */
        player: {
            hoodie: 0x28A898,
            hoodieEmissive: 0x1A7868,
            head: 0xF5D0A0,
            hair: 0xF0EEE8,
            shoe: 0x2A2840,
            shoeEmissive: 0x0A0A18,
            sole: 0xF5F0E0,
            pant: 0x4858A0,
            backpack: 0xE85030,
            backpackEmissive: 0xC03820,
            cap: 0xE85030,
            capEmissive: 0xC03820,
            capBrim: 0xC03820,
            pocket: 0x1A7868,
            collar: 0x1A7868,
            eyeWhite: 0xffffff,
            eyePupil: 0x111111,
            iris: 0x4858A0,
            mouth: 0xcc4444,
            swoosh: 0xffffff,
            zipper: 0xdddddd,
            bpPocket: 0xC03820,
            drawstring: 0xeeeeee,
        },

        /* ── Trains ── */
        trains: {
            body: 0xC8302A,
            bodyAlt: 0x1A4E8C,
            roof: 0x9A2020,
            bottom: 0x2A1A0E,
            wheel: 0x5A4A3A,
            window: 0xF5A05A,
            windowEmissive: 0x8BBCDA,
            door: 0xB02020,
            stripe: 0xF5C020,
            headlight: 0xFFEE88,
            headlightEmissive: 0xFFD040,
            winDark: 0x152030,
            winDarkEmissive: 0x1a3355,
            sideTrainWin: 0x8BBCDA,
            sideTrainWinEmissive: 0x8BBCDA,
            schemes: [
                { body: 0x1A4E8C, stripe: 0xF5C020, accent: 0x0E2E5A },
                { body: 0xC8302A, stripe: 0xF2E8D0, accent: 0x8B1A1A },
                { body: 0x3A7848, stripe: 0xF5C020, accent: 0x285838 },
                { body: 0xE8850A, stripe: 0xFAD080, accent: 0xA05808 },
                { body: 0xC02828, stripe: 0xD0A020, accent: 0x8B1A1A },
                { body: 0x2060A0, stripe: 0xF5C020, accent: 0x0E3060 },
            ],
            sideSchemes: [
                { body: 0x1A4E8C, stripe: 0xF5C020 },
                { body: 0xC8302A, stripe: 0xF2E8D0 },
                { body: 0x3A7848, stripe: 0xF5C020 },
                { body: 0xE8850A, stripe: 0xF5F0E8 },
                { body: 0xC02828, stripe: 0xD0A020 },
                { body: 0x2060A0, stripe: 0xF5C020 },
                { body: 0xD94040, stripe: 0xF2E8D0 },
            ],
            graffiti: [0xff4488, 0x44ddff, 0xffee33, 0x66ff44, 0xff8833, 0xaa55ff, 0xff3333],
            sideGraffiti: [0xff4488, 0x44ddff, 0xffee33, 0x66ff44, 0xff8833, 0xaa55ff],
        },

        /* ── Obstacles & Barriers ── */
        obstacles: {
            barrier: 0xF5C000,
            barrierStripe: 0xCC2020,
            barrierWarn: 0xD83030,
            barrierWarnEmissive: 0xFF2020,
            concrete: 0x888888,
            warnPanel: 0xff4400,
            warnPanelEmissive: 0xff2200,
            warnRed: 0xff2200,
            warnRedEmissive: 0xff0000,
            warnRedSphere: 0xff0000,
            hazardYellow: 0xffcc00,
            hazardYellowEmissive: 0xffaa00,
            hazardBlack: 0x222222,
            topStripOrange: 0xff6600,
            topStripOrangeEmissive: 0xff4400,
            ubRedStripe: 0xff2222,
            ubRedStripeEmissive: 0xff1100,
            ubWhiteStripe: 0xffffff,
            arrow: 0xff1111,
            arrowOutline: 0xffffff,
        },

        /* ── Collectibles ── */
        collectibles: {
            coin: 0xFFB800,
            coinEmissive: 0xC88000,
            coinEdge: 0xC88000,
            coinStar: 0xffe066,
            coinStarEmissive: 0xffcc00,
            coinGlow: 0xFFB800,
            powerGreen: 0x33ff88,
            powerGreenEmissive: 0x22cc66,
            powerPurple: 0xaa44ff,
            powerPurpleEmissive: 0x8833cc,
        },

        /* ── Buildings ── */
        buildings: {
            base: [
                "#C8B898", "#D8C8A8", "#B8C8C0", "#C8D8D0",
                "#9A9080", "#AAA090", "#3A7848", "#4A8858",
                "#E8D8B8", "#D8E8E0", "#BABAA0", "#C8B898",
                "#D8C8A8", "#B8C8C0",
            ],
            main: 0xC8B898,
            alt: 0xB8C8C0,
            brick: 0x9A9080,
            concrete: 0xAAA090,
            window: 0xFFD880,
            windowEmissive: 0xFFE890,
            windowDark: 0x2A3040,
            rooftop: 0x707868,
            antenna: 0x5A4A3A,
            neonRed: 0xFF2020,
            neonRedEmissive: 0xFF6060,
            neonBlue: 0x2060B8,
            neonBlueEmissive: 0x3A7AB8,
            neonGreen: 0x3A7848,
            neonGreenEmissive: 0x5A9868,
            roofSlab: 0x707868,
            cornice: 0xA89878,
            tankWood: 0x5A4A3A,
            blinkRed: 0xff0000,
            chimneyBrick: 0x5A4A3A,
            fireEscape: 0x4A3828,
            awnings: [0xCC2020, 0x1A4E8C, 0x3A7848, 0xE8850A, 0xC02828],
            texPool: [
                "#C8B898", "#D8C8A8", "#B8C8C0", "#C8D8D0",
                "#9A9080", "#AAA090", "#3A7848", "#D8C8A8",
                "#C8B898", "#B8C8C0",
            ],
        },

        /* ── Environment & Scenery ── */
        environment: {
            fence: 0x4A3828,
            lampPost: 0x4A3828,
            lampGlow: 0xFFD060,
            lampGlowEmissive: 0xFFB830,
            signal: 0x3A3030,
            signalRed: 0xFF2020,
            signalRedEmissive: 0xFF6060,
            signalGreen: 0x3A7848,
            signalGreenEmissive: 0x5A9868,
            arches: [0xCC1818, 0x8A0808, 0xE02020],
            archTrim: 0xD0A020,
            lanternGlow: 0xFFD060,
            lanternGlowEmissive: 0xFFB830,
        },

        /* ── Train Detail Parts ── */
        trainDetails: {
            chrome: 0xddddee,
            seal: 0x111111,
            safety: 0xffcc00,
            wiper: 0x222222,
            dstBorder: 0x333344,
            dstDisplay: 0xffeedd,
            dstDisplayEmissive: 0xffddaa,
            amber: 0xffaa00,
            amberEmissive: 0xff8800,
            grille: 0x222233,
            ditchLight: 0xffffff,
            ditchLightEmissive: 0xffffff,
            pilot: 0x3A3030,
            numberPlate: 0xddddcc,
            tailLight: 0xff0011,
            tailLightEmissive: 0xff0011,
            rearSafety: 0xffcc00,
        },

        /* ── Particles ── */
        particles: {
            dust: 0x9A8A70,
            spark: 0xFFD060,
        },

        /* ── Texture Base Colors (CSS strings) ── */
        textures: {
            gravelBase: "#7A6A58",
            groundBase: "#504030",
        },
    };
})();
