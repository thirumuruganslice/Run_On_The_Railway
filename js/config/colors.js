/* ============================================================
   Color Palette — Railway Runner
   Centralized color definitions for the entire game.
   All hex color values used by materials, lights, and effects.
   Rebuilt with Subway Surfers–inspired palette.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME || (window.GAME = {});

    GAME.Colors = {

        /* ── Scene & Atmosphere ── */
        scene: {
            skyBackground: 0x8AAAC0,
            fog: 0xA0B8C8,
            ambientLight: 0xBCD4E0,
            directionalLight: 0xE4E0D8,
            hemiSky: 0x8AAAC0,
            hemiGround: 0x3A8030,
        },

        /* ── Tracks & Ground ── */
        tracks: {
            ground: 0x2A2826,
            gravel: 0x5C5450,
            rail: 0x8090A0,
            railSide: 0xC0CDD8,
            track: 0x506070,
            sleeper: 0x6B4A2A,
            sleeperDark: 0x3E2810,
            platform: 0x787068,
            platformEdge: 0x909088,
            platformEdgeEmissive: 0xF0A840,
            sidewalk: 0x787068,
            wire: 0xC0C0B8,
        },

        /* ── Player Character ── */
        player: {
            hoodie: 0x4878C0,
            hoodieEmissive: 0x2C5090,
            head: 0xF0C090,
            hair: 0xF0EEEA,
            shoe: 0xCC2828,
            shoeEmissive: 0x8A1818,
            sole: 0xE8E6E0,
            pant: 0x1A3060,
            backpack: 0xCC2828,
            backpackEmissive: 0x8A1818,
            cap: 0xF0EEEA,
            capEmissive: 0xE8E6E0,
            capBrim: 0xD02020,
            pocket: 0x2C5090,
            collar: 0x2C5090,
            eyeWhite: 0xffffff,
            eyePupil: 0x111111,
            iris: 0x1A3060,
            mouth: 0xCC2828,
            swoosh: 0xffffff,
            zipper: 0xdddddd,
            bpPocket: 0xD02020,
            drawstring: 0xeeeeee,
        },

        /* ── Trains ── */
        trains: {
            body: 0xC23028,
            bodyAlt: 0x2A5EA0,
            roof: 0x3E1008,
            bottom: 0x1A1210,
            wheel: 0x3A3840,
            window: 0xF2A96E,
            windowEmissive: 0xD08040,
            door: 0x901A14,
            stripe: 0xF5C040,
            headlight: 0xFFEE88,
            headlightEmissive: 0xFFD040,
            winDark: 0x1C2030,
            winDarkEmissive: 0x182030,
            sideTrainWin: 0xF0A86A,
            sideTrainWinEmissive: 0xC07830,
            schemes: [
                { body: 0xC23028, stripe: 0xD84030, accent: 0x7A1810 },
                { body: 0x2A5EA0, stripe: 0x4A80C0, accent: 0x122C54 },
                { body: 0xE8A018, stripe: 0xF5C040, accent: 0x9A5E08 },
                { body: 0xA82420, stripe: 0xF2A96E, accent: 0x7A1810 },
                { body: 0x1E4880, stripe: 0x4A80C0, accent: 0x0E2040 },
                { body: 0xC88010, stripe: 0xF5C040, accent: 0x7A4A06 },
            ],
            sideSchemes: [
                { body: 0xC23028, stripe: 0xD84030 },
                { body: 0x2A5EA0, stripe: 0x4A80C0 },
                { body: 0xE8A018, stripe: 0xF5C040 },
                { body: 0xA82420, stripe: 0xF2A96E },
                { body: 0x1E4880, stripe: 0x4A80C0 },
                { body: 0xC88010, stripe: 0xF5C040 },
                { body: 0xD84030, stripe: 0xF0A86A },
            ],
            graffiti: [0xff4488, 0x4A80C0, 0xF5C040, 0x4CAF50, 0xE8A018, 0xD42020, 0xC23028],
            sideGraffiti: [0xff4488, 0x4A80C0, 0xF5C040, 0x4CAF50, 0xE8A018, 0xD42020],
        },

        /* ── Obstacles & Barriers ── */
        obstacles: {
            barrier: 0xF0EEEA,
            barrierStripe: 0xCC1818,
            barrierWarn: 0xCC1818,
            barrierWarnEmissive: 0xFF2020,
            concrete: 0x787878,
            warnPanel: 0xFF8040,
            warnPanelEmissive: 0xD42020,
            warnRed: 0xD42020,
            warnRedEmissive: 0xFF2020,
            warnRedSphere: 0xD42020,
            hazardYellow: 0xF0A840,
            hazardYellowEmissive: 0xE8AA20,
            hazardBlack: 0x1A1818,
            topStripOrange: 0xFF8040,
            topStripOrangeEmissive: 0xD42020,
            ubRedStripe: 0xCC1818,
            ubRedStripeEmissive: 0xD42020,
            ubWhiteStripe: 0xF0EEEA,
            arrow: 0xCC1818,
            arrowOutline: 0xF0EEEA,
        },

        /* ── Collectibles ── */
        collectibles: {
            coin: 0xFFB800,
            coinEmissive: 0xCC8800,
            coinEdge: 0xCC8800,
            coinStar: 0xFFB800,
            coinStarEmissive: 0xCC8800,
            coinGlow: 0xFFB800,
            powerGreen: 0x2DB52D,
            powerGreenEmissive: 0x1E8A1E,
            powerPurple: 0x80E8FF,
            powerPurpleEmissive: 0x4A80C0,
        },

        /* ── Buildings ── */
        buildings: {
            base: [
                "#D4C498", "#C0A878", "#B84E28", "#38887A",
                "#E06020", "#2A8878", "#3A9040", "#E8AA20",
                "#4A6888", "#C04828", "#D09010", "#B09A70",
                "#D4C498", "#4CAF50",
            ],
            main: 0xD4C498,
            alt: 0x38887A,
            brick: 0xB84E28,
            concrete: 0xB09A70,
            window: 0xF4CE88,
            windowEmissive: 0xF0C070,
            windowDark: 0x1C2030,
            rooftop: 0x363E44,
            antenna: 0x606870,
            neonRed: 0xD42020,
            neonRedEmissive: 0xFF8040,
            neonBlue: 0x3A7ACC,
            neonBlueEmissive: 0x4A80C0,
            neonGreen: 0x4CAF50,
            neonGreenEmissive: 0x3A9040,
            roofSlab: 0x363E44,
            cornice: 0xC8BC98,
            tankWood: 0x6B4A2A,
            blinkRed: 0xD42020,
            chimneyBrick: 0x8A7A60,
            fireEscape: 0x505858,
            awnings: [0xC23028, 0x2A5080, 0x38887A, 0xE8A018, 0xC04828],
            texPool: [
                "#D4C498", "#C0A878", "#B84E28", "#38887A",
                "#E06020", "#2A8878", "#D09010", "#C0A878",
                "#D4C498", "#4A6888",
            ],
        },

        /* ── Environment & Scenery ── */
        environment: {
            fence: 0x505860,
            lampPost: 0x383838,
            lampGlow: 0xF0A840,
            lampGlowEmissive: 0xF0C070,
            signal: 0x505860,
            signalRed: 0xD42020,
            signalRedEmissive: 0xFF8040,
            signalGreen: 0x4CAF50,
            signalGreenEmissive: 0x3A9040,
            arches: [0xC23028, 0x7A1810, 0xD84030],
            archTrim: 0xD4A020,
            lanternGlow: 0xFF8040,
            lanternGlowEmissive: 0xF0A840,
        },

        /* ── Train Detail Parts ── */
        trainDetails: {
            chrome: 0xC0CDD8,
            seal: 0x1A1210,
            safety: 0xF5C040,
            wiper: 0x1A1818,
            dstBorder: 0x4A4050,
            dstDisplay: 0xF2A96E,
            dstDisplayEmissive: 0xD08040,
            amber: 0xF0A840,
            amberEmissive: 0xE8AA20,
            grille: 0x1A1408,
            ditchLight: 0xffffff,
            ditchLightEmissive: 0xffffff,
            pilot: 0x505860,
            numberPlate: 0xC0CDD8,
            tailLight: 0xD42020,
            tailLightEmissive: 0xD42020,
            rearSafety: 0xF5C040,
        },

        /* ── Particles ── */
        particles: {
            dust: 0x5C5450,
            spark: 0xF0A840,
        },

        /* ── Texture Base Colors (CSS strings) ── */
        textures: {
            gravelBase: "#5C5450",
            groundBase: "#2A2826",
        },
    };
})();
