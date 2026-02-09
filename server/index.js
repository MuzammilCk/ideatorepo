import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// -----------------------------------------------------------------------------
// LOGGING UTILITY
// -----------------------------------------------------------------------------
function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  // using process.stdout for standard stream logging
  console.log(JSON.stringify({ timestamp, level, message, ...meta }));
}

// -----------------------------------------------------------------------------
// SECURITY: RATE LIMITER (In-Memory)
// -----------------------------------------------------------------------------
const rateLimits = new Map();
const LIMIT_WINDOW = 60 * 60 * 1000; // 1 Hour
const MAX_REQUESTS = 50; // Per IP per hour

const apiLimiter = (req, res, next) => {
  // Use x-forwarded-for if behind a proxy, else remoteAddress
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = rateLimits.get(ip);

  // Clean up old record or initialize new one
  if (!record || now > record.expiry) {
    rateLimits.set(ip, { count: 1, expiry: now + LIMIT_WINDOW });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    log('WARN', `Rate Limit Exceeded`, { ip });
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again in an hour.' });
  }

  record.count++;
  next();
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api/', apiLimiter); // Apply rate limiting to all API routes

// -----------------------------------------------------------------------------
// UTILITIES: CACHE & SANITIZATION
// -----------------------------------------------------------------------------
const cache = new Map();
const CACHE_TTL_MS = 3600 * 1000; // 1 Hour

function getFromCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setInCache(key, data) {
  if (cache.size > 1000) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

function sanitizeInput(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

function stripFences(str) {
  if (typeof str !== 'string') return "";
  // Removes ```json ... ``` or just ``` ... ```
  // Also handles cases where the model might put text before the block
  const match = str.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  if (match && match[1]) {
    return match[1].trim();
  }
  // Fallback: just remove lines starting with ```
  return str.replace(/^```[\w-]*\n?/gm, '').replace(/\n?```$/gm, '').trim();
}

// -----------------------------------------------------------------------------
// PROMPT ENGINEERING: INTENT ANALYSIS
// -----------------------------------------------------------------------------

function INTENT_ANALYSIS_PROMPT(userIdea) {
  return `You are an expert Product Analyst and Technical Architect specializing in MVP development.

## YOUR TASK
Analyze the following project idea and provide a comprehensive, realistic assessment.

**User's Project Idea:**
"${userIdea}"

## ANALYSIS REQUIREMENTS

### 1. ENTITY EXTRACTION
- **Project Name**: Generate a concise, professional name (2-3 words max)
- **Technologies**: List ONLY technologies explicitly mentioned or strongly implied by the idea
- **Key Nouns**: Extract 3-5 main concepts (e.g., "users", "products", "bookings")
- **Target Users**: Who will use this? Be specific (e.g., "pet owners", "freelancers", "students")

### 2. PROJECT CLASSIFICATION
- **Primary Type**: Choose the SINGLE best fit from: SaaS, E-commerce, Social Network, Content Platform, Marketplace, Dashboard/Analytics, Portfolio/Showcase, Booking/Scheduling, Educational, Other
- **Complexity**: Assess based on:
  - Simple CRUD: Basic database operations, single user type, straightforward UI
  - Moderate Multi-feature: Multiple user types, integrations, moderate business logic
  - Complex Multi-tenant: Advanced permissions, multi-organization, complex workflows
  - Enterprise: Highly scalable, extensive integrations, advanced security

### 3. FEATURE PRIORITIZATION
Categorize features using MoSCoW method:

**Must-Have**: Core features without which the product has no value
- Limit to 3-5 features
- Each should be implementable in a weekend project

**Should-Have**: Important features that significantly enhance value
- Limit to 3-5 features
- These make the MVP competitive

**Nice-to-Have**: Features for future iterations
- Limit to 2-4 features
- These can be added after launch

### 4. REQUIREMENT CLARIFICATION
Based on the idea, make EDUCATED INFERENCES:

- **Target Audience**: B2B (businesses), B2C (consumers), Internal Tool, Developer Tool, or Mixed
- **Expected Scale**: 
  - Small: <1000 users, single region
  - Medium: 1k-100k users, multi-region
  - Large: 100k+ users, global
- **Monetization**: What makes most sense for this idea?
- **Timeline**: Realistic estimate for a WORKING MVP

### 5. FEASIBILITY ASSESSMENT
Provide an honest evaluation:

- **Score** (0-10): 
  - 8-10: Can be built this weekend
  - 6-8: 2-week realistic timeline
  - 4-6: Ambitious but doable in a month
  - 0-4: Needs significant scope reduction

- **Status**: Be realistic, not discouraging
- **Concerns**: Technical or scope challenges (max 3)
- **Recommendations**: Actionable advice to improve feasibility (max 4)
- **Scope Reduction**: If score < 7, suggest what to remove/simplify

### 6. SEARCH STRATEGIES
Generate 3-5 GitHub search queries to find relevant repositories:
- Query 1: Main technology + project type
- Query 2: Specific feature + common implementation
- Query 3: Alternative approach or framework
- Query 4-5: Related patterns or architectures

## CRITICAL RULES (PREVENT HALLUCINATION)
1. ✅ Base everything on the user's actual input
2. ❌ Do NOT invent features not mentioned or implied
3. ✅ If uncertain, choose the simpler/more common option
4. ❌ Do NOT suggest bleeding-edge or experimental tech
5. ✅ Prioritize proven, well-documented solutions
6. ❌ Do NOT over-complicate for the sake of completeness
7. ✅ If the idea is vague, make CONSERVATIVE assumptions
8. ❌ Do NOT add enterprise features to simple ideas

## OUTPUT FORMAT
Return ONLY valid JSON. CRITICAL: The searchStrategies field is REQUIRED and must be an array of 3-5 GitHub search query strings.`;
}

// -----------------------------------------------------------------------------
// PROMPT ENGINEERING: DEEP PATTERN MINING
// -----------------------------------------------------------------------------

function DEEP_PATTERN_ANALYSIS_PROMPT(userIdea, repos) {
  return `You are a Senior Software Architect with 15+ years of experience analyzing GitHub repositories and extracting architectural patterns.

## YOUR TASK
Analyze the following ${repos.length} repositories to extract deep technical patterns that would help build: "${userIdea}"

## REPOSITORIES TO ANALYZE
${JSON.stringify(repos, null, 2)}

## ANALYSIS FRAMEWORK

### 1. FOLDER STRUCTURE PATTERNS
Look at the repo names, topics, and languages to infer common structures:
- Identify if repos likely use "Standard React" (src/components, src/pages), "Feature-based" (features/auth, features/dashboard), "Atomic Design" (atoms/molecules/organisms), etc.
- Recommend 5-8 essential folders with their purposes
- Mark which folders are REQUIRED vs optional

**RULE**: Base this on the repos' tech stack and type. Don't invent exotic structures.

### 2. DEPENDENCY PATTERNS
From the repos' languages and topics, identify:
- **Core Dependencies**: Libraries that would appear in 80%+ of similar projects
  - For React: react, react-dom, typescript, tailwindcss (if styling mentioned)
  - For Next.js: next, react, react-dom
  - For Express: express, dotenv, cors
- **Paired Packages**: Libraries that work together
  - Example: React Query + axios, Supabase + @supabase/supabase-js
- **Avoid Patterns**: Known incompatibilities or deprecated packages

**RULE**: Only suggest packages with 1M+ weekly NPM downloads OR explicitly mentioned in repo topics.

### 3. AUTHENTICATION PATTERNS
Based on repo topics and descriptions:
- If "firebase" in topics → Firebase Auth
- If "supabase" in topics → Supabase Auth  
- If "oauth" or "auth0" → OAuth 2.0
- If "jwt" → JWT tokens
- Default for simple apps → Session-based or Supabase

**Provide**:
- Most common approach among these repos
- 2-3 implementation examples with pros/cons
- A clear recommendation for "${userIdea}"

**RULE**: Never recommend enterprise solutions (Okta, Azure AD) for MVP projects.

### 4. STATE MANAGEMENT PATTERNS
Analyze complexity:
- **Simple CRUD** → Context API or Zustand
- **Real-time features** → Zustand + WebSockets or Supabase Realtime
- **Complex forms** → React Hook Form + Zustand
- **Large-scale** → Redux Toolkit or Jotai

**RULE**: Default to simpler solutions. Only suggest Redux if complexity justifies it.

### 5. API PATTERNS
Infer from repo characteristics:
- **REST**: Default for most CRUD apps
- **GraphQL**: If repos mention "graphql", "apollo", or need complex queries
- **tRPC**: If repos are TypeScript-heavy and mention "trpc"
- **Data Fetching**: 
  - React Query (most flexible)
  - SWR (simpler, Next.js native)
  - RTK Query (if using Redux)

**RULE**: Recommend REST + React Query for 90% of MVPs.

### 6. ARCHITECTURAL PATTERNS
Identify from repo structures:
- **MVC**: Model-View-Controller
- **Layered**: Presentation → Business → Data
- **Component-based**: React component tree
- **Feature-sliced**: Organized by features
- **Clean Architecture**: Domain-driven design

**RULE**: For MVPs, recommend simple layered or component-based. Avoid over-engineering.

### 7. SECURITY IMPLEMENTATIONS
Common practices:
- **Authentication**: Token storage (httpOnly cookies vs localStorage)
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod, Yup, or Joi
- **HTTPS**: Always required
- **Environment Variables**: .env files
- **CORS**: Properly configured

**Critical Must-Haves**:
- Secure token storage
- Input validation
- Environment variable management
- SQL injection prevention (use ORMs)

**RULE**: Don't hallucinate security tools. Stick to common ones.

### 8. SCALABILITY APPROACHES
For MVPs, focus on:
- **Code Splitting**: React.lazy() for route-based splitting
- **Caching**: React Query or SWR for API caching
- **Database Indexing**: Essential fields only
- **CDN**: For static assets (automatic with Vercel/Netlify)
- **Load Balancing**: NOT needed for MVP

**Applicability Levels**:
- MVP: Code splitting, API caching, basic indexing
- Growth: Database replication, Redis cache
- Enterprise: Microservices, Kubernetes

**RULE**: Only recommend MVP-appropriate strategies. Mark growth/enterprise strategies as "future".

### 9. SYNTHESIS & RECOMMENDATIONS
Combine all findings:
- **Ideal Stack**: Frontend (3-5 items), Backend (2-4), Database (1-2), Tooling (3-5)
- **Key Takeaways**: 4-6 actionable insights
- **Anti-Patterns**: 2-3 things to avoid
- **Confidence Score**: 
  - 8-10: Repos are highly relevant, clear patterns
  - 6-8: Some patterns clear, some inferred
  - 4-6: Limited data, more assumptions
  - 0-4: Repos not very relevant

## CRITICAL RULES (PREVENT HALLUCINATION)
1. ✅ Only analyze patterns visible in the provided repo data
2. ❌ Do NOT invent packages, libraries, or tools not commonly used
3. ✅ When uncertain, default to industry-standard choices
4. ❌ Do NOT recommend bleeding-edge or experimental tech
5. ✅ Prioritize simplicity for MVPs
6. ❌ Do NOT suggest enterprise patterns for simple projects
7. ✅ If repos lack info, make CONSERVATIVE inferences
8. ❌ Do NOT claim certainty where you're guessing

## CONSTRAINTS
- Maximum 8 core dependencies
- Maximum 6 architectural patterns
- Maximum 5 security practices
- Keep all explanations under 100 words each

## OUTPUT FORMAT
Return ONLY valid JSON matching the schema. No markdown, no preamble, no explanations outside JSON.

If the repos provide insufficient data, return lower confidence scores and mark findings as "inferred" in the notes field.`;
}

// -----------------------------------------------------------------------------
// PROMPT ENGINEERING: ENHANCED ARCHITECTURE SYNTHESIS
// -----------------------------------------------------------------------------

function ENHANCED_ARCHITECTURE_PROMPT(idea, intentAnalysis, deepPatterns, basicAnalysis) {
  const context = {
    idea,
    projectType: intentAnalysis?.classification?.primaryType || 'Unknown',
    complexity: intentAnalysis?.classification?.complexity || 'Moderate Multi-feature',
    mustHaveFeatures: intentAnalysis?.features?.mustHave || [],
    targetAudience: intentAnalysis?.clarification?.targetAudience || 'B2C',
    timeline: intentAnalysis?.clarification?.timeline || '2-weeks',
    recommendedStack: deepPatterns?.synthesis?.idealStack || {},
    authRecommendation: deepPatterns?.authentication?.recommendation || 'Supabase',
    stateRecommendation: deepPatterns?.stateManagement?.bestFit || 'Context API',
    apiRecommendation: deepPatterns?.apiPatterns?.recommendation || 'REST + React Query'
  };

  return `You are a Principal Software Architect with expertise in designing production-ready full-stack applications.

## YOUR MISSION
Design a COMPLETE, PRODUCTION-READY architecture for: "${idea}"

## CONTEXT FROM PREVIOUS ANALYSIS
${JSON.stringify(context, null, 2)}

## ARCHITECTURE REQUIREMENTS

### 1. PROJECT METADATA
- **projectName**: Generate a professional name (2-4 words, TitleCase)
- **description**: One-sentence value proposition (max 150 chars)

### 2. TECH STACK
Based on the recommendations:
- **framework**: ${context.recommendedStack.frontend?.[0] || 'React'}
- **language**: TypeScript (always for type safety)
- **styling**: ${context.recommendedStack.frontend?.includes('Tailwind') ? 'Tailwind CSS' : 'Tailwind CSS'}
- **icons**: Lucide React
- **stateManagement**: ${context.stateRecommendation}
- **dataFetching**: ${context.apiRecommendation.split(' ')[0]}
- **routing**: React Router DOM

### 3. FOLDER STRUCTURE (8-12 folders)
Create a REALISTIC structure:
\`\`\`
src/
├── components/       (Reusable UI components)
├── pages/           (Route-level components)
├── features/        (Feature-specific modules - ONLY if complex)
├── lib/             (Utilities, helpers, API clients)
├── hooks/           (Custom React hooks)
├── contexts/        (React Context providers)
├── types/           (TypeScript interfaces)
├── styles/          (Global CSS, Tailwind config)
└── assets/          (Images, fonts, static files)
\`\`\`

For each folder:
- **name**: Folder name
- **type**: "folder"
- **purpose**: Why it exists (1 sentence)
- **children**: 2-3 example files (optional)

**RULES**: Keep it simple for ${context.timeline}. Don't create folders for single files.

### 4. PAGES (4-8 pages)
Create pages based on must-have features: ${context.mustHaveFeatures.map(f => f.name).join(', ')}

For EACH page:
- **name**: Component name (PascalCase, e.g., "HomePage")
- **route**: URL path (e.g., "/", "/login")
- **description**: What the page does (1 sentence)
- **imports**: Key components it uses (3-5 max)
- **isProtected**: true if requires authentication
- **lazyLoad**: true for heavy pages

### 5. COMPONENTS (8-15 components)
Categories: layout, form, display, navigation, feedback, utility

For EACH component:
- **name**: Component name (PascalCase)
- **description**: Purpose (1 sentence)
- **isAtomic**: true if small/reusable, false if complex
- **category**: One of the categories above
- **props**: 2-4 key props with {name, type, required}

### 6. DATABASE SCHEMA (3-6 tables)
For EACH table:
- **table**: Lowercase, plural (e.g., "users", "posts")
- **columns**: Always include id (uuid, primary), created_at, updated_at. Add 4-8 domain columns
- **relationships**: Define foreign keys and types

### 7. API ENDPOINTS (6-12 endpoints)
Design RESTful endpoints:

Patterns:
- GET /api/resource → List all
- GET /api/resource/:id → Get one
- POST /api/resource → Create
- PUT /api/resource/:id → Update
- DELETE /api/resource/:id → Delete

For EACH endpoint:
- **path**: API path (e.g., "/api/users")
- **method**: HTTP verb
- **purpose**: What it does (1 sentence)
- **authentication**: true if requires auth token
- **requestSchema**: {body: [], params: [], query: []}
- **responseSchema**: {success: "shape", error: "shape"}

### 8. STATE MANAGEMENT STRATEGY
Choose based on complexity:
- Simple (CRUD): Context API
- Moderate (real-time): Zustand
- Complex (large state): Redux Toolkit

Provide:
- **approach**: Library name
- **globalStores**: 2-4 stores with {name, purpose, stateShape}
- **localStateComponents**: 4-6 components using useState
- **rationale**: Why this approach (2 sentences)

### 9. AUTHENTICATION FLOW
Design based on: ${context.authRecommendation}

Provide:
- **provider**: Supabase | Firebase | Auth0 | NextAuth | Custom JWT | Clerk | None
- **flows**: 2-4 flows (email-password, oauth-google, oauth-github, magic-link, phone, password-reset)
- **protectedRoutes**: Routes requiring auth
- **publicRoutes**: Public routes
- **tokenStorage**: httpOnly-cookie | localStorage | sessionStorage | memory
- **sessionDuration**: e.g., "7 days"

### 10. DATA FLOW ARCHITECTURE
Provide:
- **pattern**: Unidirectional | Bidirectional | Event-driven
- **layers**: 
  - presentation: [Page components, UI components] (5-8 items)
  - business: [Custom hooks, services] (3-6 items)
  - data: [API client, stores] (2-4 items)
- **communicationFlow**: Describe how data moves (2-3 sentences)

### 11. PERFORMANCE OPTIMIZATIONS
Provide:
- **codeSplitting**: true (always)
- **lazyLoading**: {routes: [], components: []}
- **caching**: {strategy: "React Query", cachedEndpoints: [], staleTime: "5 minutes", cacheTime: "30 minutes"}
- **imageOptimization**: true if using images
- **bundleOptimization**: ["Tree shaking", "Minification", "Compression"]

### 12. COMPONENT RELATIONSHIP GRAPH
Map dependencies:

**nodes**: Every component, page, hook, context (12-20 nodes)
- {id: "page-home", name: "HomePage", type: "page"}

**edges**: How they connect (15-30 edges)
- {from: "page-home", to: "component-header", relationship: "renders"}

Relationships: imports | renders | wraps | consumes | provides

## CRITICAL ANTI-HALLUCINATION RULES

1. ✅ Base EVERYTHING on the provided context
2. ❌ Do NOT invent exotic patterns or unproven libraries
3. ✅ Use ONLY technologies with >1M weekly NPM downloads
4. ❌ Do NOT over-engineer for ${context.timeline}
5. ✅ Keep component count under 15, pages under 8
6. ❌ Do NOT create more than 6 database tables for MVP
7. ✅ Prioritize SIMPLICITY over completeness
8. ❌ Do NOT suggest microservices or complex architectures
9. ✅ All authentication should use proven providers
10. ❌ Do NOT create custom auth systems

## CONSTRAINTS
- Timeline: ${context.timeline}
- Complexity: ${context.complexity}
- Target: ${context.targetAudience}
- Must-have features: ${context.mustHaveFeatures.length}

Return ONLY valid JSON matching the schema. No markdown, no explanations.`;
}

// -----------------------------------------------------------------------------
// UTILITIES: VECTOR MATH
// -----------------------------------------------------------------------------
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// -----------------------------------------------------------------------------
// AI CLIENT INITIALIZATION
// -----------------------------------------------------------------------------
let ai;
let Type;

(async () => {
  try {
    const genai = await import('@google/genai');
    const GoogleGenAI = genai.GoogleGenAI;
    Type = genai.Type;

    if (process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      log('INFO', 'AI CORE: ONLINE');
    } else {
      log('WARN', 'AI CORE: OFFLINE (Missing API Key)');
    }
  } catch (err) {
    log('ERROR', 'AI CORE: FAILED TO LOAD SDK', { error: err.message });
  }
})();

async function getEmbedding(text) {
  if (!ai) return null;

  const safeText = text.slice(0, 2048);
  const cacheKey = `EMBED:${safeText}`;

  const cachedVector = getFromCache(cacheKey);
  if (cachedVector) return cachedVector;

  try {
    const result = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: safeText
    });
    const vector = result.embedding.values;
    setInCache(cacheKey, vector);
    return vector;
  } catch (error) {
    log('ERROR', 'Embedding Generation Error', { error: error.message });
    return null;
  }
}

// -----------------------------------------------------------------------------
// AI CODE GENERATORS (Phase 4)
// -----------------------------------------------------------------------------

async function generateReactComponent(component, arch) {
  if (!ai) return `// AI Unavailable\nexport const ${component.name} = () => <div>${component.name}</div>;`;

  try {
    const prompt = `
      You are an expert React Native/Web developer.
      Write a React Functional Component named "${component.name}".
      
      Context:
      - Project: ${arch.projectName}
      - Tech Stack: React, TypeScript, Tailwind CSS, Lucide React icons.
      - Component Description: ${component.description}
      - Type: ${component.isAtomic ? 'Atomic/UI Component' : 'Complex Component'}
      
      Requirements:
      1. Use 'lucide-react' for icons if needed.
      2. Use Tailwind CSS for styling.
      3. Export as a named export: "export const ${component.name} = ..."
      4. Include proper TypeScript interfaces for props.
      5. Return ONLY the code, no markdown explanations.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });

    return stripFences(response.text);
  } catch (e) {
    log('WARN', `Failed to generate component ${component.name}`, { error: e.message });
    return `// Generation Failed for ${component.name}\nexport const ${component.name} = () => <div className="p-4 border border-red-500">Component Error</div>;`;
  }
}

async function generateReactPage(page, arch) {
  if (!ai) return `// AI Unavailable\nexport default function ${page.name}() { return <div>${page.name}</div>; }`;

  try {
    const prompt = `
      You are an expert React developer.
      Write a React Page Component named "${page.name}".
      
      Context:
      - Project: ${arch.projectName}
      - Route: ${page.route}
      - Description: ${page.description}
      - Expected Imports: ${JSON.stringify(page.imports)}
      
      Requirements:
      1. Use a responsive layout with Tailwind CSS.
      2. Mock the imported components if they are not standard libraries (e.g. assume they exist in '../components/').
      3. Use 'lucide-react' for icons.
      4. Export as default: "export default function ${page.name} ..."
      5. Return ONLY the code.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });

    return stripFences(response.text);
  } catch (e) {
    log('WARN', `Failed to generate page ${page.name}`, { error: e.message });
    return `// Generation Failed for ${page.name}\nexport default function ${page.name}() { return <div>Page Error</div>; }`;
  }
}

async function generateAppRouter(pages, arch) {
  if (!ai) return `export default function App() { return <div>App</div> }`;

  try {
    const prompt = `
      Generate the main App.tsx file for a React application using react-router-dom.
      
      Pages to route:
      ${JSON.stringify(pages.map(p => ({ name: p.name, route: p.route })))}
      
      Requirements:
      1. Import standard React hooks.
      2. Import specific pages from './pages/PageName'.
      3. Wrap with <BrowserRouter> (actually, usually App is wrapped in main.tsx, so just use <Routes> and <Route> here assuming Router is in main or App wraps it. Let's assume App returns the Router).
      4. Return the full App component code using 'react-router-dom'.
      5. Add a simple navigation layout or Sidebar if appropriate for "${arch.projectName}".
      6. Return ONLY the code.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });

    return stripFences(response.text);
  } catch (e) {
    return `export default function App() { return <div>App Router Error</div> }`;
  }
}

// -----------------------------------------------------------------------------
// TEMPLATES (Static Generators)
// -----------------------------------------------------------------------------
const generatePackageJson = (arch) => {
  const deps = {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.344.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "@supabase/supabase-js": "^2.39.7",
    "react-router-dom": "^6.22.3"
  };

  const devDeps = {
    "@types/react": "^18.2.64",
    "@types/react-dom": "^18.2.21",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.4"
  };

  return JSON.stringify({
    name: arch.projectName.toLowerCase().replace(/\s+/g, '-'),
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      "dev": "vite",
      "build": "tsc && vite build",
      "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
      "preview": "vite preview"
    },
    dependencies: deps,
    devDependencies: devDeps
  }, null, 2);
};

const generateViteConfig = () => `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})`;

const generateTsConfig = () => JSON.stringify({
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}, null, 2);

const generateTsConfigNode = () => JSON.stringify({
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}, null, 2);

const generateTailwindConfig = () => `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

const generatePostCssConfig = () => `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

const generateIndexHtml = (arch) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${arch.projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

const generateGitIgnore = () => `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs
*.njsproj
*.sln
*.sw?`;

const generateEnvExample = () => `VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
`;

// -----------------------------------------------------------------------------
// SECURITY: STARTUP VALIDATION
// -----------------------------------------------------------------------------
// Only force Gemini Key to be present. GitHub token can be supplied by client.
const requiredEnvVars = ['GEMINI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

if (!process.env.GITHUB_TOKEN) {
  log('WARN', 'Startup: GITHUB_TOKEN not found in environment. Users must provide it via UI.');
}

// -----------------------------------------------------------------------------
// ROUTES
// -----------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    mode: process.env.NODE_ENV || 'production',
    system: 'IdeaToRepo Backend',
    timestamp: new Date().toISOString()
  });
});

// --- GitHub Proxy (GraphQL) ---
app.post('/api/search', async (req, res) => {
  const { queries, token: clientToken } = req.body;

  log('INFO', 'Search Request', { queries });

  if (!queries || !Array.isArray(queries)) {
    return res.status(400).json({ error: 'Invalid input: queries array required' });
  }

  // Determine token: Client provided > Environment Variable
  const token = clientToken || process.env.GITHUB_TOKEN;

  if (!token) {
    log('WARN', 'Search failed: No GitHub token provided.');
    return res.status(401).json({ error: 'Missing GitHub Access Token. Please provide it in the UI or set GITHUB_TOKEN on server.' });
  }

  const cacheKey = `SEARCH_GQL:${JSON.stringify(queries.slice().sort())}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    res.set('X-Cache', 'HIT');
    return res.json(cachedData);
  }

  const headers = {
    'Authorization': `bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'IdeaToRepo-Server'
  };

  const GRAPHQL_QUERY = `
    query($searchQuery: String!) {
      search(query: $searchQuery, type: REPOSITORY, first: 10) {
        nodes {
          ... on Repository {
            databaseId
            name
            nameWithOwner
            description
            stargazerCount
            url
            primaryLanguage {
              name
            }
            owner {
              login
              avatarUrl
            }
            repositoryTopics(first: 3) {
              nodes {
                topic {
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const fetchPromises = queries.map(async (q) => {
      const cleanQuery = `${sanitizeInput(q)} sort:stars`;
      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: GRAPHQL_QUERY,
          variables: { searchQuery: cleanQuery }
        })
      });

      if (response.status === 401) {
        throw new Error('AUTH_ERROR');
      }

      if (response.status === 403 || response.status === 429) {
        throw new Error('RATE_LIMIT');
      }

      if (!response.ok) {
        log('WARN', 'GitHub Query Failed', { query: cleanQuery, status: response.status });
        return [];
      }

      const json = await response.json();
      if (json.errors) {
        const isRateLimit = json.errors.some(e => e.type === 'RATE_LIMITED');
        const isAuthError = json.errors.some(e => e.type === 'NOT_FOUND' || e.message.includes('Bad credentials'));

        if (isRateLimit) throw new Error('RATE_LIMIT');
        if (isAuthError) throw new Error('AUTH_ERROR');

        log('WARN', 'GitHub GraphQL Error', { error: json.errors[0].message });
        return [];
      }

      return json.data?.search?.nodes || [];
    });

    const results = await Promise.all(fetchPromises);
    const allItems = results.flat();

    const mappedRepos = allItems.map(item => {
      if (!item) return null;
      return {
        id: item.databaseId,
        name: item.name,
        full_name: item.nameWithOwner,
        description: item.description || 'No description available.',
        stargazers_count: item.stargazerCount,
        language: item.primaryLanguage?.name || 'N/A',
        html_url: item.url,
        owner: {
          login: item.owner?.login || 'Unknown',
          avatar_url: item.owner?.avatarUrl || ''
        },
        topics: item.repositoryTopics?.nodes?.map(n => n.topic.name) || []
      };
    }).filter(repo => repo !== null);

    const uniqueReposMap = new Map();
    for (const repo of mappedRepos) {
      if (!uniqueReposMap.has(repo.html_url)) {
        uniqueReposMap.set(repo.html_url, repo);
      }
    }

    const finalResults = Array.from(uniqueReposMap.values());

    setInCache(cacheKey, finalResults);
    res.set('X-Cache', 'MISS');
    res.json(finalResults);

  } catch (error) {
    if (error.message === 'RATE_LIMIT') {
      log('WARN', 'GitHub API Rate Limit Hit');
      return res.status(429).json({ error: 'RATE_LIMIT' });
    }
    if (error.message === 'AUTH_ERROR') {
      log('WARN', 'GitHub Auth Failed (Bad Credentials)');
      return res.status(401).json({ error: 'GitHub Token Invalid' });
    }
    log('ERROR', 'Search Failed', { error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Gemini AI Endpoints ---

// -----------------------------------------------------------------------------
// PHASE 1: INTENT UNDERSTANDING & VALIDATION
// -----------------------------------------------------------------------------

app.post('/api/intent-analysis', async (req, res) => {
  if (!ai) return res.status(503).json({ error: 'AI Service Unavailable' });

  const idea = sanitizeInput(req.body.idea, 1000); // Increased limit for detailed input
  log('INFO', 'Intent Analysis Request', { idea });

  const cacheKey = `INTENT:${idea}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    res.set('X-Cache', 'HIT');
    return res.json(cachedData);
  }

  const model = "gemini-2.0-flash";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: INTENT_ANALYSIS_PROMPT(idea),
      config: {
        responseMimeType: "application/json",
      }
    });
    const text = stripFences(response.text || "{}");
    const result = JSON.parse(text);

    setInCache(cacheKey, result);
    res.set('X-Cache', 'MISS');
    res.json(result);


  } catch (error) {
    // Print to console for immediate visibility
    console.error('\n❌ INTENT ANALYSIS ERROR:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Full error:', error);

    log('ERROR', 'Intent Analysis Failed', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      idea: idea.substring(0, 100)
    });
    res.status(500).json({
      error: 'AI Generation Failed',
      details: error.message,
      type: error.name
    });
  }
});

// Layer 1: Strategy
app.post('/api/strategy', async (req, res) => {
  if (!ai) return res.status(503).json({ error: 'AI Service Unavailable' });

  const idea = sanitizeInput(req.body.idea);
  log('INFO', 'Strategy Request', { idea });

  const cacheKey = `STRATEGY:${idea}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    res.set('X-Cache', 'HIT');
    return res.json(cachedData);
  }

  const model = "gemini-2.0-flash";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `You are a GitHub Search Expert. For the project idea "${idea}", generate 3 distinct search queries. Return ONLY a raw JSON object: { "queries": ["q1", "q2", "q3"] }`,
      config: {
        responseMimeType: "application/json",
      }
    });
    const text = stripFences(response.text || "{}");
    const result = JSON.parse(text);

    setInCache(cacheKey, result);
    res.set('X-Cache', 'MISS');
    res.json(result);
  } catch (error) {
    log('ERROR', 'Strategy AI Failed', { error: error.message });
    res.status(500).json({ error: 'AI Generation Failed' });
  }
});

// -----------------------------------------------------------------------------
// PHASE 2.4: DEEP PATTERN MINING
// -----------------------------------------------------------------------------

app.post('/api/deep-analysis', async (req, res) => {
  if (!ai) return res.status(503).json({ error: 'AI Service Unavailable' });

  const { repos, userIdea } = req.body;

  if (!repos || !Array.isArray(repos) || repos.length === 0) {
    return res.status(400).json({ error: 'Valid repos array required' });
  }

  log('INFO', 'Deep Pattern Mining Request', {
    repoCount: repos.length,
    idea: userIdea
  });

  // Create cache key from repo names (stable identifier)
  const repoSignature = repos.map(r => r.name).sort().join('-');
  const cacheKey = `DEEP_PATTERN:${repoSignature}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    res.set('X-Cache', 'HIT');
    return res.json(cachedData);
  }

  // Simplify repo data for analysis (reduce token usage)
  const simplifiedRepos = repos.map(r => ({
    name: r.name,
    description: r.description || 'No description',
    language: r.language || 'Unknown',
    topics: r.topics || [],
    stars: r.stargazers_count || 0,
    url: r.html_url
  }));

  const model = "gemini-2.0-flash";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: DEEP_PATTERN_ANALYSIS_PROMPT(userIdea, simplifiedRepos),
      config: {
        responseMimeType: "application/json",
      }
    });
    const text = stripFences(response.text || "{}");
    const result = JSON.parse(text);

    setInCache(cacheKey, result);
    res.set('X-Cache', 'MISS');
    res.json(result);

  } catch (error) {
    log('ERROR', 'Deep Pattern Analysis Failed', { error: error.message });
    res.status(500).json({ error: 'AI Generation Failed' });
  }
});

// -----------------------------------------------------------------------------
// PHASE 3: ENHANCED ARCHITECTURE SYNTHESIS
// -----------------------------------------------------------------------------

app.post('/api/enhanced-architecture', async (req, res) => {
  if (!ai) return res.status(503).json({ error: 'AI Service Unavailable' });

  const { idea, intentAnalysis, deepPatterns, basicAnalysis } = req.body;

  if (!idea) {
    return res.status(400).json({ error: 'User idea required' });
  }

  log('INFO', 'Enhanced Architecture Request', { idea });

  // Create comprehensive cache key
  const contextHash = JSON.stringify({
    idea,
    intent: intentAnalysis?.classification?.primaryType,
    patterns: deepPatterns?.synthesis?.idealStack
  });
  const cacheKey = `ENHANCED_ARCH:${Buffer.from(contextHash).toString('base64').slice(0, 50)}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    res.set('X-Cache', 'HIT');
    return res.json(cachedData);
  }

  const model = "gemini-2.0-flash";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: ENHANCED_ARCHITECTURE_PROMPT(idea, intentAnalysis, deepPatterns, basicAnalysis) + `

CRITICAL: Return ONLY valid JSON matching this EXACT structure (no markdown, no code fences). Do not include any explanations, only the JSON:
{
  "projectName": "string",
  "description": "string",
  "techStack": {
    "framework": "string",
    "language": "string",
    "styling": "string",
    "icons": "string",
    "stateManagement": "string",
    "dataFetching": "string",
    "routing": "string"
  },
  "folderStructure": [
    {
      "name": "string",
      "type": "folder|file",
      "purpose": "string",
      "children": [{ "name": "string", "type": "file" }]
    }
  ],
  "pages": [
    { "name": "string", "route": "string", "description": "string", "imports": ["string"], "isProtected": boolean, "lazyLoad": boolean }
  ],
  "components": [
    { "name": "string", "description": "string", "isAtomic": boolean, "category": "layout|form|display|navigation|feedback|utility", "props": [{ "name": "string", "type": "string", "required": boolean }] }
  ],
  "databaseSchema": [
    {
      "table": "string",
      "columns": [{ "name": "string", "type": "string", "isPrimary": boolean, "isRequired": boolean }],
      "relationships": [{ "type": "one-to-many|many-to-one|many-to-many", "table": "string", "foreignKey": "string" }]
    }
  ],
  "apiEndpoints": [
    {
      "path": "string",
      "method": "GET|POST|PUT|PATCH|DELETE",
      "purpose": "string",
      "authentication": boolean,
      "requestSchema": { "body": ["string"], "params": ["string"], "query": ["string"] },
      "responseSchema": { "success": "string", "error": "string" }
    }
  ],
  "stateManagement": {
    "approach": "string",
    "globalStores": [{ "name": "string", "purpose": "string", "stateShape": ["string"] }],
    "localStateComponents": ["string"],
    "rationale": "string"
  },
  "authentication": {
    "provider": "string",
    "flows": ["string"],
    "protectedRoutes": ["string"],
    "publicRoutes": ["string"],
    "tokenStorage": "httpOnly-cookie|localStorage|sessionStorage|memory",
    "sessionDuration": "string"
  },
  "performance": {
    "codeSplitting": boolean,
    "lazyLoading": { "routes": ["string"], "components": ["string"] },
    "caching": { "strategy": "React Query|SWR|RTK Query|Manual|None", "cachedEndpoints": ["string"], "staleTime": "string", "cacheTime": "string" },
    "imageOptimization": boolean,
    "bundleOptimization": ["string"]
  },
  "dataFlow": {
    "pattern": "Unidirectional|Bidirectional|Event-driven",
    "layers": { "presentation": ["string"], "business": ["string"], "data": ["string"] },
    "communicationFlow": "string"
  },
  "componentGraph": {
    "nodes": [{ "id": "string", "name": "string", "type": "page|layout|component|utility|hook|context" }],
    "edges": [{ "from": "string", "to": "string", "relationship": "imports|renders|wraps|consumes|provides" }]
  }
}`,
      config: {
        responseMimeType: "application/json",
      }
    });
    const text = stripFences(response.text || "{}");
    const result = JSON.parse(text);

    setInCache(cacheKey, result);
    res.set('X-Cache', 'MISS');
    res.json(result);

  } catch (error) {
    log('ERROR', 'Enhanced Architecture Failed', { error: error.message });
    res.status(500).json({ error: 'AI Generation Failed' });
  }
});

