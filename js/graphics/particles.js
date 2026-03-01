/* ============================================================
   Particle System — Run on the Railway
   Dust trails and spark effects with material pooling.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;
    var C = GAME.Config;
    var H = GAME.Helpers;

    var scene = GAME.Renderer.scene;
    var particles = [];
    var particleGeo = new THREE.SphereGeometry(0.035, 4, 4);

    /* Material pools to avoid clone()/dispose() churn */
    var dustMatPool = [];
    var sparkMatPool = [];

    function getDustMat() {
        if (dustMatPool.length) { var m = dustMatPool.pop(); m.opacity = 0.55; return m; }
        return new THREE.MeshBasicMaterial({ color: GAME.Colors.particles.dust, transparent: true, opacity: 0.55 });
    }
    function getSparkMat() {
        if (sparkMatPool.length) { var m = sparkMatPool.pop(); m.opacity = 0.8; return m; }
        return new THREE.MeshBasicMaterial({ color: GAME.Colors.particles.spark, transparent: true, opacity: 0.8 });
    }

    function spawnDust(pos, count) {
        count = count || 3;
        if (particles.length >= C.MAX_PARTICLES) return;
        var allowed = Math.min(count, C.MAX_PARTICLES - particles.length);
        for (var i = 0; i < allowed; i++) {
            var m = getDustMat();
            var mesh = new THREE.Mesh(particleGeo, m);
            mesh.position.set(
                pos.x + H.rnd(-0.25, 0.25),
                pos.y + H.rnd(0, 0.15),
                pos.z + H.rnd(0.2, 0.7)
            );
            mesh.scale.setScalar(H.rnd(0.4, 1.2));
            scene.add(mesh);
            particles.push({
                mesh: mesh,
                vx: H.rnd(-0.015, 0.015),
                vy: H.rnd(0.015, 0.035),
                vz: H.rnd(0.02, 0.05),
                life: H.rndInt(18, 35),
                maxLife: 35,
                isDust: true,
            });
        }
    }

    function spawnSparks(pos, count) {
        count = count || 5;
        if (particles.length >= C.MAX_PARTICLES) return;
        var allowed = Math.min(count, C.MAX_PARTICLES - particles.length);
        for (var i = 0; i < allowed; i++) {
            var m = getSparkMat();
            var mesh = new THREE.Mesh(particleGeo, m);
            mesh.position.set(pos.x + H.rnd(-0.4, 0.4), pos.y + H.rnd(0.3, 1.2), pos.z + H.rnd(-0.2, 0.2));
            mesh.scale.setScalar(H.rnd(0.2, 0.7));
            scene.add(mesh);
            particles.push({
                mesh: mesh,
                vx: H.rnd(-0.04, 0.04),
                vy: H.rnd(0.04, 0.09),
                vz: H.rnd(-0.025, 0.025),
                life: H.rndInt(12, 24),
                maxLife: 24,
                isDust: false,
            });
        }
    }

    function updateParticles(dtScale) {
        var d = dtScale || 1;
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.mesh.position.x += p.vx * d;
            p.mesh.position.y += p.vy * d;
            p.mesh.position.z += p.vz * d;
            p.vy -= 0.0008 * d;
            p.life -= d;
            var lifeRatio = Math.max(0, p.life / p.maxLife);
            p.mesh.material.opacity = lifeRatio * lifeRatio * 0.6;
            p.mesh.scale.setScalar(p.mesh.scale.x * Math.pow(0.97, d));
            if (p.life <= 0) {
                scene.remove(p.mesh);
                if (p.isDust) dustMatPool.push(p.mesh.material);
                else sparkMatPool.push(p.mesh.material);
                particles.splice(i, 1);
            }
        }
    }

    GAME.Particles = {
        particles: particles,
        spawnDust: spawnDust,
        spawnSparks: spawnSparks,
        updateParticles: updateParticles,
    };
})();
