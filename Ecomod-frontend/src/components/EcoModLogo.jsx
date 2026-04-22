import { useState, useEffect, useRef } from "react";
import { Activity, Server, Zap, Network } from "lucide-react";

const SERVICES = [
  {
    id: "auth",
    label: "Auth Service",
    x: 60,
    y: 80,
    color: "#7cfc6e",
    r: 5,
    icon: "🔐",
  },
  {
    id: "catalog",
    label: "Catalog Service",
    x: 100,
    y: 140,
    color: "#a78bfa",
    r: 4,
    icon: "📚",
  },
  {
    id: "inventory",
    label: "Inventory Service",
    x: 55,
    y: 200,
    color: "#7cfc6e",
    r: 3,
    icon: "📦",
  },
  {
    id: "cart",
    label: "Cart Service",
    x: 110,
    y: 250,
    color: "#00e5ff",
    r: 4,
    icon: "🛒",
  },
  {
    id: "orders",
    label: "Order Service",
    x: 620,
    y: 80,
    color: "#7cfc6e",
    r: 5,
    icon: "📋",
  },
  {
    id: "payments",
    label: "Payment Service",
    x: 580,
    y: 145,
    color: "#00e5ff",
    r: 4,
    icon: "💳",
  },
  {
    id: "shipping",
    label: "Shipping Service",
    x: 625,
    y: 210,
    color: "#a78bfa",
    r: 3,
    icon: "🚚",
  },
  {
    id: "notifications",
    label: "Notification Service",
    x: 575,
    y: 260,
    color: "#f472b6",
    r: 4,
    icon: "🔔",
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
      icon: "🚪",
    },
  ];

  return (
    <div style={{ position: "relative", width: "100%", cursor: "pointer" }}>
      <svg
        width="100%"
        viewBox="0 0 680 300"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="ecoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7cfc6e" />
            <stop offset="100%" stopColor="#00e5ff" />
          </linearGradient>
          <linearGradient id="kongGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7cfc6e" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

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
              stroke={isActive ? nodeA.color : "currentColor"}
              strokeWidth={isActive ? 2 : 0.8}
              opacity={isActive ? 0.8 : 0.15}
              strokeDasharray="4 6"
              strokeDashoffset={dashOffset + i * 2}
              style={{ transition: "all 0.3s ease" }}
            />
          );
        })}

        {/* Anillos nodo central pulsantes */}
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={52 + tick * 2}
          fill="none"
          stroke="url(#kongGrad)"
          strokeWidth="1"
          opacity={0.1 + Math.abs(tick) * 0.15}
        />
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r="40"
          fill="none"
          stroke="url(#kongGrad)"
          strokeWidth="1.5"
          opacity="0.3"
          strokeDasharray="4 8"
        />
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r="26"
          fill="url(#kongGrad)"
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
              {/* Halo de hover */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r + 12}
                fill="none"
                stroke={node.color}
                strokeWidth="1.5"
                opacity={isHov ? 0.4 : 0}
                style={{ transition: "opacity 0.2s ease" }}
              />

              {/* Núcleo */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isHov ? node.r + 3 : node.r + Math.abs(pulse) * 1.5}
                fill={node.color}
                opacity={isHov ? 1 : 0.7 + Math.abs(pulse) * 0.2}
                filter={isHov ? "url(#glow)" : "none"}
              />

              {/* Pulso */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r + 5 + Math.abs(pulse) * 3}
                fill="none"
                stroke={node.color}
                strokeWidth="1"
                opacity={0.2 + Math.abs(pulse) * 0.2}
              />

              {/* Icono */}
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fontSize={node.r + 2}
                fill={isHov ? "#fff" : "rgba(0,0,0,0.6)"}
                style={{ pointerEvents: "none" }}
              >
                {node.icon}
              </text>
            </g>
          );
        })}

        {/* Nodo central Kong */}
        <g
          style={{ cursor: "pointer" }}
          onMouseEnter={() => setHovered("kong")}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Anillos decorativos */}
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r="22"
            fill="none"
            stroke="url(#kongGrad)"
            strokeWidth="1"
            opacity={0.4}
            strokeDasharray="2 6"
          />

          {/* Núcleo central */}
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r={hovered === "kong" ? 14 : 10 + Math.abs(tick) * 1.5}
            fill="url(#kongGrad)"
            opacity={0.9 + Math.abs(tick) * 0.1}
            filter={hovered === "kong" ? "url(#glow)" : "none"}
          />

          {/* Icono Kong */}
          <text
            x={CENTER.x}
            y={CENTER.y + 5}
            textAnchor="middle"
            fontSize="16"
            fill="#fff"
            style={{ pointerEvents: "none", fontWeight: "bold" }}
          >
            🚪
          </text>

          {/* Pulso */}
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r="18"
            fill="none"
            stroke="url(#kongGrad)"
            strokeWidth="1.5"
            opacity={hovered === "kong" ? 0.6 : Math.abs(tick) * 0.3}
            style={{ transition: "opacity 0.2s ease" }}
          />
        </g>

        {/* Texto EcoMod */}
        <text
          x="195"
          y="192"
          textAnchor="start"
          style={{
            fill: "url(#ecoGrad)",
            fontFamily: "'Syne','DM Sans',sans-serif",
            fontWeight: 900,
            fontSize: 78,
            letterSpacing: -2,
          }}
        >
          Eco
        </text>
        <text
          x="378"
          y="192"
          textAnchor="start"
          style={{
            fill: "var(--text)",
            fontFamily: "'Syne','DM Sans',sans-serif",
            fontWeight: 900,
            fontSize: 78,
            letterSpacing: -2,
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
            fill: "var(--text3)",
            fontFamily: "var(--font-body)",
            fontSize: 12,
            letterSpacing: 5,
            fontWeight: 600,
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
          stroke="url(#ecoGrad)"
          strokeWidth="0.8"
          opacity="0.3"
        />

        {/* 8 puntos animados */}
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
            opacity={0.4 + Math.abs(Math.sin(tick * 2 + i * 0.5)) * 0.5}
            style={{ transition: "opacity 0.2s ease" }}
          />
        ))}

        {/* Stats */}
        <text
          x="340"
          y="278"
          textAnchor="middle"
          style={{
            fill: "var(--text3)",
            fontFamily: "var(--font-body)",
            fontSize: 9,
            letterSpacing: 2,
            fontWeight: 500,
          }}
        >
          8 MICROSERVICIOS CONECTADOS
        </text>
      </svg>

      {/* Tooltip moderno */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--surface)",
            border: `1px solid ${allNodes.find((n) => n.id === hovered)?.color || "var(--border)"}40`,
            borderRadius: "var(--radius)",
            padding: "6px 16px",
            fontSize: 12,
            color:
              allNodes.find((n) => n.id === hovered)?.color || "var(--accent)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            letterSpacing: 0.5,
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>
            {allNodes.find((n) => n.id === hovered)?.icon}
          </span>
          <span>{allNodes.find((n) => n.id === hovered)?.label}</span>
          <span
            style={{
              fontSize: 10,
              color: "var(--text3)",
              fontFamily: "monospace",
            }}
          >
            {hovered === "kong"
              ? "Gateway"
              : `:${
                  hovered === "auth"
                    ? "8002"
                    : hovered === "catalog"
                      ? "8003"
                      : hovered === "inventory"
                        ? "8004"
                        : hovered === "cart"
                          ? "8005"
                          : hovered === "orders"
                            ? "8006"
                            : hovered === "payments"
                              ? "8007"
                              : hovered === "shipping"
                                ? "8008"
                                : "8009"
                }`}
          </span>
        </div>
      )}
    </div>
  );
}