// Layer 3: Rerank (Vector-based)
app.post('/api/rerank', async (req, res) => {
  if (!ai) return res.status(503).json({ error: 'AI Service Unavailable' });

  const idea = sanitizeInput(req.body.idea);
  const { candidates } = req.body;
  log('INFO', 'Rerank Request', { idea, candidateCount: candidates?.length });

  if (!candidates || candidates.length === 0) {
    return res.json([]);
  }

  try {
    const ideaEmbedding = await getEmbedding(idea);
    if (!ideaEmbedding) {
      log('WARN', 'Idea Embedding Failed - Falling back');
      return res.json(candidates.slice(0, 5));
    }

    const scoredCandidates = await Promise.all(candidates.map(async (repo) => {
      const description = repo.description || '';
      const topics = (repo.topics || []).join(' ');

      if (!description && !topics) {
        return { ...repo, score: -1 };
      }

      const repoText = `${repo.name} ${description} ${topics}`.trim();
      const repoEmbedding = await getEmbedding(repoText);

      if (!repoEmbedding) {
        return { ...repo, score: -1 };
      }

      const score = cosineSimilarity(ideaEmbedding, repoEmbedding);
      return { ...repo, score };
    }));

    scoredCandidates.sort((a, b) => b.score - a.score);
    const top5 = scoredCandidates.slice(0, 5).map(({ score, ...repo }) => repo);

    res.json(top5);

  } catch (error) {
    log('ERROR', 'Rerank Failed', { error: error.message });
    res.json(candidates.slice(0, 5));
  }
});

