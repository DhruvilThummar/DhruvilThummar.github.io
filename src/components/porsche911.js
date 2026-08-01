// ============================================================
// Component: porsche911.js
// Procedural 3D Model & Visualizer for Porsche 911 GT3 RS in Three.js
// ============================================================

export class Porsche911Visualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.currentColor = 0xd31027; // Default Guards Red
        this.lightsOn = true;
        this.wireframeMode = false;
        this.isPaused = false;
        this.animFrameId = null;

        this.initThree();
        this.buildPorscheModel();
        this.setupLights();
        this.setupFloor();
        this.setupAudio();
        this.addEventListeners();
        this.animate();
    }

    initThree() {
        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 500;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0c10);
        this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.035);

        // Camera
        this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        this.camera.position.set(4.5, 2.2, 5.5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;

        // Clear container and append canvas
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go under floor
            this.controls.minDistance = 2.5;
            this.controls.maxDistance = 12;
            this.controls.target.set(0, 0.6, 0);
        }
    }

    buildPorscheModel() {
        this.carGroup = new THREE.Group();

        // Material Definitions
        this.bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: this.currentColor,
            metalness: 0.7,
            roughness: 0.2,
            clearcoat: 1.0,
            clearcoatRoughness: 0.08,
            reflectivity: 0.9
        });

        this.carbonMaterial = new THREE.MeshStandardMaterial({
            color: 0x181818,
            metalness: 0.3,
            roughness: 0.5
        });

        this.glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x111115,
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.8,
            transparent: true,
            opacity: 0.85
        });

        this.chromeMaterial = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            metalness: 0.95,
            roughness: 0.1
        });

        this.rubberMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.05,
            roughness: 0.9
        });

        this.brakeCaliperMat = new THREE.MeshStandardMaterial({
            color: 0xffcc00, // Porsche Yellow Brake Calipers
            metalness: 0.5,
            roughness: 0.3
        });

        this.lightGlowMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });

        this.tailLightMat = new THREE.MeshBasicMaterial({
            color: 0xff1122,
            transparent: true,
            opacity: 0.95
        });

        // 1. MAIN BODY COCKPIT & CHASSIS (Curved Low Silhouette)
        // Lower Main Chassis
        const chassisMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.55, 3.9, 10, 5, 10),
            this.bodyMaterial
        );
        chassisMesh.position.y = 0.55;
        chassisMesh.castShadow = true;
        chassisMesh.receiveShadow = true;
        this.carGroup.add(chassisMesh);

        // Sloping Roof & Cabin
        const cabinMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.68, 0.85, 0.65, 8),
            this.bodyMaterial
        );
        cabinMesh.scale.set(1.1, 1, 2.0);
        cabinMesh.position.set(0, 0.95, -0.1);
        cabinMesh.castShadow = true;
        this.carGroup.add(cabinMesh);

        // Windshield & Windows
        const windshield = new THREE.Mesh(
            new THREE.BoxGeometry(1.35, 0.5, 0.9),
            this.glassMaterial
        );
        windshield.position.set(0, 0.96, 0.35);
        windshield.rotation.x = -0.45;
        this.carGroup.add(windshield);

        const rearGlass = new THREE.Mesh(
            new THREE.BoxGeometry(1.3, 0.45, 1.1),
            this.glassMaterial
        );
        rearGlass.position.set(0, 0.92, -0.65);
        rearGlass.rotation.x = 0.35;
        this.carGroup.add(rearGlass);

        // 2. GT3 RS AERODYNAMIC HOOD & NACA DUCTS
        const hoodMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.55, 0.12, 1.2),
            this.bodyMaterial
        );
        hoodMesh.position.set(0, 0.65, 1.25);
        hoodMesh.rotation.x = 0.12;
        hoodMesh.castShadow = true;
        this.carGroup.add(hoodMesh);

        // Hood Air Vents (NACA Ducts)
        for (let side of [-0.35, 0.35]) {
            const vent = new THREE.Mesh(
                new THREE.BoxGeometry(0.22, 0.05, 0.4),
                this.carbonMaterial
            );
            vent.position.set(side, 0.72, 1.25);
            vent.rotation.x = 0.15;
            this.carGroup.add(vent);
        }

        // 3. FRONT LIP SPLITTER & BUMPER INTAKES
        const frontSplitter = new THREE.Mesh(
            new THREE.BoxGeometry(1.85, 0.08, 0.4),
            this.carbonMaterial
        );
        frontSplitter.position.set(0, 0.28, 1.95);
        this.carGroup.add(frontSplitter);

        const frontGrille = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.25, 0.1),
            this.carbonMaterial
        );
        frontGrille.position.set(0, 0.42, 1.92);
        this.carGroup.add(frontGrille);

        // 4. SIGNATURE QUAD-POINT LED HEADLIGHTS
        this.headlights = [];
        for (let side of [-0.62, 0.62]) {
            // Housing
            const housing = new THREE.Mesh(
                new THREE.CylinderGeometry(0.16, 0.18, 0.2, 16),
                this.chromeMaterial
            );
            housing.rotation.x = Math.PI / 2 - 0.2;
            housing.position.set(side, 0.7, 1.65);
            this.carGroup.add(housing);

            // Quad LED Lens
            const lens = new THREE.Mesh(
                new THREE.SphereGeometry(0.13, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
                this.lightGlowMat
            );
            lens.rotation.x = Math.PI / 2 - 0.2;
            lens.position.set(side, 0.71, 1.73);
            this.carGroup.add(lens);

            // Light Beam Spot
            const spot = new THREE.SpotLight(0xffffff, 2, 15, Math.PI / 6, 0.4);
            spot.position.set(side, 0.7, 1.75);
            spot.target.position.set(side, 0.2, 8);
            this.carGroup.add(spot);
            this.carGroup.add(spot.target);
            this.headlights.push(spot);
        }

        // 5. WIDE REAR FENDERS & SIDE AIR SCOOPS
        for (let side of [-0.92, 0.92]) {
            const fender = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.45, 1.4),
                this.bodyMaterial
            );
            fender.position.set(side, 0.58, -0.6);
            this.carGroup.add(fender);

            const sideScoop = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.25, 0.35),
                this.carbonMaterial
            );
            sideScoop.position.set(side * 0.98, 0.6, -0.3);
            this.carGroup.add(sideScoop);
        }

        // 6. SWAN-NECK GT3 RS MASSIVE REAR WING (Signature Feature)
        const wingGroup = new THREE.Group();
        
        // Upper Wing Blade
        const wingBlade = new THREE.Mesh(
            new THREE.BoxGeometry(2.1, 0.05, 0.45),
            this.carbonMaterial
        );
        wingBlade.position.set(0, 1.42, -1.75);
        wingBlade.rotation.x = -0.05;
        wingBlade.castShadow = true;
        wingGroup.add(wingBlade);

        // Side Endplates
        for (let side of [-1.05, 1.05]) {
            const endplate = new THREE.Mesh(
                new THREE.BoxGeometry(0.03, 0.3, 0.5),
                this.bodyMaterial
            );
            endplate.position.set(side, 1.42, -1.75);
            wingGroup.add(endplate);
        }

        // Swan Neck Upright Mounts
        for (let side of [-0.45, 0.45]) {
            const mount = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.45, 0.15),
                this.chromeMaterial
            );
            mount.position.set(side, 1.2, -1.65);
            mount.rotation.x = 0.25;
            wingGroup.add(mount);
        }
        this.carGroup.add(wingGroup);

        // 7. REAR LIGHT BAR & DIFFUSER
        const rearLightBar = new THREE.Mesh(
            new THREE.BoxGeometry(1.7, 0.06, 0.05),
            this.tailLightMat
        );
        rearLightBar.position.set(0, 0.72, -1.94);
        this.carGroup.add(rearLightBar);

        // Dual Rear Exhaust Tips
        for (let side of [-0.15, 0.15]) {
            const exhaust = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 0.25, 12),
                this.chromeMaterial
            );
            exhaust.rotation.x = Math.PI / 2;
            exhaust.position.set(side, 0.35, -1.95);
            this.carGroup.add(exhaust);
        }

        // Rear Diffuser Fins
        const rearDiffuser = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.18, 0.35),
            this.carbonMaterial
        );
        rearDiffuser.position.set(0, 0.3, -1.82);
        this.carGroup.add(rearDiffuser);

        // 8. CENTER-LOCK RACING WHEELS & BREMBO BRAKES
        this.wheels = [];
        const wheelPositions = [
            { x: -0.88, y: 0.38, z: 1.15 },  // Front Left
            { x: 0.88, y: 0.38, z: 1.15 },   // Front Right
            { x: -0.92, y: 0.38, z: -1.15 }, // Rear Left
            { x: 0.92, y: 0.38, z: -1.15 }   // Rear Right
        ];

        wheelPositions.forEach((pos) => {
            const wheelGroup = new THREE.Group();

            // Tire
            const tire = new THREE.Mesh(
                new THREE.CylinderGeometry(0.38, 0.38, 0.28, 32),
                this.rubberMaterial
            );
            tire.rotation.z = Math.PI / 2;
            tire.castShadow = true;
            wheelGroup.add(tire);

            // Rim / Wheel Hub
            const rim = new THREE.Mesh(
                new THREE.CylinderGeometry(0.28, 0.28, 0.29, 16),
                this.chromeMaterial
            );
            rim.rotation.z = Math.PI / 2;
            wheelGroup.add(rim);

            // 5 Double Spokes
            for (let i = 0; i < 5; i++) {
                const spoke = new THREE.Mesh(
                    new THREE.BoxGeometry(0.04, 0.26, 0.05),
                    this.carbonMaterial
                );
                spoke.rotation.x = (i * Math.PI * 2) / 5;
                spoke.position.x = (pos.x > 0 ? 0.14 : -0.14);
                wheelGroup.add(spoke);
            }

            // Brake Disc & Caliper
            const brakeDisc = new THREE.Mesh(
                new THREE.CylinderGeometry(0.24, 0.24, 0.04, 24),
                this.chromeMaterial
            );
            brakeDisc.rotation.z = Math.PI / 2;
            wheelGroup.add(brakeDisc);

            const caliper = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.14, 0.12),
                this.brakeCaliperMat
            );
            caliper.position.set(0, 0.12, 0);
            wheelGroup.add(caliper);

            wheelGroup.position.set(pos.x, pos.y, pos.z);
            this.carGroup.add(wheelGroup);
            this.wheels.push(wheelGroup);
        });

        this.scene.add(this.carGroup);
    }

    setupLights() {
        // Key Ambient Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // Directional Studio Sun Light with Soft Shadows
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
        dirLight.position.set(8, 12, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.bias = -0.0001;
        this.scene.add(dirLight);

        // Blue Rim Light for Cyber/Modern Aesthetic
        const rimLight = new THREE.DirectionalLight(0x00d4ff, 1.2);
        rimLight.position.set(-8, 6, -8);
        this.scene.add(rimLight);

        // Warm Accent Light
        const fillLight = new THREE.PointLight(0xff7700, 1.0, 15);
        fillLight.position.set(0, 4, 3);
        this.scene.add(fillLight);
    }

    setupFloor() {
        // Reflective Ground Shadow Plane
        const shadowPlaneGeo = new THREE.PlaneGeometry(30, 30);
        const shadowPlaneMat = new THREE.ShadowMaterial({
            opacity: 0.55
        });
        const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = 0.01;
        shadowPlane.receiveShadow = true;
        this.scene.add(shadowPlane);

        // Futuristic Radial Floor Grid
        const gridHelper = new THREE.GridHelper(24, 24, 0x00d4ff, 0x222233);
        gridHelper.position.y = 0.005;
        this.scene.add(gridHelper);
    }

    setupAudio() {
        // Synthesizes 4.0L NA Flat-6 Rev Sound with Web Audio API
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API not supported");
        }
    }

    revEngine() {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        
        // Pitch envelope imitating 9,000 RPM Flat-6 climb
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.6);
        osc.frequency.exponentialRampToValueAtTime(140, now + 1.4);

        // Volume envelope
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 1.5);

        // Visual rumble / shake effect
        if (this.carGroup) {
            const originalY = this.carGroup.position.y;
            let step = 0;
            const rumbleInterval = setInterval(() => {
                this.carGroup.position.y = originalY + (Math.random() - 0.5) * 0.03;
                // Spin wheels during rev!
                this.wheels.forEach(w => w.rotation.x += 0.3);
                step++;
                if (step > 25) {
                    clearInterval(rumbleInterval);
                    this.carGroup.position.y = originalY;
                }
            }, 30);
        }
    }

    setCarColor(hexColor) {
        this.currentColor = hexColor;
        if (this.bodyMaterial) {
            this.bodyMaterial.color.setHex(hexColor);
        }
    }

    toggleHeadlights() {
        this.lightsOn = !this.lightsOn;
        this.headlights.forEach(light => {
            light.intensity = this.lightsOn ? 2.0 : 0;
        });
        if (this.lightGlowMat) {
            this.lightGlowMat.opacity = this.lightsOn ? 0.95 : 0.2;
        }
    }

    toggleWireframe() {
        this.wireframeMode = !this.wireframeMode;
        if (this.bodyMaterial) {
            this.bodyMaterial.wireframe = this.wireframeMode;
        }
        if (this.carbonMaterial) {
            this.carbonMaterial.wireframe = this.wireframeMode;
        }
    }

    setPresetCamera(viewName) {
        if (!this.camera || !this.controls) return;

        let targetPos = { x: 4.5, y: 2.2, z: 5.5 };
        let targetLookAt = { x: 0, y: 0.6, z: 0 };

        switch (viewName) {
            case 'front':
                targetPos = { x: 0, y: 1.2, z: 4.8 };
                targetLookAt = { x: 0, y: 0.5, z: 0 };
                break;
            case 'side':
                targetPos = { x: 5.2, y: 1.1, z: 0 };
                targetLookAt = { x: 0, y: 0.6, z: 0 };
                break;
            case 'wing':
                targetPos = { x: 2.2, y: 2.3, z: -3.8 };
                targetLookAt = { x: 0, y: 1.2, z: -1.5 };
                break;
            case 'cockpit':
                targetPos = { x: 0.4, y: 1.15, z: 0.2 };
                targetLookAt = { x: 0, y: 0.8, z: 1.5 };
                break;
            case 'orbit':
            default:
                targetPos = { x: 4.5, y: 2.2, z: 5.5 };
                targetLookAt = { x: 0, y: 0.6, z: 0 };
                break;
        }

        // Smooth GSAP transition if available
        if (typeof gsap !== 'undefined') {
            gsap.to(this.camera.position, {
                x: targetPos.x,
                y: targetPos.y,
                z: targetPos.z,
                duration: 1.2,
                ease: 'power2.inOut'
            });
            gsap.to(this.controls.target, {
                x: targetLookAt.x,
                y: targetLookAt.y,
                z: targetLookAt.z,
                duration: 1.2,
                ease: 'power2.inOut'
            });
        } else {
            this.camera.position.set(targetPos.x, targetPos.y, targetPos.z);
            this.controls.target.set(targetLookAt.x, targetLookAt.y, targetLookAt.z);
        }
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    pause() {
        this.isPaused = true;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            this.animate();
        }
    }

    animate() {
        if (this.isPaused) return;
        this.animFrameId = requestAnimationFrame(() => this.animate());

        if (this.controls) {
            this.controls.update();
        }

        // Slow turntable rotation if idle
        if (this.carGroup && (!this.controls || this.controls.state === -1)) {
            this.carGroup.rotation.y += 0.003;
        }

        this.renderer.render(this.scene, this.camera);
    }
}
