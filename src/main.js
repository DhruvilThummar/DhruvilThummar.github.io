// ============================================================
// Service: main.js
// Bootstrap — wires all components together on DOMContentLoaded
// ============================================================

import { renderProjects } from './components/projects.js';
import { renderSkills } from './components/skills.js';
import { renderCertifications, renderAchievements } from './components/certifications.js';

// Store original OG images for modal restore
window._originalOgImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || "";
window._originalTwitterImage = document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || "";

// ─── Preloader ────────────────────────────────────────────────
function initPreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) { document.addEventListener("DOMContentLoaded", startMainContent); return; }

    const statusText = document.getElementById("status-text");
    const progressBar = document.getElementById("progress-bar");
    const logoSig = document.getElementById("preloader-logo-path-signature");
    const logoStr = document.getElementById("preloader-logo-path-strike");

    const pageLoaded = new Promise(resolve => window.addEventListener("load", resolve, { once: true }));

    const tl = gsap.timeline({
        paused: true,
        onComplete: () => pageLoaded.then(() => {
            gsap.to(preloader, { opacity: 0, duration: 1, delay: 0.5, onComplete: () => { preloader.style.display = "none"; startMainContent(); } });
        })
    });

    const lenSig = logoSig.getTotalLength(), lenStr = logoStr.getTotalLength();
    gsap.set(logoSig, { strokeDasharray: lenSig, strokeDashoffset: lenSig, opacity: 1 });
    gsap.set(logoStr, { strokeDasharray: lenStr, strokeDashoffset: lenStr, opacity: 1 });

    tl.to(logoSig, { strokeDashoffset: 0, duration: 2, ease: "power2.inOut" })
        .to(logoStr, { strokeDashoffset: 0, duration: 1, ease: "power2.inOut" }, "-=1.0")
        .to(statusText, { text: "Calibrating...", duration: 0.5, ease: "none" }, "<")
        .to(progressBar, { width: "100%", duration: 2.5, ease: "power2.inOut" }, "<0.5")
        .to(statusText, { duration: 1, text: "Welcome.", ease: "none" }, "-=0.5");

    document.addEventListener("DOMContentLoaded", () => { document.body.style.overflow = "hidden"; tl.play(); });
}

// ─── Main Content ─────────────────────────────────────────────
function startMainContent() {
    document.body.style.overflow = "auto";
    scrambleHeroName();
    initMainAnimations();
    initChatbot();
}

// ─── Hero Name Scramble ───────────────────────────────────────
function scrambleHeroName() {
    const el = document.getElementById("hero-name");
    if (!el) return;
    const original = el.dataset.value;
    const chars = "!<>-\\/[]{}—=+*^?#_";
    let frame = 0;
    const scrambleDur = original.length * 8;
    const revealDur = 4000;
    const scramble = () => {
        let scrambled = "";
        const progress = frame / scrambleDur;
        for (let i = 0; i < original.length; i++) {
            scrambled += i < progress * original.length ? original[i] : chars[Math.floor(Math.random() * chars.length)];
        }
        el.textContent = scrambled;
        if (frame < scrambleDur) { frame++; setTimeout(() => requestAnimationFrame(scramble), 50); }
        else { setTimeout(() => { frame = 0; requestAnimationFrame(scramble); }, revealDur); }
    };
    scramble();
}

// ─── Navbar Scroll Hide ───────────────────────────────────────
function setupNavbarScroll() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    let lastScrollTop = 0;
    window.addEventListener("scroll", () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > 100) gsap.to(navbar, { y: -100, duration: 0.4, ease: "power2.out" });
        else gsap.to(navbar, { y: 0, duration: 0.4, ease: "power2.out" });
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, false);
}

