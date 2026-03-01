/* ============================================================
   Texture Generators — Run on the Railway
   Canvas-based procedural textures for ground, trains, buildings.
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;

    function makeGravelTexture() {
        var c = document.createElement("canvas");
        c.width = 256; c.height = 256;
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#7A6A58";
        ctx.fillRect(0, 0, 256, 256);
        for (var i = 0; i < 1200; i++) {
            var shade = 70 + Math.random() * 50;
            ctx.fillStyle = "rgb(" + (shade + 10) + "," + (shade + 5) + "," + (shade - 5) + ")";
            var s = 1 + Math.random() * 3;
            ctx.fillRect(Math.random() * 256, Math.random() * 256, s, s);
        }
        var tex = new THREE.CanvasTexture(c);
        tex.encoding = THREE.sRGBEncoding;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(12, 100);
        return tex;
    }

    function makeGroundTexture() {
        var c = document.createElement("canvas");
        c.width = 512; c.height = 512;
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#504030";
        ctx.fillRect(0, 0, 512, 512);
        for (var i = 0; i < 3000; i++) {
            var shade = 55 + Math.random() * 40;
            ctx.fillStyle = "rgb(" + (shade + 10) + "," + (shade + 5) + "," + (shade - 5) + ")";
            var s = 1 + Math.random() * 2;
            ctx.fillRect(Math.random() * 512, Math.random() * 512, s, s);
        }
        ctx.strokeStyle = "rgba(30,20,10,0.35)";
        ctx.lineWidth = 1;
        for (var i = 0; i < 6; i++) {
            ctx.beginPath();
            var x = Math.random() * 512, y = Math.random() * 512;
            ctx.moveTo(x, y);
            for (var j = 0; j < 5; j++) {
                x += (Math.random() - 0.5) * 60;
                y += (Math.random() - 0.5) * 60;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        var tex = new THREE.CanvasTexture(c);
        tex.encoding = THREE.sRGBEncoding;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(6, 50);
        return tex;
    }

    function makeTrainSideTexture(bodyColor, isAlt) {
        var c = document.createElement("canvas");
        c.width = 512; c.height = 256;
        var ctx = c.getContext("2d");
        ctx.fillStyle = isAlt ? "#1A4E8C" : "#C8302A";
        ctx.fillRect(0, 0, 512, 256);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(0, 200, 512, 56);
        ctx.fillStyle = isAlt ? "#F5C020" : "#F2E8D0";
        ctx.fillRect(0, 80, 512, 6);
        ctx.fillRect(0, 170, 512, 4);
        for (var i = 0; i < 3; i++) {
            var cols = ["#E85A50", "#8BBCDA", "#F5C020", "#FAB030", "#3A7AB8"];
            ctx.fillStyle = cols[Math.floor(Math.random() * cols.length)];
            ctx.globalAlpha = 0.12 + Math.random() * 0.15;
            ctx.beginPath();
            var gx = 40 + Math.random() * 400;
            var gy = 90 + Math.random() * 80;
            ctx.ellipse(gx, gy, 30 + Math.random() * 50, 15 + Math.random() * 25, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        for (var x = 10; x < 512; x += 24) {
            ctx.beginPath();
            ctx.arc(x, 8, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        var tex = new THREE.CanvasTexture(c);
        tex.encoding = THREE.sRGBEncoding;
        return tex;
    }

    /* Pre-bake a pool of building textures once, reuse them */
    var _buildTexPool = null;
    function getBuildTexPool() {
        if (_buildTexPool) return _buildTexPool;
        _buildTexPool = [];
        var poolColors = GAME.Colors.buildings.texPool;
        var poolFloors = [4, 6, 5, 7, 4, 6, 5, 7, 5, 6];
        var poolCols = [2, 3, 3, 3, 2, 3, 2, 3, 3, 2];
        for (var k = 0; k < poolColors.length; k++) {
            _buildTexPool.push(makeBuildingTexture(poolColors[k], poolFloors[k], poolCols[k]));
        }
        return _buildTexPool;
    }

    function makeBuildingTexture(color, floors, cols) {
        var c = document.createElement("canvas");
        c.width = 256; c.height = 512;
        var ctx = c.getContext("2d");

        var baseGrad = ctx.createLinearGradient(0, 0, 0, 512);
        baseGrad.addColorStop(0, color);
        baseGrad.addColorStop(0.9, color);
        baseGrad.addColorStop(1, "#504030");
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, 256, 512);

        ctx.strokeStyle = "rgba(0,0,0,0.07)";
        ctx.lineWidth = 0.5;
        for (var y = 0; y < 512; y += 12) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
            var off = (Math.floor(y / 12) % 2) * 12;
            for (var x = off; x < 256; x += 24) {
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 12); ctx.stroke();
            }
        }

        var floorH = Math.floor(440 / Math.max(floors, 1));
        for (var f = 0; f < floors; f++) {
            var fy = 18 + f * floorH;
            ctx.fillStyle = "rgba(0,0,0,0.14)";
            ctx.fillRect(0, fy + floorH - 4, 256, 4);
            ctx.fillStyle = "rgba(255,255,255,0.07)";
            ctx.fillRect(0, fy + floorH - 5, 256, 1);
        }

        var ww = 18, wh = 24, gap = 6;
        var totalW = cols * (ww + gap);
        var startX = (256 - totalW) / 2 + gap / 2;
        for (var r = 0; r < floors; r++) {
            var fy = 24 + r * floorH;
            for (var cc = 0; cc < cols; cc++) {
                var wx = startX + cc * (ww + gap);
                ctx.fillStyle = "rgba(255,255,255,0.13)";
                ctx.fillRect(wx - 2, fy - 2, ww + 4, wh + 4);
                ctx.fillStyle = "rgba(180,180,180,0.2)";
                ctx.fillRect(wx - 3, fy + wh, ww + 6, 3);

                var lit = Math.random() > 0.28;
                if (lit) {
                    var wGrad = ctx.createLinearGradient(wx, fy, wx, fy + wh);
                    wGrad.addColorStop(0, "#FFD880");
                    wGrad.addColorStop(0.6, "#FFE890");
                    wGrad.addColorStop(1, "#D0A020");
                    ctx.fillStyle = wGrad;
                    ctx.fillRect(wx, fy, ww, wh);
                    ctx.fillStyle = "rgba(255,216,128,0.18)";
                    ctx.fillRect(wx - 4, fy - 4, ww + 8, wh + 8);
                    ctx.fillStyle = "rgba(0,0,0,0.14)";
                    ctx.fillRect(wx + ww / 2 - 0.5, fy, 1, wh);
                    ctx.fillRect(wx, fy + wh / 2 - 0.5, ww, 1);
                } else {
                    ctx.fillStyle = "#2A3040";
                    ctx.fillRect(wx, fy, ww, wh);
                    ctx.fillStyle = "rgba(106,144,184,0.2)";
                    ctx.fillRect(wx + 2, fy + 2, ww * 0.38, wh * 0.45);
                }
            }
        }

        var gfY = 512 - 55;
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(0, gfY, 256, 55);
        if (Math.random() < 0.65) {
            ctx.fillStyle = "rgba(255,240,180,0.3)";
            ctx.fillRect(55, gfY + 10, 146, 36);
            ctx.fillStyle = "rgba(106,80,64,0.7)";
            ctx.fillRect(112, gfY + 12, 32, 34);
            ctx.fillStyle = "rgba(200,180,100,0.5)";
            ctx.fillRect(138, gfY + 28, 3, 3);
        }

        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(0, 0, 256, 6);
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(0, 6, 256, 2);

        var tex = new THREE.CanvasTexture(c);
        tex.encoding = THREE.sRGBEncoding;
        return tex;
    }

    GAME.Textures = {
        makeGravelTexture: makeGravelTexture,
        makeGroundTexture: makeGroundTexture,
        makeTrainSideTexture: makeTrainSideTexture,
        getBuildTexPool: getBuildTexPool,
        makeBuildingTexture: makeBuildingTexture,
    };
})();
