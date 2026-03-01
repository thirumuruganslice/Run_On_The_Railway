/* ============================================================
   Input — Run on the Railway
   Keyboard and touch input handling.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;
    var C = GAME.Config;

    var touchStartX = 0, touchStartY = 0, touchStartTime = 0;

    function moveLeft() {
        var state = GAME.State.state;
        if (state.targetLane > 0) { state.targetLane--; GAME.Audio.sfx.lane(); }
    }

    function moveRight() {
        var state = GAME.State.state;
        if (state.targetLane < 2) { state.targetLane++; GAME.Audio.sfx.lane(); }
    }

    function jump() {
        var state = GAME.State.state;
        if (!state.jumping && !state.rolling) {
            state.yVel = C.JUMP_VEL;
            state.jumping = true;
            GAME.Audio.sfx.jump();
        }
    }

    function roll() {
        var state = GAME.State.state;
        if (!state.rolling && !state.jumping) {
            state.rolling = true;
            state.rollTimer = C.ROLL_DUR;
            GAME.Audio.sfx.roll();
        }
    }

    function handleKeyDown(e) {
        var state = GAME.State.state;
        if (!state.running || state.gameOver) return;

        if (e.code === "KeyP" || e.code === "Escape") {
            if (GAME.Flow && GAME.Flow.togglePause) GAME.Flow.togglePause();
            return;
        }
        if (state.paused) return;

        switch (e.code) {
            case "ArrowLeft": case "KeyA": moveLeft(); break;
            case "ArrowRight": case "KeyD": moveRight(); break;
            case "ArrowUp": case "KeyW": case "Space": jump(); break;
            case "ArrowDown": case "KeyS": roll(); break;
        }
        e.preventDefault();
    }

    function handleKeyUp(e) { /* no-op, keys object removed for simplicity */ }

    function handleTouchStart(e) {
        var state = GAME.State.state;
        if (!state.running) return;
        var t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        touchStartTime = Date.now();
    }

    function handleTouchEnd(e) {
        var state = GAME.State.state;
        if (!state.running || state.paused || state.gameOver) return;
        var t = e.changedTouches[0];
        var dx = t.clientX - touchStartX;
        var dy = t.clientY - touchStartY;
        var dt = Date.now() - touchStartTime;
        if (dt > 500) return;
        var absDx = Math.abs(dx);
        var absDy = Math.abs(dy);
        var minSwipe = 30;
        if (absDx > absDy && absDx > minSwipe) {
            dx > 0 ? moveRight() : moveLeft();
        } else if (absDy > absDx && absDy > minSwipe) {
            dy < 0 ? jump() : roll();
        }
    }

    function setupInput() {
        var canvas = GAME.DOM.canvas;
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
        canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    }

    GAME.Input = {
        setupInput: setupInput,
        moveLeft: moveLeft,
        moveRight: moveRight,
        jump: jump,
        roll: roll,
    };
})();