// Phase C: Analyze Patterns
app.post('/api/analyze', async (req, res) => {
  if (!ai) return res.status(503).json({ error: 'AI Service Unavailable' });

  const idea = sanitizeInput(req.body.idea);
  const { repos } = req.body;
  log('INFO', 'Analyze Request', { idea });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analyze these repositories in the context of: "${idea}". Return JSON: { "recommendedStack": [], "coreFeatures": [], "architecturalNotes": "" }. Repos: ${JSON.stringify(repos)}`,
      config: {
        responseMimeType: "application/json",
      }
    });
    const text = stripFences(response.text || "{}");
    res.json(JSON.parse(text));
  } catch (error) {
    log('ERROR', 'Analyze AI Failed', { error: error.message });
    res.status(500).json({ error: 'AI Generation Failed' });
  }
});

// Phase D1: Generate Architecture (V2)
app.post('/api/blueprint-v2', async (req, res) => {
  if (!ai) return res.status(503).json({ error: 'AI Service Unavailable' });

  const idea = sanitizeInput(req.body.idea);
  const { analysis } = req.body;
  log('INFO', 'Architecture V2 Request', { idea });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Design a complete project architecture for: "${idea}".
      Analysis Context: ${JSON.stringify(analysis || {})}
      
      Requirements:
      1. Use React, TypeScript, Tailwind CSS, Lucide React.
      2. Define a clear folder structure (src/components, src/pages, etc).
      3. List all necessary pages and their routes.
      4. List atomic components vs complex components.
      5. Define a Supabase-compatible database schema.
      
      Return ONLY valid JSON matching the ProjectArchitecture interface.`,
      config: {
        responseMimeType: "application/json",
      }
    });
    const text = stripFences(response.text || "{}");
    const architecture = JSON.parse(text);

    res.json(architecture);
  } catch (error) {
    log('ERROR', 'Architecture V2 Failed', { error: error.message });
    res.status(500).json({ error: 'AI Generation Failed' });
  }
});

