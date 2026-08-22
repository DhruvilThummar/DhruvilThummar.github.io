export interface Telemetry {
  fps: string;
  bundleSize: string;
  rating: string;
  downloads: string;
  latency: string;
}

export interface ProjectMission {
  id: string;
  missionNumber: string;
  title: string;
  subtitle: string;
  problem: string;
  pivot: string;
  solution: string;
  tags: string[];
  githubUrl: string;
  liveUrl: string;
  imageUrl: string;
  featured: boolean;
  telemetry: Telemetry;
  highlights: string[];
}

export const projectsData: ProjectMission[] = [
  {
    id: 'mission-01',
    missionNumber: 'MISSION // 01',
    title: 'AgriPulse AI — Commodity Price Intelligence',
    subtitle: 'Automated 3-tier market valuation & ML predictive pipeline',
    problem: 'Commodity market volatility and lack of predictive valuation models across crop harvests causing financial uncertainty.',
    pivot: 'Architected a 3-tier microservice platform (React SPA, Node.js Gateway, Django ML) predicting commodity valuations across 12 crop types.',
    solution: 'Trained Scikit-Learn ensemble models (HistGradientBoosting, Random Forest, SVC) achieving 83.10% accuracy and 0.9131 ROC-AUC.',
    tags: ['Django', 'Scikit-Learn', 'Node.js', 'React', 'Pandas', 'MongoDB'],
    githubUrl: 'https://github.com/DhruvilThummar/AgriPulse-AI',
    liveUrl: 'https://agricastai.vercel.app/',
    imageUrl: '/assets/dt-logo-og.png',
    featured: true,
    telemetry: {
      fps: '60 FPS',
      bundleSize: '9.8 MB',
      rating: '4.9 ★',
      downloads: '100k+ Samples',
      latency: '< 35ms ML',
    },
    highlights: [
      'Trained Scikit-Learn ensemble models (HistGradientBoosting, Random Forest, SVC) achieving 83.10% accuracy and 0.9131 ROC-AUC.',
      'Integrated live web scrapers (BS4, Yahoo Finance API) and a round-robin load balancer with automated failover.',
      'Built a 100k-sample Pandas analytics & feature engineering pipeline.',
    ],
  },
  {
    id: 'mission-02',
    missionNumber: 'MISSION // 02',
    title: 'Appointory — Healthcare OS & Wait-Time Predictor',
    subtitle: 'B2B hospital discovery aggregator & predictive EMR queue engine',
    problem: 'Patient queue delays, fragmented medical vaults, and inefficient clinic scheduling causing patient frustration.',
    pivot: 'Shifted a complex patient EMR to a streamlined B2B hospital discovery aggregator optimized for hyperlocal discovery.',
    solution: 'Developed a multi-tenant clinic queue management platform featuring a CatBoost Machine Learning wait-time predictor hosted at appointory.in.',
    tags: ['MERN Stack', 'Socket.io', 'CatBoost ML', 'AES-256', 'FHIR'],
    githubUrl: 'https://github.com/DhruvilThummar',
    liveUrl: 'https://appointory.in/',
    imageUrl: '/assets/dt-logo-og.png',
    featured: true,
    telemetry: {
      fps: '60 FPS',
      bundleSize: '14.2 MB',
      rating: '4.9 ★',
      downloads: '50k+ Patients',
      latency: '< 12ms Socket',
    },
    highlights: [
      'Predictive patient queue wait times using CatBoost Machine Learning model.',
      'Synchronized real-time patient queue updates via Socket.io across mobile and clinic display screens with FHIR digital prescriptions.',
      'Implemented secure role-based access control (Doctor, Receptionist, Admin), DLT transactional SMS updates, and AES-256 encrypted health vaults.',
    ],
  },
  {
    id: 'mission-03',
    missionNumber: 'MISSION // 03',
    title: 'Script Converter Studio',
    subtitle: 'Client-side in-browser AST parsing & JSON/TOON code engine',
    problem: 'Converting data formats on server endpoints introduces latency, privacy risks, and bandwidth cost.',
    pivot: 'High-performance client-side execution with zero server latency.',
    solution: 'Architected a high-performance in-browser JSON/TOON code transformation engine with real-time client-side AST data parsing logic.',
    tags: ['React.js', 'TypeScript', 'Vite', 'Monaco Editor', 'AST Parsing'],
    githubUrl: 'https://github.com/DhruvilThummar/Script-Converter-Studio',
    liveUrl: 'https://dhruvilthummar.github.io/Script-Converter-Studio/',
    imageUrl: '/assets/dt-logo-og.png',
    featured: true,
    telemetry: {
      fps: '60 FPS',
      bundleSize: '8.2 MB',
      rating: '5.0 ★',
      downloads: 'Dev Tool',
      latency: '0ms Latency',
    },
    highlights: [
      'High-performance in-browser JSON/TOON code transformation engine with real-time client-side AST data parsing logic.',
      'Embedded Monaco Editor UI to provide live syntax highlighting, error detection, dynamic formatting, and instant static build transformations.',
    ],
  },
  {
    id: 'mission-04',
    missionNumber: 'MISSION // 04',
    title: 'Tourism Management System',
    subtitle: 'High-performance Java OOP booking engine & SQL optimizer',
    problem: 'Legacy booking platforms suffer from sluggish database query response times and unoptimized schema relationships.',
    pivot: 'Strict object-oriented programming architecture with sub-50ms relational database query execution.',
    solution: 'Built a desktop booking engine applying OOP principles (inheritance, interfaces, polymorphism) with dedicated Admin and Customer modules.',
    tags: ['Java', 'JDBC', 'MySQL', 'OOP', 'Query Optimization'],
    githubUrl: 'https://github.com/DhruvilThummar',
    liveUrl: 'https://drthummar.me/',
    imageUrl: '/assets/dt-logo-og.png',
    featured: true,
    telemetry: {
      fps: '60 FPS',
      bundleSize: '6.4 MB',
      rating: '4.8 ★',
      downloads: 'Enterprise',
      latency: '< 50ms SQL',
    },
    highlights: [
      'Built a desktop booking engine applying OOP principles (inheritance, interfaces, polymorphism) with dedicated Admin and Customer modules.',
      'Formulated relational database schemas and optimized SQL query execution plans, achieving sub-50ms query response speeds.',
    ],
  },
  {
    id: 'mission-05',
    missionNumber: 'MISSION // 05',
    title: 'BUS-IQ Dashboard',
    subtitle: 'Real-time public transit telemetry & fleet analytics',
    problem: 'Transit commuters face unpredictable bus arrival times and lack live GPS telemetry access.',
    pivot: 'Real-time public transit telemetry under low-bandwidth cellular conditions.',
    solution: 'Engineered a low-latency WebSockets & Flask architecture with real-time geospatial coordinate mapping for live transit fleet monitoring.',
    tags: ['Flask', 'WebSockets', 'React', 'Geospatial', 'IoT'],
    githubUrl: 'https://github.com/DhruvilThummar',
    liveUrl: 'https://drthummar.me/',
    imageUrl: '/assets/dt-logo-og.png',
    featured: true,
    telemetry: {
      fps: '60 FPS',
      bundleSize: '11.5 MB',
      rating: '4.9 ★',
      downloads: '25k+ Commutes',
      latency: '< 8ms GPS',
    },
    highlights: [
      'Real-time WebSocket event bus pushing sub-10ms bus coordinate updates.',
      'Geospatial route plotting with dynamic delay calculation.',
    ],
  },
];
