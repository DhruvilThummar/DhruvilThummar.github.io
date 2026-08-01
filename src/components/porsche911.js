// ============================================================
// Component: porsche911.js
// Photorealistic 3D Car Model Visualizer with Environment Map Reflections,
// PBR Clearcoat Shading, GLTFLoader Support & High-Detail Curved Geometry
// ============================================================

export class Porsche911Visualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.currentColor = 0xd31027; // Default Guards Red
        this.lightsOn = true;
        this.wireframeMode = false;
        this.isPaused = false;
        this.animFrameId = null;
        this.gltfLoaded = false;

        this.initThree();
        this.setupEnvironmentMap();
        this.setupLights();
        this.setupFloor();
        this.setupAudio();

        // Attempt loading high-detail GLTF model, fallback to detailed procedural model
        this.loadCarModel();

        this.addEventListeners();
        this.animate();
    }

    initThree() {
        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 500;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x06070a);
        this.scene.fog = new THREE.FogExp2(0x06070a, 0.03);

        // Camera - Adaptive FOV and positioning for Mobile Phones
        const fov = this.isMobile ? 44 : 36;
        this.camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100);
        if (this.isMobile) {
            this.camera.position.set(5.5, 2.4, 6.8);
        } else {
            this.camera.position.set(4.8, 2.1, 5.8);
        }

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: !this.isMobile, alpha: true, powerPreference: "high-performance" });
        this.renderer.setSize(width, height);
        const maxDpr = this.isMobile ? 1.5 : 2;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = this.isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        // Container setup with loading UI
        this.container.innerHTML = `
            <div id="porsche-3d-loader" class="porsche-loader-overlay">
                <div class="loader-spinner"></div>
                <div class="loader-text" id="porsche-loader-text">Loading 3D Porsche Studio...</div>
                <div class="loader-bar-bg"><div class="loader-bar-fill" id="porsche-loader-bar"></div></div>
            </div>
        `;
        this.container.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.touchAction = 'none';

        // Controls with Mobile Touch Support
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2 - 0.01;
            this.controls.minDistance = 1.8;
            this.controls.maxDistance = 14;
            this.controls.target.set(0, 0.62, 0);
            this.controls.touches = {
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            };
        }
    }

    updateLoaderProgress(percent) {
        const bar = document.getElementById('porsche-loader-bar');
        const text = document.getElementById('porsche-loader-text');
        if (bar) bar.style.width = percent + '%';
        if (text) text.innerText = `Loading 3D Porsche Model (${percent}%)...`;
    }

    hideLoader() {
        const loader = document.getElementById('porsche-3d-loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                if (loader.parentNode) loader.parentNode.removeChild(loader);
            }, 450);
        }
    }

    setupEnvironmentMap() {
        // Procedural High-Dynamic Studio Environment Cube/Equirectangular Texture Map
        const canvas = document.createElement('canvas');
        canvas.width = this.isMobile ? 256 : 512;
        canvas.height = this.isMobile ? 128 : 256;
        const ctx = canvas.getContext('2d');

        // Studio Environment Gradient with Top Soft Light Box Highlights
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(0.3, '#0f172a');
        grad.addColorStop(0.7, '#080c14');
        grad.addColorStop(1, '#020408');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Bright Soft Studio Ceiling Light Boxes for Realistic Metallic Sheen
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 20;
        ctx.fillRect(canvas.width * 0.23, canvas.height * 0.08, canvas.width * 0.53, canvas.height * 0.18);

        const envTexture = new THREE.CanvasTexture(canvas);
        envTexture.mapping = THREE.EquirectangularReflectionMapping;
        envTexture.encoding = THREE.sRGBEncoding;
        this.envMap = envTexture;
        this.scene.environment = envTexture;
    }

    loadCarModel() {
        this.carGroup = new THREE.Group();
        this.scene.add(this.carGroup);

        // Create PBR Materials with Environment Map Reflections
        this.createMaterials();

        // Authentic 19.2MB Porsche 911 GT3 RS GLTF model
        const gltfUrl = './assets/porsche_gt3_rs.glb';
        this.paintMeshes = [];

        if (typeof THREE.GLTFLoader !== 'undefined') {
            const loader = new THREE.GLTFLoader();
            
            // Setup DRACOLoader decoder
            if (typeof THREE.DRACOLoader !== 'undefined') {
                const dracoLoader = new THREE.DRACOLoader();
                dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/gltf/');
                loader.setDRACOLoader(dracoLoader);
            }

            loader.load(
                gltfUrl,
                (gltf) => {
                    this.gltfLoaded = true;
                    const model = gltf.scene;

                    // Compute Bounding Box for Auto-Centering and Optimal Scale
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());

                    const maxDim = Math.max(size.x, size.y, size.z);
                    const targetSize = 4.4;
                    const scale = targetSize / maxDim;

                    model.scale.set(scale, scale, scale);
                    model.position.x = -center.x * scale;
                    model.position.y = -box.min.y * scale + 0.01; // Rest wheel contact points directly on studio floor
                    model.position.z = -center.z * scale;

                    // Apply studio reflections and identify paint meshes
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            
                            if (child.material) {
                                const applyEnv = (mat) => {
                                    if (!mat) return;
                                    mat.envMap = this.envMap;
                                    mat.envMapIntensity = 2.0;
                                    mat.needsUpdate = true;
                                };

                                if (Array.isArray(child.material)) {
                                    child.material.forEach(applyEnv);
                                } else {
                                    applyEnv(child.material);
                                }

                                const name = (child.name || '').toLowerCase();
                                const matName = (child.material.name || '').toLowerCase();

                                if (name.includes('body') || name.includes('paint') || name.includes('car_body') || 
                                    name.includes('primary') || name.includes('exterior') || 
                                    matName.includes('body') || matName.includes('paint') || matName.includes('car_body')) {
                                    this.paintMeshes.push(child);
                                }
                            }
                        }
                    });

                    this.carGroup.add(model);
                    this.hideLoader();
                },
                (xhr) => {
                    if (xhr.lengthComputable && xhr.total > 0) {
                        const percent = Math.round((xhr.loaded / xhr.total) * 100);
                        this.updateLoaderProgress(percent);
                    }
                },
                (error) => {
                    console.warn("Error loading GLTF model, rendering procedural fallback:", error);
                    this.buildProceduralPorsche();
                    this.hideLoader();
                }
            );
        } else {
            this.buildProceduralPorsche();
            this.hideLoader();
        }
    }

    createMaterials() {
        this.bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: this.currentColor,
            metalness: 0.75,
            roughness: 0.12,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            reflectivity: 0.98,
            envMap: this.envMap,
            envMapIntensity: 2.2
        });

        this.carbonMaterial = new THREE.MeshStandardMaterial({
            color: 0x121214,
            metalness: 0.45,
            roughness: 0.4,
            envMap: this.envMap,
            envMapIntensity: 1.0
        });

        this.glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x080b12,
            metalness: 0.1,
            roughness: 0.04,
            transmission: 0.88,
            transparent: true,
            opacity: 0.8,
            envMap: this.envMap,
            envMapIntensity: 2.5
        });

        this.chromeMaterial = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            metalness: 0.98,
            roughness: 0.05,
            envMap: this.envMap,
            envMapIntensity: 2.5
        });

        this.titaniumMaterial = new THREE.MeshStandardMaterial({
            color: 0x778899,
            metalness: 0.9,
            roughness: 0.18,
            envMap: this.envMap,
            envMapIntensity: 2.0
        });

        this.rubberMaterial = new THREE.MeshStandardMaterial({
            color: 0x161616,
            metalness: 0.05,
            roughness: 0.92
        });

        this.brakeCaliperMat = new THREE.MeshStandardMaterial({
            color: 0xffcc00, // Porsche Yellow Calipers
            metalness: 0.6,
            roughness: 0.2,
            envMap: this.envMap,
            envMapIntensity: 1.5
        });

        this.lightGlowMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.95
        });

        this.tailLightMat = new THREE.MeshBasicMaterial({
            color: 0xff1122,
            transparent: true,
            opacity: 0.95
        });
    }

    buildProceduralPorsche() {
        if (this.carGroup.children.length > 0) return; // Already loaded

        const carContainer = new THREE.Group();

        // 1. Aerodynamic Curved Floor & Main Shell
        const floorGeo = new THREE.BoxGeometry(1.84, 0.12, 4.15);
        const floorMesh = new THREE.Mesh(floorGeo, this.carbonMaterial);
        floorMesh.position.y = 0.28;
        carContainer.add(floorMesh);

        // Curved Body Shell with Smooth Vertices
        const mainBodyGeo = new THREE.CylinderGeometry(0.94, 0.96, 3.95, 24);
        mainBodyGeo.scale(1.0, 0.38, 1.0);
        mainBodyGeo.computeVertexNormals();
        const mainBodyMesh = new THREE.Mesh(mainBodyGeo, this.bodyMaterial);
        mainBodyMesh.rotation.x = Math.PI / 2;
        mainBodyMesh.position.set(0, 0.58, 0);
        mainBodyMesh.castShadow = true;
        mainBodyMesh.receiveShadow = true;
        carContainer.add(mainBodyMesh);

        // Sloping Front Hood (Porsche 911 Contour)
        const hoodGeo = new THREE.CylinderGeometry(0.8, 0.9, 1.48, 16, 1, false, -Math.PI / 2, Math.PI);
        hoodGeo.scale(1.08, 0.28, 1.0);
        hoodGeo.computeVertexNormals();
        const hoodMesh = new THREE.Mesh(hoodGeo, this.bodyMaterial);
        hoodMesh.rotation.z = Math.PI;
        hoodMesh.rotation.x = 0.18;
        hoodMesh.position.set(0, 0.74, 1.18);
        hoodMesh.castShadow = true;
        carContainer.add(hoodMesh);

        // Recessed Hood NACA Ducts
        for (let side of [-0.32, 0.32]) {
            const ventGeo = new THREE.BoxGeometry(0.18, 0.04, 0.38);
            const vent = new THREE.Mesh(ventGeo, this.carbonMaterial);
            vent.position.set(side, 0.8, 1.22);
            vent.rotation.x = 0.2;
            carContainer.add(vent);
        }

        // 2. Sloping 911 Roof & Teardrop Glass Cabin
        const cabinGeo = new THREE.CylinderGeometry(0.66, 0.9, 1.98, 24);
        cabinGeo.scale(1.12, 0.58, 1.0);
        cabinGeo.computeVertexNormals();
        const cabinMesh = new THREE.Mesh(cabinGeo, this.bodyMaterial);
        cabinMesh.rotation.x = Math.PI / 2 + 0.12;
        cabinMesh.position.set(0, 1.04, -0.15);
        cabinMesh.castShadow = true;
        carContainer.add(cabinMesh);

        // Tinted Glass Windshield & Rear Window
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.54, 0.96), this.glassMaterial);
        windshield.position.set(0, 1.04, 0.44);
        windshield.rotation.x = -0.48;
        carContainer.add(windshield);

        const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.48, 1.18), this.glassMaterial);
        rearWindow.position.set(0, 0.99, -0.74);
        rearWindow.rotation.x = 0.38;
        carContainer.add(rearWindow);

        // Roof Air Guide Fins
        for (let side of [-0.42, 0.42]) {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.85), this.carbonMaterial);
            fin.position.set(side, 1.36, -0.2);
            carContainer.add(fin);
        }

        // 3. Front Fender Humps with Air Louvers
        for (let side of [-0.86, 0.86]) {
            const frontFenderGeo = new THREE.SphereGeometry(0.4, 20, 20);
            frontFenderGeo.scale(0.52, 0.65, 1.8);
            frontFenderGeo.computeVertexNormals();
            const frontFender = new THREE.Mesh(frontFenderGeo, this.bodyMaterial);
            frontFender.position.set(side, 0.7, 1.18);
            frontFender.castShadow = true;
            carContainer.add(frontFender);

            // GT3 RS Top Fender Air Extractors (Louvers)
            for (let l = -0.15; l <= 0.15; l += 0.08) {
                const slat = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.05), this.carbonMaterial);
                slat.position.set(side * 0.95, 0.88, 1.22 + l);
                carContainer.add(slat);
            }
        }

        // Flared Rear Hips & Side Air Intakes
        for (let side of [-0.98, 0.98]) {
            const rearFenderGeo = new THREE.SphereGeometry(0.48, 20, 20);
            rearFenderGeo.scale(0.58, 0.72, 1.75);
            rearFenderGeo.computeVertexNormals();
            const rearFender = new THREE.Mesh(rearFenderGeo, this.bodyMaterial);
            rearFender.position.set(side, 0.68, -0.65);
            rearFender.castShadow = true;
            carContainer.add(rearFender);

            const sideScoop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.44), this.carbonMaterial);
            sideScoop.position.set(side * 0.96, 0.66, -0.32);
            carContainer.add(sideScoop);

            const sideSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 2.25), this.carbonMaterial);
            sideSkirt.position.set(side * 0.94, 0.28, 0);
            carContainer.add(sideSkirt);

            // Aero Side Mirrors
            const mirrorStalk = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.06), this.carbonMaterial);
            mirrorStalk.position.set(side * 0.88, 0.94, 0.55);
            carContainer.add(mirrorStalk);

            const mirrorCap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.16), this.bodyMaterial);
            mirrorCap.position.set(side * 1.02, 0.96, 0.55);
            carContainer.add(mirrorCap);
        }

        // 4. Front Lip Splitter & Dive Planes (Canards)
        const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.32, 0.45), this.bodyMaterial);
        frontBumper.position.set(0, 0.45, 1.9);
        carContainer.add(frontBumper);

        const frontGrille = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.22, 0.1), this.carbonMaterial);
        frontGrille.position.set(0, 0.43, 1.98);
        carContainer.add(frontGrille);

        const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.06, 0.45), this.carbonMaterial);
        splitter.position.set(0, 0.27, 2.0);
        carContainer.add(splitter);

        for (let side of [-0.94, 0.94]) {
            const canard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.25), this.carbonMaterial);
            canard.position.set(side, 0.43, 1.97);
            canard.rotation.z = side * -0.2;
            carContainer.add(canard);
        }

        // 5. Signature Quad LED Headlights
        this.headlights = [];
        for (let side of [-0.65, 0.65]) {
            const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.22, 16), this.chromeMaterial);
            housing.rotation.x = Math.PI / 2 - 0.22;
            housing.position.set(side, 0.74, 1.7);
            carContainer.add(housing);

            const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 8, 24), this.lightGlowMat);
            haloRing.rotation.x = Math.PI / 2 - 0.22;
            haloRing.position.set(side, 0.75, 1.78);
            carContainer.add(haloRing);

            for (let px of [-0.05, 0.05]) {
                for (let py of [-0.05, 0.05]) {
                    const ledPod = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), this.lightGlowMat);
                    ledPod.position.set(side + px, 0.75 + py, 1.79);
                    carContainer.add(ledPod);
                }
            }

            const spot = new THREE.SpotLight(0xffffff, 2.2, 18, Math.PI / 5, 0.4);
            spot.position.set(side, 0.75, 1.8);
            spot.target.position.set(side, 0.2, 9);
            carContainer.add(spot);
            carContainer.add(spot.target);
            this.headlights.push(spot);
        }

        // 6. Massive Swan-Neck GT3 RS Rear Wing (Active Aero)
        const wingGroup = new THREE.Group();
        const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 0.48), this.carbonMaterial);
        wingBlade.position.set(0, 1.5, -1.8);
        wingBlade.rotation.x = -0.06;
        wingBlade.castShadow = true;
        wingGroup.add(wingBlade);

        for (let side of [-1.12, 1.12]) {
            const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.38, 0.58), this.bodyMaterial);
            endplate.position.set(side, 1.5, -1.8);
            wingGroup.add(endplate);
        }

        for (let side of [-0.48, 0.48]) {
            const mount = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.52, 0.16), this.chromeMaterial);
            mount.position.set(side, 1.27, -1.7);
            mount.rotation.x = 0.28;
            wingGroup.add(mount);
        }
        carContainer.add(wingGroup);

        // 7. Rear Light Bar, Diffuser & Titanium Exhaust
        const rearLightBar = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.05, 0.06), this.tailLightMat);
        rearLightBar.position.set(0, 0.75, -1.98);
        carContainer.add(rearLightBar);

        for (let side of [-0.12, 0.12]) {
            const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.28, 16), this.titaniumMaterial);
            exhaust.rotation.x = Math.PI / 2;
            exhaust.position.set(side, 0.38, -2.0);
            carContainer.add(exhaust);
        }

        const diffuserBase = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.16, 0.42), this.carbonMaterial);
        diffuserBase.position.set(0, 0.32, -1.88);
        carContainer.add(diffuserBase);

        // 8. Center-Lock Wheels & PCCB Brakes
        this.wheels = [];
        const wheelPositions = [
            { x: -0.93, y: 0.38, z: 1.18 },  // Front Left
            { x: 0.93, y: 0.38, z: 1.18 },   // Front Right
            { x: -0.99, y: 0.38, z: -1.18 }, // Rear Left
            { x: 0.99, y: 0.38, z: -1.18 }   // Rear Right
        ];

        wheelPositions.forEach((pos) => {
            const wheelGroup = new THREE.Group();

            const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.32, 32), this.rubberMaterial);
            tire.rotation.z = Math.PI / 2;
            tire.castShadow = true;
            wheelGroup.add(tire);

            const rimBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.33, 24), this.chromeMaterial);
            rimBarrel.rotation.z = Math.PI / 2;
            wheelGroup.add(rimBarrel);

            const centerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.34, 16), this.brakeCaliperMat);
            centerCap.rotation.z = Math.PI / 2;
            wheelGroup.add(centerCap);

            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5;
                for (let offset of [-0.03, 0.03]) {
                    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.27, 0.04), this.carbonMaterial);
                    spoke.rotation.x = angle + offset;
                    spoke.position.x = (pos.x > 0 ? 0.16 : -0.16);
                    wheelGroup.add(spoke);
                }
            }

            const brakeDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 24), this.chromeMaterial);
            brakeDisc.rotation.z = Math.PI / 2;
            wheelGroup.add(brakeDisc);

            const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.14), this.brakeCaliperMat);
            caliper.position.set(0, 0.14, 0);
            wheelGroup.add(caliper);

            wheelGroup.position.set(pos.x, pos.y, pos.z);
            carContainer.add(wheelGroup);
            this.wheels.push(wheelGroup);
        });

        this.carGroup.add(carContainer);
    }

    setupLights() {
        // Clean Studio Environment Lighting (No extra glare/top spotlights)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(5, 8, 5);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.bias = -0.0001;
        this.scene.add(dirLight);

        const rimLight = new THREE.DirectionalLight(0x00d4ff, 0.6);
        rimLight.position.set(-5, 4, -5);
        this.scene.add(rimLight);
    }

    setupFloor() {
        // Soft Ground Contact Shadow
        const shadowPlaneGeo = new THREE.PlaneGeometry(30, 30);
        const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.55 });
        const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = 0.01;
        shadowPlane.receiveShadow = true;
        this.scene.add(shadowPlane);

        // Futuristic Grid Floor
        const gridHelper = new THREE.GridHelper(24, 24, 0x00d4ff, 0x1a1d29);
        gridHelper.position.y = 0.005;
        this.scene.add(gridHelper);
    }

    setupAudio() {
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
                if (this.wheels) this.wheels.forEach(w => w.rotation.x += 0.35);
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
        if (this.paintMeshes && this.paintMeshes.length > 0) {
            this.paintMeshes.forEach(mesh => {
                if (mesh.material) {
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach(m => m.color && m.color.setHex(hexColor));
                    } else if (mesh.material.color) {
                        mesh.material.color.setHex(hexColor);
                    }
                }
            });
        }
    }

    toggleHeadlights() {
        this.lightsOn = !this.lightsOn;

        if (this.headlights) {
            this.headlights.forEach(light => {
                if (light.spot) light.spot.intensity = this.lightsOn ? 2.2 : 0;
                else if (light.intensity !== undefined) light.intensity = this.lightsOn ? 2.2 : 0;
            });
        }
        if (this.lightGlowMat) {
            this.lightGlowMat.opacity = this.lightsOn ? 0.95 : 0.1;
        }

        // Traverse GLTF scene to toggle emissive materials on headlights/lamps
        if (this.carGroup) {
            this.carGroup.traverse((child) => {
                if (child.isMesh && child.material) {
                    const toggleEmissive = (m) => {
                        const nameStr = ((child.name || '') + (m.name || '')).toLowerCase();
                        if (nameStr.includes('light') || nameStr.includes('lamp') || nameStr.includes('glass') || nameStr.includes('headlight')) {
                            if (m.emissive) {
                                m.emissive.setHex(this.lightsOn ? 0xffffff : 0x000000);
                                m.emissiveIntensity = this.lightsOn ? 1.8 : 0;
                            }
                        }
                    };
                    if (Array.isArray(child.material)) child.material.forEach(toggleEmissive);
                    else toggleEmissive(child.material);
                }
            });
        }
    }

    toggleWireframe() {
        this.wireframeMode = !this.wireframeMode;
        
        // Traverse carGroup (both GLTF & procedural meshes) to toggle wireframe
        if (this.carGroup) {
            this.carGroup.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.wireframe = this.wireframeMode);
                    } else {
                        child.material.wireframe = this.wireframeMode;
                    }
                }
            });
        }
    }

    setPresetCamera(viewName) {
        if (!this.camera || !this.controls) return;

        let targetPos = { x: 4.8, y: 2.1, z: 5.8 };
        let targetLookAt = { x: 0, y: 0.62, z: 0 };

        switch (viewName) {
            case 'front':
                targetPos = { x: 0, y: 1.15, z: 4.8 };
                targetLookAt = { x: 0, y: 0.55, z: 0 };
                break;
            case 'side':
                targetPos = { x: 5.4, y: 1.1, z: 0 };
                targetLookAt = { x: 0, y: 0.62, z: 0 };
                break;
            case 'wing':
                targetPos = { x: 2.2, y: 2.4, z: -3.8 };
                targetLookAt = { x: 0, y: 1.25, z: -1.5 };
                break;
            case 'cockpit':
                targetPos = { x: 0.4, y: 1.15, z: 0.2 };
                targetLookAt = { x: 0, y: 0.8, z: 1.5 };
                break;
            case 'orbit':
            default:
                targetPos = { x: 4.8, y: 2.1, z: 5.8 };
                targetLookAt = { x: 0, y: 0.62, z: 0 };
                break;
        }

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
