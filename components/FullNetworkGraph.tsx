import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Maximize2, Info, Filter, Layers, ChevronRight, ChevronLeft } from 'lucide-react';

interface NetworkNode {
  id: string;
  name: string;
  type: string;
  isCenter?: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface NetworkEdge {
  source: string | NetworkNode;
  target: string | NetworkNode;
  relationship: string;
  relationType?: string;
  pathType?: string;
}

interface FullNetworkGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  centerNode?: { id: string; name: string; type: string };
  title?: string;
  onNodeClick?: (node: NetworkNode) => void;
}

// Color scheme for different node types
const NODE_COLORS: Record<string, { fill: string; stroke: string; glow: string }> = {
  'Compound': { fill: '#3b82f6', stroke: '#60a5fa', glow: '#3b82f6' },
  'Drug': { fill: '#3b82f6', stroke: '#60a5fa', glow: '#3b82f6' },
  'drug': { fill: '#3b82f6', stroke: '#60a5fa', glow: '#3b82f6' },
  'Disease': { fill: '#ef4444', stroke: '#f87171', glow: '#ef4444' },
  'disease': { fill: '#ef4444', stroke: '#f87171', glow: '#ef4444' },
  'Gene': { fill: '#10b981', stroke: '#34d399', glow: '#10b981' },
  'gene': { fill: '#10b981', stroke: '#34d399', glow: '#10b981' },
  'target_gene': { fill: '#10b981', stroke: '#34d399', glow: '#10b981' },
  'upregulated_gene': { fill: '#22c55e', stroke: '#4ade80', glow: '#22c55e' },
  'downregulated_gene': { fill: '#f97316', stroke: '#fb923c', glow: '#f97316' },
  'interacting_gene': { fill: '#14b8a6', stroke: '#2dd4bf', glow: '#14b8a6' },
  'Pathway': { fill: '#eab308', stroke: '#facc15', glow: '#eab308' },
  'pathway': { fill: '#eab308', stroke: '#facc15', glow: '#eab308' },
  'Anatomy': { fill: '#ec4899', stroke: '#f472b6', glow: '#ec4899' },
  'anatomy': { fill: '#ec4899', stroke: '#f472b6', glow: '#ec4899' },
  'SideEffect': { fill: '#f43f5e', stroke: '#fb7185', glow: '#f43f5e' },
  'Symptom': { fill: '#a855f7', stroke: '#c084fc', glow: '#a855f7' },
  'symptom': { fill: '#a855f7', stroke: '#c084fc', glow: '#a855f7' },
  'PharmacologicClass': { fill: '#6366f1', stroke: '#818cf8', glow: '#6366f1' },
  'class': { fill: '#6366f1', stroke: '#818cf8', glow: '#6366f1' },
  'similar_disease': { fill: '#f87171', stroke: '#fca5a5', glow: '#f87171' },
  'similar_drug': { fill: '#60a5fa', stroke: '#93c5fd', glow: '#60a5fa' },
  'default': { fill: '#6b7280', stroke: '#9ca3af', glow: '#6b7280' }
};

// Edge colors by relationship type
const EDGE_COLORS: Record<string, string> = {
  'TREATS': '#22c55e',
  'PALLIATES': '#84cc16',
  'BINDS': '#3b82f6',
  'TARGETS': '#3b82f6',
  'ASSOCIATES': '#a855f7',
  'RESEMBLES': '#f59e0b',
  'UPREGULATES': '#22c55e',
  'DOWNREGULATES': '#ef4444',
  'LOCALIZES': '#ec4899',
  'PRESENTS': '#a855f7',
  'PARTICIPATES': '#eab308',
  'INTERACTS': '#14b8a6',
  'INCLUDES': '#6366f1',
  'EXPRESSES': '#f472b6',
  'default': '#64748b'
};

const getNodeColor = (type: string) => NODE_COLORS[type] || NODE_COLORS['default'];
const getEdgeColor = (rel: string) => EDGE_COLORS[rel] || EDGE_COLORS['default'];

