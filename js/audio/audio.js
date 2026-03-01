/* ============================================================
   Audio System (Web Audio API synth + BGM) — Run on the Railway
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;

    var audioCtx, masterGain;
    var muted = false;
    var bgmActive = false;
    var bgmLoopId = null;

    function initAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.35;
        masterGain.connect(audioCtx.destination);
    }

    function playTone(freq, dur, type, vol) {
        type = type || "square";
        vol = vol || 0.3;
        if (!audioCtx || muted) return;
        var osc = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(vol, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        osc.connect(g).connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + dur);
    }

    var sfx = {
        coin: function () {
            if (!audioCtx || muted) return;
            var notes = [880, 1108, 1760];
            notes.forEach(function (freq, i) {
                setTimeout(function () {
                    var o = audioCtx.createOscillator();
                    var g = audioCtx.createGain();
                    o.type = "sine";
                    o.frequency.value = freq;
                    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                    o.connect(g).connect(masterGain);
                    o.start(); o.stop(audioCtx.currentTime + 0.1);
                }, i * 48);
            });
        },
        jump: function () {
            if (!audioCtx || muted) return;
            var o = audioCtx.createOscillator();
            var g = audioCtx.createGain();
            o.type = "sine";
            o.frequency.setValueAtTime(280, audioCtx.currentTime);
            o.frequency.exponentialRampToValueAtTime(620, audioCtx.currentTime + 0.22);
            g.gain.setValueAtTime(0.22, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.24);
            o.connect(g).connect(masterGain);
            o.start(); o.stop(audioCtx.currentTime + 0.25);
        },
        roll: function () {
            if (!audioCtx || muted) return;
            var o = audioCtx.createOscillator();
            var g = audioCtx.createGain();
            o.type = "sawtooth";
            o.frequency.setValueAtTime(300, audioCtx.currentTime);
            o.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.18);
            g.gain.setValueAtTime(0.14, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            o.connect(g).connect(masterGain);
            o.start(); o.stop(audioCtx.currentTime + 0.2);
        },
        lane: function () {
            if (!audioCtx || muted) return;
            playTone(680, 0.07, "sine", 0.09);
        },
        hit: function () {
            if (!audioCtx || muted) return;
            var boom = audioCtx.createOscillator();
            var bG = audioCtx.createGain();
            boom.type = "sawtooth";
            boom.frequency.setValueAtTime(160, audioCtx.currentTime);
            boom.frequency.exponentialRampToValueAtTime(38, audioCtx.currentTime + 0.7);
            bG.gain.setValueAtTime(0.55, audioCtx.currentTime);
            bG.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.85);
            boom.connect(bG).connect(masterGain);
            boom.start(); boom.stop(audioCtx.currentTime + 0.85);
            setTimeout(function () {
                if (!audioCtx || muted) return;
                var w = audioCtx.createOscillator();
                var wG = audioCtx.createGain();
                w.type = "square";
                w.frequency.setValueAtTime(620, audioCtx.currentTime);
                w.frequency.exponentialRampToValueAtTime(90, audioCtx.currentTime + 0.55);
                wG.gain.setValueAtTime(0.28, audioCtx.currentTime);
                wG.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
                w.connect(wG).connect(masterGain);
                w.start(); w.stop(audioCtx.currentTime + 0.6);
            }, 140);
            setTimeout(function () {
                if (!audioCtx || muted) return;
                var buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.18, audioCtx.sampleRate);
                var data = buf.getChannelData(0);
                for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
                var src = audioCtx.createBufferSource();
                src.buffer = buf;
                var filt = audioCtx.createBiquadFilter();
                filt.type = "bandpass";
                filt.frequency.value = 800;
                filt.Q.value = 0.5;
                var ng = audioCtx.createGain();
                ng.gain.value = 0.18;
                src.connect(filt).connect(ng).connect(masterGain);
                src.start();
            }, 60);
        },
        powerup: function () {
            if (!audioCtx || muted) return;
            var notes = [523, 659, 784, 1047];
            notes.forEach(function (freq, i) {
                setTimeout(function () {
                    var o = audioCtx.createOscillator();
                    var g = audioCtx.createGain();
                    o.type = "sine";
                    o.frequency.value = freq;
                    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
                    o.connect(g).connect(masterGain);
                    o.start(); o.stop(audioCtx.currentTime + 0.22);
                }, i * 68);
            });
        },
        milestone: function () {
            if (!audioCtx || muted) return;
            var chord = [523, 659, 784, 1047, 1319];
            chord.forEach(function (freq, i) {
                setTimeout(function () {
                    var o = audioCtx.createOscillator();
                    var g = audioCtx.createGain();
                    o.type = "triangle";
                    o.frequency.value = freq;
                    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
                    o.connect(g).connect(masterGain);
                    o.start(); o.stop(audioCtx.currentTime + 0.45);
                }, i * 58);
            });
            setTimeout(function () {
                if (!audioCtx || muted) return;
                playTone(2093, 0.5, "sine", 0.12);
            }, chord.length * 58 + 20);
        },
    };

    /* ── Background Music ── */
    function startBGM() {
        if (bgmActive || !audioCtx || muted) return;
        bgmActive = true;
        scheduleBGMLoop();
    }

    function stopBGM() {
        bgmActive = false;
        if (bgmLoopId) { clearTimeout(bgmLoopId); bgmLoopId = null; }
    }

    function scheduleBGMLoop() {
        if (!bgmActive || !audioCtx || muted) return;
        var bpm = 138;
        var step = 60 / bpm * 0.5;
        var now = audioCtx.currentTime;

        var bass = [41.2, 41.2, 55, 41.2, 36.7, 41.2, 61.7, 41.2];
        bass.forEach(function (freq, i) {
            var t = now + i * step;
            var o = audioCtx.createOscillator();
            var g = audioCtx.createGain();
            o.type = "sawtooth";
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.042, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + step * 0.85);
            o.connect(g).connect(masterGain);
            o.start(t); o.stop(t + step);
        });

        [0, 2, 4, 6].forEach(function (beat) {
            var t = now + beat * step;
            var kick = audioCtx.createOscillator();
            var kG = audioCtx.createGain();
            kick.type = "sine";
            kick.frequency.setValueAtTime(160, t);
            kick.frequency.exponentialRampToValueAtTime(28, t + 0.22);
            kG.gain.setValueAtTime(0.09, t);
            kG.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
            kick.connect(kG).connect(masterGain);
            kick.start(t); kick.stop(t + 0.28);
        });

        [1, 3, 5, 7].forEach(function (beat) {
            if (!audioCtx) return;
            var t = now + beat * step;
            var buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.04), audioCtx.sampleRate);
            var d = buf.getChannelData(0);
            for (var j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / d.length);
            var src = audioCtx.createBufferSource();
            src.buffer = buf;
            var hf = audioCtx.createBiquadFilter();
            hf.type = "highpass"; hf.frequency.value = 7000;
            var hg = audioCtx.createGain(); hg.gain.value = 0.025;
            src.connect(hf).connect(hg).connect(masterGain);
            src.start(t);
        });

        var loopDur = bass.length * step;
        bgmLoopId = setTimeout(scheduleBGMLoop, (loopDur - 0.05) * 1000);
    }

    function isMuted() { return muted; }

    function toggleMute() {
        muted = !muted;
        if (masterGain) masterGain.gain.value = muted ? 0 : 0.35;
        return muted;
    }

    GAME.Audio = {
        initAudio: initAudio,
        sfx: sfx,
        startBGM: startBGM,
        stopBGM: stopBGM,
        isMuted: isMuted,
        toggleMute: toggleMute,
    };
})();
