import { useEffect, useRef, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getGraphData } from '../services/api';
import { getStatusColor } from '../utils/helpers';
import type { GraphData } from '../types';

export default function NetworkGraph() {
  const fgRef = useRef<any>();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getGraphData();
        setGraphData(res.data.data);
      } catch { /* noop */ }
    }
    load();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!graphData) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-gbrc-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-white">Network Graph Analytics</h1>
        <p className="text-gbrc-text-dim text-sm mt-1">
          Interactive visualization of supply chain relationships and transaction flow
        </p>
      </div>

      <div className="glass-card flex-1 relative overflow-hidden" ref={containerRef}>
        {/* Legend */}
        <div className="absolute top-4 left-4 z-10 glass-card p-3 rounded-lg flex flex-col gap-2">
          <p className="text-xs font-semibold text-white uppercase tracking-wider mb-1">Status Legend</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gbrc-trusted" />
            <span className="text-xs text-gbrc-text-dim">Trusted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gbrc-warning" />
            <span className="text-xs text-gbrc-text-dim">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gbrc-quarantine" />
            <span className="text-xs text-gbrc-text-dim">Quarantine</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gbrc-slashed" />
            <span className="text-xs text-gbrc-text-dim">Slashed</span>
          </div>
        </div>

        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name"
          nodeColor={(node: any) => getStatusColor(node.status)}
          nodeRelSize={4}
          nodeVal={(node: any) => Math.log10(Math.max(node.val, 1)) * 3}
          linkColor={() => 'rgba(255, 255, 255, 0.1)'}
          linkWidth={(link: any) => Math.log10(Math.max(link.volume, 1))}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={(link: any) => Math.log10(Math.max(link.volume, 1)) * 0.8}
          linkDirectionalParticleSpeed={0.005}
          backgroundColor="transparent"
          onNodeClick={(node: any) => {
            if (fgRef.current) {
              fgRef.current.centerAt(node.x, node.y, 1000);
              fgRef.current.zoom(4, 2000);
            }
          }}
        />
      </div>
    </div>
  );
}
