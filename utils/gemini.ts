import { Repository, MVPAnalysis, ScaffoldData, ProjectArchitecture, GeneratedProject, DeepPatternAnalysis, IntentAnalysis, EnhancedArchitecture } from "../types";

// Helper to handle API responses
async function postToApi(endpoint: string, body: any) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}

/**
 * Layer 1: Intent Understanding
 * Proxies to backend /api/strategy
 */
export async function generateSearchStrategies(userIdea: string): Promise<string[]> {
  try {
    const data = await postToApi('/api/strategy', { idea: userIdea });
    return data.queries || [`topic:${userIdea.split(' ')[0]}`, userIdea, "stars:>500"];
  } catch (error: any) {
    console.error("Gemini Layer 1 Error:", error);
    // Fallback
    return [`topic:${userIdea.split(' ')[0]}`, userIdea, "stars:>100"];
  }
}

/**
 * Layer 3: Semantic Reranking
 * Proxies to backend /api/rerank
 */
export async function rankReposWithGemini(userIdea: string, candidates: Repository[]): Promise<Repository[]> {
  if (candidates.length === 0) return [];

  // Simplify list to save bandwidth
  const simplifiedList = candidates.map(r => ({
    id: r.id,
    name: r.name,
    desc: r.description,
    stars: r.stargazers_count,
    url: r.html_url
  }));

  try {
    const selectedSimple = await postToApi('/api/rerank', { idea: userIdea, candidates: simplifiedList });

    // Map back to full repository objects
    const selectedIds = new Set(selectedSimple.map((s: any) => s.id));
    const finalRepos = candidates.filter(r => selectedIds.has(r.id));

    return finalRepos.length > 0 ? finalRepos : candidates.slice(0, 5);

  } catch (error) {
    console.error("Gemini Layer 3 Error:", error);
    return candidates.slice(0, 5);
  }
}

/**
 * Phase C: Pattern Extraction
 * Proxies to backend /api/analyze
 */
export async function extractPatterns(userIdea: string, repos: Repository[]): Promise<MVPAnalysis> {
  const simplifiedRepos = repos.map(r => ({
    name: r.name,
    description: r.description,
    topics: r.topics,
    language: r.language
  }));

  try {
    return await postToApi('/api/analyze', { idea: userIdea, repos: simplifiedRepos });
  } catch (error: any) {
    console.error("Pattern Extraction Failed:", error);

    // Simulation Fallback
    return {
      recommendedStack: ["React", "TypeScript", "TailwindCSS", "Node.js"],
      coreFeatures: ["User Authentication", "Real-time Dashboard", "REST API", "Responsive Layout"],
      architecturalNotes: "[SIMULATION MODE] The AI service is currently unavailable. Displaying standard high-availability patterns."
    };
  }
}

/**
 * Phase 2.4: Deep Pattern Mining
 * Enhanced repository analysis with architectural insights
 */
export async function deepPatternMining(
  userIdea: string,
  repos: Repository[]
): Promise<DeepPatternAnalysis> {
  try {
    const data = await postToApi('/api/deep-analysis', {
      repos,
      userIdea
    });
    return data;
  } catch (error: any) {
    console.error("Deep Pattern Mining Failed:", error);

    // Fallback with minimal structure
    return {
      folderStructure: {
        commonPattern: "Standard React",
        recommendedStructure: [
          { folder: "src/components", purpose: "Reusable UI components", isRequired: true },
          { folder: "src/pages", purpose: "Page-level components", isRequired: true },
          { folder: "src/lib", purpose: "Utilities and helpers", isRequired: true }
        ]
      },
      dependencies: {
        core: [
          { package: "react", purpose: "UI framework", frequency: "Always" },
          { package: "typescript", purpose: "Type safety", frequency: "Always" }
        ],
        pairedPackages: []
      },
      authentication: {
        mostCommonApproach: "Supabase Auth",
        implementations: [],
        recommendation: "Use Supabase for quick MVP setup"
      },
      stateManagement: {
        dominantPattern: "Context API",
        usage: [],
        bestFit: "Context API for simple state, Zustand for complex"
      },
      apiPatterns: {
        primaryType: "REST",
        dataFetching: {
          library: "React Query",
          patterns: []
        },
        recommendation: "REST API with React Query"
      },
      architecture: {
        patterns: [],
        layering: {
          hasLayeredArchitecture: true,
          layers: ["Presentation", "Business Logic", "Data Access"]
        }
      },
      security: {
        commonPractices: [],
        criticalMustHaves: ["Input validation", "Secure token storage", "HTTPS"]
      },
      scalability: {
        strategies: [],
        recommendations: ["Use code splitting", "Implement API caching"]
      },
      synthesis: {
        idealStack: {
          frontend: ["React", "TypeScript", "Tailwind CSS"],
          backend: ["Node.js", "Express"],
          database: ["PostgreSQL"],
          tooling: ["Vite", "ESLint", "Prettier"]
        },
        keyTakeaways: ["Keep it simple", "Use proven libraries", "Focus on core features"],
        antiPatterns: ["Over-engineering", "Premature optimization"],
        confidenceScore: 3
      }
    };
  }
}

