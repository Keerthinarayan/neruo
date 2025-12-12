import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphEdge, NodeType } from '../types';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface NetworkGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ data, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);

  // Handle Resize
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
    handleResize(); // Init
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

  // D3 Simulation
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous
    svgSelectionRef.current = svg;

    const width = dimensions.width;
    const height = dimensions.height;

    // Create container group for zoom
    const container = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Type casting for D3 mutable objects
    const nodes = data.nodes.map(d => ({ ...d })) as (GraphNode & d3.SimulationNodeDatum)[];
    const links = data.links.map(d => ({ ...d })) as (GraphEdge & d3.SimulationLinkDatum<d3.SimulationNodeDatum>)[];

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40));

    // Define arrow markers for directed edges
    const defs = container.append("defs");
    
    // Add glow filter
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("height", "300%")
      .attr("width", "300%")
      .attr("x", "-100%")
      .attr("y", "-100%");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw Lines (Edges)
    const link = container.append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#64748b")
      .attr("stroke-width", d => 1 + (d.weight || 0.5));

    // Edge labels
    const linkLabels = container.append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("fill", "#64748b")
      .style("font-size", "8px")
      .style("pointer-events", "none")
      .text(d => d.relation);

    // Node Colors based on type
    const getNodeColor = (type: NodeType) => {
      switch (type) {
        case NodeType.DRUG: return "#3b82f6"; // Blue
        case NodeType.DISEASE: return "#ef4444"; // Red
        case NodeType.GENE: return "#10b981"; // Emerald
        case NodeType.PATHWAY: return "#eab308"; // Yellow
        default: return "#9ca3af";
      }
    };

    const getNodeGradient = (type: NodeType, id: string) => {
      const colors = {
        [NodeType.DRUG]: ["#60a5fa", "#2563eb"],
        [NodeType.DISEASE]: ["#f87171", "#dc2626"],
        [NodeType.GENE]: ["#34d399", "#059669"],
        [NodeType.PATHWAY]: ["#fbbf24", "#d97706"],
      };
      const [start, end] = colors[type] || ["#9ca3af", "#6b7280"];
      
      const gradient = defs.append("radialGradient")
        .attr("id", `gradient-${id}`)
        .attr("cx", "30%")
        .attr("cy", "30%");
      gradient.append("stop").attr("offset", "0%").attr("stop-color", start);
      gradient.append("stop").attr("offset", "100%").attr("stop-color", end);
      
      return `url(#gradient-${id})`;
    };

    // Draw Circles (Nodes)
    const node = container.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => 8 + (d.val || 1) * 1.5)
      .attr("fill", d => {
        getNodeGradient(d.type, d.id);
        return `url(#gradient-${d.id})`;
      })
      .attr("stroke", d => getNodeColor(d.type))
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .attr("filter", "url(#glow)")
      .call(drag(simulation) as any)
      .on("click", (event, d) => {
        setSelectedNode(d as GraphNode);
        if (onNodeClick) onNodeClick(d as GraphNode);
      })
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", (d as any).val ? 12 + (d as any).val * 1.5 : 16)
          .attr("stroke-width", 3);
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", (d as any).val ? 8 + (d as any).val * 1.5 : 12)
          .attr("stroke-width", 2);
      });

    // Labels
    const labels = container.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dx", d => 12 + (d.val || 1))
      .attr("dy", ".35em")
      .attr("fill", "#e2e8f0")
      .style("font-size", "11px")
      .style("font-weight", "500")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.8)")
      .text(d => d.label);

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      linkLabels
        .attr("x", d => ((d.source as any).x + (d.target as any).x) / 2)
        .attr("y", d => ((d.source as any).y + (d.target as any).y) / 2);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);

      labels
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);
    });

    // Drag behavior
    function drag(simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [data, dimensions, onNodeClick]);

  return (
    <div ref={wrapperRef} className="w-full h-full min-h-[350px] bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block" />
      
      {/* Zoom Controls */}
      <div className="absolute top-3 left-3 flex flex-col gap-1">
        <button 
          onClick={handleZoomIn}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={handleReset}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 bg-slate-800 p-2 rounded border border-slate-700 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 mb-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Drug</div>
        <div className="flex items-center gap-1.5 mb-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Disease</div>
        <div className="flex items-center gap-1.5 mb-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Gene</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Pathway</div>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute bottom-3 left-3 right-3 bg-slate-800 p-3 rounded border border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${
                  selectedNode.type === NodeType.DRUG ? 'bg-blue-500' :
                  selectedNode.type === NodeType.DISEASE ? 'bg-red-500' :
                  selectedNode.type === NodeType.GENE ? 'bg-emerald-500' : 'bg-yellow-500'
                }`}></span>
                <span className="text-[10px] uppercase text-slate-500">{selectedNode.type}</span>
              </div>
              <h4 className="text-white text-sm font-medium">{selectedNode.label}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">ID: {selectedNode.id}</p>
            </div>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-slate-500 hover:text-white text-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Node Count */}
      <div className="absolute bottom-3 right-3 text-[10px] text-slate-600">
        {data.nodes.length} nodes • {data.links.length} edges
      </div>
    </div>
  );
};

export default NetworkGraph;
