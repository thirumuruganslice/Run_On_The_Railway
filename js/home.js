/* ============================================================
   Run on the Railway — Home Screen Controller
   Handles: Shop, Settings, Leaderboard, Missions, Panels
   ============================================================ */
"use strict";

(function HomeController() {

    /* ── Storage keys ── */
    const KEY_HIGH = "subwaySurfersHigh";
    const KEY_COINS = "rotr_totalCoins";
    const KEY_RUNS = "rotr_runHistory";
    const KEY_PREFS = "rotr_prefs";
    const KEY_OWNED = "rotr_ownedItems";
    const KEY_MISSIONS = "rotr_missions";
    const KEY_THEME = "rotr_theme";

    /* ── Load / Save helpers ── */
    const load = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
    const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

    /* ── DOM shorthand (must be defined early) ── */
    const $ = id => document.getElementById(id);
    const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

    let totalCoins = load(KEY_COINS, 0);
    let ownedItems = load(KEY_OWNED, ["racer-default"]);
    let prefs = load(KEY_PREFS, { sfx: true, music: true, vibration: true, lowPower: false });
    let currentTheme = load(KEY_THEME, "light");

    /* ── Apply theme immediately (before render) ── */
    function applyTheme(theme) {
        currentTheme = theme;
        document.documentElement.setAttribute("data-theme", theme);
        save(KEY_THEME, theme);
        // update buttons
        const darkBtn = $("btnThemeDark");
        const lightBtn = $("btnThemeLight");
        if (darkBtn) darkBtn.classList.toggle("active-theme", theme === "dark");
        if (lightBtn) lightBtn.classList.toggle("active-theme", theme === "light");
    }
    applyTheme(currentTheme);

    /* ── Mission definitions ── */
    const MISSIONS_DEF = [
        { id: "run5", icon: "🏃", name: "First Steps", desc: "Complete 5 runs", goal: 5, type: "runs", reward: 100 },
        { id: "score500", icon: "🎯", name: "500 Club", desc: "Reach a score of 500", goal: 500, type: "score", reward: 80 },
        { id: "coins50", icon: "🪙", name: "Coin Hoarder", desc: "Collect 50 coins in one run", goal: 50, type: "coins_run", reward: 120 },
        { id: "score2500", icon: "🔥", name: "On Fire", desc: "Reach a score of 2,500", goal: 2500, type: "score", reward: 200 },
        { id: "dist1000", icon: "🚂", name: "Long Haul", desc: "Travel 1,000m in one run", goal: 1000, type: "dist", reward: 150 },
        { id: "coins500", icon: "💰", name: "Rich Runner", desc: "Earn 500 total coins", goal: 500, type: "totalCoins", reward: 180 },
    ];
    let missionProgress = load(KEY_MISSIONS, {});

    /* ─────────────────────────────────────────────────
       Expose a hook so game.js can report run results
    ───────────────────────────────────────────────── */
    window.HomeCtrl = {
        /** Called by game after a run ends */
        recordRun(score, coins, distMeters) {
            // accumulate total coins
            totalCoins += coins;
            save(KEY_COINS, totalCoins);

            // save run history (keep last 20)
            const runs = load(KEY_RUNS, []);
            runs.unshift({ score, coins, dist: distMeters, ts: Date.now() });
            if (runs.length > 20) runs.length = 20;
            save(KEY_RUNS, runs);

            // update missions
            _updateMissions(score, coins, distMeters);
        },
        getTotalCoins: () => totalCoins,
        getPrefs: () => prefs,
    };

    /* ── Mission progress update ── */
    function _updateMissions(score, coinsRun, dist) {
        const runCount = (load(KEY_RUNS, [])).length;
        MISSIONS_DEF.forEach(m => {
            if (missionProgress[m.id] >= m.goal) return; // already done
            let val = missionProgress[m.id] || 0;
            switch (m.type) {
                case "runs": val = runCount; break;
                case "score": val = Math.max(val, score); break;
                case "coins_run": val = Math.max(val, coinsRun); break;
                case "dist": val = Math.max(val, dist); break;
                case "totalCoins": val = totalCoins; break;
            }
            if (val >= m.goal && !missionProgress[m.id + "_rewarded"]) {
                totalCoins += m.reward;
                save(KEY_COINS, totalCoins);
                missionProgress[m.id + "_rewarded"] = true;
            }
            missionProgress[m.id] = val;
        });
        save(KEY_MISSIONS, missionProgress);
    }

    /* ─────────────────────────────────────────────────
       Refresh coin displays everywhere
    ───────────────────────────────────────────────── */
    function refreshCoins() {
        const el = $("homeTotalCoins");
        const shopEl = $("shopCoins");
        const lbEl = $("lbTotalCoins");
        if (el) el.textContent = totalCoins.toLocaleString();
        if (shopEl) shopEl.textContent = totalCoins.toLocaleString();
        if (lbEl) lbEl.textContent = totalCoins.toLocaleString();
    }

    /* ─────────────────────────────────────────────────
       Panel open / close
    ───────────────────────────────────────────────── */
    function openPanel(id) {
        const el = $(id);
        if (!el) return;
        el.style.display = "flex";
        // refresh content when opened
        if (id === "shopScreen") refreshCoins();
        if (id === "leaderboardScreen") refreshLeaderboard();
        if (id === "missionScreen") refreshMissions();
        if (id === "settingsScreen") applyTheme(currentTheme); // sync btn states
    }

    function closePanel(id) {
        const el = $(id);
        if (el) el.style.display = "none";
    }

    // close buttons (data-close attribute)
    document.addEventListener("click", e => {
        const btn = e.target.closest("[data-close]");
        if (btn) closePanel(btn.dataset.close);

        // click outside panel card closes it
        if (e.target.classList.contains("panel-overlay")) {
            e.target.style.display = "none";
        }
    });

    /* ─────────────────────────────────────────────────
       Home nav buttons
    ───────────────────────────────────────────────── */
    $("navShop")?.addEventListener("click", () => openPanel("shopScreen"));
    $("navLeaderboard")?.addEventListener("click", () => openPanel("leaderboardScreen"));
    $("navHowToPlay")?.addEventListener("click", () => openPanel("howToPlayScreen"));
    $("btnSettings")?.addEventListener("click", () => openPanel("settingsScreen"));
    $("btnMission")?.addEventListener("click", () => openPanel("missionScreen"));

    /* Pause screen home button */
    $("btnPauseHome")?.addEventListener("click", () => {
        const pauseScreen = $("pauseScreen");
        if (pauseScreen) pauseScreen.style.display = "none";
        // delegate to game.js goHome via btnHome click
        $("btnHome")?.click();
    });

    /* ─────────────────────────────────────────────────
       SHOP — tab switching
    ───────────────────────────────────────────────── */
    $$(".shop-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            $$(".shop-tab").forEach(t => t.classList.remove("active"));
            $$(".shop-tab-content").forEach(c => { c.style.display = "none"; c.classList.remove("active"); });
            tab.classList.add("active");
            const content = $("tab-" + tab.dataset.tab);
            if (content) { content.style.display = ""; content.classList.add("active"); }
            // hide other tabs
            $$(".shop-tab-content").forEach(c => {
                if (c !== content) c.style.display = "none";
            });
        });
    });

    /* ── shop buy buttons ── */
    $("shopScreen")?.addEventListener("click", e => {
        const btn = e.target.closest(".shop-buy-btn");
        if (!btn || btn.disabled || btn.classList.contains("owned-btn")) return;

        const cost = parseInt(btn.dataset.cost, 10);
        const item = btn.dataset.item;
        const toast = $("shopToast");

        if (isNaN(cost) || !item) return;

        if (totalCoins < cost) {
            showToast(toast, "❌ Not enough coins!", "#d07080");
            return;
        }

        if (ownedItems.includes(item)) {
            showToast(toast, "✅ Already owned!", "var(--cyan)");
            return;
        }

        // Deduct coins
        totalCoins -= cost;
        save(KEY_COINS, totalCoins);
        ownedItems.push(item);
        save(KEY_OWNED, ownedItems);

        // Update button UI
        btn.textContent = "✓ Owned";
        btn.disabled = true;
        btn.classList.add("owned-btn");
        btn.closest(".shop-item")?.classList.add("owned");

        refreshCoins();
        showToast(toast, `🎉 ${item.replace(/-/g, " ")} purchased!`, "var(--cyan)");
    });

    function showToast(el, msg, color) {
        if (!el) return;
        el.textContent = msg;
        el.style.color = color || "var(--cyan)";
        clearTimeout(el._t);
        el._t = setTimeout(() => { el.textContent = ""; }, 3000);
    }

    /* ── mark owned items on open ── */
    function refreshShopOwned() {
        ownedItems = load(KEY_OWNED, ["racer-default"]);
        $$(".shop-buy-btn[data-item]").forEach(btn => {
            if (ownedItems.includes(btn.dataset.item)) {
                btn.textContent = "✓ Owned";
                btn.disabled = true;
                btn.classList.add("owned-btn");
                btn.closest(".shop-item")?.classList.add("owned");
            }
        });
    }
    document.addEventListener("DOMContentLoaded", refreshShopOwned);

    /* ─────────────────────────────────────────────────
       SETTINGS — toggles
    ───────────────────────────────────────────────── */
    function applyPrefs() {
        const sfxEl = $("settingSfx");
        const musEl = $("settingMusic");
        const vibEl = $("settingVibration");
        const lowEl = $("settingLowPower");
        if (sfxEl) sfxEl.checked = prefs.sfx;
        if (musEl) musEl.checked = prefs.music;
        if (vibEl) vibEl.checked = prefs.vibration;
        if (lowEl) lowEl.checked = prefs.lowPower;
    }

    $("settingSfx")?.addEventListener("change", e => { prefs.sfx = e.target.checked; save(KEY_PREFS, prefs); syncMuteBtn(); });
    $("settingMusic")?.addEventListener("change", e => { prefs.music = e.target.checked; save(KEY_PREFS, prefs); syncMuteBtn(); });
    $("settingVibration")?.addEventListener("change", e => { prefs.vibration = e.target.checked; save(KEY_PREFS, prefs); });
    $("settingLowPower")?.addEventListener("change", e => { prefs.lowPower = e.target.checked; save(KEY_PREFS, prefs); });
    /* theme buttons */
    $('btnThemeDark')?.addEventListener('click', () => applyTheme('dark'));
    $('btnThemeLight')?.addEventListener('click', () => applyTheme('light'));
    function syncMuteBtn() {
        // Reflect settings into the in-game mute button text
        const muteBtn = $("btnMute");
        if (!muteBtn) return;
        muteBtn.textContent = prefs.sfx ? "🔊" : "🔇";
    }

    $("btnResetProgress")?.addEventListener("click", () => {
        if (!confirm("Reset ALL progress? This cannot be undone.")) return;
        localStorage.removeItem(KEY_HIGH);
        localStorage.removeItem(KEY_COINS);
        localStorage.removeItem(KEY_RUNS);
        localStorage.removeItem(KEY_MISSIONS);
        localStorage.removeItem(KEY_OWNED);
        totalCoins = 0;
        ownedItems = ["racer-default"];
        missionProgress = {};
        refreshCoins();
        refreshShopOwned();
        refreshLeaderboard();
        refreshMissions();
        closePanel("settingsScreen");
    });

    /* ─────────────────────────────────────────────────
       LEADERBOARD
    ───────────────────────────────────────────────── */
    function refreshLeaderboard() {
        const runs = load(KEY_RUNS, []);
        const bestScore = load(KEY_HIGH, 0);

        // best score display
        const lbBest = $("lbBestScore");
        if (lbBest) lbBest.textContent = bestScore > 0 ? bestScore.toLocaleString() : "—";
        refreshCoins();

        // best distance
        const bestDist = runs.reduce((max, r) => Math.max(max, r.dist || 0), 0);
        const lbDist = $("lbBestDist");
        if (lbDist) lbDist.textContent = bestDist > 0 ? bestDist + "m" : "—";

        // run history table
        const tbody = $("lbTableBody");
        if (!tbody) return;
        if (runs.length === 0) {
            tbody.innerHTML = `<div class="lb-empty">Play a run to see history!</div>`;
            return;
        }
        tbody.innerHTML = runs.slice(0, 15).map((r, i) => `
            <div class="lb-row">
                <span class="lb-rank">#${i + 1}</span>
                <span class="lb-score">${r.score.toLocaleString()}</span>
                <span class="lb-dist">${(r.dist || 0).toLocaleString()}m</span>
            </div>
        `).join("");
    }

    /* ─────────────────────────────────────────────────
       MISSIONS
    ───────────────────────────────────────────────── */
    function refreshMissions() {
        const list = $("missionList");
        if (!list) return;
        missionProgress = load(KEY_MISSIONS, {});
        list.innerHTML = MISSIONS_DEF.map(m => {
            const prog = Math.min(missionProgress[m.id] || 0, m.goal);
            const done = prog >= m.goal;
            const pct = Math.round((prog / m.goal) * 100);
            return `
            <div class="mission-item${done ? " done" : ""}">
                <span class="mission-icon">${m.icon}</span>
                <div class="mission-body">
                    <div class="mission-name">${m.name}</div>
                    <div class="mission-desc">${m.desc}</div>
                    <div class="mission-progress-bar">
                        <div class="mission-progress-fill" style="width:${pct}%"></div>
                    </div>
                </div>
                <div class="mission-reward">
                    ${done
                    ? `<span class="mission-check">✅</span>`
                    : `<span class="mini-coin"></span>${m.reward}`}
                </div>
            </div>`;
        }).join("");
    }

    /* ─────────────────────────────────────────────────
       INTERCEPT game.js goHome — refresh coins display
    ───────────────────────────────────────────────── */
    // game.js shows startScreen; observe that and refresh coins
    const startScreen = $("startScreen");
    if (startScreen) {
        const observer = new MutationObserver(() => {
            if (startScreen.style.display !== "none") {
                refreshCoins();
                refreshShopOwned();
            }
        });
        observer.observe(startScreen, { attributes: true, attributeFilter: ["style"] });
    }

    /* ─────────────────────────────────────────────────
       Hook game over to record run stats
    ───────────────────────────────────────────────── */
    const gameOverScreen = $("gameOverScreen");
    if (gameOverScreen) {
        const goObserver = new MutationObserver(() => {
            if (gameOverScreen.style.display !== "none") {
                const score = parseInt(($("finalScore")?.textContent || "0").replace(/,/g, ""), 10);
                const coins = parseInt(($("finalCoins")?.textContent || "0").replace(/,/g, ""), 10);
                const distEl = $("hudDistance");
                const dist = distEl ? parseInt(distEl.textContent, 10) || 0 : 0;
                if (score >= 0) window.HomeCtrl.recordRun(score, coins, dist);
                refreshCoins();
            }
        });
        goObserver.observe(gameOverScreen, { attributes: true, attributeFilter: ["style"] });
    }

    /* ─────────────────────────────────────────────────
       INIT
    ───────────────────────────────────────────────── */
    applyPrefs();
    refreshCoins();

})();
