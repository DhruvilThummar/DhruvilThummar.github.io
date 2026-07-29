// ============================================================
// Component: certifications
// Renders certificate cards with images, credential IDs, and verify links
// ============================================================

import { certificationsData, achievementsData } from '../data/certifications.js';

export function renderCertifications() {
    const grid = document.getElementById("certifications-grid");
    if (!grid) return;

    grid.innerHTML = certificationsData.map((cert, i) => {
        const skillPills = cert.skills.map(s => `<span class="cert-skill-pill">${s}</span>`).join('');
        const verifyBtn = cert.credlyBadge
            ? `<a href="${cert.verifyUrl}" target="_blank" rel="noopener noreferrer" class="cert-action-btn credly-btn"><i class="fas fa-award"></i> Credly Badge</a>`
            : `<a href="${cert.verifyUrl}" target="_blank" rel="noopener noreferrer" class="cert-action-btn verify-btn"><i class="fas fa-external-link-alt"></i> Verify</a>`;

        return `
            <article class="cert-card glass-card rounded-xl overflow-hidden" style="animation-delay:${i * 0.1}s" data-cert-id="${cert.id}">
                <!-- Certificate Image Preview -->
                <div class="cert-image-wrap">
                    <img
                        src="${cert.imageUrl}"
                        alt="${cert.title} certificate"
                        class="cert-image"
                        loading="lazy"
                        decoding="async"
                        onerror="this.parentElement.innerHTML='<div class=\\'cert-image-fallback\\'><i class=\\'fas fa-certificate\\'></i></div>'"
                    >
                    <div class="cert-image-overlay">
                        <a href="${cert.verifyUrl}" target="_blank" rel="noopener noreferrer" class="cert-view-full">
                            <i class="fas fa-expand-alt"></i> View Full Certificate
                        </a>
                    </div>
                    <div class="cert-platform-badge">${cert.platform}</div>
                </div>

                <!-- Certificate Info -->
                <div class="cert-info p-5">
                    <div class="cert-issuer-row">
                        <span class="cert-issuer-name" style="color: ${cert.color}">${cert.issuer}</span>
                        <span class="cert-date">${cert.date}</span>
                    </div>
                    <h3 class="cert-title">${cert.title}</h3>
                    <p class="cert-description">${cert.description}</p>
                    <div class="cert-credential">
                        <i class="fas fa-fingerprint"></i>
                        <span class="cert-credential-label">Credential ID:</span>
                        <code class="cert-credential-id">${cert.credentialId}</code>
                    </div>
                    <div class="cert-skills">${skillPills}</div>
                    <div class="cert-actions">
                        ${verifyBtn}
                        <a href="${cert.courseraUrl}" target="_blank" rel="noopener noreferrer" class="cert-action-btn coursera-btn">
                            <i class="fas fa-graduation-cap"></i> Coursera
                        </a>
                    </div>
                </div>
            </article>`;
    }).join('');
}

export function renderAchievements() {
    const container = document.getElementById("achievements-grid");
    if (!container) return;

    container.innerHTML = achievementsData.map((ach, i) => `
        <div class="achievement-card glass-card p-6 rounded-xl" style="animation-delay:${i * 0.1}s">
            <div class="achievement-icon-wrap" style="background: ${ach.color}20; border-color: ${ach.color}40">
                <i class="${ach.icon}" style="color: ${ach.color}"></i>
            </div>
            <div class="achievement-content">
                <h3 class="achievement-title">${ach.title}</h3>
                <p class="achievement-subtitle">${ach.subtitle} <span class="achievement-organizer">— ${ach.organizer}</span></p>
                <p class="achievement-desc">${ach.description}</p>
            </div>
            <div class="achievement-date">${ach.date}</div>
        </div>`
    ).join('');
}
