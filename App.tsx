
import React, { useState } from 'react';
import { VisualType, GenerationResult } from './types';
import { generateVisual, summarizeContent } from './services/geminiService';
import MermaidRenderer from './components/MermaidRenderer';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [visualType, setVisualType] = useState<VisualType>(VisualType.AUTO);
  const [loadingStep, setLoadingStep] = useState<'idle' | 'summarizing' | 'drawing'>('idle');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isUrlInput = /^(http|https):\/\/[^ "]+$/.test(inputText.trim());

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError("请输入文字或粘贴一个网址...");
      return;
    }

    setError(null);
    setResult(null);
    
    try {
      // Step 1: Gemini Summarize / Fetch
      setLoadingStep('summarizing');
      const summary = await summarizeContent(inputText, visualType);
      
      // Step 2: Gemini Draw
      setLoadingStep('drawing');
      const output = await generateVisual(summary, visualType);
      
      setResult(output);
    } catch (err) {
      console.error(err);
      setError("生成失败。可能是内容过于复杂或网络连接问题，请稍后重试。");
    } finally {
      setLoadingStep('idle');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    if (result.type === VisualType.ILLUSTRATION) {
      link.href = result.content;
      link.download = `灵动创作-${Date.now()}.png`;
    } else {
      const svgElement = document.querySelector('.max-w-full svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        link.href = url;
        link.download = `灵动图表-${Date.now()}.svg`;
      }
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-amber-200">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 px-8 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl transition-all group-hover:rotate-6 group-hover:scale-110">
              灵
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">灵动绘图 <span className="text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 ml-2">Smart Visual</span></h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Words & URLs to High-Definition Visuals</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-900 uppercase">Powered by Gemini 3</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">HD Rendering Engine</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main UI */}
      <main className="flex-1 max-w-[90rem] w-full mx-auto p-6 lg:p-10 grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Input Controls */}
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.03)] p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  内容输入
                </label>
                {isUrlInput && (
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">
                    🔗 网址抓取模式
                  </span>
                )}
              </div>
              <textarea
                className="w-full h-80 p-6 rounded-3xl border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-50 outline-none transition-all resize-none text-slate-700 font-medium placeholder:text-slate-300 leading-relaxed shadow-inner"
                placeholder="粘贴文字或网址 (URL)，AI 将自动提炼逻辑并高清渲染..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">渲染引擎</label>
                <div className="relative">
                  <select 
                    className="w-full pl-6 pr-12 py-4 rounded-2xl border-2 border-slate-100 text-sm font-black text-slate-600 focus:border-indigo-400 outline-none appearance-none bg-white cursor-pointer transition-all hover:bg-slate-50"
                    value={visualType}
                    onChange={(e) => setVisualType(e.target.value as VisualType)}
                  >
                    <option value={VisualType.AUTO}>✨ 智能多模态识别</option>
                    <option value={VisualType.ILLUSTRATION}>🎨 高端商务信息图 (深度优化中文)</option>
                    <option value={VisualType.FLOWCHART}>📝 逻辑流程示意图</option>
                    <option value={VisualType.MINDMAP}>🧠 核心思维导图</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={loadingStep !== 'idle'}
                className={`w-full py-5 rounded-3xl font-black text-lg text-white transition-all shadow-2xl active:scale-95 relative overflow-hidden group ${
                  loadingStep !== 'idle' 
                    ? 'bg-slate-200 cursor-not-allowed text-slate-400' 
                    : 'bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-800'
                }`}
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {loadingStep === 'idle' ? (
                    <>
                      <span>开启 AI 高清生成</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>{loadingStep === 'summarizing' ? '正在深度提炼内容逻辑...' : '正在进行高清字符渲染...'}</span>
                    </>
                  )}
                </div>
              </button>
            </div>
            
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0 text-xs">!</div>
                {error}
              </div>
            )}
          </div>
          
          <div className="bg-amber-50/50 rounded-3xl p-6 border border-amber-100/50">
             <h4 className="text-amber-900 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
               💎 高清文字优化已开启
             </h4>
             <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
               为了解决图片中文字乱码的问题，我们已升级至 Gemini 2.5 深度渲染引擎。系统会自动强制模型采用清晰的黑体风格并增加文字对比度，确保中文标签清晰可见。
             </p>
          </div>
        </div>

        {/* Output Area */}
        <div className="xl:col-span-8 flex flex-col h-full">
          <div className="bg-white rounded-[3rem] border border-slate-50 shadow-[0_30px_80px_rgba(0,0,0,0.02)] flex-1 flex flex-col p-10 relative overflow-hidden min-h-[700px]">
            
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight italic">高清画布</h2>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${loadingStep !== 'idle' ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`}></div>
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">HD Visual Studio Live</span>
                </div>
              </div>

              {result && (
                <button 
                  onClick={handleDownload}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 transition-all hover:bg-indigo-700 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  <span>下载高清原图</span>
                </button>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center relative bg-[#F9F9F8] rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-inner group">
              <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/cardboard-flat.png")'}}></div>
              
              {!result && loadingStep === 'idle' && (
                <div className="text-center space-y-8 animate-in fade-in duration-700">
                  <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-xl mx-auto flex items-center justify-center border border-slate-100 transition-transform hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-black text-slate-800 tracking-tight italic">见证 AI 视觉化的艺术</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-12">贴入任意长文或链接，我们将为您呈现高清逻辑图</p>
                  </div>
                </div>
              )}

              {loadingStep !== 'idle' && (
                <div className="flex flex-col items-center gap-10">
                  <div className="relative">
                    <div className="w-24 h-24 border-8 border-indigo-50 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-indigo-500 font-black animate-pulse">渲染中</span>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl text-slate-800 font-black animate-pulse">
                      {loadingStep === 'summarizing' ? '正在提取核心逻辑链条...' : '正在进行像素级高清中文字符渲染...'}
                    </p>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em]">Deep Rendering Pipeline</p>
                  </div>
                </div>
              )}

              {result && loadingStep === 'idle' && (
                <div className="w-full h-full p-8 flex items-center justify-center animate-in zoom-in-95 duration-1000">
                  {result.type === VisualType.ILLUSTRATION ? (
                    <div className="relative p-3 bg-white shadow-2xl rounded-[2rem] border-4 border-white overflow-hidden">
                      <img 
                        src={result.content} 
                        alt="AI Visual" 
                        className="max-w-full max-h-[550px] rounded-xl object-contain shadow-lg"
                      />
                      <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/20">
                        HD Corporate Illustration
                      </div>
                    </div>
                  ) : (
                    <MermaidRenderer chart={result.content} />
                  )}
                </div>
              )}
            </div>

            {result && (
              <div className="mt-8 flex items-center justify-between px-2">
                 <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-full bg-green-50 text-[9px] font-black text-green-600 uppercase tracking-widest border border-green-100">
                      Finished
                    </div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                      Enhanced Typography & Clarity Applied
                    </span>
                 </div>
                 <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest opacity-50">
                   V3.1 HD Engine
                 </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 px-10 border-t border-slate-50 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
             <p className="text-slate-900 text-xs font-black uppercase tracking-[0.2em]">LingDong Drawing Studio</p>
             <p className="text-slate-400 text-[10px] font-bold mt-1 tracking-tight">为您捕捉每一份稍纵即逝的创意逻辑</p>
          </div>
          <div className="flex items-center gap-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">
             <a href="#" className="hover:text-slate-900 transition-colors">条款说明</a>
             <a href="#" className="hover:text-slate-900 transition-colors">隐私保护</a>
             <a href="#" className="hover:text-slate-900 transition-colors">开发者接入</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
