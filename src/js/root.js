import * as THREE from 'three';
import * as CANNON from 'cannon';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as Stats from './vendor/stats.min.js';
import CannonHelper from './vendor/CannonHelper.js';

class Root {
    constructor() {
        this.sceneState = {};

        // Setup renderer [START]
        const renderer = new THREE.WebGLRenderer();
        renderer.setClearColor('#000000');
        const screenSize = this.getScreenResolution();
        renderer.setSize(screenSize.x, screenSize.y);
        renderer.domElement.id = 'main-stage';
        document.body.appendChild(renderer.domElement);
        this.renderer = renderer;
        // Setup renderer [/END]

        // Setup scene and basic lights [START]
        const scene = new THREE.Scene();
        const hemi = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.65);
        hemi.position.set(32, -32, 5);
        scene.add(hemi);
        scene.add(new THREE.AmbientLight(0xffffff, 0.25));
        scene.add(new THREE.AxesHelper(10)); // Helper
        this.scene = scene;
        // Setup scene and basic lights [/END]

        // Setup camera and aspect ratio [START]
        this.aspectRatio = screenSize.x / screenSize.y;
        const camera = new THREE.PerspectiveCamera(45, this.aspectRatio, 0.1, 64);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.update();
        this.controls = controls;
        this.camera = camera;
        // Setup camera and aspect ratio [/END]

        // Setup physics (cannon.js) [START]
        const world = new CANNON.World();
        world.gravity.set(0, -9.82, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;
        this.sceneState.physics = {};
        this.sceneState.physics.world = world;
        this.sceneState.physics.timeStep = 1 / 60;
        this.sceneState.physics.maxSubSteps = 3;
        this.sceneState.physics.addShape = this.addShapeToPhysics;
        this.sceneState.physics.shapes = [];
        this.world = world;
        this.helper = new CannonHelper(scene, world);
        // Setup physics (cannon.js) [/END]

        // Setup debug statisctics [START]
        const createStats = () => {
            const s = new Stats();
            s.setMode(0);
            return s;
        };
        this.stats = createStats();
        this.stats.domElement.id = 'debug-stats-wrapper';
        document.body.appendChild(this.stats.domElement);
        // Setup debug statisctics [/END]

        // Other setup [START]
        this.sceneState.clock = new THREE.Clock(),
        this.sceneState.resizeFns = [this.resize],
        this.sceneState.getScreenResolution = this.getScreenResolution;
        this.sceneState.defaultSettings = {
            showPhysicsHelpers: false,
            showMeters: true
        };
        this.sceneState.settings = { ...this.sceneState.defaultSettings };
        this.initResizer();
        // Other setup [/END]

        this.runApp(scene, camera);
    }

    runApp(scene, camera) {

        // Main app logic [START]
        camera.position.set(1, 1, 10);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        // Add ground
        const gSize = [5, 0.2, 2];
        const gPos = [0, 0, 0];
        const groundGeo = new THREE.BoxBufferGeometry(gSize[0], gSize[1], gSize[2]);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.position.set(gPos[0], gPos[1], gPos[2]);
        const groundBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(gPos[0] / 2, gPos[1] / 2, gPos[2] / 2),
            shape: new CANNON.Box(new CANNON.Vec3(gSize[0] / 2, gSize[1] / 2, gSize[2] / 2))
        });
        this.sceneState.physics.addShape(groundMesh, groundBody);

        // Add a box
        const bSize = [1, 1, 1];
        const bPos = [0, 8, 0];
        const boxGeo = new THREE.BoxBufferGeometry(1, 1, 1);
        const boxMat = new THREE.MeshLambertMaterial({ color: 0xfff000 });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.position.set(bPos[0], bPos[1], bPos[2]);
        const boxBody = new CANNON.Body({
            mass: 5,
            position: new CANNON.Vec3(bPos[0] / 2, bPos[1] / 2, bPos[2] / 2),
            shape: new CANNON.Box(new CANNON.Vec3(bSize[0] / 2, bSize[1] / 2, bSize[2] / 2))
        });
        this.sceneState.physics.addShape(boxMesh, boxBody, 0xFF0000);
        setTimeout(() => {
            boxBody.velocity.y = 5;
            setTimeout(() => {
                boxBody.velocity.y = 5;
                setTimeout(() => {
                    boxBody.velocity.y = 5;
                }, 3000);
            }, 3000);
        }, 3000);

        // Main app logic [/END]

        this.resize(this.sceneState, this.renderer);
        this.renderLoop();

    }

    renderLoop = () => {
        requestAnimationFrame(this.renderLoop);
        const delta = this.sceneState.clock.getDelta();
        this.updatePhysics(delta);
        this.renderer.render(this.scene, this.camera);
        this.stats.update(); // Debug statistics
    }

    updatePhysics(delta) {
        let i;
        const l = this.sceneState.physics.shapesLength,
            s = this.sceneState.physics.shapes,
            settings = this.sceneState.settings;
        this.world.step(this.sceneState.physics.timeStep, delta, this.sceneState.physics.maxSubSteps);
        for(i=0; i<l; i++) {
            s[i].mesh.position.copy(s[i].body.position);
            s[i].mesh.quaternion.copy(s[i].body.quaternion);
        }
        if(settings.showPhysicsHelpers) this.helper.update();
    }

    addShapeToPhysics = (mesh, body, helperColor) => {
        this.scene.add(mesh);
        this.world.addBody(body);
        this.sceneState.physics.shapes.push({ mesh, body });
        this.sceneState.physics.shapesLength = this.sceneState.physics.shapes.length;
        if(this.sceneState.settings.showPhysicsHelpers) this.helper.addVisual(body, helperColor || 0xFFFFFF);
    }

    resize(sceneState, renderer) {
        const width = sceneState.getScreenResolution().x;
        const height = sceneState.getScreenResolution().y;
        const pixelRatio = window.devicePixelRatio || 1;
        document.getElementsByTagName('body')[0].style.width = width + 'px';
        document.getElementsByTagName('body')[0].style.height = height + 'px';
        renderer.setSize(width, height);
        renderer.setPixelRatio(pixelRatio);
    }

    initResizer() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                let i;
                const fns = this.sceneState.resizeFns,
                    fnsLength = fns.length;
                for(i=0; i<fnsLength; i++) {
                    fns[i](
                        this.sceneState,
                        this.renderer,
                        this.scene,
                        this.camera
                    );
                }
            }, 500);
        });
    }

    getScreenResolution() {
        return {
            x: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            y: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        };
    }
}

new Root();