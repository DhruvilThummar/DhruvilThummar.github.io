export interface AcademicFoundation {
  role: string;
  institution: string;
  degree: string;
  period: string;
  description: string;
  focus: string[];
  coursework: string[];
}

export interface IndustryReality {
  role: string;
  company: string;
  position: string;
  period: string;
  description: string;
  focus: string[];
}

export interface GuildMember {
  name: string;
  role: string;
  focus: string;
  avatar: string;
  badge: string;
  github?: string;
  linkedin?: string;
}

export interface CommunityAlliance {
  name: string;
  badge: string;
}

export interface Profile {
  name: string;
  fullName: string;
  title: string;
  statusBadge: string;
  bio: string;
  location: string;
  phone: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
  resumeUrl: string;
  academic: AcademicFoundation;
  industry: IndustryReality;
  guildMembers: GuildMember[];
  alliances: CommunityAlliance[];
}

export const profileData: Profile = {
  name: 'D R Thummar',
  fullName: 'Dhruvil Thummar',
  title: 'Software Engineer | Machine Learning, Data Analytics & MERN Stack Developer',
  statusBadge: 'SYSTEM ONLINE: DHRUVIL THUMMAR',
  bio: 'Computer Engineering student specializing in Machine Learning (Scikit-Learn, CatBoost), Data Analytics (Pandas, EDA), and MERN Stack web engineering. IBM-certified in Python for Data Science and EDA for ML. Experienced in architecting 3-tier microservice platforms, predictive modeling pipelines, real-time Socket.io applications, and sub-50ms database query optimizations.',
  location: 'Ahmedabad, Gujarat, India',
  phone: '+91-9265809361',
  email: 'dhruvilthummar1303@gmail.com',
  githubUrl: 'https://github.com/DhruvilThummar',
  linkedinUrl: 'https://www.linkedin.com/in/dhruvil-thummar-54422731a',
  websiteUrl: 'https://drthummar.me/',
  resumeUrl: 'https://drive.google.com/file/d/1nrIPdXnacxYHWfA_fgeNbIMtEeH7bZJs/view',

  academic: {
    role: 'The Scholar',
    institution: 'L.J. University, Ahmedabad',
    degree: 'Bachelor of Technology in Computer Engineering',
    period: '2024 — 2028',
    description: 'Deep core technical foundations in Data Structures & Algorithms, Object-Oriented System Design, Database Architecture, Operating Systems, Computer Networks, and Machine Learning Fundamentals.',
    focus: ['DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'Python for Data Science'],
    coursework: [
      'Data Structures & Algorithms',
      'Database Management Systems (DBMS)',
      'Operating Systems',
      'Computer Networks',
      'Python for Data Science',
    ],
  },

  industry: {
    role: 'The Leader',
    company: 'The Intelliverse',
    position: 'Co-founder, CTO & Full Stack Developer',
    period: 'Jan 2025 — Present',
    description: 'Leading technology vision, software architecture, and engineering teams. Architecting scalable B2B multi-tenant systems, WebSockets telemetry, and AI products.',
    focus: ['CTO Leadership', 'Scalable Architecture', 'Multi-tenant Systems', 'WebSockets Engine'],
  },

  guildMembers: [
    {
      name: 'D R Thummar',
      role: 'Co-founder & CTO',
      focus: 'Engineering Scalable Systems, Technical Vision & Backend Architecture',
      avatar: '/assets/dt-logo-circle.svg',
      badge: 'CTO // LEAD ARCHITECT',
      github: 'https://github.com/DhruvilThummar',
      linkedin: 'https://www.linkedin.com/in/dhruvil-thummar-54422731a',
    },
    {
      name: 'Jal Anghan',
      role: 'Founder & Director',
      focus: 'Visionary Leadership, Business Strategy & Product Growth',
      avatar: '/assets/dt-logo-circle.svg',
      badge: 'FOUNDER // DIRECTOR',
    },
    {
      name: 'Rudra Kankotiya',
      role: 'Co-founder & CMO',
      focus: 'Brand Strategy, Marketing Excellence & User Growth',
      avatar: '/assets/dt-logo-circle.svg',
      badge: 'CO-FOUNDER // CMO',
    },
  ],

  alliances: [
    { name: 'Google Cloud Developer Community', badge: 'MEMBER // GOOGLE CLOUD' },
    { name: 'NVIDIA Developer Program', badge: 'MEMBER // NVIDIA DEV' },
    { name: 'LJU Computer Engineering Network', badge: 'LJU CE // ALUMNI NETWORK' },
  ],
};