// Phase 3 & 4: Config & Code Generator
app.post('/api/generate-project', async (req, res) => {
  const { architecture } = req.body;

  if (!architecture) {
    return res.status(400).json({ error: 'Architecture required' });
  }

  log('INFO', 'Generating Project Config & Code', { project: architecture.projectName });

  // 1. Static Configuration
  const files = [
    { path: 'package.json', content: generatePackageJson(architecture) },
    { path: 'vite.config.ts', content: generateViteConfig() },
    { path: 'tsconfig.json', content: generateTsConfig() },
    { path: 'tsconfig.node.json', content: generateTsConfigNode() },
    { path: 'tailwind.config.js', content: generateTailwindConfig() },
    { path: 'postcss.config.js', content: generatePostCssConfig() },
    { path: 'index.html', content: generateIndexHtml(architecture) },
    { path: '.gitignore', content: generateGitIgnore() },
    { path: '.env.example', content: generateEnvExample() }
  ];

  // 2. Dynamic AI Code Generation (Limit to top 5 to prevent timeouts)
  if (ai) {
    try {
      const componentsToGen = (architecture.components || []).slice(0, 5);
      const pagesToGen = (architecture.pages || []).slice(0, 5);

      log('INFO', 'Starting AI Code Gen', {
        components: componentsToGen.length,
        pages: pagesToGen.length
      });

      const [generatedComponents, generatedPages, appRouterCode] = await Promise.all([
        Promise.all(componentsToGen.map(c => generateReactComponent(c, architecture))),
        Promise.all(pagesToGen.map(p => generateReactPage(p, architecture))),
        generateAppRouter(pagesToGen, architecture)
      ]);

      // Merge Components
      generatedComponents.forEach((code, idx) => {
        files.push({
          path: `src/components/${componentsToGen[idx].name}.tsx`,
          content: code
        });
      });

      // Merge Pages
      generatedPages.forEach((code, idx) => {
        files.push({
          path: `src/pages/${pagesToGen[idx].name}.tsx`,
          content: code
        });
      });

      // Add App.tsx
      files.push({ path: 'src/App.tsx', content: appRouterCode });

      // Add main.tsx (Entry Point)
      files.push({
        path: 'src/main.tsx',
        content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`
      });

      // Add index.css
      files.push({
        path: 'src/index.css',
        content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n/* Custom Scrollbar */\n::-webkit-scrollbar {\n  width: 8px;\n}\n::-webkit-scrollbar-track {\n  background: #0f172a;\n}\n::-webkit-scrollbar-thumb {\n  background: #334155;\n  border-radius: 4px;\n}\n::-webkit-scrollbar-thumb:hover {\n  background: #475569;\n}`
      });

    } catch (error) {
      log('ERROR', 'Code Generation Failed', { error: error.message });
      // We continue even if AI fails, returning just config files + mock fallback
    }
  }

  res.json({
    name: architecture.projectName,
    files: files,
    dependencies: {}, // could parse from package.json if needed
    installCommand: 'npm install',
    startCommand: 'npm run dev'
  });
});

