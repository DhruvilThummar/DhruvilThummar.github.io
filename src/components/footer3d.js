// ============================================================
// Component: footer3d
// Renders an interactive 3D Particle Globe/Sphere in the footer
// ============================================================

export function initFooter3D() {
    const container = document.getElementById("footer-3d-canvas-container");
    if (!container) return;

    // Dimensions
    let width = container.clientWidth;
    let height = container.clientHeight || 200;

    // Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group to hold everything for easy rotation
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Get theme colors dynamically
    function getThemeColor(variableName, fallback) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
        return value ? value : fallback;
    }

    let accentColorStr = getThemeColor('--accent-color', '#00d4ff');
    let secondaryColorStr = getThemeColor('--accent-secondary-color', '#7000ff');

    // Create materials
    const particleMaterial = new THREE.PointsMaterial({
        color: new THREE.Color(accentColorStr),
        size: 0.12,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
    });

    const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(secondaryColorStr),
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending
    });

    // Create 3D Globe Geometry (Particles + Wireframe)
    const particleCount = 280;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    const radius = 4.2;
    for (let i = 0; i < particleCount; i++) {
        // Golden ratio distribution for neat spherical points
        const phi = Math.acos(-1 + (2 * i) / particleCount);
        const theta = Math.sqrt(particleCount * Math.PI) * phi;

        positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
        positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
        positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const globeParticles = new THREE.Points(geometry, particleMaterial);
    mainGroup.add(globeParticles);

    // Add wireframe sphere outline for structural depth
    const sphereGeometry = new THREE.SphereGeometry(radius - 0.05, 12, 12);
    const wireframeGeometry = new THREE.WireframeGeometry(sphereGeometry);
    const globeWireframe = new THREE.LineSegments(wireframeGeometry, lineMaterial);
    mainGroup.add(globeWireframe);

    // Add surrounding orbital rings for an astronomical/premium feel
    const ringGroup = new THREE.Group();
    mainGroup.add(ringGroup);

    const ringCount = 2;
    for (let r = 0; r < ringCount; r++) {
        const ringGeo = new THREE.RingGeometry(radius + 0.8 + r * 0.4, radius + 0.82 + r * 0.4, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(accentColorStr),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.12 - r * 0.05,
            blending: THREE.AdditiveBlending
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.rotation.y = (r === 0 ? 0.3 : -0.4);
        ringGroup.add(ringMesh);
    }

    // Animation & Mouse Interaction State
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotation = { x: 0.5, y: 0.5 };
    let mouseHover = { x: 0, y: 0 };
    let targetHover = { x: 0, y: 0 };

    // Drag to rotate
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };

            targetRotation.y += deltaMove.x * 0.005;
            targetRotation.x += deltaMove.y * 0.005;

            previousMousePosition = { x: e.clientX, y: e.clientY };
        } else {
            // Parallax effect on hover when not dragging
            const rect = container.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                targetHover.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                targetHover.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            } else {
                targetHover.x = 0;
                targetHover.y = 0;
            }
        }
    });

    // Touch support for mobile devices
    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    });

    window.addEventListener('touchend', () => {
        isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
            const deltaMove = {
                x: e.touches[0].clientX - previousMousePosition.x,
                y: e.touches[0].clientY - previousMousePosition.y
            };

            targetRotation.y += deltaMove.x * 0.008;
            targetRotation.x += deltaMove.y * 0.008;

            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    });

    // Auto theme sync listener
    const observer = new MutationObserver(() => {
        const nextAccent = getThemeColor('--accent-color', '#00d4ff');
        const nextSecondary = getThemeColor('--accent-secondary-color', '#7000ff');
        
        particleMaterial.color.set(nextAccent);
        lineMaterial.color.set(nextSecondary);
        ringGroup.children.forEach((ring, idx) => {
            if (ring.material) {
                ring.material.color.set(nextAccent);
            }
        });
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Animation Loop
    let lastTime = 0;
    function animate(time) {
        requestAnimationFrame(animate);

        // Smooth rotation interpolation (Inertia)
        mainGroup.rotation.y += (targetRotation.y - mainGroup.rotation.y) * 0.05;
        mainGroup.rotation.x += (targetRotation.x - mainGroup.rotation.x) * 0.05;

        // Subtle hover shift
        mouseHover.x += (targetHover.x - mouseHover.x) * 0.1;
        mouseHover.y += (targetHover.y - mouseHover.y) * 0.1;
        mainGroup.position.x = mouseHover.x * 0.5;
        mainGroup.position.y = mouseHover.y * 0.5;

        // Auto slow spin when not dragging
        if (!isDragging) {
            targetRotation.y += 0.002;
        }

        // Pulse / wave effect on particles
        const positionAttr = geometry.attributes.position;
        const timeFactor = time * 0.001;
        for (let i = 0; i < particleCount; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];
            
            // Add custom sine wave noise based on position and time
            const wave = Math.sin(timeFactor + x * 0.5 + y * 0.5) * 0.08;
            
            positionAttr.setXYZ(
                i,
                x + (x / radius) * wave,
                y + (y / radius) * wave,
                z + (z / radius) * wave
            );
        }
        geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);

    // Window Resize handler
    window.addEventListener("resize", () => {
        width = container.clientWidth;
        height = container.clientHeight || 200;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
}
