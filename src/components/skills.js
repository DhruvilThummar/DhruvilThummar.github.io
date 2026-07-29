// ============================================================
// Component: skills
// Renders circular progress ring skill buttons
// ============================================================

import { skillsData } from '../data/skills.js';

export function renderSkills() {
    const container = document.getElementById("skills-container");
    if (!container) return;

    container.innerHTML = Object.entries(skillsData).map(([category, skills]) => `
        <div class="skills-category mb-12">
            <h3 class="font-display text-2xl text-accent-secondary mb-8 text-center">${category}</h3>
            <div class="skills-grid">
                ${skills.map(s => `
                    <div class="skill-button" data-level="${s.level}">
                        <svg class="skill-button-progress" viewBox="0 0 100 100">
                            <circle class="progress-ring-bg" cx="50" cy="50" r="45" stroke-width="6" fill="transparent"/>
                            <circle cx="50" cy="50" r="45" stroke="var(--accent-color)" stroke-width="6" fill="transparent" class="progress-ring"/>
                        </svg>
                        <div class="skill-content">
                            <i class="${s.icon}" aria-hidden="true"></i>
                            <span class="skill-percentage">0%</span>
                        </div>
                        <span class="tooltip">${s.name}</span>
                    </div>`).join('')}
            </div>
        </div>`
    ).join('');

    // Initialize progress ring circumferences
    document.querySelectorAll(".progress-ring").forEach(ring => {
        const r = ring.r.baseVal.value;
        const c = 2 * Math.PI * r;
        ring.style.setProperty("--circumference", c);
        ring.style.strokeDasharray = `0 ${c}`;
    });
}
