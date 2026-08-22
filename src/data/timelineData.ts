export interface GitCommitMilestone {
  hash: string;
  branch: string;
  tag: string;
  date: string;
  title: string;
  category: string;
  type: string;
  author: string;
  message: string;
  diffStats: string;
  description: string;
  techTags: string[];
}

export const gitCommitsData: GitCommitMilestone[] = [
  {
    hash: 'commit c7a91f4',
    branch: 'main',
    tag: 'v2.5-cto-release',
    date: 'Jan 2025 — Present',
    title: 'Co-founder & CTO @ The Intelliverse',
    category: 'Leadership',
    type: 'Merge Request #42',
    author: 'D R Thummar <cto@intelliverse.tech>',
    message: 'feat(core): Co-founded The Intelliverse & assumed CTO role',
    diffStats: '+14,280 lines / -1,120 refactored',
    description: 'Leading overall technology vision, system architecture, and software development pipelines. Driving multi-tenant web platform designs, real-time telemetry infrastructures, and cross-functional engineering teams.',
    techTags: ['System Design', 'CTO Leadership', 'Architecture', 'Full Stack', 'React', 'Node.js'],
  },
  {
    hash: 'commit b8e402a',
    branch: 'release/b2b-discovery',
    tag: 'v2.0-appointory',
    date: 'Oct 2024 — Dec 2024',
    title: 'Architected Appointory B2B Healthcare Platform',
    category: 'Architecture',
    type: 'Merge Request #28',
    author: 'D R Thummar <drthummar@dev>',
    message: 'feat(emr): B2B hospital discovery aggregator & CatBoost wait-time ML',
    diffStats: '+8,420 lines / -640 refactored',
    description: 'Pivot from patient EMR to B2B clinic aggregator. Built CatBoost ML predictive wait-time model, Socket.io multi-device state synchronization, and FHIR encrypted digital vaults.',
    techTags: ['CatBoost ML', 'Socket.io', 'AES-256', 'FHIR', 'MERN Stack'],
  },
  {
    hash: 'commit a4f8b9e',
    branch: 'feature/ast-parser',
    tag: 'v1.8-script-converter',
    date: 'Jul 2024 — Sep 2024',
    title: 'Engineered Script Converter Studio AST Engine',
    category: 'Open Source',
    type: 'Merge Request #19',
    author: 'D R Thummar <drthummar@dev>',
    message: 'feat(ast): Client-side Monaco Editor JSON & TOON conversion engine',
    diffStats: '+5,120 lines / -310 refactored',
    description: 'Designed a 100% client-side Abstract Syntax Tree (AST) compilation engine allowing zero-latency format transformations in Monaco Editor.',
    techTags: ['React', 'TypeScript', 'Monaco Editor', 'AST', 'Vite'],
  },
  {
    hash: 'commit f1d390c',
    branch: 'main',
    tag: 'v1.0-lju-init',
    date: 'Aug 2024 — Present',
    title: 'B.Tech Computer Engineering @ L.J. University',
    category: 'Education',
    type: 'Initial Commit',
    author: 'D R Thummar <student@ljku.edu.in>',
    message: 'init(edu): Commenced Computer Engineering degree at L.J. University',
    diffStats: '+3,200 lines / DSA & Systems Architecture',
    description: 'Building deep theoretical & practical knowledge in Data Structures & Algorithms, Object-Oriented System Design, Database Management Systems, and Software Engineering Principles.',
    techTags: ['Java', 'Python', 'DSA', 'SQL', 'OOP', 'MERN Stack', 'Computer Engineering'],
  },
];
