export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  language: string;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  topics: string[];
}

export interface MVPAnalysis {
  recommendedStack: string[];
  coreFeatures: string[];
  architecturalNotes: string;
}

export interface ScaffoldData {
  entryFile: string;
  entryCode: string;
  packageJson: string;
}

// --- V2 ARCHITECTURE TYPES ---

export interface FileNode {
  path: string;
  content: string;
}

export interface GeneratedProject {
  name: string;
  files: FileNode[];
  dependencies: Record<string, string>;
  installCommand: string;
  startCommand: string;
}

// ProjectArchitecture is now defined as EnhancedArchitecture (see end of file)

export interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  content?: string;
}

export interface IntentAnalysis {
  entities: {
    projectName: string;
    technologies: string[];
    keyNouns: string[];
    targetUsers: string[];
  };

  classification: {
    primaryType: string;
    secondaryTypes?: string[];
    complexity: 'Simple CRUD' | 'Moderate Multi-feature' | 'Complex Multi-tenant' | 'Enterprise';
  };

  features: {
    mustHave: { name: string; reason: string }[];
    shouldHave: { name: string; reason: string }[];
    niceToHave: { name: string; reason: string }[];
  };

  clarification: {
    targetAudience: 'B2B' | 'B2C' | 'Internal Tool' | 'Developer Tool' | 'Mixed';
    expectedScale: 'small' | 'medium' | 'large';
    monetization?: 'free' | 'subscription' | 'freemium' | 'one-time-purchase' | 'ads' | 'not-applicable';
    timeline: 'weekend' | '2-weeks' | 'month' | '3-months';
  };

  feasibility: {
    score: number;
    status: string;
    concerns: string[];
    recommendations: string[];
    scopeReduction?: {
      needed: boolean;
      suggestions: string[];
    };
  };

  searchStrategies: string[];
}

export interface DeepPatternAnalysis {
  folderStructure: {
    commonPattern: string;
    recommendedStructure: {
      folder: string;
      purpose: string;
      isRequired: boolean;
    }[];
    notes?: string;
  };

  dependencies: {
    core: {
      package: string;
      purpose: string;
      frequency: 'Always' | 'Very Common' | 'Common' | 'Occasional';
    }[];
    pairedPackages: {
      packages: string[];
      reason: string;
    }[];
    avoidPatterns?: string[];
  };

  authentication: {
    mostCommonApproach: string;
    implementations: {
      method: string;
      usedBy: string[];
      pros: string[];
      cons: string[];
    }[];
    recommendation: string;
  };

  stateManagement: {
    dominantPattern: string;
    usage: {
      library: string;
      useCases: string[];
      complexity: 'Simple' | 'Moderate' | 'Complex';
    }[];
    bestFit: string;
  };

  apiPatterns: {
    primaryType: string;
    dataFetching: {
      library: string;
      patterns: string[];
    };
    recommendation: string;
  };

  architecture: {
    patterns: {
      name: string;
      description: string;
      frequency: 'Dominant' | 'Common' | 'Occasional' | 'Rare';
    }[];
    layering: {
      hasLayeredArchitecture: boolean;
      layers: string[];
    };
  };

  security: {
    commonPractices: {
      practice: string;
      implementation: string;
    }[];
    criticalMustHaves: string[];
    observedWeaknesses?: string[];
  };

  scalability: {
    strategies: {
      strategy: string;
      usedBy: string[];
      applicability: 'MVP' | 'Growth Stage' | 'Enterprise' | 'All Stages';
    }[];
    recommendations: string[];
  };

  synthesis: {
    idealStack: {
      frontend: string[];
      backend: string[];
      database: string[];
      tooling: string[];
    };
    keyTakeaways: string[];
    antiPatterns: string[];
    confidenceScore: number;
  };
}

// Enhanced Architecture Interface (Phase 3)
export interface EnhancedArchitecture {
  // Base (Existing)
  projectName: string;
  description: string;
  techStack: {
    framework: string;
    language: string;
    styling: string;
    icons: string;
    stateManagement: string;
    dataFetching: string;
    routing: string;
  };
  folderStructure: {
    name: string;
    type: 'file' | 'folder';
    purpose?: string;
    children?: { name: string; type: string }[];
  }[];
  pages: {
    name: string;
    route: string;
    description: string;
    imports: string[];
    isProtected?: boolean;
    lazyLoad?: boolean;
  }[];
  components: {
    name: string;
    description: string;
    isAtomic: boolean;
    category?: 'layout' | 'form' | 'display' | 'navigation' | 'feedback' | 'utility';
    props?: {
      name: string;
      type: string;
      required: boolean;
    }[];
  }[];
  databaseSchema: {
    table: string;
    columns: {
      name: string;
      type: string;
      isPrimary?: boolean;
      isRequired?: boolean;
      defaultValue?: string;
    }[];
    relationships?: {
      type: 'one-to-many' | 'many-to-one' | 'many-to-many';
      table: string;
      foreignKey: string;
    }[];
  }[];

  // NEW: Enhanced Fields
  apiEndpoints: {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    purpose: string;
    authentication: boolean;
    requestSchema?: {
      body?: string[];
      params?: string[];
      query?: string[];
    };
    responseSchema?: {
      success: string;
      error: string;
    };
  }[];

  stateManagement: {
    approach: 'Context API' | 'Redux Toolkit' | 'Zustand' | 'Jotai' | 'Recoil' | 'Mixed';
    globalStores: {
      name: string;
      purpose: string;
      stateShape: string[];
    }[];
    localStateComponents: string[];
    rationale: string;
  };

  authentication: {
    provider: 'Supabase' | 'Firebase' | 'Auth0' | 'NextAuth' | 'Custom JWT' | 'Clerk' | 'None';
    flows: ('email-password' | 'oauth-google' | 'oauth-github' | 'magic-link' | 'phone' | 'password-reset')[];
    protectedRoutes: string[];
    publicRoutes: string[];
    tokenStorage: 'httpOnly-cookie' | 'localStorage' | 'sessionStorage' | 'memory';
    sessionDuration: string;
  };

  dataFlow: {
    pattern: 'Unidirectional' | 'Bidirectional' | 'Event-driven';
    layers: {
      presentation: string[];
      business: string[];
      data: string[];
    };
    communicationFlow: string;
  };

  performance: {
    codeSplitting: boolean;
    lazyLoading: {
      routes: string[];
      components: string[];
    };
    caching: {
      strategy: 'React Query' | 'SWR' | 'RTK Query' | 'Manual' | 'None';
      cachedEndpoints: string[];
      staleTime?: string;
      cacheTime?: string;
    };
    imageOptimization: boolean;
    bundleOptimization: string[];
  };

  componentGraph: {
    nodes: {
      id: string;
      name: string;
      type: 'page' | 'layout' | 'component' | 'utility' | 'hook' | 'context';
    }[];
    edges: {
      from: string;
      to: string;
      relationship: 'imports' | 'renders' | 'wraps' | 'consumes' | 'provides';
    }[];
  };
}

// Backward compatibility: ProjectArchitecture now extends EnhancedArchitecture
export type ProjectArchitecture = EnhancedArchitecture;