// Phase D: Generate Blueprint (Legacy MVP Plan)
app.post('/api/blueprint', async (req, res) => {
  if (!ai) return res.status(503).json({ error: 'AI Service Unavailable' });

  const idea = sanitizeInput(req.body.idea);
  log('INFO', 'Blueprint Request', { idea });
  const { analysis } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `User Idea: "${idea}". Analysis: ${JSON.stringify(analysis)}. Create MVP.md content. Tone: Technical. Return ONLY markdown string.`
    });

    // NOTE: We do NOT strip fences here because the response IS markdown, not JSON
    res.json({ plan: response.text });
  } catch (error) {
    log('ERROR', 'Blueprint AI Failed', { error: error.message });
    res.status(500).json({ error: 'AI Generation Failed' });
  }
});

// Phase E: Scaffold (Legacy - Kept for fallback or future cleanup)
app.post('/api/scaffold', async (req, res) => {
  if (!ai) return res.status(503).json({ error: 'AI Service Unavailable' });

  log('INFO', 'Scaffold Request');
  const { blueprint } = req.body;
  if (!blueprint) return res.status(400).json({ error: 'Blueprint required' });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Generate entry file and package.json from blueprint. Return JSON: { "entryFile": "App.tsx", "entryCode": "...", "packageJson": "..." }`,
      config: {
        systemInstruction: 'Do not generate copyright-infringing code.',
        responseMimeType: "application/json",
      }
    });
    const text = stripFences(response.text || "{}");
    let data = JSON.parse(text);

    if (data.entryCode) data.entryCode = stripFences(data.entryCode);
    if (data.packageJson) data.packageJson = stripFences(data.packageJson);

    res.json(data);
  } catch (error) {
    log('ERROR', 'Scaffold AI Failed', { error: error.message });
    res.status(500).json({ error: 'AI Generation Failed' });
  }
});

// SERVER INITIALIZATION
// -----------------------------------------------------------------------------
app.listen(PORT, () => {
  log('INFO', `SECURE BACKEND ONLINE: http://localhost:${PORT}`);
  log('INFO', `MODE: ${process.env.NODE_ENV || 'production'}`);
  log('INFO', 'SYSTEM READY');
});
