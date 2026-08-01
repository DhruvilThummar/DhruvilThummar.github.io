// ============================================================
// Component: projects
// Renders project cards with live preview + modal (macOS style)
// ============================================================

import { projectsData } from '../data/projects.js';

const isMobile = () => window.innerWidth < 768;

function buildLivePreview(project) {
    if (!project.liveUrl || isMobile()) {
        // Static image fallback
        const src = project.imageUrl || `https://placehold.co/600x400/0a0a0a/00bfff?text=${encodeURIComponent(project.title)}`;
        return `
            <div class="project-thumb-wrap">
                <img src="${src}" alt="${project.title} screenshot"
                     class="project-thumbnail w-full" loading="lazy" decoding="async"
                     onerror="this.src='https://placehold.co/600x400/0a0a0a/00bfff?text=${encodeURIComponent(project.title)}'">
            </div>`;
    }

    // Live iframe preview for desktop
    return `
        <div class="project-live-preview">
            <div class="live-badge"><span class="live-dot"></span>LIVE</div>
            <div class="iframe-scaler">
                <iframe
                    src="${project.liveUrl}"
                    class="project-iframe"
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    title="${project.title} live preview"
                    onerror="this.parentElement.parentElement.innerHTML=buildFallbackImg('${project.imageUrl || ''}','${project.title}')"
                ></iframe>
            </div>
        </div>`;
}

// expose globally for iframe onerror
function buildFallbackImg(src, title) {
    const url = src || `https://placehold.co/600x400/0a0a0a/00bfff?text=${encodeURIComponent(title)}`;
    return `<img src="${url}" alt="${title} screenshot" class="project-thumbnail w-full" loading="lazy">`;
}
window.buildFallbackImg = buildFallbackImg;

export function renderProjects() {
    const grid = document.getElementById("projects-grid");
    if (!grid) return;

    grid.innerHTML = projectsData.map((p, index) => {
        const tagsHtml = (p.tags || [])
            .map(t => `<span class="tag-pill">${t}</span>`)
            .join(" ");

        const codeBtn = p.githubUrl
            ? `<a href="${p.githubUrl}" target="_blank" rel="noopener noreferrer" class="project-button secondary" onclick="event.stopPropagation()"><i class="fab fa-github" aria-hidden="true"></i> Code</a>`
            : "";
        const demoBtn = p.liveUrl
            ? `<a href="${p.liveUrl}" target="_blank" rel="noopener noreferrer" class="project-button primary" onclick="event.stopPropagation()"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Live</a>`
            : "";

        const featuredBadge = p.featured
            ? `<div class="featured-badge"><i class="fas fa-star"></i> Featured</div>`
            : "";

        const actionsHtml = [codeBtn, demoBtn].filter(Boolean).join("");
        const actionsBlock = actionsHtml
            ? `<div class="mt-auto pt-2 border-t border-border-color"><div class="flex items-center gap-3 flex-wrap pt-3">${actionsHtml}</div></div>`
            : "";

        return `
            <article
                role="button" tabindex="0"
                onclick="openProjectModal(${index})"
                onkeypress="if(event.key==='Enter')openProjectModal(${index})"
                class="glass-card p-6 rounded-xl flex flex-col project-card${p.featured ? ' featured-card' : ''}"
                style="animation-delay: ${index * 0.08}s"
                aria-label="Open ${p.title} details">
                ${featuredBadge}
                <div class="overflow-hidden rounded-lg mb-4 relative">
                    ${buildLivePreview(p)}
                </div>
                <div class="flex flex-wrap gap-1 mb-3">${tagsHtml}</div>
                <h3 class="font-display text-xl text-primary mb-2 transition-colors duration-300">${p.title}</h3>
                <p class="text-secondary text-sm mb-4 flex-grow line-clamp-3">${p.description || ''}</p>
                ${actionsBlock}
            </article>`;
    }).join("");
}

let activeProjectIdx = null;

function getProjectIcon(project) {
    const tags = project.tags || [];
    if (tags.includes("React") || tags.includes("MERN Stack")) return '<i class="fab fa-react text-sky-400"></i>';
    if (tags.includes("Java")) return '<i class="fab fa-java text-orange-500"></i>';
    if (tags.includes("Python") || tags.includes("Django") || tags.includes("Flask")) return '<i class="fab fa-python text-yellow-500"></i>';
    if (tags.includes("JavaScript") || tags.includes("HTML")) return '<i class="fab fa-js text-yellow-400"></i>';
    return '<i class="fas fa-file-code text-indigo-400"></i>';
}

