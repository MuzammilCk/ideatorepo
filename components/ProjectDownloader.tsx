import React, { useState } from 'react';
import JSZip from 'jszip';
import { Download, Check, Loader2 } from 'lucide-react';
import { GeneratedProject } from '../types';

interface ProjectDownloaderProps {
  project: GeneratedProject;
}

const ProjectDownloader: React.FC<ProjectDownloaderProps> = ({ project }) => {
  const [status, setStatus] = useState<'idle' | 'zipping' | 'downloaded'>('idle');

  const handleDownload = async () => {
    setStatus('zipping');
    try {
      // @ts-ignore - JSZip is loaded via import map
      const zip = new JSZip();
      
      // Add all files to the zip
      project.files.forEach(file => {
         // Ensure clean relative paths (remove leading slash)
         const path = file.path.startsWith('/') ? file.path.slice(1) : file.path;
         zip.file(path, file.content);
      });
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name ? project.name.toLowerCase().replace(/\s+/g, '-') : 'ideatorepo-project'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setStatus('downloaded');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error("Failed to zip project:", error);
      setStatus('idle');
    }
  };

  return (
    <button 
        onClick={handleDownload}
        disabled={status === 'zipping'}
        className={`relative px-6 py-2 font-black text-xs uppercase tracking-widest transition-all duration-200 skew-x-[-10deg] flex items-center gap-2
            ${status === 'downloaded' 
                ? 'bg-green-500 text-black border border-green-500' 
                : 'bg-electricBlue text-black hover:bg-white hover:text-electricBlue hover:shadow-blue-glow'
            }
        `}
    >
        <span className="skew-x-[10deg] flex items-center gap-2">
            {status === 'zipping' && <Loader2 size={14} className="animate-spin" />}
            {status === 'downloaded' && <Check size={14} />}
            {status === 'idle' && <Download size={14} />}
            
            {status === 'zipping' ? 'COMPRESSING...' : status === 'downloaded' ? 'DOWNLOADED' : 'DOWNLOAD ZIP'}
        </span>
    </button>
  );
};

export default ProjectDownloader;