// ============================================================
// Component: skills
// Renders circular progress ring skill buttons
// ============================================================

import { skillsData } from '../data/skills.js';

export function renderSkills() {
    const container = document.getElementById("skills-container");
    if (!container) return;

    container.innerHTML = Object.entries(skillsData).map(([category, skills]) => `
        <div class="skills-category-card glass-card mb-8">
            <h3 class="font-display text-xl md:text-2xl text-accent-secondary mb-6 font-bold border-b border-border-color/20 pb-3 flex items-center gap-2">
                <i class="fa-regular fa-folder-open text-accent"></i> ${category}
            </h3>
            <div class="skills-grid">
                ${skills.map(s => `
                    <div class="skill-card" data-name="${s.name}" data-level="${s.level}">
                        <div class="skill-icon-wrap">
                            <i class="${s.icon}" aria-hidden="true"></i>
                        </div>
                        <div class="skill-info">
                            <div class="skill-header-row">
                                <span class="skill-name">${s.name}</span>
                                <span class="skill-percentage">0%</span>
                            </div>
                            <div class="skill-progress-container">
                                <div class="skill-progress-bar" style="width: 0%;"></div>
                            </div>
                        </div>
                    </div>`).join('')}
            </div>
        </div>`
    ).join('');
}