function updateModalDetails(idx) {
    activeProjectIdx = idx;
    const p = projectsData[idx];
    if (!p) return;

    // Update active class in sidebar
    document.querySelectorAll('.mac-sidebar-item').forEach((el, i) => {
        if (i === idx) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    const pane = document.getElementById('mac-content-pane');
    if (!pane) return;

    // Update title
    const titleEl = document.querySelector('.mac-window-title');
    if (titleEl) titleEl.textContent = p.title;

    const tagsHtml = (p.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join(' ');
    const previewImg = p.imageUrl || `https://placehold.co/800x450/0a0a0a/00bfff?text=${encodeURIComponent(p.title)}`;

    const featuresHtml = (p.features || [])
        .map(f => `<li class="modal-feature-item">${f}</li>`)
        .join('');
    const featuresBlock = featuresHtml
        ? `<div class="mt-4 border-t border-border-color/30 pt-4">
            <h4 class="font-display text-sm font-semibold text-accent-secondary mb-2 flex items-center gap-2"><i class="fas fa-list-check"></i> Key Features & Accomplishments</h4>
            <ul class="modal-feature-list">${featuresHtml}</ul>
           </div>`
        : '';

    // Animate content shift inside panel
    gsap.fromTo(pane, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });

    pane.innerHTML = `
        <div class="flex flex-col lg:flex-row gap-8 items-start">
            <div class="w-full lg:w-1/2 flex flex-col gap-4">
                <div class="overflow-hidden rounded-xl border border-border-color bg-black/40 aspect-video flex items-center justify-center relative group">
                    <img src="${previewImg}" alt="${p.title} screenshot"
                         class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                         loading="lazy" decoding="async" width="800" height="450"
                         onerror="this.src='https://placehold.co/800x450/0a0a0a/00bfff?text=${encodeURIComponent(p.title)}'">
                </div>
            </div>
            <div class="w-full lg:w-1/2 flex flex-col justify-between">
                <div>
                    <div class="flex flex-wrap gap-1.5 mb-4">${tagsHtml}</div>
                    <h3 class="font-display text-2xl md:text-3xl font-bold text-primary mb-3">${p.title}</h3>
                    <p class="text-secondary text-sm md:text-base leading-relaxed text-justify mb-4">${p.description || ''}</p>
                    ${featuresBlock}
                </div>
                <div class="flex gap-3 flex-wrap mt-6 pt-4 border-t border-border-color/30">
                    ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" rel="noopener noreferrer" class="project-button secondary"><i class="fab fa-github"></i> Source Code</a>` : ''}
                    ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank" rel="noopener noreferrer" class="project-button primary"><i class="fa-solid fa-external-link"></i> Live Demo</a>` : ''}
                </div>
            </div>
        </div>
    `;

    // update social meta
    if (p.imageUrl) {
        setMetaContent('og:image', p.imageUrl, true);
        setMetaContent('twitter:image', p.imageUrl, false);
    }
}

export function openProjectModal(idx) {
    activeProjectIdx = idx;
    const modal = document.getElementById('project-modal');
    if (!modal) return;
    
    // Set active item for sidebar rendering
    const sidebarItemsHtml = projectsData.map((p, i) => {
        const activeClass = i === idx ? ' active' : '';
        return `
            <div class="mac-sidebar-item${activeClass}" onclick="window.switchProjectInModal(${i})">
                <span class="mac-sidebar-icon">${getProjectIcon(p)}</span>
                <span class="mac-sidebar-title">${p.title}</span>
            </div>
        `;
    }).join('');

    const modalWrapper = modal.querySelector('.relative') || modal.querySelector('.modal-glass-container');
    if (!modalWrapper) return;

    // Get position of clicked card
    const cardElements = document.querySelectorAll('.project-card');
    const clickedCard = cardElements[idx];
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;
    if (clickedCard) {
        const rect = clickedCard.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
    }

    // Apply macOS modal layout with Sidebar
    modalWrapper.className = "relative max-w-6xl w-full modal-glass-container rounded-2xl z-10 mx-4 max-h-[90vh] overflow-hidden flex flex-col";
    modalWrapper.innerHTML = `
        <div class="mac-window-header">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="mac-window-controls">
                    <button class="mac-control-btn mac-close" id="project-modal-close" aria-label="Close Window"></button>
                    <button class="mac-control-btn mac-minimize" id="project-modal-minimize" aria-label="Minimize Window"></button>
                    <button class="mac-control-btn mac-zoom" id="project-modal-zoom" aria-label="Zoom Window"></button>
                </div>
                <button class="mac-sidebar-toggle-btn" id="mac-sidebar-toggle" aria-label="Toggle Sidebar">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
            <div class="mac-window-title">Projects Explorer</div>
            <div style="width: 72px;"></div>
        </div>
        <div class="mac-window-body">
            <aside class="mac-window-sidebar" id="mac-modal-sidebar">
                <div class="mac-sidebar-section-title">Projects</div>
                <div class="mac-sidebar-list">
                    ${sidebarItemsHtml}
                </div>
            </aside>
            <div class="mac-window-content-wrapper">
                <div class="modal-body-content" id="mac-content-pane">
                    <!-- Dynamic project details injected here -->
                </div>
            </div>
        </div>`;

    // Modal open animation from card coordinates
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = "hidden"; // Prevent background scroll
    
    gsap.killTweensOf(modalWrapper);
    gsap.fromTo(modalWrapper, 
        { 
            scale: 0.05, 
            opacity: 0, 
            x: startX - window.innerWidth / 2, 
            y: startY - window.innerHeight / 2 
        }, 
        { 
            scale: 1, 
            opacity: 1, 
            x: 0, 
            y: 0, 
            duration: 0.45, 
            ease: "power3.out",
            onComplete: () => {
                // Render initial details
                updateModalDetails(idx);
            }
        }
    );

    // Sidebar toggle event
    const sidebar = document.getElementById('mac-modal-sidebar');
    document.getElementById('mac-sidebar-toggle')?.addEventListener('click', () => {
        sidebar?.classList.toggle('collapsed');
    });

    // Window events
    document.getElementById('project-modal-minimize')?.addEventListener('click', closeProjectModal);
    document.getElementById('project-modal-zoom')?.addEventListener('click', () => {
        modalWrapper.classList.toggle('max-w-6xl');
        modalWrapper.classList.toggle('max-w-[95vw]');
        modalWrapper.classList.toggle('h-[85vh]');
    });

    document.getElementById('project-modal-close')?.addEventListener('click', closeProjectModal);
    document.getElementById('project-modal-backdrop')?.addEventListener('click', closeProjectModal);
}

window.switchProjectInModal = function(idx) {
    updateModalDetails(idx);
};

export function closeProjectModal() {
    const modal = document.getElementById('project-modal');
    if (!modal) return;
    const modalWrapper = modal.querySelector('.relative') || modal.querySelector('.modal-glass-container');
    if (modalWrapper) {
        const cardElements = document.querySelectorAll('.project-card');
        const clickedCard = activeProjectIdx !== null ? cardElements[activeProjectIdx] : null;
        let targetX = 0;
        let targetY = 0;
        if (clickedCard) {
            const rect = clickedCard.getBoundingClientRect();
            targetX = (rect.left + rect.width / 2) - window.innerWidth / 2;
            targetY = (rect.top + rect.height / 2) - window.innerHeight / 2;
        }
        
        gsap.killTweensOf(modalWrapper);
        gsap.to(modalWrapper, {
            scale: 0.05,
            opacity: 0,
            x: targetX,
            y: targetY,
            duration: 0.38,
            ease: "power2.in",
            onComplete: () => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.style.overflow = ""; // Restore background scroll
                gsap.set(modalWrapper, { x: 0, y: 0, scale: 1, opacity: 1 }); // reset position
            }
        });
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = ""; // Restore background scroll
    }
    const _orig = window._originalOgImage;
    const _origT = window._originalTwitterImage;
    if (_orig) setMetaContent('og:image', _orig, true);
    if (_origT) setMetaContent('twitter:image', _origT, false);
}

function setMetaContent(prop, value, isProperty = true) {
    if (!value) return;
    const selector = isProperty ? `meta[property="${prop}"]` : `meta[name="${prop}"]`;
    let el = document.querySelector(selector);
    if (!el) {
        el = document.createElement('meta');
        isProperty ? el.setAttribute('property', prop) : el.setAttribute('name', prop);
        document.head.appendChild(el);
    }
    el.setAttribute('content', value);
}

// expose for inline onclick handlers in HTML
window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;