/**
 * Phase D1: Generate Architecture (V2) - Enhanced with Deep Patterns
 */
export async function generateArchitecture(
  userIdea: string,
  analysis: MVPAnalysis,
  deepPatterns?: DeepPatternAnalysis
): Promise<ProjectArchitecture> {
  try {
    // Enhance prompt with deep pattern insights if available
    const enhancedAnalysis = deepPatterns ? {
      ...analysis,
      deepInsights: {
        folderPattern: deepPatterns.folderStructure.commonPattern,
        coreDeps: deepPatterns.dependencies.core.map(d => d.package).join(', '),
        authApproach: deepPatterns.authentication.recommendation,
        stateManagement: deepPatterns.stateManagement.bestFit,
        apiPattern: deepPatterns.apiPatterns.recommendation
      }
    } : analysis;

    const data = await postToApi('/api/blueprint-v2', { idea: userIdea, analysis: enhancedAnalysis });
    return data;
  } catch (error: any) {
    console.error("Architecture V2 Generation Failed:", error);

    // Simulation Fallback
    return {
      projectName: "simulation-project",
      description: "A simulated architecture response due to API failure.",
      techStack: {
        framework: "React",
        language: "TypeScript",
        styling: "Tailwind CSS",
        icons: "Lucide React",
        stateManagement: "Context API",
        dataFetching: "fetch",
        routing: "React Router"
      },
      folderStructure: [
        { name: "src", type: "folder", children: [{ name: "App.tsx", type: "file" }] }
      ],
      pages: [],
      components: [],
      databaseSchema: [],
      apiEndpoints: [],
      stateManagement: {
        approach: "Context API",
        globalStores: [],
        localStateComponents: [],
        rationale: "Fallback state"
      },
      authentication: {
        provider: "None",
        flows: [],
        protectedRoutes: [],
        publicRoutes: ["/"],
        tokenStorage: "localStorage",
        sessionDuration: "7 days"
      },
      dataFlow: {
        pattern: "Unidirectional",
        layers: {
          presentation: [],
          business: [],
          data: []
        },
        communicationFlow: "Fallback flow"
      },
      performance: {
        codeSplitting: false,
        lazyLoading: { routes: [], components: [] },
        caching: { strategy: "None", cachedEndpoints: [] },
        imageOptimization: false,
        bundleOptimization: []
      },
      componentGraph: {
        nodes: [],
        edges: []
      }
    };
  }
}

/**
 * Phase 3: Project Configuration Generation
 * Proxies to backend /api/generate-project
 */
export async function generateProjectConfig(architecture: ProjectArchitecture): Promise<GeneratedProject> {
  try {
    return await postToApi('/api/generate-project', { architecture });
  } catch (error: any) {
    console.error("Project Config Generation Failed:", error);
  }
}

/**
 * Phase 3: Enhanced Architecture Generation
 * Generates comprehensive architecture with API, state, auth, and performance specs
 */