// ─── Matrix Background Canvas ─────────────────────────────────
let animationFrameId;
function setupBackgroundCanvas() {
    const canvas = document.getElementById("background-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const setup = () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const isLight = document.body.classList.contains("light-mode");
        const fontSize = 16;
        const textColor = isLight ? "rgba(0, 180, 220, 0.45)" : "rgba(0, 191, 255, 0.4)";
        const bgColor = isLight ? "rgba(248, 249, 250, 0.05)" : "rgba(0, 0, 0, 0.05)";
        const characters = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン01";
        const columns = Math.floor(canvas.width / fontSize);
        const drops = new Array(columns).fill(1);
        const charArray = characters.split("");
        function draw() {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = textColor;
            ctx.font = `${fontSize}px Roboto Mono`;
            for (let i = 0; i < drops.length; i++) {
                const text = charArray[Math.floor(Math.random() * charArray.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
            animationFrameId = requestAnimationFrame(draw);
        }
        draw();
    };
    let resizeTimer;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(setup, 250); });
    new MutationObserver(setup).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    setup();
}

// ─── Custom Cursor ────────────────────────────────────────────
function setupCustomCursor() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;
    window.addEventListener("mousemove", e => {
        gsap.to(dot, { duration: 0.2, x: e.clientX, y: e.clientY });
        gsap.to(ring, { duration: 0.6, x: e.clientX, y: e.clientY, ease: "power2.out" });
    });
    document.querySelectorAll("a, button, .glass-card, .magnetic-icon").forEach(el => {
        el.addEventListener("mouseenter", () => document.body.classList.add("link-hover"));
        el.addEventListener("mouseleave", () => document.body.classList.remove("link-hover"));
    });
}

// ─── Sidebar ──────────────────────────────────────────────────
function setupSidebar() {
    const menuBtn = document.getElementById("menu-toggle-btn"),
        closeBtn = document.getElementById("sidebar-close-btn"),
        sidebar = document.getElementById("sidebar-menu"),
        overlay = document.getElementById("sidebar-overlay"),
        links = document.querySelectorAll(".sidebar-link");
    if (!menuBtn || !closeBtn || !sidebar || !overlay) return;
    const open = () => { document.body.classList.add("no-scroll"); sidebar.classList.add("open"); overlay.classList.remove("hidden"); gsap.to(overlay, { opacity: 1, duration: 0.3 }); menuBtn.setAttribute("aria-expanded", "true"); };
    const close = () => { document.body.classList.remove("no-scroll"); sidebar.classList.remove("open"); gsap.to(overlay, { opacity: 0, duration: 0.3, onComplete: () => overlay.classList.add("hidden") }); menuBtn.setAttribute("aria-expanded", "false"); };
    menuBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", close);
    links.forEach(l => l.addEventListener("click", close));
}

// ─── Theme Toggle ─────────────────────────────────────────────
function setupThemeToggle() {
    const btn = document.getElementById("theme-toggle");
    const sun = document.getElementById("theme-toggle-sun");
    const moon = document.getElementById("theme-toggle-moon");
    if (!btn || !sun || !moon) return;
    const apply = theme => {
        if (theme === "dark") { document.body.classList.remove("light-mode"); sun.classList.add("hidden"); moon.classList.remove("hidden"); }
        else { document.body.classList.add("light-mode"); sun.classList.remove("hidden"); moon.classList.add("hidden"); }
    };
    btn.addEventListener("click", () => { const isLight = document.body.classList.toggle("light-mode"); const t = isLight ? "light" : "dark"; localStorage.setItem("theme", t); apply(t); });
    apply(localStorage.getItem("theme") || "dark");
}

