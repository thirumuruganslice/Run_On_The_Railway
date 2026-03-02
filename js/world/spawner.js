/* ============================================================
   World Spawner — Railway Runner
   Spawns obstacles, coins, buildings, powerups and cleans up
   objects that have passed behind the player.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;
    var C = GAME.Config;
    var H = GAME.Helpers;

    var nextObstacleZ = -30;
    var nextCoinZ = -20;
    var nextBuildingZ = -20;
    var nextPowerZ = -80;

    /* Lane status constants */
    var LANE_SAFE = 0;
    var LANE_JUMP = 1;
    var LANE_ROLL = 2;
    var LANE_BLOCKED = 3;

    /**
     * Check each lane for obstacles overlapping a Z range.
     * Returns [status0, status1, status2] for the three lanes.
     */
    function getLaneStatus(coinZ, coinSpan) {
        var obstacles = GAME.Obstacles.obstacles;
        var status = [LANE_SAFE, LANE_SAFE, LANE_SAFE];
        var margin = 3.0;

        for (var oi = 0; oi < obstacles.length; oi++) {
            var obs = obstacles[oi];
            var coinMin = coinZ - coinSpan;
            var coinMax = coinZ;
            var obsMin = obs.z - obs.halfD - margin;
            var obsMax = obs.z + obs.halfD + margin;

            /* Check Z-range overlap */
            if (coinMin < obsMax && obsMin < coinMax) {
                var lane = obs.lane;
                if (lane < 0 || lane > 2) continue;

                if (obs.type === "train") {
                    status[lane] = LANE_BLOCKED;
                } else if ((obs.type === "barrier" || obs.type === "lowBarrier") && status[lane] < LANE_BLOCKED) {
                    status[lane] = Math.max(status[lane], LANE_JUMP);
                } else if (obs.type === "upperBarrier" && status[lane] < LANE_BLOCKED) {
                    status[lane] = Math.max(status[lane], LANE_ROLL);
                }
            }
        }
        return status;
    }

    function spawnWorld() {
        var player = GAME.Player.getPlayer();
        if (!player) return;
        var ahead = player.position.z - C.SPAWN_DIST;

        var Obs = GAME.Obstacles;
        var Col = GAME.Collectibles;
        var Bld = GAME.Buildings;
        var Scn = GAME.Scenery;

        /* ── Spawn obstacles first ── */
        while (nextObstacleZ > ahead) {
            var laneIdx = H.rndInt(0, 2);
            var r = Math.random();
            if (r < 0.35) {
                Obs.spawnTrain(laneIdx, nextObstacleZ);
            } else if (r < 0.60) {
                Obs.spawnBarrier(laneIdx, nextObstacleZ);
            } else if (r < 0.80) {
                Obs.spawnUpperBarrier(laneIdx, nextObstacleZ);
            } else {
                var l2 = (laneIdx + H.pick([1, 2])) % 3;
                Obs.spawnBarrier(laneIdx, nextObstacleZ);
                Obs.spawnBarrier(l2, nextObstacleZ);
            }
            nextObstacleZ -= H.rnd(C.OBS_GAP_MIN, C.OBS_GAP_MAX);
        }

        /* ── Spawn coins (obstacle-aware) ── */
        while (nextCoinZ > ahead) {
            var coinCount = H.rndInt(3, 7);
            var coinSpan = (coinCount - 1) * 1.8;

            /* Determine which lanes are safe/jumpable/rollable/blocked */
            var status = getLaneStatus(nextCoinZ, coinSpan);
            var safeLanes = [];
            var jumpLanes = [];
            var rollLanes = [];

            for (var li = 0; li < 3; li++) {
                if (status[li] === LANE_SAFE) safeLanes.push(li);
                else if (status[li] === LANE_JUMP) jumpLanes.push(li);
                else if (status[li] === LANE_ROLL) rollLanes.push(li);
            }

            if (safeLanes.length > 0) {
                /* Place coins in a safe lane; sometimes guide via arcs */
                if (Math.random() < 0.25 && jumpLanes.length > 0) {
                    Col.spawnCoinArc(H.pick(jumpLanes), nextCoinZ);
                } else {
                    Col.spawnCoinRow(H.pick(safeLanes), nextCoinZ, coinCount);
                }
            } else if (jumpLanes.length > 0) {
                /* No safe lane — arc coins over a jumpable barrier */
                Col.spawnCoinArc(H.pick(jumpLanes), nextCoinZ);
            } else if (rollLanes.length > 0) {
                /* Only roll-under lanes available — low coins */
                Col.spawnCoinRowLow(H.pick(rollLanes), nextCoinZ, coinCount);
            }
            /* If all 3 lanes are trains, skip coins entirely */

            nextCoinZ -= H.rnd(C.COIN_GAP * 1.5, C.COIN_GAP * 3.5);
        }

        while (nextBuildingZ > ahead) {
            Bld.spawnBuilding(nextBuildingZ);
            if (Math.random() < 0.5) {
                Bld.spawnBuilding(nextBuildingZ + H.rnd(-3, 3));
            }
            nextBuildingZ -= H.rnd(8, 16);
        }

        while (nextPowerZ > ahead) {
            if (Math.random() < C.POWERUP_CHANCE * 3) {
                Col.spawnPowerup(H.rndInt(0, 2), nextPowerZ);
            }
            nextPowerZ -= H.rnd(40, 80);
        }

        Scn.spawnScenery();
    }

    function cleanBehind() {
        var player = GAME.Player.getPlayer();
        if (!player) return;
        var behind = player.position.z + 15;
        var dispose = H.disposeGroup;

        var obstacles = GAME.Obstacles.obstacles;
        var coins = GAME.Collectibles.coins;
        var powerups = GAME.Collectibles.powerups;
        var buildings = GAME.Buildings.buildings;
        var sceneryObjs = GAME.Scenery.sceneryObjs;

        for (var i = obstacles.length - 1; i >= 0; i--) {
            if (obstacles[i].mesh.position.z > behind) {
                dispose(obstacles[i].mesh);
                obstacles.splice(i, 1);
            }
        }
        for (var j = coins.length - 1; j >= 0; j--) {
            if (coins[j].mesh.position.z > behind || coins[j].collected) {
                dispose(coins[j].mesh);
                coins.splice(j, 1);
            }
        }
        for (var k = powerups.length - 1; k >= 0; k--) {
            if (powerups[k].mesh.position.z > behind || powerups[k].collected) {
                dispose(powerups[k].mesh);
                powerups.splice(k, 1);
            }
        }
        for (var l = buildings.length - 1; l >= 0; l--) {
            if (buildings[l].z > behind + 30) {
                dispose(buildings[l].mesh);
                buildings.splice(l, 1);
            }
        }
        for (var m = sceneryObjs.length - 1; m >= 0; m--) {
            if (sceneryObjs[m].z > behind + 20) {
                dispose(sceneryObjs[m].mesh);
                sceneryObjs.splice(m, 1);
            }
        }
    }

    function resetSpawner() {
        nextObstacleZ = -30;
        nextCoinZ = -15;
        nextBuildingZ = -10;
        nextPowerZ = -60;
    }

    GAME.Spawner = {
        spawnWorld: spawnWorld,
        cleanBehind: cleanBehind,
        resetSpawner: resetSpawner,
    };
})();
