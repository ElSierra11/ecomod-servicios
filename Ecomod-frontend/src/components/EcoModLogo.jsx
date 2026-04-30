import { useState, useEffect, useRef } from "react";

const SERVICES = [
  {
    id: "auth",
    label: "Auth Service",
    x: 60,
    y: 80,
    color: "#d97556",
    r: 5,
    icon: "🔐",
  },
  {
    id: "catalog",
    label: "Catalog Service",
    x: 100,
    y: 140,
    color: "#e8956a",
    r: 4,
    icon: "📚",
  },
  {
    id: "inventory",
    label: "Inventory Service",
    x: 55,
    y: 200,
    color: "#f4b183",
    r: 3,
    icon: "📦",
  },
  {
    id: "cart",
    label: "Cart Service",
    x: 110,
    y: 250,
    color: "#d97556",
    r: 4,
    icon: "🛒",
  },
  {
    id: "orders",
    label: "Order Service",
    x: 620,
    y: 80,
    color: "#e8956a",
    r: 5,
    icon: "📋",
  },
  {
    id: "payments",
    label: "Payment Service",
    x: 580,
    y: 145,
    color: "#f4b183",
    r: 4,
    icon: "💳",
  },
  {
    id: "shipping",
    label: "Shipping Service",
    x: 625,
    y: 210,
    color: "#d97556",
    r: 3,
    icon: "🚚",
  },
  {
    id: "notifications",
    label: "Notification Service",
    x: 575,
    y: 260,
    color: "#e8956a",
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      setDashOffset(-(elapsed / 80) % 20);
      setTick(Math.sin(elapsed / 800));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleMouseMove = (e) => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 680,
        y: ((e.clientY - rect.top) / rect.height) * 300,
      });
    }
  };

  const allNodes = [
    ...SERVICES,
    {
      id: "kong",
      label: "Kong Gateway",
      x: CENTER.x,
      y: CENTER.y,
      color: "#d97556",
      r: 8,
      icon: "⚡",
    },
  ];

  const getDistanceFromMouse = (node) => {
    const dx = mousePos.x - node.x;
    const dy = mousePos.y - node.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  return (
    <div
      style={{ position: "relative", width: "100%", cursor: "pointer" }}
      onMouseMove={handleMouseMove}
    >
      <svg
        ref={svgRef}
        width="100%"
        viewBox="0 0 680 300"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient
            id="ecoGradTerracota"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#d97556" />
            <stop offset="50%" stopColor="#e8956a" />
            <stop offset="100%" stopColor="#f4b183" />
          </linearGradient>

          <linearGradient
            id="kongGradTerracota"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#d97556" />
            <stop offset="100%" stopColor="#f4b183" />
          </linearGradient>

          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d97556" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#d97556" stopOpacity="0" />
          </radialGradient>

          <filter
            id="glowTerracota"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodColor="#d97556"
              floodOpacity="0.3"
            />
          </filter>
        </defs>

        <pattern
          id="gridPattern"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="10" cy="10" r="0.5" fill="#d97556" opacity="0.1" />
        </pattern>
        <rect
          width="100%"
          height="100%"
          fill="url(#gridPattern)"
          opacity="0.5"
        />

        {CONNECTIONS.map(([a, b], i) => {
          const nodeA = allNodes[a];
          const nodeB = allNodes[b];
          if (!nodeA || !nodeB) return null;
          const isActive = hovered === nodeA.id || hovered === nodeB.id;
          const midX = (nodeA.x + nodeB.x) / 2;
          const midY = (nodeA.y + nodeB.y) / 2;
          const distFromMouse = Math.sqrt(
            Math.pow(mousePos.x - midX, 2) + Math.pow(mousePos.y - midY, 2),
          );
          const proximityOpacity = Math.max(
            0.1,
            Math.min(0.6, 1 - distFromMouse / 200),
          );

          return (
            <g key={i}>
              {isActive && (
                <line
                  x1={nodeA.x}
                  y1={nodeA.y}
                  x2={nodeB.x}
                  y2={nodeB.y}
                  stroke={nodeA.color}
                  strokeWidth={4}
                  opacity={0.2}
                  strokeLinecap="round"
                />
              )}
              <line
                x1={nodeA.x}
                y1={nodeA.y}
                x2={nodeB.x}
                y2={nodeB.y}
                stroke={isActive ? nodeA.color : "#d97556"}
                strokeWidth={isActive ? 2.5 : 1}
                opacity={isActive ? 0.9 : proximityOpacity}
                strokeDasharray={isActive ? "none" : "4 6"}
                strokeDashoffset={dashOffset + i * 2}
                strokeLinecap="round"
                style={{ transition: "all 0.3s ease" }}
              />
            </g>
          );
        })}

        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={60 + tick * 4}
          fill="none"
          stroke="url(#kongGradTerracota)"
          strokeWidth="0.5"
          opacity={0.15 + Math.abs(tick) * 0.1}
        />
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={48 + tick * 2}
          fill="none"
          stroke="url(#kongGradTerracota)"
          strokeWidth="1"
          opacity={0.2 + Math.abs(tick) * 0.15}
        />
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r="38"
          fill="none"
          stroke="url(#kongGradTerracota)"
          strokeWidth="1.5"
          opacity="0.35"
          strokeDasharray="3 6"
          strokeDashoffset={dashOffset * 2}
        />
        <circle cx={CENTER.x} cy={CENTER.y} r="28" fill="url(#glowGrad)" />

        {SERVICES.map((node, idx) => {
          const isHov = hovered === node.id;
          const pulse = Math.sin(tick * 2.5 + idx * 0.7);
          const distFromMouse = getDistanceFromMouse(node);
          const isNearMouse = distFromMouse < 80;
          const scale = isHov ? 1.3 : isNearMouse ? 1.1 : 1;

          return (
            <g
              key={node.id}
              style={{ cursor: "pointer", transition: "transform 0.2s ease" }}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHov && (
                <>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r + 20 + Math.abs(tick) * 5}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="1"
                    opacity={0.2}
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r + 28 + Math.abs(tick) * 8}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="0.5"
                    opacity={0.1}
                  />
                </>
              )}

              <circle
                cx={node.x}
                cy={node.y}
                r={node.r + 14}
                fill="none"
                stroke={node.color}
                strokeWidth="2"
                opacity={isHov ? 0.6 : isNearMouse ? 0.3 : 0}
                style={{ transition: "opacity 0.2s ease" }}
              />

              <circle
                cx={node.x}
                cy={node.y}
                r={node.r + 8}
                fill={node.color}
                opacity={isHov ? 0.25 : 0.1}
                style={{ transition: "opacity 0.2s ease" }}
              />

              <circle
                cx={node.x}
                cy={node.y}
                r={(node.r + Math.abs(pulse) * 1.5) * scale}
                fill={node.color}
                opacity={isHov ? 1 : 0.75 + Math.abs(pulse) * 0.2}
                filter={isHov ? "url(#glowTerracota)" : "none"}
                style={{ transition: "all 0.2s ease" }}
              />

              <circle
                cx={node.x}
                cy={node.y}
                r={node.r + 6 + Math.abs(pulse) * 4}
                fill="none"
                stroke={node.color}
                strokeWidth="1"
                opacity={0.25 + Math.abs(pulse) * 0.25}
              />

              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fontSize={(node.r + 3) * scale}
                style={{
                  pointerEvents: "none",
                  filter: isHov
                    ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                    : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {node.icon}
              </text>
            </g>
          );
        })}

        <g
          style={{ cursor: "pointer" }}
          onMouseEnter={() => setHovered("kong")}
          onMouseLeave={() => setHovered(null)}
        >
          {hovered === "kong" && (
            <>
              <circle
                cx={CENTER.x}
                cy={CENTER.y}
                r={35 + Math.abs(tick) * 8}
                fill="none"
                stroke="url(#kongGradTerracota)"
                strokeWidth="1"
                opacity={0.3}
              />
              <circle
                cx={CENTER.x}
                cy={CENTER.y}
                r={45 + Math.abs(tick) * 12}
                fill="none"
                stroke="url(#kongGradTerracota)"
                strokeWidth="0.5"
                opacity={0.15}
              />
            </>
          )}

          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r="22"
            fill="none"
            stroke="url(#kongGradTerracota)"
            strokeWidth="1.5"
            opacity={0.5}
            strokeDasharray="2 4"
            strokeDashoffset={-dashOffset}
          />

          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r="18"
            fill="url(#kongGradTerracota)"
            opacity={0.15}
          />

          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r={hovered === "kong" ? 16 : 12 + Math.abs(tick) * 2}
            fill="url(#kongGradTerracota)"
            filter={
              hovered === "kong" ? "url(#glowTerracota)" : "url(#softShadow)"
            }
            style={{ transition: "all 0.2s ease" }}
          />

          <text
            x={CENTER.x}
            y={CENTER.y + 6}
            textAnchor="middle"
            fontSize={hovered === "kong" ? 20 : 16}
            style={{
              pointerEvents: "none",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
              transition: "font-size 0.2s ease",
            }}
          >
            ⚡
          </text>

          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r="20"
            fill="none"
            stroke="url(#kongGradTerracota)"
            strokeWidth="2"
            opacity={hovered === "kong" ? 0.7 : 0.3 + Math.abs(tick) * 0.2}
            style={{ transition: "opacity 0.2s ease" }}
          />
        </g>

        <text
          x="195"
          y="192"
          textAnchor="start"
          filter="url(#softShadow)"
          style={{
            fill: "url(#ecoGradTerracota)",
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
            fill: "var(--text, #374151)",
            fontFamily: "'Syne','DM Sans',sans-serif",
            fontWeight: 900,
            fontSize: 78,
            letterSpacing: -2,
          }}
        >
          Mod
        </text>

        <text
          x="340"
          y="228"
          textAnchor="middle"
          style={{
            fill: "var(--text3, #9ca3af)",
            fontFamily: "var(--font-body, sans-serif)",
            fontSize: 12,
            letterSpacing: 5,
            fontWeight: 600,
          }}
        >
          COMMERCE PLATFORM
        </text>

        <line
          x1="240"
          y1="240"
          x2="440"
          y2="240"
          stroke="url(#ecoGradTerracota)"
          strokeWidth="1"
          opacity="0.4"
          strokeLinecap="round"
        />

        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <circle
            key={i}
            cx={268 + i * 16}
            cy={258}
            r={2.5 + Math.abs(Math.sin(tick * 2 + i * 0.5)) * 1}
            fill={
              [
                "#d97556",
                "#e8956a",
                "#f4b183",
                "#d97556",
                "#e8956a",
                "#f4b183",
                "#d97556",
                "#e8956a",
              ][i]
            }
            opacity={0.5 + Math.abs(Math.sin(tick * 2.5 + i * 0.6)) * 0.5}
            style={{ transition: "opacity 0.15s ease" }}
          />
        ))}

        <text
          x="340"
          y="278"
          textAnchor="middle"
          style={{
            fill: "var(--text3, #9ca3af)",
            fontFamily: "var(--font-body, sans-serif)",
            fontSize: 9,
            letterSpacing: 2,
            fontWeight: 500,
          }}
        >
          8 MICROSERVICIOS CONECTADOS
        </text>
      </svg>

      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%) translateY(0)",
            background: "var(--surface, #ffffff)",
            border: `2px solid ${allNodes.find((n) => n.id === hovered)?.color || "#d97556"}`,
            borderRadius: 12,
            padding: "8px 18px",
            fontSize: 13,
            color: allNodes.find((n) => n.id === hovered)?.color || "#d97556",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-body, sans-serif)",
            fontWeight: 600,
            letterSpacing: 0.5,
            backdropFilter: "blur(12px)",
            zIndex: 1000,
            boxShadow: `0 4px 20px ${allNodes.find((n) => n.id === hovered)?.color || "#d97556"}40`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "fadeInUp 0.2s ease",
          }}
        >
          <span style={{ fontSize: 18 }}>
            {allNodes.find((n) => n.id === hovered)?.icon}
          </span>
          <span>{allNodes.find((n) => n.id === hovered)?.label}</span>
          <span
            style={{
              fontSize: 11,
              color: "var(--text3, #9ca3af)",
              fontFamily: "monospace",
              background: "var(--bg2, #f3f4f6)",
              padding: "2px 8px",
              borderRadius: 6,
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

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
