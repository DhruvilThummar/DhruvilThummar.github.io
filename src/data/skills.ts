export interface SkillItem {
  name: string;
  level: number;
  icon: string;
  desc: string;
}

export interface SkillCategory {
  id: string;
  tabName: string;
  title: string;
  icon: string;
  codeSnippet: string;
  skills: SkillItem[];
}

export const skillsCategories: SkillCategory[] = [
  {
    id: 'machine-learning',
    tabName: 'ML_Analytics.py',
    title: 'Machine Learning & Data Analytics',
    icon: 'fa-solid fa-brain',
    codeSnippet: `# Scikit-Learn & Pandas Analytics Pipeline
from sklearn.ensemble import HistGradientBoostingRegressor
import pandas as pd

df = pd.read_csv("commodity_telemetry.csv")
# Trained ensemble models achieving 83.10% accuracy & 0.9131 ROC-AUC`,
    skills: [
      { name: 'Exploratory Data Analysis (EDA)', level: 94, icon: 'devicon-python-plain colored', desc: 'Statistical EDA, feature engineering, data wrangling' },
      { name: 'Scikit-Learn', level: 92, icon: 'devicon-python-plain colored', desc: 'HistGradientBoosting, Random Forest, SVC, Model Pipelines' },
      { name: 'CatBoost ML', level: 90, icon: 'fa-layer-group', desc: 'Wait-time predictors, multi-tenant clinic queue modeling' },
      { name: 'Pandas & NumPy', level: 95, icon: 'devicon-pandas-plain colored', desc: 'Data wrangling, GroupBy transformations, outlier removal' },
      { name: 'Matplotlib', level: 88, icon: 'fa-chart-line', desc: 'Quantitative visualizations, analytics trend charting' },
      { name: 'Web Scraping (BS4)', level: 90, icon: 'fa-spider', desc: 'BeautifulSoup4, Yahoo Finance API, live ETL scrapers' },
    ],
  },
  {
    id: 'mern-webdev',
    tabName: 'MERN_WebDev.tsx',
    title: 'MERN Stack & Full Stack Web Engineering',
    icon: 'fa-brands fa-react',
    codeSnippet: `// Socket.io Real-Time Telemetry & MERN Service
import { io } from 'socket.io-client';

const socket = io('https://appointory.in', {
  transports: ['websocket'],
});
socket.on('queue_update', (data) => console.log('Sync:', data));`,
    skills: [
      { name: 'React.js & Vite', level: 96, icon: 'devicon-react-original colored', desc: 'Custom Hooks, Virtual DOM, Monaco Editor AST integration' },
      { name: 'Node.js & Express.js', level: 94, icon: 'devicon-nodejs-plain colored', desc: '3-tier microservice API gateways, RESTful routing' },
      { name: 'MongoDB', level: 90, icon: 'devicon-mongodb-plain colored', desc: 'BSON collections, aggregation pipelines, encrypted vaults' },
      { name: 'Django & DRF', level: 88, icon: 'devicon-django-plain colored', desc: 'Django REST Framework, ML model serving endpoints' },
      { name: 'Socket.io & WebSockets', level: 92, icon: 'fa-solid fa-plug', desc: 'Sub-10ms real-time event bus & telemetry streaming' },
      { name: 'TypeScript', level: 92, icon: 'devicon-typescript-plain colored', desc: 'Strict typing, AST parsers, Next.js App Router' },
      { name: 'Tailwind CSS', level: 96, icon: 'devicon-tailwindcss-plain colored', desc: 'Glassmorphism, custom tokens, fluid responsive grids' },
    ],
  },
  {
    id: 'languages-core',
    tabName: 'Core_Languages.java',
    title: 'Languages & Core Computer Science',
    icon: 'fa-solid fa-code',
    codeSnippet: `// Core Computer Science Rigor
public class CoreEngine {
    private final String university = "L.J. University (B.Tech CE)";
    private final String[] coreCS = {"DSA", "DBMS", "OOP", "OS", "Networks"};
    
    public void executeSystem() {
        System.out.println("Sub-50ms query speeds & strict OOP architectures.");
    }
}`,
    skills: [
      { name: 'Python', level: 96, icon: 'devicon-python-plain colored', desc: 'Pandas pipelines, Scikit-Learn, Flask APIs, automation' },
      { name: 'Java', level: 92, icon: 'devicon-java-plain colored', desc: 'Enterprise OOP, JDBC, sub-50ms SQL query optimization' },
      { name: 'JavaScript (ES6+)', level: 95, icon: 'devicon-javascript-plain colored', desc: 'Async/await, DOM, AST parsing, event loops' },
      { name: 'SQL (PostgreSQL / MySQL)', level: 90, icon: 'devicon-postgresql-plain colored', desc: 'Relational schemas, indexing, sub-50ms execution plans' },
      { name: 'DSA & DBMS', level: 92, icon: 'fa-diagram-project', desc: 'Algorithmic complexity, tree traversal, database normalization' },
      { name: 'Git & GitHub', level: 94, icon: 'devicon-git-plain colored', desc: 'Version control, feature branching, open-source stewardship' },
    ],
  },
];
