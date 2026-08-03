import { useMemo } from "react";
import { measureLabelBox, resolveLabelCollisions, wrapLabel } from "./graphMath";

const EDGE_COLOR = { synergy: "#2f9e44", tension: "#e03131" };
const LABEL_MAX_WIDTH = 92;
const FONT_SIZE = 11;
const LINE_HEIGHT = 13;

function nodeRadius(node) {
  return Math.min(22, 8 + node.degree * 1.6);
}

function useLabelLayout(nodes) {
  return useMemo(() => {
    const boxes = nodes.map((node) => {
      const lines = wrapLabel(node.label, LABEL_MAX_WIDTH, FONT_SIZE);
      const { width, height } = measureLabelBox(lines, FONT_SIZE, LINE_HEIGHT);
      const anchorY = node.y + nodeRadius(node) + 14 + height / 2;
      return { id: node.id, x: node.x, y: anchorY, width, height, lines };
    });
    const resolved = resolveLabelCollisions(boxes, { padding: 5, iterations: 80 });
    return new Map(resolved.map((box, i) => [box.id, { ...box, lines: boxes[i].lines }]));
  }, [nodes]);
}

export default function GraphView({ data }) {
  const { canvas, nodes, edges } = data;
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const labelById = useLabelLayout(nodes);
  const communities = useMemo(() => {
    const seen = new Map();
    for (const node of nodes) {
      if (!seen.has(node.community)) seen.set(node.community, node.color);
    }
    return [...seen.entries()].sort((a, b) => a[0] - b[0]);
  }, [nodes]);

  return (
    <div className="graph-panel">
      <svg
        className="graph-svg"
        viewBox={`0 0 ${canvas.width} ${canvas.height}`}
        role="img"
        aria-label="Cognitive identity network graph"
      >
        <g className="edges">
          {edges.map((edge) => {
            const source = nodeById.get(edge.source);
            const target = nodeById.get(edge.target);
            if (!source || !target) return null;
            return (
              <line
                key={`${edge.source}-${edge.target}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={EDGE_COLOR[edge.kind]}
                strokeWidth={1 + edge.weight * 3}
                strokeOpacity={0.35 + edge.weight * 0.4}
              />
            );
          })}
        </g>

        <g className="labels">
          {nodes.map((node) => {
            const box = labelById.get(node.id);
            if (!box) return null;
            const r = nodeRadius(node);
            const anchorDrifted =
              Math.abs(box.x - node.x) > 1 || Math.abs(box.y - (node.y + r + 14 + box.height / 2)) > 1;
            const firstLineY = box.y - ((box.lines.length - 1) * LINE_HEIGHT) / 2;
            return (
              <g key={node.id}>
                {anchorDrifted && (
                  <line
                    x1={node.x}
                    y1={node.y + r}
                    x2={box.x}
                    y2={box.y - box.height / 2}
                    stroke={node.color}
                    strokeWidth={1}
                    strokeOpacity={0.4}
                    strokeDasharray="2,2"
                  />
                )}
                <text x={box.x} y={firstLineY} textAnchor="middle" className="node-label">
                  {box.lines.map((line, i) => (
                    <tspan key={i} x={box.x} dy={i === 0 ? 0 : LINE_HEIGHT}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </g>

        <g className="nodes">
          {nodes.map((node) => (
            <circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={nodeRadius(node)}
              fill={node.color}
              stroke="#0b1220"
              strokeWidth={2}
            />
          ))}
        </g>
      </svg>

      <div className="legend">
        <div className="legend-group">
          <span className="legend-title">Communities (Louvain)</span>
          <div className="legend-chips">
            {communities.map(([id, color]) => (
              <span key={id} className="legend-chip">
                <span className="legend-swatch" style={{ background: color }} />
                Cluster {id + 1}
              </span>
            ))}
          </div>
        </div>
        <div className="legend-group">
          <span className="legend-title">Relations</span>
          <div className="legend-chips">
            <span className="legend-chip">
              <span className="legend-line" style={{ background: EDGE_COLOR.synergy }} />
              Synergy
            </span>
            <span className="legend-chip">
              <span className="legend-line" style={{ background: EDGE_COLOR.tension }} />
              Tension
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