export const FullNetworkGraph: React.FC<FullNetworkGraphProps> = ({
  nodes,
  edges,
  centerNode,
  title,
  onNodeClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);

  // Get unique node types
  const nodeTypes = [...new Set(nodes.map(n => n.type))];

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        setDimensions({
          width: wrapperRef.current.clientWidth,
          height: wrapperRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleZoomIn = () => {
    if (svgSelectionRef.current && zoomRef.current) {
      svgSelectionRef.current.transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgSelectionRef.current && zoomRef.current) {
      svgSelectionRef.current.transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
    }
  };

  const handleReset = () => {
    if (svgSelectionRef.current && zoomRef.current) {
      svgSelectionRef.current.transition().duration(500).call(
        zoomRef.current.transform,
        d3.zoomIdentity
      );
    }
  };

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svgSelectionRef.current = svg;

    const width = dimensions.width;
    const height = dimensions.height;

    // Create container group for zoom
    const container = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Filter nodes by selected types
    const filteredNodes = selectedTypes.size === 0
      ? nodes
      : nodes.filter(n => selectedTypes.has(n.type) || n.isCenter);

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = edges.filter(e => {
      const sourceId = typeof e.source === 'string' ? e.source : e.source.id;
      const targetId = typeof e.target === 'string' ? e.target : e.target.id;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    // Clone nodes/edges for D3 mutation
    const simNodes = filteredNodes.map(d => ({ ...d })) as (NetworkNode & d3.SimulationNodeDatum)[];
    const simEdges = filteredEdges.map(d => ({ ...d })) as (NetworkEdge & d3.SimulationLinkDatum<d3.SimulationNodeDatum>)[];

    // Create definitions for gradients and filters
    const defs = container.append("defs");

    // Glow filter
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("height", "300%")
      .attr("width", "300%")
      .attr("x", "-100%")
      .attr("y", "-100%");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Create gradients for each node type
    Object.entries(NODE_COLORS).forEach(([type, colors]) => {
      const gradient = defs.append("radialGradient")
        .attr("id", `gradient-${type.replace(/\s+/g, '-')}`)
        .attr("cx", "30%")
        .attr("cy", "30%");
      gradient.append("stop").attr("offset", "0%").attr("stop-color", colors.stroke);
      gradient.append("stop").attr("offset", "100%").attr("stop-color", colors.fill);
    });

    // Arrow markers for each relationship type
    Object.entries(EDGE_COLORS).forEach(([rel, color]) => {
      defs.append("marker")
        .attr("id", `arrow-${rel}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", color);
    });

    // Simulation
    const simulation = d3.forceSimulation(simNodes)
      .force("link", d3.forceLink(simEdges).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(35));

    // Draw edges
    const linkGroup = container.append("g").attr("class", "links");

    const link = linkGroup.selectAll("g")
      .data(simEdges)
      .join("g");

    link.append("line")
      .attr("stroke", d => getEdgeColor(d.relationship))
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", d => `url(#arrow-${d.relationship})`)
      .style("filter", "drop-shadow(0 0 2px rgba(0,0,0,0.5))");

    // Edge labels
    const edgeLabels = link.append("text")
      .text(d => d.relationship)
      .attr("fill", d => getEdgeColor(d.relationship))
      .attr("font-size", "9px")
      .attr("font-weight", "500")
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .style("pointer-events", "none")
      .style("opacity", 0.8);

    // Draw nodes
    const nodeGroup = container.append("g").attr("class", "nodes");

    const node = nodeGroup.selectAll("g")
      .data(simNodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Node circles
    node.append("circle")
      .attr("r", d => d.isCenter ? 25 : 18)
      .attr("fill", d => {
        const colors = getNodeColor(d.type);
        return `url(#gradient-${d.type.replace(/\s+/g, '-')})` || colors.fill;
      })
      .attr("stroke", d => getNodeColor(d.type).stroke)
      .attr("stroke-width", d => d.isCenter ? 3 : 2)
      .style("filter", d => d.isCenter ? "url(#glow)" : "none");

    // Node labels
    node.append("text")
      .text(d => d.name?.length > 15 ? d.name.slice(0, 15) + '...' : d.name)
      .attr("dy", d => d.isCenter ? 38 : 30)
      .attr("text-anchor", "middle")
      .attr("fill", "#e5e7eb")
      .attr("font-size", d => d.isCenter ? "12px" : "10px")
      .attr("font-weight", d => d.isCenter ? "600" : "500")
      .style("pointer-events", "none")
      .style("text-shadow", "0 0 4px rgba(0,0,0,0.8)");

    // Node type icons/labels
    node.append("text")
      .text(d => {
        const typeMap: Record<string, string> = {
          'Compound': '💊',
          'Drug': '💊',
          'drug': '💊',
          'Disease': '🦠',
          'disease': '🦠',
          'Gene': '🧬',
          'gene': '🧬',
          'target_gene': '🎯',
          'upregulated_gene': '⬆️',
          'downregulated_gene': '⬇️',
          'interacting_gene': '🔗',
          'Pathway': '🛤️',
          'pathway': '🛤️',
          'Anatomy': '🫀',
          'anatomy': '🫀',
          'Symptom': '🩺',
          'symptom': '🩺',
          'similar_disease': '🔄',
          'similar_drug': '🔄',
          'class': '📁',
        };
        return typeMap[d.type] || '•';
      })
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .attr("font-size", d => d.isCenter ? "14px" : "12px")
      .style("pointer-events", "none");

    // Hover effects
    node.on("mouseenter", function (event, d) {
      setHoveredNode(d);
      d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("r", d.isCenter ? 30 : 22)
        .style("filter", "url(#glow)");
    })
      .on("mouseleave", function (event, d) {
        setHoveredNode(null);
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", d.isCenter ? 25 : 18)
          .style("filter", d.isCenter ? "url(#glow)" : "none");
      })
      .on("click", (event, d) => {
        if (onNodeClick) onNodeClick(d);
      });

    // Update positions on tick
    simulation.on("tick", () => {
      link.select("line")
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      edgeLabels
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Initial zoom to fit
    setTimeout(() => {
      svg.transition().duration(500).call(
        zoom.transform,
        d3.zoomIdentity.translate(0, 0).scale(0.9)
      );
    }, 500);

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, dimensions, selectedTypes, onNodeClick]);

  const toggleType = (type: string) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedTypes(newSelected);
  };

  return (
    <div className="flex w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-white/10 relative group">

      {/* Left Sidebar - Filters */}
      <div
        className={`bg-black/80 backdrop-blur-xl border-r border-white/10 transition-all duration-300 flex flex-col z-20 ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-400" />
            Filters
          </h3>
        </div>

        <div className="p-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="text-xs font-bold text-gray-500 uppercase mb-3 text-left">Node Types</div>
          <div className="space-y-2">
            {nodeTypes.map((type: string) => {
              const colors = getNodeColor(type);
              const isSelected = selectedTypes.size === 0 || selectedTypes.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${isSelected ? 'bg-white/10 text-white border border-white/10' : 'text-gray-500 hover:bg-white/5 border border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: colors.fill, color: colors.fill }}></span>
                    {type.replace(/_/g, ' ')}
                  </div>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-black/40 flex-shrink-0 mb-4 pb-8">
          <div className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <Layers className="w-3 h-3" /> Legend
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 p-1.5 rounded">
              <span className="text-sm">💊</span> Drug
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 p-1.5 rounded">
              <span className="text-sm">🦠</span> Disease
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 p-1.5 rounded">
              <span className="text-sm">🧬</span> Gene
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 p-1.5 rounded">
              <span className="text-sm">🛤️</span> Pathway
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative h-full flex flex-col z-0">

        {/* Graph Header / Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-black/50 backdrop-blur border border-white/10 hover:bg-white/10 rounded-lg text-white transition-colors shadow-lg"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Header Info */}
        {title && (
          <div className="absolute top-4 left-16 z-10 bg-black/50 backdrop-blur px-4 py-2 rounded-xl border border-white/10 shadow-lg pointer-events-none">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-[10px] text-gray-300">{nodes.length} nodes • {edges.length} connections</p>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button onClick={handleZoomIn} className="p-2 bg-black/50 backdrop-blur border border-white/10 hover:bg-white/10 rounded-lg transition-colors text-white shadow-lg" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleZoomOut} className="p-2 bg-black/50 backdrop-blur border border-white/10 hover:bg-white/10 rounded-lg transition-colors text-white shadow-lg" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={handleReset} className="p-2 bg-black/50 backdrop-blur border border-white/10 hover:bg-white/10 rounded-lg transition-colors text-white shadow-lg" title="Reset View">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* SVG Canvas */}
        <div ref={wrapperRef} className="w-full h-full bg-[#111111] bg-grid-pattern cursor-grab active:cursor-grabbing">
          <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
        </div>

      </div>

      {/* Hover Info Tooltip - Moved to TOP LEFTish, but away from Sidebar to prevent overlap issues */}
      {hoveredNode && (
        <div className="absolute top-20 right-4 z-50 bg-gray-900/90 backdrop-blur-xl rounded-xl p-4 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] max-w-sm pointer-events-none animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div
              className="p-3 rounded-xl flex-shrink-0 shadow-lg"
              style={{ backgroundColor: `${getNodeColor(hoveredNode.type).fill}30`, color: getNodeColor(hoveredNode.type).fill }}
            >
              <Info className="w-6 h-6" />
            </div>
            <div>
              <div className="text-white font-bold text-lg mb-1 leading-tight">{hoveredNode.name}</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/10 text-gray-300 border border-white/5">
                  {hoveredNode.type.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-gray-500 text-[10px] font-mono bg-black/50 px-2 py-1 rounded inline-block border border-white/5">
                ID: {hoveredNode.id}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullNetworkGraph;
