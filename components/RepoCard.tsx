import React from 'react';
import { Repository } from '../types';

interface RepoCardProps {
  repo: Repository;
}

const RepoCard: React.FC<RepoCardProps> = ({ repo }) => {
  return (
    <div className="group relative flex flex-col justify-between p-6 bg-nightDark border border-gray-800 hover:border-electricBlue transition-all duration-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] rounded-lg">
      
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-transparent border-r-gray-800 group-hover:border-r-electricBlue transition-colors duration-200"></div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
             <img 
                src={repo.owner.avatar_url} 
                alt={repo.owner.login} 
                className="w-10 h-10 grayscale group-hover:grayscale-0 transition-all duration-300 border border-gray-700"
              />
              <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay"></div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-electricBlue transition-colors duration-200">
              {repo.name}
            </h3>
            <p className="text-[10px] font-mono text-gray-500 uppercase">//{repo.owner.login}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-gray-400 font-mono text-xs bg-black px-2 py-1 border border-gray-800">
          <span>★</span>
          <span>{repo.stargazers_count.toLocaleString()}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed font-sans border-l-2 border-gray-800 pl-3 group-hover:border-electricBlue/50 transition-colors">
        {repo.description}
      </p>

      {/* Footer info */}
      <div className="mt-auto">
        <div className="flex flex-wrap gap-2 mb-4">
          {repo.topics.slice(0, 3).map((topic) => (
            <span key={topic} className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider bg-gray-900 text-gray-500 border border-gray-800 group-hover:text-electricBlue group-hover:border-electricBlue/30 transition-colors">
              {topic}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between border-t border-gray-900 pt-4 mt-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-electricBlue rounded-none rotate-45"></span>
            <span className="text-xs text-gray-500 font-mono uppercase">{repo.language}</span>
          </div>
          
          <a 
            href={repo.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative px-5 py-2 font-black text-[10px] uppercase tracking-widest transition-all duration-200 skew-x-[-10deg] bg-electricBlue text-black hover:bg-white hover:text-electricBlue hover:shadow-blue-glow group/btn"
          >
            <span className="flex items-center gap-1 skew-x-[10deg]">
              ACCESS
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default RepoCard;