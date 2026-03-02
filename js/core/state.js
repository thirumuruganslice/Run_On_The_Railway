/* ============================================================
   Game State — Railway Runner
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;
    var C = GAME.Config;

    var state = {
        running: false,
        paused: false,
        gameOver: false,
        score: 0,
        coins: 0,
        distance: 0,
        speed: C.RUN_SPEED,
        laneIndex: 1,
        targetLane: 1,
        yVel: 0,
        jumping: false,
        rolling: false,
        rollTimer: 0,
        frame: 0,
        magnetTimer: 0,
        multiplierTimer: 0,
        multiplier: 1,
        invulnTimer: 0,
        highScore: parseInt(localStorage.getItem("subwaySurfersHigh") || "0"),
    };

    function resetState() {
        state.score = 0;
        state.coins = 0;
        state.distance = 0;
        state.speed = C.RUN_SPEED;
        state.laneIndex = 1;
        state.targetLane = 1;
        state.yVel = 0;
        state.jumping = false;
        state.rolling = false;
        state.rollTimer = 0;
        state.frame = 0;
        state.magnetTimer = 0;
        state.multiplierTimer = 0;
        state.multiplier = 1;
        state.invulnTimer = 0;
        state.gameOver = false;
        state.paused = false;
        if (GAME.HUD && GAME.HUD.resetMilestones) {
            GAME.HUD.resetMilestones();
        }
    }

    GAME.State = { state: state, resetState: resetState };
})();
