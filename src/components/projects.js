// ============================================================
// Component: projects
// Renders project cards with live preview + modal
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

function buildFallbackImg(src, title) {
    const url = src || `https://placehold.co/600x400/0a0a0a/00bfff?text=${encodeURIComponent(title)}`;
    return `<img src="${url}" alt="${title} screenshot" class="project-thumbnail w-full" loading="lazy">`;
}

// expose globally for iframe onerror
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

export function openProjectModal(idx) {
    const p = projectsData[idx];
    if (!p) return;
    const modal = document.getElementById('project-modal');
    const content = document.getElementById('project-modal-content');
    if (!modal || !content) return;

    const tagsHtml = (p.tags || []).map(t => `<span class="tag-pill mr-2 mb-1">${t}</span>`).join('');
    const previewImg = p.imageUrl || `https://placehold.co/800x450/0a0a0a/00bfff?text=${encodeURIComponent(p.title)}`;

    content.innerHTML = `
        <div class="flex flex-col md:flex-row gap-6">
            <div class="md:w-1/2">
                <img src="${previewImg}" alt="${p.title} screenshot"
                     class="w-full project-thumbnail rounded-lg"
                     loading="lazy" decoding="async" width="800" height="450"
                     onerror="this.src='https://placehold.co/800x450/0a0a0a/00bfff?text=${encodeURIComponent(p.title)}'">
            </div>
            <div class="md:w-1/2">
                <div class="flex flex-wrap gap-1 mb-3">${tagsHtml}</div>
                <h3 class="font-display text-2xl text-accent-secondary mb-3">${p.title}</h3>
                <p class="text-secondary mb-4 leading-relaxed">${p.description || ''}</p>
                <div class="flex gap-3 flex-wrap">
                    ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" rel="noopener noreferrer" class="project-button secondary"><i class="fab fa-github"></i> View Code</a>` : ''}
                    ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank" rel="noopener noreferrer" class="project-button primary"><i class="fa-solid fa-arrow-up-right-from-square"></i> Live Demo</a>` : ''}
                </div>
            </div>
        </div>`;

    // update social meta
    if (p.imageUrl) {
        setMetaContent('og:image', p.imageUrl, true);
        setMetaContent('twitter:image', p.imageUrl, false);
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('project-modal-close')?.addEventListener('click', closeProjectModal);
    document.getElementById('project-modal-backdrop')?.addEventListener('click', closeProjectModal);
}

export function closeProjectModal() {
    const modal = document.getElementById('project-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
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
