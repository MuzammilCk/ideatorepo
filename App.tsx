import React, { useState, useRef } from 'react';
import RepoCard from './components/RepoCard';
import MVPTrigger from './components/MVPTrigger';
import BlueprintCard from './components/BlueprintCard';
import IntentReview from './components/IntentReview';
import { Repository, ScaffoldData, ProjectArchitecture, GeneratedProject, IntentAnalysis, DeepPatternAnalysis } from './types';
import { generateSearchStrategies, rankReposWithGemini, extractPatterns, generateMVPPlan, generateScaffold, generateArchitecture, generateProjectConfig, deepPatternMining, generateEnhancedArchitecture } from './utils/gemini';
import { fetchCandidates, RateLimitError } from './utils/github';
import { MOCK_REPOS } from './constants';

const App: React.FC = () => {
  const [idea, setIdea] = useState<string>('');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [mvpMode, setMvpMode] = useState<boolean>(false);

  // Phase C/D: Analysis & Blueprint State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [architecture, setArchitecture] = useState<ProjectArchitecture | null>(null);

  // Phase E: Scaffolding State
  const [isScaffolding, setIsScaffolding] = useState<boolean>(false);
  const [scaffoldData, setScaffoldData] = useState<ScaffoldData | null>(null); // Legacy
  const [generatedProject, setGeneratedProject] = useState<GeneratedProject | null>(null); // New Phase 3
  const [generationProgress, setGenerationProgress] = useState<{
    phase: string;
    current: number;
    total: number;
  }>({ phase: '', current: 0, total: 0 });

  // Phase 1: Intent Analysis State
  const [intentAnalysis, setIntentAnalysis] = useState<IntentAnalysis | null>(null);
  const [showIntentReview, setShowIntentReview] = useState<boolean>(false);

  // Phase 2.4: Deep Pattern Mining State
  const [deepPatterns, setDeepPatterns] = useState<DeepPatternAnalysis | null>(null);

  const mvpSectionRef = useRef<HTMLDivElement>(null);

  // State for optional GitHub Token
  const [githubToken, setGithubToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false);

  const handleFindRepos = async () => {
    if (!idea.trim()) return;

    setIsLoading(true);
    setSearchStatus('');
    setError(null);
    setHasSearched(true);
    setIsDemoMode(false);
    setRepos([]);
    setMvpMode(false);
    setBlueprint(null);
    setArchitecture(null);
    setScaffoldData(null);
    setGeneratedProject(null);
    setGenerationProgress({ phase: '', current: 0, total: 0 });
    setShowIntentReview(false);

    try {
      // PHASE 1: Intent Analysis (NEW)
      setSearchStatus('>> AI: ANALYZING PROJECT INTENT');
      const response = await fetch('/api/intent-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea })
      });

      // Check if response is OK before parsing
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Intent Analysis API Error:', errorData);
        throw new Error(`Intent Analysis Failed: ${errorData.details || errorData.error || 'Unknown error'}`);
      }

      const intentResult = await response.json();
      setIntentAnalysis(intentResult);
      console.log('Intent Analysis:', intentResult);

      // Show feasibility warning if needed (with safe property access)
      if (intentResult?.feasibility?.score !== undefined && intentResult.feasibility.score < 7) {
        setShowIntentReview(true);
        setIsLoading(false);
        setSearchStatus('');
        // Pause to let user review
        return;
      }


      // Validate that we have search strategies
      if (!intentResult?.searchStrategies || intentResult.searchStrategies.length === 0) {
        throw new Error('Intent analysis did not return valid search strategies');
      }

      // Phase 2: Layer 1 - Use enhanced search strategies from intent analysis
      setSearchStatus('>> NETWORK: SCANNING GITHUB SECTORS');
      const candidates = await fetchCandidates(intentResult.searchStrategies, githubToken);
      console.log('Candidates found:', candidates.length);

      if (candidates.length === 0) {
        throw new Error("TARGET NOT FOUND.");
      }

      // Phase 3: Layer 3 - Semantic Reranking
      setSearchStatus('>> AI: ANALYZING TACTICAL RELEVANCE');
      const rankedRepos = await rankReposWithGemini(idea, candidates);

      setRepos(rankedRepos);

    } catch (err: any) {
      console.error("Error processing request:", err);

      if (err instanceof RateLimitError) {
        setIsDemoMode(true);
        setRepos(MOCK_REPOS);
        setError("API RATE LIMIT EXCEEDED. ENGAGING SIMULATION MODE.");
      } else {
        setError(err.message || "SYSTEM FAILURE. RETRY.");
      }
    } finally {
      setIsLoading(false);
      setSearchStatus('');
    }
  };

  const handleStartMVP = async () => {
    setMvpMode(true);
    setBlueprint(null);
    setArchitecture(null);
    setScaffoldData(null);
    setGeneratedProject(null);

    setTimeout(() => {
      mvpSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Trigger Pattern Extraction & Plan Generation
    setIsAnalyzing(true);
    try {
      console.log(">> PHASE 2.4: DEEP PATTERN MINING...");

      // Run Phase 2.4 Deep Analysis + Phase C Pattern Extraction in parallel
      const [deepAnalysis, basicAnalysis] = await Promise.all([
        deepPatternMining(idea, repos),  // NEW: Phase 2.4
        extractPatterns(idea, repos)      // EXISTING: Phase C
      ]);

      setDeepPatterns(deepAnalysis);
      console.log(">> DEEP PATTERNS EXTRACTED:", deepAnalysis);
      console.log(">> PATTERN EXTRACTION COMPLETE.");

      console.log(">> PHASE 3: ENHANCED ARCHITECTURE SYNTHESIS...");

      // Generate enhanced architecture with full context
      const enhancedArch = await generateEnhancedArchitecture(
        idea,
        intentAnalysis,  // From Phase 1
        deepAnalysis,    // From Phase 2.4
        basicAnalysis    // From Phase 2 (existing)
      );

      setArchitecture(enhancedArch);
      console.log(">> ENHANCED ARCHITECTURE READY:", enhancedArch);

      // Legacy blueprint for markdown view
      const plan = await generateMVPPlan(idea, basicAnalysis);
      setBlueprint(plan);

    } catch (e) {
      console.error("Analysis/Blueprint generation failed:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinueAfterReview = async () => {
    if (!intentAnalysis) return;

    setShowIntentReview(false);
    setIsLoading(true);
    setSearchStatus('');

    try {
      // Continue with search using strategies from intent analysis
      setSearchStatus('>> NETWORK: SCANNING GITHUB SECTORS');
      const candidates = await fetchCandidates(intentAnalysis.searchStrategies, githubToken);
      console.log('Candidates found:', candidates.length);

      if (candidates.length === 0) {
        throw new Error("TARGET NOT FOUND.");
      }

      setSearchStatus('>> AI: ANALYZING TACTICAL RELEVANCE');
      const rankedRepos = await rankReposWithGemini(idea, candidates);

      setRepos(rankedRepos);
    } catch (err: any) {
      console.error("Error processing request:", err);

      if (err instanceof RateLimitError) {
        setIsDemoMode(true);
        setRepos(MOCK_REPOS);
        setError("API RATE LIMIT EXCEEDED. ENGAGING SIMULATION MODE.");
      } else {
        setError(err.message || "SYSTEM FAILURE. RETRY.");
      }
    } finally {
      setIsLoading(false);
      setSearchStatus('');
    }
  };

  const handleReviseIdea = () => {
    setShowIntentReview(false);
    setIntentAnalysis(null);
  };

  const handleGenerateScaffold = async () => {
    if (!architecture) {
      // Fallback for legacy flow if architecture failed
      if (blueprint) {
        setIsScaffolding(true);
        try {
          const data = await generateScaffold(blueprint);
          setScaffoldData(data);
        } finally {
          setIsScaffolding(false);
        }
      }
      return;
    }

    setIsScaffolding(true);
    try {
      console.log(">> INITIATING ENHANCED PROJECT GENERATION...");

      const estimatedFiles = 10
        + (architecture.pages?.length || 0)
        + (architecture.components?.length || 0)
        + (architecture.stateManagement?.globalStores?.length || 0)
        + 5;

      setGenerationProgress({
        phase: 'Initializing',
        current: 0,
        total: estimatedFiles
      });

      const project = await generateProjectConfig(architecture);
      setGeneratedProject(project);
      setGenerationProgress({
        phase: 'Complete',
        current: estimatedFiles,
        total: estimatedFiles
      });
      console.log(">> CONFIG GENERATED:", project);
    } catch (e) {
      console.error("Scaffolding failed:", e);
    } finally {
      setIsScaffolding(false);
    }
  };

  return (
    <div className={`min-h-screen bg-black text-white overflow-x-hidden font-sans flex flex-col transition-all duration-700 ease-in-out ${!hasSearched ? 'justify-center' : 'pt-16 pb-20'}`}>

      {/* Background Ambience - Sharp Blue Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-deepBlue/20 rounded-full blur-[100px]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[60%] bg-electricBlue/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-electricBlue/20 to-transparent"></div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center w-full">

        {/* Hero Section */}
        <div className="text-center mb-12 max-w-4xl animate-fade-in-up">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-2 italic transform -skew-x-6 pr-24 pb-2 inline-block">
            <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">IDEA</span>
            <span className="text-electricBlue mx-4">//</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-electricBlue to-white drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] pr-4">REPO</span>
          </h1>
          <p className="text-md font-mono text-electricBlue/60 uppercase tracking-[0.2em] mt-4">
            Tactical Repository Reconnaissance
          </p>
        </div>

        {/* Input Section */}
        <div className="w-full max-w-3xl mb-16">
          <div className="relative group">
            {/* Hard Border Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-electricBlue to-deepBlue rounded-lg opacity-30 group-hover:opacity-100 transition duration-200 blur-[2px]"></div>

            <div className="relative bg-black rounded-lg p-1">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="INPUT MISSION PARAMETERS..."
                className="w-full h-32 bg-nightDark/90 text-xl font-bold text-white placeholder-gray-700 p-6 border-none focus:ring-0 focus:outline-none resize-none rounded-md uppercase tracking-wide"
              />

              {/* Action Bar */}
              <div className="flex justify-between items-end px-4 pb-3 bg-nightDark/90 rounded-b-md">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-electricBlue/50">
                    <span className="w-2 h-2 bg-electricBlue rounded-full animate-pulse"></span>
                    GEMINI LINK: ONLINE
                  </div>
                  <button
                    onClick={() => setShowTokenInput(!showTokenInput)}
                    className="text-[10px] font-mono text-gray-500 hover:text-white underline decoration-dotted underline-offset-4 text-left transition-colors uppercase"
                  >
                    {showTokenInput ? '[-H] SECURE COMMS' : '[+T] SECURE COMMS'}
                  </button>
                </div>

                <button
                  onClick={handleFindRepos}
                  disabled={isLoading}
                  className={`
                    relative px-10 py-3 font-black text-sm uppercase tracking-widest transition-all duration-200 skew-x-[-10deg]
                    ${isLoading
                      ? 'bg-gray-800 text-gray-500 cursor-wait'
                      : 'bg-electricBlue text-black hover:bg-white hover:text-electricBlue hover:shadow-blue-glow'
                    }
                  `}
                >
                  <span className="block skew-x-[10deg]">
                    {isLoading ? 'PROCESSING...' : 'INITIATE'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Token Input (Tactical Dropdown) */}
          {showTokenInput && (
            <div className="mt-2 p-4 bg-nightDark border-l-2 border-electricBlue animate-fade-in">
              <label className="block text-xs text-electricBlue font-mono mb-2 uppercase">
                        // GitHub Access Token
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_************************************"
                className="w-full bg-black border border-gray-800 focus:border-electricBlue rounded-none px-4 py-2 text-sm text-white focus:outline-none transition-colors font-mono"
              />
            </div>
          )}

          {/* Status Bar (System Log Style) */}
          {searchStatus && (
            <div className="mt-4 w-full flex justify-center">
              <div className="bg-deepBlue/20 border border-electricBlue/30 text-electricBlue px-6 py-2 font-mono text-xs tracking-widest uppercase flex items-center gap-3">
                <span className="animate-spin text-lg">⟳</span>
                {searchStatus}
              </div>
            </div>
          )}

          {/* Error / Demo Indicators */}
          {(isDemoMode || error) && (
            <div className={`mt-4 w-full p-3 font-mono text-xs border-l-4 flex items-center gap-3 uppercase tracking-wider
                ${isDemoMode ? 'bg-red-900/20 border-red-600 text-red-400' : 'bg-red-900/20 border-red-600 text-red-500'}
             `}>
              <span className="font-bold text-lg">!</span>
              <span>{error || "SIMULATION MODE ACTIVE"}</span>
            </div>
          )}
        </div>

        {/* Intent Review Screen */}
        {showIntentReview && intentAnalysis && (
          <IntentReview
            analysis={intentAnalysis}
            onContinue={handleContinueAfterReview}
            onRevise={handleReviseIdea}
          />
        )}

        {/* Results Grid - ONLY VISIBLE WHEN REPOS ARE FOUND */}
        {repos.length > 0 && !showIntentReview && (
          <div className="w-full animate-fade-in-up">
            <div className="flex items-center mb-8 gap-4">
              <div className="h-[2px] bg-gray-900 flex-grow"></div>
              <h2 className="text-3xl font-black italic text-gray-700 tracking-tighter uppercase">
                <span className="text-white">TARGETS</span>
              </h2>
              <div className="h-[2px] bg-gray-900 flex-grow"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {repos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          </div>
        )}

        {/* PHASE B: MVP TRIGGER */}
        {hasSearched && repos.length > 0 && !isLoading && !error && !mvpMode && (
          <MVPTrigger onActivate={handleStartMVP} />
        )}

        {/* PHASE C/D/E: MVP BLUEPRINT & SCAFFOLDING */}
        {mvpMode && (
          <div ref={mvpSectionRef} className="w-full max-w-7xl mt-32 border-t border-gray-900 pt-16 min-h-[50vh] animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] bg-electricBlue w-12"></div>
              <h3 className="text-4xl font-black text-white uppercase tracking-widest italic">
                MVP <span className="text-electricBlue">SYNTHESIS</span>
              </h3>
              <div className="h-[1px] bg-electricBlue w-full opacity-30"></div>
            </div>

            <BlueprintCard
              isLoading={isAnalyzing}
              content={blueprint}
              isScaffolding={isScaffolding}
              scaffoldData={scaffoldData}
              generatedProject={generatedProject}
              architecture={architecture}
              generationProgress={generationProgress}
              onGenerateScaffold={handleGenerateScaffold}
            />
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
