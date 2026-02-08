import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, ChevronRight, ChevronDown, File } from 'lucide-react';
import { TreeNode } from '../types';

interface FileTreeViewerProps {
  data: TreeNode[];
  onSelect: (node: TreeNode) => void;
  selectedFile?: string;
}

const FileTreeNode: React.FC<{ 
  node: TreeNode; 
  depth: number; 
  onSelect: (node: TreeNode) => void; 
  selectedFile?: string 
}> = ({ node, depth, onSelect, selectedFile }) => {
  const [isOpen, setIsOpen] = useState(true); // Default open for better visibility
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'file') {
      onSelect(node);
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Simple name check. In production, use full path or ID.
  const isSelected = node.name === selectedFile; 

  return (
    <div>
      <div 
        className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer transition-all duration-150 select-none border-l-2
          ${isSelected 
            ? 'bg-electricBlue/10 text-electricBlue border-electricBlue' 
            : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }
        `}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={handleSelect}
      >
        <span 
          onClick={node.type === 'folder' ? handleToggle : undefined}
          className={`flex items-center justify-center w-4 h-4 rounded hover:bg-white/10 ${node.type === 'folder' ? 'cursor-pointer' : ''}`}
        >
           {node.type === 'folder' && (
             isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
           )}
        </span>
        
        {node.type === 'folder' ? (
           isOpen 
             ? <FolderOpen size={16} className={isSelected ? 'text-electricBlue' : 'text-blue-400'} /> 
             : <Folder size={16} className={isSelected ? 'text-electricBlue' : 'text-blue-400'} />
        ) : (
           <FileCode size={16} className={isSelected ? 'text-electricBlue' : 'text-gray-500'} />
        )}
        
        <span className={`text-xs font-mono truncate ${isSelected ? 'font-bold' : ''}`}>
          {node.name}
        </span>
      </div>
      
      {node.type === 'folder' && isOpen && node.children && (
        <div>
          {node.children.map((child, idx) => (
            <FileTreeNode 
              key={`${child.name}-${idx}`} 
              node={child} 
              depth={depth + 1} 
              onSelect={onSelect}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FileTreeViewer({ data, onSelect, selectedFile }: FileTreeViewerProps) {
  return (
    <div className="flex flex-col select-none w-full">
       {data.map((node, idx) => (
         <FileTreeNode 
           key={`${node.name}-${idx}`} 
           node={node} 
           depth={0} 
           onSelect={onSelect}
           selectedFile={selectedFile}
         />
       ))}
    </div>
  );
}