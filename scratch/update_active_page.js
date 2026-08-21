const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/sprints/active/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Imports
content = content.replace(
  'import Editor from "@monaco-editor/react";',
  'import Editor from "@monaco-editor/react";\nimport * as faceapi from "@vladmandic/face-api";'
);

// 2. Add modelsLoaded ref inside SprintActiveContent
content = content.replace(
  'const containerRef = useRef<HTMLDivElement>(null);',
  `const containerRef = useRef<HTMLDivElement>(null);\n  const modelsLoaded = useRef(false);\n\n  useEffect(() => {\n    const loadModels = async () => {\n      try {\n        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');\n        modelsLoaded.current = true;\n      } catch (e) {\n        console.error("FaceAPI load error:", e);\n      }\n    };\n    loadModels();\n  }, []);`
);

// 3. Update snapInterval for face detection
content = content.replace(
  `snapInterval = setInterval(() => {`,
  `snapInterval = setInterval(async () => {`
);
content = content.replace(
  `// Sync to backend silently directly with PUT since we have participantId\n            fetch(\`/api/sprints/participants\`, {\n              method: "PUT",\n              headers: { "Content-Type": "application/json" },\n              body: JSON.stringify({ id: participantId, latestSnapshot: b64 })\n            });`,
  `// Sync to backend silently directly with PUT since we have participantId
            fetch(\`/api/sprints/participants\`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: participantId, latestSnapshot: b64 })
            });
            
            if (modelsLoaded.current) {
              try {
                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
                if (detections.length === 0) {
                  issueWarning("Face not detected in camera frame.");
                }
              } catch(err) {}
            }`
);

// 4. Timer Logic Fix
content = content.replace(
  `useEffect(() => {\n    if (!sprint || isLocked || isSubmitted) return;`,
  `useEffect(() => {\n    if (!sprint || !sprint.isStarted || isLocked || isSubmitted) return;`
);

// 5. Theme Refactoring
// We'll replace dark mode classes with light mode Red/White equivalents.
// Fullscreen overlay
content = content.replace('bg-zinc-950/95 backdrop-blur-md', 'bg-red-50/95 backdrop-blur-md');
content = content.replace('bg-zinc-900 p-10', 'bg-white p-10');
content = content.replace('shadow-[0_0_50px_rgba(16,185,129,0.1)] border border-emerald-900', 'shadow-[0_0_50px_rgba(230,30,50,0.1)] border border-red-200');
content = content.replace('text-emerald-500 mx-auto animate-pulse', 'text-red-600 mx-auto animate-pulse');
content = content.replace('bg-emerald-600 hover:bg-emerald-500 text-white', 'bg-red-600 hover:bg-red-500 text-white');

// Header
content = content.replace('<header className="bg-zinc-900 text-white', '<header className="bg-white text-zinc-900 border-b border-red-100');
content = content.replace('bg-emerald-500 w-8 h-8 rounded-lg flex items-center justify-center font-bold', 'bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold');
content = content.replace('text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-900/50', 'text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200');

// Main layout wrapper
content = content.replace('<div className="w-[500px] shrink-0 bg-[#0e141e] border-r border-zinc-800 flex relative text-zinc-200">', '<div className="w-[500px] shrink-0 bg-red-50 border-r border-red-200 flex relative text-zinc-800">');

// Vertical Question List
content = content.replace('<div className="w-20 shrink-0 bg-[#0e141e] border-r border-zinc-800 flex flex-col items-center py-6 gap-3 overflow-y-auto hide-scrollbar z-10 relative">', '<div className="w-20 shrink-0 bg-white border-r border-red-200 flex flex-col items-center py-6 gap-3 overflow-y-auto hide-scrollbar z-10 relative">');

// Active / solved logic in Question List
content = content.replace('"bg-[#151e2b] shadow-lg scale-110 z-10 text-white border border-zinc-700"', '"bg-red-600 shadow-lg scale-110 z-10 text-white border border-red-700"');
content = content.replace('"bg-emerald-950/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-900/30"', '"bg-green-50 text-green-600 border border-green-300 hover:bg-green-100"');
content = content.replace('"bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"', '"bg-zinc-100 text-zinc-600 border border-zinc-300 hover:bg-zinc-200"');
content = content.replace('"bg-[#151e2b] text-zinc-500 border border-transparent hover:text-zinc-300 hover:bg-zinc-800/50"', '"bg-white text-zinc-500 border border-zinc-200 hover:text-zinc-700 hover:bg-zinc-50"');
content = content.replace('text-emerald-500 absolute -top-1.5 -right-1.5 bg-[#0e141e]', 'text-green-500 absolute -top-1.5 -right-1.5 bg-white');

// Question content area
content = content.replace('text-2xl font-black text-white', 'text-2xl font-black text-zinc-900');
content = content.replace('border-b border-zinc-800 pb-5', 'border-b border-red-200 pb-5');
content = content.replace('bg-[#1a2b22] text-[#2ec866] border border-[#2ec866]/30', 'bg-green-100 text-green-700 border border-green-300');
content = content.replace('bg-zinc-800 text-zinc-300', 'bg-red-100 text-red-700');
content = content.replace('text-[14px] text-zinc-300', 'text-[14px] text-zinc-700');

// Sample Inputs
content = content.replace(/bg-\[#151e2b\]/g, 'bg-white');
content = content.replace(/border-zinc-800/g, 'border-red-200');
content = content.replace(/text-zinc-300/g, 'text-zinc-800');

// Right Editor Panel
content = content.replace('<div className="flex-1 flex flex-col bg-zinc-950">', '<div className="flex-1 flex flex-col bg-white">');
content = content.replace('<div className="flex items-center justify-between px-4 py-3 bg-[#1e293b] border-b border-zinc-800">', '<div className="flex items-center justify-between px-4 py-3 bg-red-50 border-b border-red-200">');
content = content.replace('bg-[#0f172a] text-emerald-400 font-bold text-xs px-3 py-1.5 rounded border border-zinc-700 outline-none focus:border-emerald-500', 'bg-white text-red-600 font-bold text-xs px-3 py-1.5 rounded border border-red-200 outline-none focus:border-red-500');

// Monaco Theme
content = content.replace('theme="vs-dark"', 'theme="light"');

// Test Suite output area
content = content.replace('<div className="h-56 bg-zinc-900 border-t border-zinc-800 flex flex-col">', '<div className="h-56 bg-white border-t border-red-200 flex flex-col">');
content = content.replace('text-[10px] font-extrabold text-zinc-400 uppercase', 'text-[10px] font-extrabold text-zinc-600 uppercase');
content = content.replace('bg-emerald-600 text-white', 'bg-red-600 text-white');
content = content.replace('text-emerald-400', 'text-green-600');
content = content.replace('text-zinc-500 flex justify-center', 'text-zinc-500 flex justify-center');
content = content.replace(/text-red-400/g, 'text-red-600');


fs.writeFileSync(targetPath, content);
console.log('Update complete.');