// ─── Contact Form ─────────────────────────────────────────────
function setupContactForm() {
    const form = document.getElementById("contact-form");
    const button = form?.querySelector('button[type="submit"]');
    const toast = document.getElementById("form-toast");
    const toastIcon = document.getElementById("toast-icon");
    const toastMessage = document.getElementById("toast-message");
    if (!form || !button || !toast) return;

    const showToast = (message, isSuccess) => {
        toastMessage.textContent = message;
        toastIcon.innerHTML = isSuccess ? "✅" : "❌";
        toast.className = "show " + (isSuccess ? "success" : "error");
        setTimeout(() => toast.className = toast.className.replace("show", ""), 4000);
    };

    const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    const validateForm = () => {
        const name = form.name?.value?.trim();
        const email = form.email?.value?.trim();
        const message = form.message?.value?.trim();
        if (!name || name.length < 2) return "Please enter a valid name";
        if (!email || email.length > 254 || !emailPattern.test(email)) return "Please enter a valid email";
        if (!message || message.length < 10) return "Message must be at least 10 characters";
        return null;
    };

    const endpoint = (form.dataset.endpoint || window.CONTACT_API_URL || "/api/contact").trim();
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const err = validateForm();
        if (err) { showToast(err, false); return; }
        button.classList.add("loading"); button.disabled = true;
        const formData = { name: form.name?.value?.trim(), email: form.email?.value?.trim(), subject: form.subject?.value?.trim() || "Portfolio Contact Form", message: form.message?.value?.trim() };
        try {
            const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                showToast(`Contact service error (${res.status}). Please try again later.`, false); return;
            }
            const payload = await res.json().catch(() => null);
            if (res.ok) { showToast("Thanks for connecting! Check your email for confirmation. 🙏", true); form.reset(); }
            else { showToast(payload?.error || "Failed to send message", false); }
        } catch { showToast("Network error. Please check your connection.", false); }
        finally { button.classList.remove("loading"); button.disabled = false; }
    });
}

