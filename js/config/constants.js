/* ============================================================
   Game Constants — Railway Runner
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;

    var LANE_WIDTH = 2.4;

    GAME.Config = {
        LANE_WIDTH: LANE_WIDTH,
        LANES: [-LANE_WIDTH, 0, LANE_WIDTH],
        RUN_SPEED: 0.38,
        SPEED_INC: 0.0001,
        MAX_SPEED: 0.72,
        JUMP_VEL: 0.22,
        GRAVITY: -0.012,
        ROLL_DUR: 28,
        LANE_SWITCH: 0.14,
        COIN_SPIN: 0.045,
        GROUND_Y: 0,
        CAM_Y: 6.5,
        CAM_Z: 11.0,
        CAM_LOOKAT_Y: 2.0,
        FOG_NEAR: 50,
        FOG_FAR: 160,
        CHUNK_LEN: 200,
        SPAWN_DIST: 110,
        OBS_GAP_MIN: 12,
        OBS_GAP_MAX: 26,
        COIN_GAP: 6,
        POWERUP_CHANCE: 0.06,
        MAGNET_DUR: 480,
        MULTI_DUR: 480,
        INVULN_DUR: 180,
        GROUND_W: 28,
        MILESTONES: [500, 1000, 2500, 5000, 10000, 25000, 50000],
        MAX_PARTICLES: 30,
        COIN_ANIM_RANGE: 35,
        SHADOW_UPDATE_INTERVAL: 3,
        SMOOTH_FACTOR: 0.08,
    };
})();
