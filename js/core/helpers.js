/* ============================================================
   Helper Functions — Run on the Railway
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function rndInt(a, b) { return Math.floor(rnd(a, b + 1)); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    /* Dispose a group/mesh properly — frees GPU geometry buffers */
    function disposeGroup(obj) {
        GAME.Renderer.scene.remove(obj);
        obj.traverse(function (child) {
            if (child.geometry) child.geometry.dispose();
        });
    }

    GAME.Helpers = { rnd: rnd, rndInt: rndInt, pick: pick, lerp: lerp, clamp: clamp, disposeGroup: disposeGroup };
})();
