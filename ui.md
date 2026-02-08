🎨 Tactical UI Design System ("IdeaToRepo" Style)
This guide provides everything you need to replicate this project's "Dark Tactical / Cyberpunk" aesthetic in a new application.

1. Essentials Setup
Install Dependencies
Use Tailwind CSS v4 for the simplest configuration.

npm install tailwindcss @tailwindcss/postcss postcss
Fonts
Add this to your 
index.html
 <head>:

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
CSS Configuration (
index.css
)
Replace your CSS content with this to define the color palette and typography variables.

@import "tailwindcss";
@theme {
  /* Tactical Color Palette */
  --color-nightBlack: #050505;   /* Deepest background */
  --color-nightDark: #0a0a0a;    /* Element background */
  --color-electricBlue: #3b82f6; /* Primary accent (Blue-500) */
  --color-deepBlue: #1e3a8a;     /* Secondary accent (Blue-900) */
  /* Typography */
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  /* FX */
  --shadow-blue-glow: 0 0 15px rgba(59, 130, 246, 0.5);
}
/* Global Reset */
body {
  background-color: var(--color-nightBlack);
  color: #ffffff;
}
/* Custom Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--color-nightBlack); }
::-webkit-scrollbar-thumb { background: var(--color-deepBlue); }
::-webkit-scrollbar-thumb:hover { background: var(--color-electricBlue); }
2. Page Layout (The "Atmosphere")
Use this wrapper in your 
App.tsx
 or Layout.tsx to get the glowing background effects.

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-nightBlack text-white overflow-x-hidden font-sans relative">
      
      {/* Background Ambience - Sharp Blue Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-deepBlue/20 rounded-full blur-[100px]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[60%] bg-electricBlue/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-electricBlue/20 to-transparent"></div>
      </div>
      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 w-full">
        {children}
      </main>
    </div>
  );
}
3. Core Components
The "Hero Title" (Skewed & Gradient)
export function HeroTitle() {
  return (
    <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic transform -skew-x-6 inline-block">
      <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">IDEA</span>
      <span className="text-electricBlue mx-4">//</span>
      {/* Note: 'pr-4' prevents the italic 'O' from being clipped */}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-electricBlue to-white drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] pr-4">
        REPO
      </span>
    </h1>
  );
}
The "Cyber Input" (Glow Border)
export function CyberInput() {
  return (
    <div className="relative group w-full max-w-xl">
      {/* Animated Glow Border */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-electricBlue to-deepBlue rounded-lg opacity-30 group-hover:opacity-100 transition duration-200 blur-[2px]"></div>
      
      {/* Input Field */}
      <div className="relative bg-black rounded-lg p-1">
        <input 
          type="text" 
          placeholder="ENTER COMMAND..." 
          className="w-full bg-nightDark/90 text-white placeholder-gray-700 p-4 border-none focus:outline-none rounded-md font-bold uppercase tracking-widest"
        />
      </div>
    </div>
  );
}
The "Tactical Button" (Skewed Action)
export function ActionButton({ label }: { label: string }) {
  return (
    <button className="relative px-10 py-3 font-black text-sm uppercase tracking-widest transition-all duration-200 skew-x-[-10deg] bg-electricBlue text-black hover:bg-white hover:text-electricBlue hover:shadow-blue-glow">
      <span className="block skew-x-[10deg]">
        {label}
      </span>
    </button>
  );
}
4. Design Philosophy
Colors: Avoid pure black (#000000) for containers; use nightBlack (#050505) or nightDark (#0a0a0a).
Typography: Use ITALIC + SKEW (-skew-x-6) for headers to give speed/aggression.
Lighting: Everything should self-illuminate. Use drop-shadow on text and blur on background accents.
Borders: Don't use standard borders. Use a div behind the element with a gradient background (-inset-0.5) to create a "laser cut" border effect.