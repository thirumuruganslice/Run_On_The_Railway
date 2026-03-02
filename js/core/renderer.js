/* ============================================================
   Three.js Renderer, Scene, Camera & Lighting — Railway Runner
   ============================================================ */
(function () {
    "use strict";
    var GAME = window.GAME;
    var C = GAME.Config;
    var Colors = GAME.Colors;

    // Enable Three.js asset cache for geometry/texture reuse
    if (typeof THREE !== "undefined" && THREE.Cache) THREE.Cache.enabled = true;

    var canvas = GAME.DOM.canvas;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(Colors.scene.skyBackground);
    scene.fog = new THREE.FogExp2(Colors.scene.fog, 0.0035);

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 200);
    camera.position.set(0, C.CAM_Y, C.CAM_Z);
    camera.lookAt(0, C.CAM_LOOKAT_Y, -10);

    /* ── Lighting (optimized — fewer lights for better performance) ── */
    var ambLight = new THREE.AmbientLight(Colors.scene.ambientLight, 0.7);
    scene.add(ambLight);

    var dirLight = new THREE.DirectionalLight(Colors.scene.directionalLight, 1.2);
    dirLight.position.set(8, 22, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -28;
    dirLight.shadow.camera.right = 28;
    dirLight.shadow.camera.top = 28;
    dirLight.shadow.camera.bottom = -28;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);
    scene.add(dirLight.target);

    var hemiLight = new THREE.HemisphereLight(Colors.scene.hemiSky, Colors.scene.hemiGround, 0.65);
    scene.add(hemiLight);

    GAME.Renderer = {
        renderer: renderer,
        scene: scene,
        camera: camera,
        dirLight: dirLight,
        ambLight: ambLight,
        hemiLight: hemiLight,
    };
})();
