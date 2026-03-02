/* ============================================================
   Geometry Cache — Railway Runner
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;

    GAME.Geometry = {
        geo: {
            box: new THREE.BoxGeometry(1, 1, 1),
            coin: new THREE.CylinderGeometry(0.48, 0.48, 0.1, 16),
            coinInner: new THREE.CylinderGeometry(0.38, 0.38, 0.11, 16),
            sphere: new THREE.SphereGeometry(0.4, 10, 8),
            powerup: new THREE.OctahedronGeometry(0.55, 1),
            wheel: new THREE.CylinderGeometry(0.3, 0.3, 0.12, 8),
            capsule: new THREE.CylinderGeometry(0.18, 0.18, 0.5, 8),
            headSphere: new THREE.SphereGeometry(0.38, 10, 8),
        },
    };
})();
