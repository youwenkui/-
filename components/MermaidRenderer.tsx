
import React, { useEffect, useRef, useState } from 'react';

// Declare mermaid on window as it's loaded via CDN in index.html
declare const mermaid: any;

interface MermaidRendererProps {
  chart: string;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chart) return;

    const renderChart = async () => {
      try {
        setError(null);
        // Robust Chinese font stack for system-rendered diagrams
        const chineseFonts = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", "sans-serif"';
        const handDrawnFonts = '"Comic Sans MS", "Chalkboard SE", "Marker Felt", ' + chineseFonts;

        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          look: 'handDrawn',
          securityLevel: 'loose',
          fontFamily: handDrawnFonts,
          themeVariables: {
            fontFamily: handDrawnFonts,
            primaryColor: '#fef3c7',
            lineColor: '#57534e',
            textColor: '#1c1917',
            mainBkg: '#fffbeb',
            nodeBorder: '#d97706',
            clusterBkg: '#fafaf9'
          }
        });

        const id = `mermaid-svg-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (err) {
        console.error("Mermaid Render Error:", err);
        setError("无法渲染手绘图表，请尝试简化内容。");
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center justify-center min-h-[300px] font-sans text-sm font-bold">
        {error}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full overflow-auto bg-[#fefcf6] rounded-3xl shadow-inner p-10 min-h-[400px] border border-stone-100 relative group">
      {/* Decorative corners for a more premium sketchbook feel */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-stone-200 rounded-tl-lg"></div>
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-stone-200 rounded-tr-lg"></div>
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-stone-200 rounded-bl-lg"></div>
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-stone-200 rounded-br-lg"></div>

      <div 
        ref={containerRef} 
        dangerouslySetInnerHTML={{ __html: svg }} 
        className="max-w-full sketchy-diagram transition-transform duration-500 group-hover:scale-[1.01]"
      />
      <style>{`
        .sketchy-diagram svg {
          filter: drop-shadow(4px 4px 6px rgba(0,0,0,0.04));
        }
        /* Ensure text in SVG inherits the font stack correctly */
        .sketchy-diagram text {
          font-weight: 600 !important;
        }
      `}</style>
    </div>
  );
};

export default MermaidRenderer;
