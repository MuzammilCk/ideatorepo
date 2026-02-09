import React, { useState, useEffect } from 'react';
import { ScaffoldData, GeneratedProject, TreeNode, FileNode, ProjectArchitecture } from '../types';
import FileTreeViewer from './FileTreeViewer';
import CodeViewer from './CodeViewer';
import ProjectDownloader from './ProjectDownloader';
import { Layers, Code, Box, Cpu } from 'lucide-react';

interface BlueprintCardProps {
  isLoading: boolean;
  content: string | null;
  isScaffolding: boolean;
  scaffoldData: ScaffoldData | null;
  generatedProject: GeneratedProject | null;
  architecture: ProjectArchitecture | null;
  generationProgress: {
    phase: string;
    current: number;
    total: number;
  };
  onGenerateScaffold: () => void;
}

const MOCK_PROJECT_STRUCTURE: TreeNode[] = [
  {
    name: "src",
    type: "folder",
    children: [
      { name: "App.tsx", type: "file", content: "// Waiting for generation..." },
    ]
  },
  { name: "package.json", type: "file", content: "{}" }
];

const BlueprintCard: React.FC<BlueprintCardProps> = ({ 
  isLoading, 
  content, 
  isScaffolding,
  scaffoldData,
  generatedProject,
  architecture,
  generationProgress,
  onGenerateScaffold
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'code'>('architecture');
  const [selectedFile, setSelectedFile] = useState<TreeNode | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>(MOCK_PROJECT_STRUCTURE);

  // Convert flat FileNode list to recursive TreeNode structure
  useEffect(() => {
    if (generatedProject && generatedProject.files) {
        const buildTree = (files: FileNode[]): TreeNode[] => {
            const root: TreeNode[] = [];
            files.forEach(file => {
                const parts = file.path.split('/');
                let currentLevel = root;
                parts.forEach((part, index) => {
                    const isFile = index === parts.length - 1;
                    let existingNode = currentLevel.find(n => n.name === part);
                    if (!existingNode) {
                         existingNode = {
                            name: part,
                            type: isFile ? 'file' : 'folder',
                            children: isFile ? undefined : [],
                            content: isFile ? file.content : undefined
                        };
                        currentLevel.push(existingNode);
                    }
                    if (!isFile && existingNode.children) {
                        currentLevel = existingNode.children;
                    }
                });
            });
            return root;
        };

        const newTree = buildTree(generatedProject.files);
        setTreeData(newTree);
        
        // Auto-select package.json if it exists
        const pkgJson = newTree.find(n => n.name === 'package.json');
        if (pkgJson) setSelectedFile(pkgJson);
        
        // Auto switch to code tab when done
        setActiveTab('code');
    }
  }, [generatedProject]);

  // Fallback to legacy scaffoldData if generatedProject not available yet
  useEffect(() => {
      if (!generatedProject && scaffoldData) {
          setTreeData([
              { name: scaffoldData.entryFile, type: 'file', content: scaffoldData.entryCode },
              { name: 'package.json', type: 'file', content: scaffoldData.packageJson }
          ]);
      }
  }, [scaffoldData, generatedProject]);

  if (isLoading || isScaffolding) {
    const fileEstimate = architecture 
        ? (architecture.components?.length || 0) + (architecture.pages?.length || 0) + 10 
        : 15;
    const totalFiles = generationProgress.total || fileEstimate;
    const currentFiles = generationProgress.current || 0;
    const progressPercent = totalFiles > 0
      ? Math.min(100, Math.round((currentFiles / totalFiles) * 100))
      : 0;

    return (
      <div className="w-full max-w-4xl mx-auto p-1 bg-nightDark/50 rounded-xl border border-electricBlue/20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-electricBlue to-transparent animate-scan-line"></div>
        <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-electricBlue/30 border-t-electricBlue rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-electricBlue/20 rounded-full animate-pulse"></div>
             </div>
          </div>
          <h3 className="mt-8 text-2xl font-black text-white tracking-widest uppercase animate-pulse">
             {isScaffolding ? (generationProgress.phase || 'Generating Files') : 'Synthesizing Architecture'}
          </h3>
          <div className="mt-4 flex flex-col gap-2 w-full max-w-md">
             <div className="h-2 bg-gray-800 rounded overflow-hidden">
                <div
                  className="h-full bg-electricBlue transition-all"
                  style={{ width: `${progressPercent}%` }}
                ></div>
             </div>
             {isScaffolding ? (
                <p className="text-xs text-gray-500 text-center">
                  {currentFiles} / {totalFiles} files
                </p>
              ) : (
                <div className="flex justify-between text-[10px] font-mono text-electricBlue/60">
                  <span>Optimizing Stack...</span>
                  <span>Generating Schema...</span>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  if (!content && !generatedProject) return null;

  const renderArchitectureView = () => {
    if (!content) return null;
    const lines = content.split('\n');
    return (
        <div className="p-8 md:p-12 font-sans text-gray-300 leading-relaxed animate-fade-in">
             {lines.map((line, index) => {
                if (line.startsWith('# ')) {
                    return (
                        <h1 key={index} className="text-4xl md:text-5xl font-black text-white mb-8 pb-4 border-b border-electricBlue/30 uppercase tracking-tighter flex items-center gap-4">
                            <span className="text-electricBlue">#</span>
                            {line.replace('# ', '')}
                        </h1>
                    );
                }
                if (line.startsWith('## ')) {
                    return (
                        <h2 key={index} className="text-2xl font-bold text-electricBlue mt-12 mb-6 uppercase tracking-wider flex items-center gap-2">
                            <span className="text-xl opacity-50">//</span>
                            {line.replace('## ', '')}
                        </h2>
                    );
                }
                if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-lg font-bold text-white mt-8 mb-4">{line.replace('### ', '')}</h3>;
                }
                if (line.trim().startsWith('- ')) {
                    return (
                        <div key={index} className="flex items-start gap-3 mb-2 ml-4">
                            <span className="text-electricBlue mt-1.5 text-[10px]">●</span>
                            <span>{line.replace('- ', '')}</span>
                        </div>
                    );
                }
                if (/^\d+\./.test(line.trim())) {
                    return (
                            <div key={index} className="flex items-start gap-3 mb-3 ml-2 group">
                            <span className="font-mono text-electricBlue font-bold bg-electricBlue/10 px-2 rounded group-hover:bg-electricBlue group-hover:text-black transition-colors">
                                {line.split('.')[0]}
                            </span>
                            <span className="text-gray-300">{line.replace(/^\d+\.\s*/, '')}</span>
                        </div>
                    );
                }
                if (line.startsWith('```')) return null;
                if (!line.trim()) return <div key={index} className="h-4"></div>;
                return <p key={index} className="mb-2">{line}</p>;
            })}
        </div>
    );
  };

  const renderCodeExplorer = () => {
      return (
          <div className="flex h-[600px] border-t border-gray-800 animate-fade-in">
              {/* Sidebar */}
              <div className="w-64 flex-shrink-0 bg-nightDark/30 border-r border-gray-800 overflow-y-auto custom-scrollbar">
                  <div className="p-4 border-b border-gray-800 bg-black/20 sticky top-0 z-10 backdrop-blur-sm">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                          <Box size={14} /> Project Files
                      </h4>
                  </div>
                  <div className="p-2">
                    <FileTreeViewer 
                        data={treeData} 
                        onSelect={setSelectedFile} 
                        selectedFile={selectedFile?.name}
                    />
                  </div>
              </div>

              {/* Code Editor Area */}
              <div className="flex-1 flex flex-col bg-black overflow-hidden relative">
                  {selectedFile ? (
                      <CodeViewer 
                        filename={selectedFile.name} 
                        code={selectedFile.content || "// Select a file to view content"} 
                      />
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-600">
                          <Cpu size={48} className="mb-4 opacity-20" />
                          <p className="text-sm font-mono uppercase tracking-widest">Select a module to decrypt</p>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in-up">
        {/* Card Container */}
        <div className="relative bg-black/80 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden shadow-[0_0_50px_rgba(30,58,138,0.2)]">
            
            {/* Header Tabs */}
            <div className="bg-gray-900/50 border-b border-gray-800 flex items-center justify-between pl-4">
                <div className="flex gap-1">
                     <button
                        onClick={() => setActiveTab('architecture')}
                        className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors border-b-2
                            ${activeTab === 'architecture' 
                                ? 'text-white border-electricBlue bg-white/5' 
                                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'
                            }
                        `}
                     >
                        <Layers size={14} />
                        Architecture
                     </button>
                     <button
                        onClick={() => setActiveTab('code')}
                        className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors border-b-2
                            ${activeTab === 'code' 
                                ? 'text-white border-electricBlue bg-white/5' 
                                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'
                            }
                        `}
                     >
                        <Code size={14} />
                        Source Code
                     </button>
                </div>
                
                <div className="flex items-center gap-4 pr-4">
                     <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div>
                {activeTab === 'architecture' && renderArchitectureView()}
                {activeTab === 'code' && renderCodeExplorer()}
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-900/80 p-4 border-t border-gray-800 flex justify-end gap-4 z-20 relative">
                {generatedProject ? (
                    <ProjectDownloader project={generatedProject} />
                ) : (
                    <>
                        <button 
                            disabled={isScaffolding}
                            className="relative px-6 py-2 font-black text-xs uppercase tracking-widest transition-all duration-200 skew-x-[-10deg] border border-gray-600 text-gray-400 hover:border-white hover:text-white disabled:opacity-50"
                        >
                            <span className="block skew-x-[10deg] flex items-center gap-2">
                                    Download Spec
                            </span>
                        </button>
                        <button 
                            onClick={onGenerateScaffold}
                            disabled={isScaffolding}
                            className="relative px-8 py-2 font-black text-xs uppercase tracking-widest transition-all duration-200 skew-x-[-10deg] bg-electricBlue text-black hover:bg-white hover:text-electricBlue hover:shadow-blue-glow disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-wait"
                        >
                            <span className="block skew-x-[10deg]">
                                {isScaffolding ? 'GENERATING...' : 'INITIALIZE REPO'}
                            </span>
                        </button>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};

export default BlueprintCard;
