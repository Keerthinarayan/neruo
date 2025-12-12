import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Explanation } from '../services/api';

interface GraphViewProps {
    explanation: Explanation;
}

export const GraphView: React.FC<GraphViewProps> = ({ explanation }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!explanation || !explanation.path || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous

        const width = 600;
        const height = 300;

        const pathData = explanation.path;
        const nodes: any[] = [];
        const links: any[] = [];
        const nodeIds = new Set();

        // Parse flat path list: [Node, Rel, Node, Rel, Node]
        if (Array.isArray(pathData)) {
            for (let i = 0; i < pathData.length; i += 2) {
                const nodeData = pathData[i];
                // Check if valid node object
                if (nodeData && typeof nodeData === 'object' && nodeData.id) {
                    if (!nodeIds.has(nodeData.id)) {
                        nodes.push({ ...nodeData, x: width / 2 + (Math.random() - 0.5) * 50, y: height / 2 + (Math.random() - 0.5) * 50 });
                        nodeIds.add(nodeData.id);
                    }

                    // If there is a next relationship and node
                    if (i + 2 < pathData.length) {
                        const relLabel = pathData[i + 1];
                        const targetNode = pathData[i + 2];
                        if (targetNode && targetNode.id) {
                            // Ensure target node is also added if not already
                            if (!nodeIds.has(targetNode.id)) {
                                nodes.push({ ...targetNode, x: width / 2 + (Math.random() - 0.5) * 50, y: height / 2 + (Math.random() - 0.5) * 50 });
                                nodeIds.add(targetNode.id);
                            }

                            links.push({
                                source: nodeData.id,
                                target: targetNode.id,
                                label: relLabel
                            });
                        }
                    }
                }
            }
        }

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(35));

        // Arrow marker
        svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 25)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#9ca3af");

        const link = svg.append("g")
            .selectAll("line")
            .data(links)
            .enter().append("g");

        link.append("line")
            .attr("stroke", "#4b5563")
            .attr("stroke-width", 1.5)
            .attr("marker-end", "url(#arrowhead)");

        link.append("text")
            .text((d: any) => d.label)
            .attr("fill", "#9ca3af")
            .attr("font-size", "10px")
            .attr("text-anchor", "middle")
            .attr("dy", -5);

        const node = svg.append("g")
            .selectAll("g")
            .data(nodes)
            .enter().append("g")
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

        node.append("circle")
            .attr("r", 15)
            .attr("fill", (d: any) => {
                if (d.id.includes('Disease')) return '#ef4444';
                if (d.id.includes('Compound')) return '#8b5cf6';
                return '#3b82f6';
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);

        node.append("text")
            .text((d: any) => d.name)
            .attr("x", 18)
            .attr("y", 4)
            .attr("fill", "#e5e7eb")
            .attr("font-size", "12px")
            .style("pointer-events", "none");

        simulation.on("tick", () => {
            link.select("line")
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            link.select("text")
                .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
                .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

            node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        });

    }, [explanation]);

    return (
        <div className="border border-gray-700 rounded p-4 bg-gray-900">
            <h4 className="text-sm font-semibold mb-2 text-gray-300">{explanation.rule}</h4>
            <svg ref={svgRef} width="100%" height="300" viewBox="0 0 600 300" className="bg-black rounded cursor-move" />
        </div>
    );
};
