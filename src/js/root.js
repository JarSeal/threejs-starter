import * as THREE from 'three';
import * as CANNON from 'cannon';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as Stats from './vendor/stats.min.js';

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
        this.world = world;
        this.sceneState.physics = {
            world,
            fixedTimeStep: 1 / 60,
            maxSubSteps: 3
        };
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
        this.initResizer();
        // Other setup [/END]

        this.runApp(scene, camera);
    }

    runApp(scene, camera) {

        // Main app logic [START]
        camera.position.set(1, 1, 10);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        const geo = new THREE.BoxBufferGeometry(1, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ color: 0xfff000 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.5;
        scene.add(mesh);
        // Main app logic [/END]

        this.resize(this.sceneState, this.renderer);
        this.renderLoop();

    }

    renderLoop = () => {
        requestAnimationFrame(this.renderLoop);
        // const delta = this.sceneState.clock.getDelta();
        this.renderer.render(this.scene, this.camera);
        this.stats.update(); // Debug statistics
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