export async function generateEnhancedArchitecture(
  userIdea: string,
  intentAnalysis: IntentAnalysis | null,
  deepPatterns: DeepPatternAnalysis | null,
  basicAnalysis: MVPAnalysis
): Promise<EnhancedArchitecture> {
  try {
    const data = await postToApi('/api/enhanced-architecture', {
      idea: userIdea,
      intentAnalysis,
      deepPatterns,
      basicAnalysis
    });
    return data;
  } catch (error: any) {
    console.error("Enhanced Architecture Generation Failed:", error);

    // Comprehensive fallback
    return {
      projectName: "Fallback Project",
      description: "A fallback architecture response due to API failure",
      techStack: {
        framework: "React",
        language: "TypeScript",
        styling: "Tailwind CSS",
        icons: "Lucide React",
        stateManagement: "Context API",
        dataFetching: "fetch",
        routing: "React Router"
      },
      folderStructure: [
        { name: "src", type: "folder", purpose: "Source code" },
        { name: "components", type: "folder", purpose: "UI components" },
        { name: "pages", type: "folder", purpose: "Route pages" }
      ],
      pages: [
        { name: "HomePage", route: "/", description: "Landing page", imports: [], isProtected: false }
      ],
      components: [
        { name: "Button", description: "Reusable button", isAtomic: true, category: "form" }
      ],
      databaseSchema: [
        {
          table: "users",
          columns: [
            { name: "id", type: "uuid", isPrimary: true },
            { name: "email", type: "string", isRequired: true }
          ]
        }
      ],
      apiEndpoints: [
        { path: "/api/users", method: "GET", purpose: "Get users", authentication: false }
      ],
      stateManagement: {
        approach: "Context API",
        globalStores: [{ name: "authStore", purpose: "Auth state", stateShape: ["user", "isAuthenticated"] }],
        localStateComponents: [],
        rationale: "Simple state for MVP"
      },
      authentication: {
        provider: "Supabase",
        flows: ["email-password"],
        protectedRoutes: ["/dashboard"],
        publicRoutes: ["/", "/login"],
        tokenStorage: "localStorage",
        sessionDuration: "7 days"
      },
      dataFlow: {
        pattern: "Unidirectional",
        layers: {
          presentation: ["Components"],
          business: ["Hooks"],
          data: ["API Client"]
        },
        communicationFlow: "Standard React data flow"
      },
      performance: {
        codeSplitting: true,
        lazyLoading: { routes: [], components: [] },
        caching: { strategy: "React Query", cachedEndpoints: [] },
        imageOptimization: false,
        bundleOptimization: ["Minification"]
      },
      componentGraph: {
        nodes: [{ id: "page-home", name: "HomePage", type: "page" }],
        edges: []
      }
    };
  }
}

/**
 * Phase D: MVP Blueprint Synthesis
 * Proxies to backend /api/blueprint
 */
export async function generateMVPPlan(userIdea: string, analysis: MVPAnalysis): Promise<string> {
  try {
    const data = await postToApi('/api/blueprint', { idea: userIdea, analysis });
    return data.plan;
  } catch (error: any) {
    console.error("Blueprint Generation Failed:", error);

    // Simulation Fallback
    return `# PROJECT: ${userIdea.toUpperCase().slice(0, 20)} [SIMULATION]
## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (Supabase)

## Core Features
- [ ] User Authentication (OAuth)
- [ ] Dashboard View
- [ ] CRUD Operations for Main Entity
- [ ] Settings & Profile Management

## Database Schema
\`\`\`json
{
  "users": { "id": "uuid", "email": "string", "created_at": "timestamp" },
  "items": { "id": "uuid", "user_id": "uuid", "title": "string", "status": "string" }
}
\`\`\`

## Implementation Plan
1. Initialize Git repository and install dependencies.
2. Set up Supabase project and connect environment variables.
3. Build authentication flow using Supabase Auth.
4. Construct main dashboard layout with Tailwind Grid.
5. Implement backend API routes for data persistence.
6. Deploy MVP to Vercel/Netlify.`;
  }
}

/**
 * Phase E: Code Scaffolding
 * Proxies to backend /api/scaffold
 */
export async function generateScaffold(blueprint: string): Promise<ScaffoldData> {
  try {
    return await postToApi('/api/scaffold', { blueprint });
  } catch (error: any) {
    console.error("Scaffold Generation Failed:", error);

    // Simulation Fallback
    return {
      entryFile: "App.tsx",
      entryCode: `// [SIMULATION MODE] - SERVICE UNAVAILABLE
// The AI system is currently unavailable. 
// Displaying a high-fidelity cached response for: React Dashboard.

import React, { useState } from 'react';
import { Activity, Users, Settings, Bell, Search, Menu } from 'lucide-react';

export default function App() {
  const [active, setActive] = useState('dashboard');

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            NEXUS
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {['dashboard', 'users', 'analytics', 'settings'].map((item) => (
            <button
              key={item}
              onClick={() => setActive(item)}
              className={\`w-full flex items-center gap-3 px-4 py-3 rounded-lg capitalize transition-all duration-200 \${
                active === item 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                  : 'hover:bg-slate-800 hover:text-white'
              }\`}
            >
              {item === 'dashboard' && <Activity size={18} />}
              {item === 'users' && <Users size={18} />}
              {item === 'analytics' && <Search size={18} />}
              {item === 'settings' && <Settings size={18} />}
              {item}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
           <div className="md:hidden">
              <Menu />
           </div>
           <div className="flex-1 max-w-xl mx-auto hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
           </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 min-h-[400px] flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Activity className="text-indigo-500" size={32} />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Project Initialized</h3>
             <p className="text-slate-400 max-w-md mx-auto">
               Your MVP scaffolding is ready. (Simulation Mode)
             </p>
          </div>
        </div>
      </main>
    </div>
  );
}
`,
      packageJson: `{
  "name": "idea-to-repo-scaffold",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0"
  }
}`
    };
  }
}