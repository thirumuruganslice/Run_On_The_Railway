/* ============================================================
   DOM References — Railway Runner
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;

    GAME.DOM = {
        canvas: document.getElementById("gameCanvas"),
        flashOverlay: document.getElementById("flashOverlay"),
        hud: document.getElementById("hud"),
        hudScore: document.getElementById("hudScore"),
        hudCoins: document.getElementById("hudCoins"),
        hudDistance: document.getElementById("hudDistance"),
        hudMultiplier: document.getElementById("hudMultiplier"),
        hudPowerup: document.getElementById("hudPowerup"),
        btnPause: document.getElementById("btnPause"),
        btnMute: document.getElementById("btnMute"),
        startScreen: document.getElementById("startScreen"),
        startHigh: document.getElementById("startHigh"),
        gameOverScreen: document.getElementById("gameOverScreen"),
        pauseScreen: document.getElementById("pauseScreen"),
        btnRestart: document.getElementById("btnRestart"),
        btnHome: document.getElementById("btnHome"),
        btnResume: document.getElementById("btnResume"),
        btnPauseHome: document.getElementById("btnPauseHome"),
        finalScore: document.getElementById("finalScore"),
        finalCoins: document.getElementById("finalCoins"),
        finalBest: document.getElementById("finalBest"),
        newBestBadge: document.getElementById("newBestBadge"),
        goldFlash: document.getElementById("goldFlash"),
        milestoneNotif: document.getElementById("milestoneNotif"),
        coinIconHUD: document.querySelector(".coin-icon-hud"),
    };
})();
