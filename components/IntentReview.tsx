import React from 'react';
import { IntentAnalysis } from '../types';
import { AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';

interface IntentReviewProps {
    analysis: IntentAnalysis;
    onContinue: () => void;
    onRevise: () => void;
}

const IntentReview: React.FC<IntentReviewProps> = ({ analysis, onContinue, onRevise }) => {
    const { feasibility, classification, features, clarification } = analysis;

    return (
        <div className="w-full max-w-4xl mx-auto p-8 bg-nightDark border border-electricBlue/30 rounded-xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                {feasibility.score >= 7 ? (
                    <CheckCircle className="text-green-500" size={32} />
                ) : (
                    <AlertTriangle className="text-yellow-500" size={32} />
                )}
                <h2 className="text-2xl font-black text-white uppercase">
                    Project Feasibility: {feasibility.status}
                </h2>
            </div>

            {/* Score */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 font-mono">FEASIBILITY SCORE</span>
                    <span className="text-2xl font-black text-electricBlue">{feasibility.score}/10</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${feasibility.score >= 7 ? 'bg-green-500' :
                                feasibility.score >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                        style={{ width: `${feasibility.score * 10}%` }}
                    />
                </div>
            </div>

            {/* Project Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-black/30 border border-gray-800 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <Target size={16} className="text-electricBlue" />
                        <span className="text-xs text-gray-500 uppercase">Type</span>
                    </div>
                    <p className="text-white font-bold">{classification.primaryType}</p>
                    <p className="text-xs text-gray-400 mt-1">{classification.complexity}</p>
                </div>

                <div className="p-4 bg-black/30 border border-gray-800 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-electricBlue" />
                        <span className="text-xs text-gray-500 uppercase">Timeline</span>
                    </div>
                    <p className="text-white font-bold capitalize">{clarification.timeline}</p>
                    <p className="text-xs text-gray-400 mt-1">{clarification.targetAudience}</p>
                </div>
            </div>

            {/* Must-Have Features */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-electricBlue uppercase mb-3">
                    Must-Have Features ({features.mustHave.length})
                </h3>
                <div className="space-y-2">
                    {features.mustHave.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-black/20 border-l-2 border-electricBlue">
                            <span className="text-electricBlue font-mono text-xs mt-1">●</span>
                            <div>
                                <p className="text-white font-semibold">{feature.name}</p>
                                <p className="text-xs text-gray-400 mt-1">{feature.reason}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Concerns & Recommendations */}
            {feasibility.concerns.length > 0 && (
                <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <h4 className="text-sm font-bold text-yellow-500 uppercase mb-2">⚠️ Concerns</h4>
                    <ul className="space-y-1">
                        {feasibility.concerns.map((concern, idx) => (
                            <li key={idx} className="text-sm text-gray-300">• {concern}</li>
                        ))}
                    </ul>
                </div>
            )}

            {feasibility.recommendations.length > 0 && (
                <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                    <h4 className="text-sm font-bold text-blue-400 uppercase mb-2">💡 Recommendations</h4>
                    <ul className="space-y-1">
                        {feasibility.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-gray-300">• {rec}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Scope Reduction Suggestions */}
            {feasibility.scopeReduction?.needed && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded">
                    <h4 className="text-sm font-bold text-red-400 uppercase mb-2">🎯 Suggested Scope Reduction</h4>
                    <ul className="space-y-1">
                        {feasibility.scopeReduction.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-gray-300">• {suggestion}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
                <button
                    onClick={onRevise}
                    className="flex-1 px-6 py-3 font-bold text-sm uppercase tracking-wider bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                >
                    Revise Idea
                </button>
                <button
                    onClick={onContinue}
                    className="flex-1 px-6 py-3 font-bold text-sm uppercase tracking-wider bg-electricBlue text-black hover:bg-white hover:shadow-blue-glow transition-all skew-x-[-10deg]"
                >
                    <span className="skew-x-[10deg]">Continue Anyway</span>
                </button>
            </div>
        </div>
    );
};

export default IntentReview;