// ─── Chatbot ──────────────────────────────────────────────────
function initChatbot() {
    const bubble = document.getElementById("chatbot-bubble"),
        windowEl = document.getElementById("chatbot-window"),
        messagesEl = document.getElementById("chat-messages"),
        inputEl = document.getElementById("chat-input"),
        sendBtn = document.getElementById("chat-send"),
        closeBtn = document.getElementById("chat-close-btn"),
        quickRepliesEl = document.getElementById("quick-replies-container");
    if (!bubble || !windowEl || !messagesEl || !inputEl || !sendBtn || !closeBtn || !quickRepliesEl) return;

    const knowledge = [
        { k: ["about", "who are you", "dhruvil"], r: "Dhruvil is a Computer Engineering student at L.J. University, specializing in ML (Scikit-Learn, CatBoost), Data Analytics, and MERN Stack. IBM-certified and building microservice platforms." },
        { k: ["skill", "tech", "know", "do", "proficient", "tools"], r: "Dhruvil's specialties: Machine Learning (Scikit-Learn, CatBoost, EDA), MERN Stack (MongoDB, Express, React, Node), Python, Java, Socket.io, Django REST, TypeScript, SQL." },
        { k: ["project", "work", "experience", "build"], r: "Key projects: AgriPulse AI (3-tier microservice ML platform), Appointory (healthcare OS with CatBoost wait-time predictor), Script Converter Studio (React/TypeScript/Monaco Editor). All on GitHub!" },
        { k: ["agripulse", "agri", "commodity", "crop"], r: "AgriPulse AI is a 3-tier microservice platform predicting commodity prices across 12 crop types. It achieved 83.10% accuracy and 0.9131 ROC-AUC using HistGradientBoosting, Random Forest, and SVC ensemble models." },
        { k: ["appointory", "healthcare", "clinic", "queue"], r: "Appointory is a multi-tenant clinic queue OS hosted at appointory.in. Features CatBoost ML wait-time predictions, Socket.io real-time updates, AES-256 health vaults, and DLT SMS notifications." },
        { k: ["contact", "email", "hire", "connect"], r: "Reach Dhruvil at dhruvilthummar1303@gmail.com or connect on LinkedIn. He's open to internships and freelance opportunities!" },
        { k: ["education", "college", "university", "studying"], r: "B.Tech in Computer Engineering at L.J. University, Ahmedabad (2024–2028). Focus areas: DSA, DBMS, OS, Computer Networks, Python for Data Science." },
        { k: ["certificate", "ibm", "coursera", "certification"], r: "Dhruvil holds IBM certifications in EDA for ML and Python for Data Science, plus Penn Engineering's Java DSA cert. All verified on Coursera." },
        { k: ["location", "where", "from"], r: "Dhruvil is from Ahmedabad, Gujarat, India." },
        { k: ["hello", "hi", "hey"], r: "Hello! I'm Info-Byte, Dhruvil's personal AI assistant. Ask me about his ML projects, MERN skills, or certifications!" },
        { k: ["thank you", "thanks"], r: "You're welcome! Feel free to ask about Dhruvil's AI/ML or full-stack projects." },
        { k: ["bye", "goodbye"], r: "Goodbye! Feel free to reach out via the contact form anytime." },
    ];

    const quickReplies = ["Tell me about AgriPulse AI", "What ML skills does he have?", "Is Appointory live?"];
    const getResponse = input => {
        const lower = input.toLowerCase();
        for (const item of knowledge) if (item.k.some(k => lower.includes(k))) return item.r;
        return "I can answer questions about Dhruvil's ML projects, MERN skills, and certifications. Use the contact form for anything else!";
    };

    const addMessage = (text, sender) => {
        const isUser = sender === "user";
        const el = document.createElement("div");
        el.className = `chat-message-group ${sender}`;
        el.innerHTML = `<div class="chat-avatar"><i class="fas ${isUser ? "fa-user" : "fa-robot"}"></i></div><div class="chat-bubble">${text}</div>`;
        messagesEl.appendChild(el);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    };

    const showTyping = show => {
        document.querySelector(".typing-indicator")?.remove();
        if (show) {
            const el = document.createElement("div");
            el.className = "chat-message-group bot typing-indicator";
            el.innerHTML = `<div class="chat-avatar"><i class="fas fa-robot"></i></div><div><span></span><span></span><span></span></div>`;
            messagesEl.appendChild(el);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }
    };

    const showQuickReplies = () => {
        quickRepliesEl.innerHTML = "";
        quickReplies.forEach(reply => {
            const btn = document.createElement("button");
            btn.textContent = reply; btn.className = "quick-reply";
            btn.onclick = () => { inputEl.value = reply; handleChat(); };
            quickRepliesEl.appendChild(btn);
        });
    };

    const handleChat = () => {
        const input = inputEl.value.trim();
        if (!input) return;
        addMessage(input, "user"); inputEl.value = ""; quickRepliesEl.innerHTML = "";
        showTyping(true);
        setTimeout(() => { showTyping(false); addMessage(getResponse(input), "bot"); showQuickReplies(); }, 1200);
    };

    const toggleChat = open => {
        windowEl.classList.toggle("open", open); bubble.classList.toggle("open", open);
        const icon = bubble.querySelector("svg");
        gsap.to(icon, { rotation: open ? 135 : 0, duration: 0.4, ease: "back.out(1.7)" });
        if (open) inputEl.focus();
    };

    bubble.addEventListener("click", () => toggleChat(!windowEl.classList.contains("open")));
    closeBtn.addEventListener("click", () => toggleChat(false));
    sendBtn.addEventListener("click", handleChat);
    inputEl.addEventListener("keypress", e => e.key === "Enter" && handleChat());
    addMessage("Hello! I'm Info-Byte, Dhruvil's AI assistant. Ask me about his ML/MERN projects!", "bot");
    showQuickReplies();
}

