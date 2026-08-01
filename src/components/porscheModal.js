// ============================================================
// Component: porscheModal.js
// Interactive Modal Showcase & Floating Trigger for 3D Porsche 911 GT3 RS
// ============================================================

import { Porsche911Visualizer } from './porsche911.js';

let porscheInstance = null;

export function initPorscheShowcase() {
    createLauncherButton();
    createModalDOM();
    bindNavButtons();
}

function bindNavButtons() {
    const navBtn = document.getElementById('navbar-3d-btn');
    if (navBtn) {
        navBtn.addEventListener('click', openPorscheModal);
    }

    const sidebarBtn = document.getElementById('sidebar-3d-btn');
    if (sidebarBtn) {
        sidebarBtn.addEventListener('click', () => {
            openPorscheModal();
            // Close sidebar menu
            const sidebar = document.getElementById('sidebar-menu');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar) sidebar.classList.add('-translate-x-full');
            if (overlay) {
                overlay.classList.add('opacity-0');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            }
        });
    }
}

function createLauncherButton() {
    if (document.getElementById('porsche-floating-launcher')) return;

    const launcher = document.createElement('button');
    launcher.id = 'porsche-floating-launcher';
    launcher.className = 'porsche-launcher-btn shadow-2xl';
    launcher.setAttribute('aria-label', 'Open 3D Interactive Model Studio');
    launcher.innerHTML = `
        <div class="launcher-glow"></div>
        <i class="fa-solid fa-cube text-lg"></i>
        <span class="launcher-text">3D Interactive Model</span>
        <span class="launcher-badge">3D</span>
    `;

    launcher.addEventListener('click', openPorscheModal);
    document.body.appendChild(launcher);
}

