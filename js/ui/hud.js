/* ============================================================
   HUD — Railway Runner
   Floating text, milestone celebration, HUD updates.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;
    var C = GAME.Config;
    var DOM = GAME.DOM;
    var scene = GAME.Renderer.scene;
    var state = GAME.State.state;

    var floatingTexts = [];
    var nextMilestoneIdx = 0;
    var milestoneTimeout = null;

    /* ── Floating Text ── */
    function showFloatingText(text, pos) {
        var c = document.createElement("canvas");
        c.width = 256;
        c.height = 80;
        var ctx = c.getContext("2d");

        ctx.font = "bold 42px 'Poppins', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.shadowColor = "rgba(255, 200, 0, 0.8)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#fff8e0";
        ctx.fillText(text, 128, 40);

        ctx.shadowBlur = 0;
        var grad = ctx.createLinearGradient(0, 20, 0, 60);
        grad.addColorStop(0, "#fff8e0");
        grad.addColorStop(0.5, "#ffd700");
        grad.addColorStop(1, "#ff9900");
        ctx.fillStyle = grad;
        ctx.fillText(text, 128, 40);

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(80, 50, 0, 0.5)";
        ctx.strokeText(text, 128, 40);

        var tex = new THREE.CanvasTexture(c);
        var spriteMat = new THREE.SpriteMaterial({
            map: tex, transparent: true, depthTest: false, depthWrite: false,
        });
        var sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.6, 0.5, 1);
        sprite.position.copy(pos);
        sprite.position.y += 1.8;
        sprite.position.x += (Math.random() - 0.5) * 0.3;
        scene.add(sprite);
        floatingTexts.push({ sprite: sprite, life: 50, maxLife: 50, startY: sprite.position.y });
    }

    function updateFloatingTexts() {
        for (var i = floatingTexts.length - 1; i >= 0; i--) {
            var ft = floatingTexts[i];
            var progress = 1 - (ft.life / ft.maxLife);
            var easeOut = 1 - Math.pow(1 - progress, 3);
            ft.sprite.position.y = ft.startY + easeOut * 2.0;
            var scaleEase = progress < 0.15 ? (1 + (progress / 0.15) * 0.3) : (1.3 - (progress - 0.15) * 0.35);
            ft.sprite.scale.set(1.6 * scaleEase, 0.5 * scaleEase, 1);
            ft.sprite.material.opacity = progress > 0.6 ? (1 - (progress - 0.6) / 0.4) : 1;
            ft.life--;
            if (ft.life <= 0) {
                scene.remove(ft.sprite);
                ft.sprite.material.map.dispose();
                ft.sprite.material.dispose();
                floatingTexts.splice(i, 1);
            }
        }
    }

    /* ── Powerup indicator ── */
    function showPowerup(text) {
        DOM.hudPowerup.textContent = text;
        DOM.hudPowerup.classList.add("visible");
        setTimeout(function () { DOM.hudPowerup.classList.remove("visible"); }, 2000);
    }

    /* ── Coin icon pop ── */
    function popCoinIcon() {
        if (!DOM.coinIconHUD) return;
        DOM.coinIconHUD.classList.remove("pop");
        void DOM.coinIconHUD.offsetWidth;
        DOM.coinIconHUD.classList.add("pop");
        setTimeout(function () { DOM.coinIconHUD.classList.remove("pop"); }, 250);
    }

    /* ── Gold flash overlay ── */
    function flashGold() {
        if (!DOM.goldFlash) return;
        DOM.goldFlash.classList.add("active");
        setTimeout(function () { DOM.goldFlash.classList.remove("active"); }, 220);
    }

    /* ── Milestone text ── */
    function showMilestoneText(text) {
        if (!DOM.milestoneNotif) return;
        clearTimeout(milestoneTimeout);
        DOM.milestoneNotif.classList.remove("active", "fade-out");
        DOM.milestoneNotif.textContent = text;
        void DOM.milestoneNotif.offsetWidth;
        DOM.milestoneNotif.classList.add("active");
        milestoneTimeout = setTimeout(function () {
            DOM.milestoneNotif.classList.remove("active");
            DOM.milestoneNotif.classList.add("fade-out");
            setTimeout(function () { DOM.milestoneNotif.classList.remove("fade-out"); }, 500);
        }, 1400);
    }

    /* ── Milestone check ── */
    function checkMilestones() {
        if (nextMilestoneIdx >= C.MILESTONES.length) return;
        if (state.score >= C.MILESTONES[nextMilestoneIdx]) {
            celebrateMilestone(C.MILESTONES[nextMilestoneIdx]);
            nextMilestoneIdx++;
        }
    }

    function celebrateMilestone(score) {
        GAME.Audio.sfx.milestone();
        flashGold();
        var player = GAME.Player.getPlayer();
        if (player) {
            for (var i = 0; i < 4; i++) GAME.Particles.spawnSparks(player.position, 14);
        }
        var labels = ["NICE!", "AWESOME!", "INCREDIBLE!", "LEGENDARY!", "UNSTOPPABLE!", "DEITY MODE!", "TRANSCENDENT!"];
        var label = labels[Math.min(nextMilestoneIdx, labels.length - 1)];
        showMilestoneText(label + "  " + score.toLocaleString());
        state.invulnTimer = Math.max(state.invulnTimer, 90);
    }

    /* ── HUD DOM update ── */
    function updateHUD() {
        DOM.hudScore.textContent = state.score.toLocaleString();
        DOM.hudCoins.textContent = state.coins.toLocaleString();
        DOM.hudDistance.textContent = Math.floor(state.distance) + "m";

        if (state.multiplier > 1 && state.multiplierTimer > 0) {
            DOM.hudMultiplier.textContent = "×" + state.multiplier + " (" + Math.ceil(state.multiplierTimer / 60) + "s)";
            DOM.hudMultiplier.classList.add("visible");
        } else {
            DOM.hudMultiplier.classList.remove("visible");
        }
    }

    function resetMilestones() {
        nextMilestoneIdx = 0;
    }

    GAME.HUD = {
        floatingTexts: floatingTexts,
        showFloatingText: showFloatingText,
        updateFloatingTexts: updateFloatingTexts,
        showPowerup: showPowerup,
        popCoinIcon: popCoinIcon,
        flashGold: flashGold,
        showMilestoneText: showMilestoneText,
        checkMilestones: checkMilestones,
        celebrateMilestone: celebrateMilestone,
        updateHUD: updateHUD,
        resetMilestones: resetMilestones,
    };
})();