// ─── GSAP Animations ──────────────────────────────────────────
function initMainAnimations() {
    gsap.registerPlugin(ScrollTrigger);
    const taglineEl = document.getElementById("hero-tagline");
    const originalTagline = taglineEl ? taglineEl.textContent.trim() : "";
    if (taglineEl) taglineEl.textContent = "";

    gsap.timeline({ delay: 0.2 })
        .from("#hero-name", { opacity: 0, y: 20, duration: 0.8, ease: "power3.out" })
        .to("#hero-tagline", { text: originalTagline, duration: 2.5, ease: "none" }, "-=0.6")
        .from("#hero-university", { opacity: 0, y: 20, duration: 0.8, ease: "power3.out" }, "-=2")
        .from("#hero-cta-container", { opacity: 0, y: 20, duration: 0.8, ease: "power3.out" }, "-=1.8");

    gsap.utils.toArray(".section-heading").forEach(h =>
        gsap.from(h, { scrollTrigger: { trigger: h, start: "top 85%", toggleActions: "play none none none" }, opacity: 0, y: 50, duration: 1, ease: "power3.out" })
    );

    gsap.utils.toArray(".reveal-text").forEach(el => {
        const nodes = Array.from(el.childNodes);
        el.innerHTML = "";
        nodes.forEach(node => {
            if (node.nodeType === 3) {
                node.textContent.split(/(\s+)/).forEach(part => {
                    if (part.trim()) { const w = document.createElement("span"); w.className = "word-wrapper"; const i = document.createElement("span"); i.className = "word"; i.textContent = part; w.appendChild(i); el.appendChild(w); }
                    else el.appendChild(document.createTextNode(part));
                });
            } else if (node.nodeType === 1) {
                const w = document.createElement("span"); w.className = "word-wrapper"; node.classList.add("word"); w.appendChild(node.cloneNode(true)); el.appendChild(w);
            } else el.appendChild(node.cloneNode(true));
        });
        gsap.from(el.querySelectorAll(".word"), { scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" }, yPercent: 100, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.05 });
    });

    gsap.from(".education-card", { scrollTrigger: { trigger: "#education", start: "top 70%" }, opacity: 0, scale: 0.9, duration: 1, ease: "power3.out" });

    ScrollTrigger.batch(".project-card", {
        start: "top 80%",
        onEnter: b => gsap.from(b, { opacity: 0, y: 50, stagger: 0.15, ease: "power3.out", duration: 0.8 })
    });

    ScrollTrigger.batch(".cert-card", {
        start: "top 85%",
        onEnter: b => gsap.from(b, { opacity: 0, y: 40, stagger: 0.1, ease: "power3.out", duration: 0.7 })
    });

    ScrollTrigger.batch(".skill-card", {
        start: "top 88%",
        onEnter: b => {
            gsap.fromTo(b, { opacity: 0, y: 15 }, { opacity: 1, y: 0, stagger: 0.04, duration: 0.5, ease: "power2.out" });
            b.forEach(card => {
                const level = parseInt(card.dataset.level);
                const progressBar = card.querySelector(".skill-progress-bar");
                const percent = card.querySelector(".skill-percentage");
                gsap.to(progressBar, { width: `${level}%`, duration: 1.5, ease: "power3.out", delay: 0.1 });
                gsap.to({ v: 0 }, { v: level, duration: 1.5, delay: 0.1, ease: "power3.out", onUpdate() { percent.textContent = `${Math.round(this.targets()[0].v)}%`; } });
            });
        }
    });

    gsap.from(".contact-content > *", { scrollTrigger: { trigger: "#contact", start: "top 70%" }, opacity: 0, y: 50, duration: 1, stagger: 0.2, ease: "power3.out" });
}

// ─── Podcast Player ───────────────────────────────────────────
function setupPodcastPlayer() {
    const audio = document.getElementById('podcast-audio');
    const podcastBtn = document.getElementById('podcast-btn');
    const playIcon = document.getElementById('podcast-play-icon');
    const audioSource = document.getElementById('podcast-source');
    const miniPlayer = document.getElementById('podcast-mini-player');
    const miniPlayBtn = document.getElementById('mini-play-btn');
    const miniPlayIcon = document.getElementById('mini-play-icon');
    const miniProgressBar = document.getElementById('mini-progress-bar');
    const miniProgressContainer = document.getElementById('mini-progress-container');
    const miniTime = document.getElementById('mini-time');
    const miniCloseBtn = document.getElementById('mini-close-btn');
    const heroSection = document.getElementById('home');
    const languageToggle = document.getElementById('podcast-language-toggle');
    const languageDropdown = document.getElementById('podcast-language-dropdown');
    const langBadge = document.getElementById('podcast-lang-badge');
    const languageOptions = document.querySelectorAll('.podcast-language-option');
    if (!audio || !podcastBtn) return;

    let isPlaying = false, hasStarted = false, currentLanguage = 'en';
    const audioSources = {
        'en': 'assets/Story/Code_Wizard_Java_and_Clean_Architecture.m4a',
        'hi': 'assets/Story/सोचिए,_रात_का_कोड_विज़ार्ड_नया_डेवलपर_ब्लूप्रिंट.m4a',
        'gu': 'assets/Story/એન્જિનિયરિંગ_વિદ્યાર્થી_ધ્રુવિલ_કોડ_વિઝાર્ડ.m4a'
    };
    const flags = { 'en': '🇬🇧', 'hi': '🇮🇳', 'gu': '🇮🇳' };

    function changeLanguage(lang) {
        const wasPlaying = !audio.paused;
        currentLanguage = lang; audioSource.src = audioSources[lang]; audio.load();
        if (langBadge) langBadge.textContent = flags[lang];
        const flagEl = document.getElementById('current-lang-flag');
        if (flagEl) flagEl.textContent = flags[lang];
        languageOptions.forEach(o => o.classList.toggle('active', o.dataset.lang === lang));
        if (wasPlaying) audio.play();
        languageDropdown.classList.remove('show');
    }

    if (languageToggle) languageToggle.addEventListener('click', e => { e.stopPropagation(); languageDropdown.classList.toggle('show'); });
    languageOptions.forEach(opt => opt.addEventListener('click', e => { e.stopPropagation(); if (opt.dataset.lang !== currentLanguage) changeLanguage(opt.dataset.lang); }));
    document.addEventListener('click', () => languageDropdown.classList.remove('show'));

    const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const updatePlayState = playing => { isPlaying = playing; playIcon.className = playing ? 'fas fa-pause' : 'fas fa-play'; podcastBtn.classList.toggle('playing', playing); miniPlayIcon.className = playing ? 'fas fa-pause' : 'fas fa-play'; };
    const togglePlay = () => { if (audio.paused) { audio.play(); hasStarted = true; } else audio.pause(); };

    podcastBtn.addEventListener('click', togglePlay);
    miniPlayBtn.addEventListener('click', togglePlay);
    miniCloseBtn.addEventListener('click', () => { audio.pause(); audio.currentTime = 0; hasStarted = false; miniPlayer.classList.remove('visible'); updatePlayState(false); });
    miniProgressContainer.addEventListener('click', e => { const r = miniProgressContainer.getBoundingClientRect(); audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration; });

    audio.addEventListener('play', () => updatePlayState(true));
    audio.addEventListener('pause', () => updatePlayState(false));
    audio.addEventListener('ended', () => { updatePlayState(false); miniProgressBar.style.width = '0%'; miniTime.textContent = '0:00'; });
    audio.addEventListener('timeupdate', () => { if (audio.duration) { miniProgressBar.style.width = `${(audio.currentTime / audio.duration) * 100}%`; miniTime.textContent = fmtTime(audio.currentTime); } });

    const checkMini = () => { if (!hasStarted) return; const h = heroSection.getBoundingClientRect(); miniPlayer.classList.toggle('visible', h.bottom <= 100 && (isPlaying || audio.currentTime > 0)); };
    window.addEventListener('scroll', () => requestAnimationFrame(checkMini));
}

// ─── Bootstrap ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    renderProjects();
    renderSkills();
    renderCertifications();
    renderAchievements();
    setupSidebar();
    setupContactForm();
    setupThemeToggle();
    setupPodcastPlayer();
});

gsap.registerPlugin(TextPlugin);
initPreloader();
setupNavbarScroll();
setupBackgroundCanvas();
setupCustomCursor();