function createModalDOM() {
    if (document.getElementById('porsche-3d-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'porsche-3d-modal';
    modal.className = 'porsche-modal-backdrop hidden';
    modal.innerHTML = `
        <div class="porsche-modal-container">
            <!-- Modal Header -->
            <div class="porsche-modal-header">
                <div class="header-titles">
                    <div class="brand-subtitle flex items-center gap-2">
                        <span class="relative flex h-2 w-2">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                        </span>
                        <span>3D GEOMETRY &amp; SHADER STUDIO</span>
                    </div>
                    <h3 class="model-title">GT AERO CONCEPT <span class="highlight-spec">(INTERACTIVE 3D)</span></h3>
                </div>
                <div class="header-specs hidden md:flex items-center gap-3">
                    <div class="spec-pill"><i class="fa-solid fa-bolt text-amber-400"></i> High Performance</div>
                    <div class="spec-pill"><i class="fa-solid fa-microchip text-cyan-400"></i> WebGL Shaders</div>
                    <div class="spec-pill"><i class="fa-solid fa-layer-group text-emerald-400"></i> Procedural Mesh</div>
                    <div class="spec-pill"><i class="fa-solid fa-wind text-purple-400"></i> Active Aerodynamics</div>
                </div>
                <button id="porsche-modal-close" class="close-btn" aria-label="Close 3D Studio">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <!-- Main 3D Canvas Container -->
            <div id="porsche-3d-canvas-container" class="porsche-canvas-box"></div>

            <!-- Controls Overlay Toolbar -->
            <div class="porsche-controls-bar">
                <!-- Color Swatches -->
                <div class="control-group">
                    <span class="group-label">MATERIAL FINISH</span>
                    <div class="color-swatches">
                        <button class="swatch active" style="background:#d31027" data-color="0xd31027" title="Crimson Red"></button>
                        <button class="swatch" style="background:#00bd56" data-color="0x00bd56" title="Vibrant Green"></button>
                        <button class="swatch" style="background:#ffcc00" data-color="0xffcc00" title="Cyber Yellow"></button>
                        <button class="swatch" style="background:#c0c0c0" data-color="0xc0c0c0" title="Titanium Silver"></button>
                        <button class="swatch" style="background:#0066cc" data-color="0x0066cc" title="Cobalt Blue"></button>
                        <button class="swatch" style="background:#1a1a1a" data-color="0x1a1a1a" title="Obsidian Black"></button>
                    </div>
                </div>

                <!-- Camera Views -->
                <div class="control-group">
                    <span class="group-label">CAMERA VIEW</span>
                    <div class="btn-grid">
                        <button class="ctrl-btn view-btn active" data-view="orbit"><i class="fa-solid fa-rotate"></i> 360° Orbit</button>
                        <button class="ctrl-btn view-btn" data-view="front"><i class="fa-solid fa-eye"></i> Front</button>
                        <button class="ctrl-btn view-btn" data-view="side"><i class="fa-solid fa-arrows-left-right"></i> Side</button>
                        <button class="ctrl-btn view-btn" data-view="wing"><i class="fa-solid fa-feather"></i> Rear Spoiler</button>
                        <button class="ctrl-btn view-btn" data-view="cockpit"><i class="fa-solid fa-circle-dot"></i> Cockpit</button>
                    </div>
                </div>

                <!-- Interactive Toggles & Audio Rev -->
                <div class="control-group">
                    <span class="group-label">ACTIONS</span>
                    <div class="btn-grid">
                        <button id="porsche-rev-btn" class="ctrl-btn rev-action-btn"><i class="fa-solid fa-volume-high"></i> Rev Sound Synth</button>
                        <button id="porsche-lights-btn" class="ctrl-btn action-btn active"><i class="fa-solid fa-lightbulb"></i> LED Lights</button>
                        <button id="porsche-wireframe-btn" class="ctrl-btn action-btn"><i class="fa-solid fa-cube"></i> Wireframe</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('porsche-modal-close').addEventListener('click', closePorscheModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closePorscheModal();
    });

    // Swatches click
    const swatches = modal.querySelectorAll('.swatch');
    swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            swatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            const colorHex = parseInt(swatch.dataset.color, 16);
            if (porscheInstance) {
                porscheInstance.setCarColor(colorHex);
            }
        });
    });

    // Camera preset view clicks
    const viewBtns = modal.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (porscheInstance) {
                porscheInstance.setPresetCamera(btn.dataset.view);
            }
        });
    });

    // Action buttons
    document.getElementById('porsche-rev-btn').addEventListener('click', () => {
        if (porscheInstance) porscheInstance.revEngine();
    });

    document.getElementById('porsche-lights-btn').addEventListener('click', function () {
        this.classList.toggle('active');
        if (porscheInstance) porscheInstance.toggleHeadlights();
    });

    document.getElementById('porsche-wireframe-btn').addEventListener('click', function () {
        this.classList.toggle('active');
        if (porscheInstance) porscheInstance.toggleWireframe();
    });
}

export function openPorscheModal() {
    const modal = document.getElementById('porsche-3d-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Pause heavy background processes to free 100% GPU/CPU for the 3D model studio
    if (typeof window.pauseBackgroundMatrix === 'function') window.pauseBackgroundMatrix();
    if (typeof window.pauseFooter3D === 'function') window.pauseFooter3D();

    if (!porscheInstance) {
        setTimeout(() => {
            porscheInstance = new Porsche911Visualizer('porsche-3d-canvas-container');
        }, 100);
    } else {
        porscheInstance.resume();
        setTimeout(() => {
            porscheInstance.onWindowResize();
        }, 100);
    }
}

export function closePorscheModal() {
    const modal = document.getElementById('porsche-3d-modal');
    if (!modal) return;

    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';

    // Pause 3D model render loop to consume 0 CPU/GPU when hidden
    if (porscheInstance) {
        porscheInstance.pause();
    }

    // Resume background matrix and footer 3D animations
    if (typeof window.resumeBackgroundMatrix === 'function') window.resumeBackgroundMatrix();
    if (typeof window.resumeFooter3D === 'function') window.resumeFooter3D();
}
