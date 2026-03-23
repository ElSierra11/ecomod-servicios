import { useState, useEffect, useRef } from "react";

const SERVICES = [
  { id: "auth", label: "Auth Service", x: 60, y: 80, color: "#7cfc6e", r: 5 },
  {
    id: "catalog",
    label: "Catalog Service",
    x: 100,
    y: 140,
    color: "#a78bfa",
    r: 4,
  },
  {
    id: "inventory",
    label: "Inventory Service",
    x: 55,
    y: 200,
    color: "#7cfc6e",
    r: 3,
  },
  { id: "cart", label: "Cart Service", x: 110, y: 250, color: "#00e5ff", r: 4 },
  {
    id: "orders",
    label: "Order Service",
    x: 620,
    y: 80,
    color: "#7cfc6e",
    r: 5,
  },
  {
    id: "payments",
    label: "Payment Service",
    x: 580,
    y: 145,
    color: "#00e5ff",
    r: 4,
  },
  {
    id: "shipping",
    label: "Shipping Service",
    x: 625,
    y: 210,
    color: "#a78bfa",
    r: 3,
  },
  {
    id: "notifications",
    label: "Notification Service",
    x: 575,
    y: 260,
    color: "#f472b6",
    r: 4,
  },
];

const CENTER = { x: 340, y: 155 };

const CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 2],
  [4, 5],
  [5, 6],
  [6, 7],
  [4, 6],
  [0, 8],
  [1, 8],
  [4, 8],
  [5, 8],
];

export default function EcoModLogo() {
  const [hovered, setHovered] = useState(null);
  const [tick, setTick] = useState(0);
  const [dashOffset, setDashOffset] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      setDashOffset(-(elapsed / 100) % 20);
      setTick(Math.sin(elapsed / 1000));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const allNodes = [
    ...SERVICES,
    {
      id: "kong",
      label: "Kong Gateway",
      x: CENTER.x,
      y: CENTER.y,
      color: "#7cfc6e",
      r: 8,
    },
  ];

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        width="100%"
        viewBox="0 0 680 300"
        style={{ display: "block", overflow: "visible" }}
      >
        {/* Conexiones animadas */}
        {CONNECTIONS.map(([a, b], i) => {
          const nodeA = allNodes[a];
          const nodeB = allNodes[b];
          if (!nodeA || !nodeB) return null;
          const isActive = hovered === nodeA.id || hovered === nodeB.id;
          return (
            <line
              key={i}
              x1={nodeA.x}
              y1={nodeA.y}
              x2={nodeB.x}
              y2={nodeB.y}
              stroke={isActive ? nodeA.color : "#7cfc6e"}
              strokeWidth={isActive ? 1.5 : 0.8}
              opacity={isActive ? 0.7 : 0.2}
              strokeDasharray="4 4"
              strokeDashoffset={dashOffset + i * 2}
            />
          );
        })}

        {/* Anillos nodo central pulsantes */}
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={52 + tick * 2}
          fill="none"
          stroke="#7cfc6e"
          strokeWidth="0.8"
          opacity={0.1 + Math.abs(tick) * 0.15}
        />
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r="38"
          fill="none"
          stroke="#7cfc6e"
          strokeWidth="1.2"
          opacity="0.25"
        />
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r="24"
          fill="#7cfc6e"
          opacity="0.08"
        />

        {/* Nodos microservicios */}
        {SERVICES.map((node, idx) => {
          const isHov = hovered === node.id;
          const pulse = Math.sin(tick * 2 + idx * 0.8);
          return (
            <g
              key={node.id}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r + 8}
                fill="none"
                stroke={node.color}
                strokeWidth="1"
                opacity={isHov ? 0.5 : 0}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={isHov ? node.r + 2 : node.r + Math.abs(pulse) * 1.5}
                fill={node.color}
                opacity={isHov ? 1 : 0.6 + Math.abs(pulse) * 0.3}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r + 4 + Math.abs(pulse) * 2}
                fill="none"
                stroke={node.color}
                strokeWidth="0.8"
                opacity={0.15 + Math.abs(pulse) * 0.2}
              />
            </g>
          );
        })}

        {/* Nodo central Kong */}
        <g
          style={{ cursor: "pointer" }}
          onMouseEnter={() => setHovered("kong")}
          onMouseLeave={() => setHovered(null)}
        >
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r={hovered === "kong" ? 11 : 8 + Math.abs(tick)}
            fill="#7cfc6e"
            opacity={0.8 + Math.abs(tick) * 0.2}
          />
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r="14"
            fill="none"
            stroke="#7cfc6e"
            strokeWidth="1"
            opacity={hovered === "kong" ? 0.6 : Math.abs(tick) * 0.3}
          />
        </g>

        {/* Texto EcoMod */}
        <text
          x="210"
          y="192"
          textAnchor="start"
          style={{
            fill: "#7cfc6e",
            fontFamily: "'Syne','DM Sans',sans-serif",
            fontWeight: 900,
            fontSize: 78,
          }}
        >
          Eco
        </text>
        <text
          x="378"
          y="192"
          textAnchor="start"
          style={{
            fill: "#ffffff",
            fontFamily: "'Syne','DM Sans',sans-serif",
            fontWeight: 900,
            fontSize: 78,
          }}
        >
          Mod
        </text>

        {/* Subtítulo */}
        <text
          x="340"
          y="228"
          textAnchor="middle"
          style={{
            fill: "#555566",
            fontFamily: "sans-serif",
            fontSize: 13,
            letterSpacing: 4,
          }}
        >
          COMMERCE PLATFORM
        </text>

        {/* Línea decorativa */}
        <line
          x1="240"
          y1="240"
          x2="440"
          y2="240"
          stroke="#7cfc6e"
          strokeWidth="0.5"
          opacity="0.25"
        />

        {/* 8 puntos */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <circle
            key={i}
            cx={268 + i * 16}
            cy={258}
            r="2.5"
            fill={
              [
                "#7cfc6e",
                "#00e5ff",
                "#a78bfa",
                "#7cfc6e",
                "#00e5ff",
                "#f472b6",
                "#7cfc6e",
                "#00e5ff",
              ][i]
            }
            opacity={0.5 + Math.abs(Math.sin(tick * 2 + i * 0.5)) * 0.5}
          />
        ))}

        <text
          x="340"
          y="278"
          textAnchor="middle"
          style={{
            fill: "#333344",
            fontFamily: "sans-serif",
            fontSize: 10,
            letterSpacing: 2,
          }}
        >
          8 MICROSERVICIOS
        </text>
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(10,10,15,0.9)",
            border: "1px solid #7cfc6e40",
            borderRadius: 8,
            padding: "4px 14px",
            fontSize: 12,
            color: "#7cfc6e",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            fontFamily: "sans-serif",
            letterSpacing: 1,
          }}
        >
          {allNodes.find((n) => n.id === hovered)?.label}
        </div>
      )}
    </div>
  );
}
