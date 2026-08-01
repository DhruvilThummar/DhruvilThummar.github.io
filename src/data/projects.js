// ============================================================
// Service: projects-data
// All project entries for the portfolio
// ============================================================

export const projectsData = [
    {
        title: "AgriPulse AI — Commodity Price Intelligence",
        description:
            "A 3-tier microservice platform (React SPA + Node.js Gateway + Django ML) predicting commodity valuations across 12 crop types. Trained ensemble models achieving 83.10% accuracy and 0.9131 ROC-AUC. Integrated live web scrapers and a 100k-sample Pandas analytics pipeline.",
        tags: ["Django", "Scikit-Learn", "Node.js", "React", "Pandas", "MongoDB"],
        githubUrl: "https://github.com/DhruvilThummar/AgriPulse-AI",
        liveUrl: null,
        imageUrl: "https://placehold.co/600x400/000000/00BFFF?text=AgriPulse+AI",
        featured: true,
        features: [
            "Ensemble models (HistGradientBoosting, Random Forest, SVC) with 83.10% price prediction accuracy.",
            "Fully decoupled 3-tier microservices connected via REST API gateway.",
            "Real-time ETL pipeline processing 100k+ data points using Pandas & BeautifulSoup scrapers.",
            "Clean dark-mode analytics dashboard showing crop market volume & prediction graphs."
        ]
    },
    {
        title: "Appointory — Healthcare OS & Wait-Time Predictor",
        description:
            "Multi-tenant clinic queue management platform featuring CatBoost ML wait-time predictor. Real-time Socket.io queue sync, FHIR digital prescriptions, AES-256 encrypted health vaults, and DLT transactional SMS updates.",
        tags: ["MERN Stack", "Socket.io", "CatBoost ML", "AES-256"],
        githubUrl: "https://github.com/DhruvilThummar",
        liveUrl: "https://appointory.in/",
        imageUrl: "https://placehold.co/600x400/000000/00F5D4?text=Appointory",
        featured: true,
        features: [
            "Predictive patient queue wait times using a CatBoost machine learning model.",
            "Instant multi-device state synchronization via WebSockets (Socket.io).",
            "Medical records secured with AES-256 encryption & FHIR compliant digital signatures.",
            "Automated clinic transactional alerts using regulatory DLT SMS endpoints."
        ]
    },
    {
        title: "Script Converter Studio",
        description:
            "High-performance in-browser JSON/TOON transformation engine with real-time client-side AST parsing. Monaco Editor with live syntax highlighting, error detection, and dynamic formatting.",
        tags: ["React", "TypeScript", "Monaco Editor", "Vite", "AST"],
        githubUrl: "https://github.com/DhruvilThummar/Script-Converter-Studio",
        liveUrl: "https://dhruvilthummar.github.io/Script-Converter-Studio/",
        imageUrl: "https://placehold.co/600x400/000000/00BFFF?text=Script+Converter+Studio",
        featured: true,
        features: [
            "In-browser client-side Abstract Syntax Tree (AST) parsing for ultra-fast compilation.",
            "Monaco Editor integration with live syntax validation and code highlighting.",
            "Zero-latency translation from TOON data schemas into standard JSON outputs.",
            "Custom layout adjustment, dynamic format themes, and code copy hooks."
        ]
    },
    {
        title: "Attendify System",
        description:
            "A role-based attendance platform with secure session handling, automated PDF reports, and analytics dashboards.",
        tags: ["Flask", "MySQL", "RBAC"],
        githubUrl: "https://github.com/DhruvilThummar/Attendance-Management-system.git",
        liveUrl: null,
        imageUrl: "https://placehold.co/600x400/000000/00BFFF?text=Attendify+System",
        features: [
            "Role-Based Access Control (RBAC) separating student profiles, teachers, and admins.",
            "Automated PDF exporter generating attendance summaries for classes/departments.",
            "Secure session tokens preventing attendance spoofing and tracking location ranges.",
            "Fast query processing using optimized indexes in MySQL database."
        ]
    },
    {
        title: "BUS-IQ Dashboard",
        description:
            "A real-time bus tracking dashboard with live route updates, optimization logic, and status monitoring.",
        tags: ["Flask", "SQLite", "WebSockets", "JavaScript"],
        githubUrl: "https://github.com/DhruvilThummar/BUS-IQ.git",
        liveUrl: null,
        imageUrl: "https://placehold.co/600x400/000000/00F5D4?text=BUS-IQ+Dashboard",
        features: [
            "Live tracking coordinates shown on map interface using WebSockets protocol.",
            "Intelligent route optimization algorithm advising drivers on shortest congestion-free path.",
            "Automatic ETA notifications updating passengers about schedule deviations.",
            "Lightweight dashboard built on Flask & SQLite, rendering under 150ms on mobile."
        ]
    },
    {
        title: "What's in my Fridge?",
        description:
            "A web app that suggests recipes based on ingredients you have, helping to reduce food waste.",
        tags: ["HTML", "CSS", "JavaScript", "Local Storage"],
        githubUrl: "https://github.com/DhruvilThummar/What-s-in-my-fridge",
        liveUrl: "https://dhruvilthummar.github.io/What-s-In-My-Fridge/",
        imageUrl: "https://placehold.co/600x400/000000/00BFFF?text=FridgeApp",
        features: [
            "Instant recipe suggestions using an internal client-side culinary mapping engine.",
            "User inventory management using standard Local Storage persisting ingredient state.",
            "Step-by-step cooking guides with interactive checkbox progression lists.",
            "Clean layout that looks great on mobile screens for easy reference in the kitchen."
        ]
    },
    {
        title: "Tourism Management System",
        description:
            "Java desktop booking engine with OOP (inheritance, interfaces, polymorphism), Admin/Customer modules, and sub-50ms SQL query execution via optimized schemas.",
        tags: ["Java", "JDBC", "MySQL", "Query Optimization"],
        githubUrl: "https://github.com/DhruvilThummar/Tourism_Management_System",
        liveUrl: null,
        imageUrl: "https://placehold.co/600x400/000000/00F5D4?text=Tourism+System",
        features: [
            "Rigorous Object-Oriented Design (OOP) implementing inheritance, interfaces, & polymorphism.",
            "SQL query times minimized to sub-50ms via indexing and transactional optimization.",
            "Administrative panels handling customer bookings, tour guides, and payment logs.",
            "Secure database connectivity leveraging robust JDBC drivers."
        ]
    },
    {
        title: "Hangman Game",
        description:
            "A console-based Hangman game in Java with multiple difficulty levels and a score tracker, using Java-related words.",
        tags: ["Java"],
        githubUrl: "https://github.com/DhruvilThummar/HangmanGame",
        liveUrl: null,
        imageUrl: "https://placehold.co/600x400/000000/00BFFF?text=Hangman+Game",
        features: [
            "Clean command line interface with dynamic ASCII art transitions.",
            "Configurable difficulty parameters modifying maximum allow guess margins.",
            "Session-based scorecard tracking wins, losses, and consecutive streaks.",
            "Rich built-in vocabulary focused on software engineering and Java concepts."
        ]
    },
    {
        title: "Airline Reservation",
        description:
            "A comprehensive airline reservation system built with Java, allowing users to book, cancel, and manage flight reservations.",
        tags: ["Java"],
        githubUrl: "https://github.com/DhruvilThummar/Airline-Reservation-System",
        liveUrl: null,
        imageUrl: "https://placehold.co/600x400/000000/00F5D4?text=Airline+System",
        features: [
            "Multi-class booking engine supporting economy, business, and first-class seating maps.",
            "Automated reservation code generator generating unique confirmation identifiers.",
            "Cancelation workflows computing applicable refunds according to simulated airline rules.",
            "Comprehensive console interface validating travel criteria and inputs."
        ]
    },
];
