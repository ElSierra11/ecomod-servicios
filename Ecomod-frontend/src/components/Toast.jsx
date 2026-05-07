// src/components/Toast.jsx
import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X,
  Sparkles,
  Bell,
} from "lucide-react";

const toastStyles = {
  success: {
    icon: CheckCircle,
    gradient: "linear-gradient(135deg, #10b981 0%, #34d399 50%, #059669 100%)",
    glow: "0 0 20px rgba(16, 185, 129, 0.5)",
    particleColor: "#10b981",
  },
  error: {
    icon: XCircle,
    gradient: "linear-gradient(135deg, #ef4444 0%, #f87171 50%, #dc2626 100%)",
    glow: "0 0 20px rgba(239, 68, 68, 0.5)",
    particleColor: "#ef4444",
  },
  warning: {
    icon: AlertCircle,
    gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)",
    glow: "0 0 20px rgba(245, 158, 11, 0.5)",
    particleColor: "#f59e0b",
  },
  info: {
    icon: Info,
    gradient: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #2563eb 100%)",
    glow: "0 0 20px rgba(59, 130, 246, 0.5)",
    particleColor: "#3b82f6",
  },
};

export default function Toast({
  message,
  type = "success",
  onClose,
  duration = 4000,
}) {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState([]);
  const {
    icon: Icon,
    gradient,
    glow,
    particleColor,
  } = toastStyles[type] || toastStyles.success;

  useEffect(() => {
    const startTime = Date.now();
    let interval;

    if (!isHovered) {
      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          handleClose();
        }
      }, 16);
    }

    return () => clearInterval(interval);
  }, [duration, isHovered]);

  const generateParticles = useCallback(() => {
    const newParticles = [];
    for (let i = 0; i < 12; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 0.8 + Math.random() * 0.6,
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    generateParticles();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(), 350);
  };

  return (
    <div
      className="toast-premium"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-type={type}
    >
      {/* Partículas flotantes */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="toast-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particleColor,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}

      {/* Efecto de brillo */}
      <div className="toast-glow" style={{ boxShadow: glow }} />

      {/* Contenido principal */}
      <div className="toast-container" style={{ background: gradient }}>
        {/* Icono con animación */}
        <div className="toast-icon-wrapper">
          <div
            className="toast-icon-pulse"
            style={{ backgroundColor: particleColor }}
          />
          <div className="toast-icon">
            <Icon size={24} strokeWidth={1.8} />
          </div>
        </div>

        {/* Mensaje */}
        <div className="toast-message">
          <div className="toast-title">
            {type === "success" && "¡Éxito!"}
            {type === "error" && "¡Error!"}
            {type === "warning" && "¡Atención!"}
            {type === "info" && "Información"}
          </div>
          <div className="toast-text">{message}</div>
        </div>

        {/* Botón cerrar */}
        <button className="toast-close" onClick={handleClose}>
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Barra de progreso interactiva */}
      <div className="toast-progress-container">
        <div
          className="toast-progress-bar"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${particleColor}80, ${particleColor})`,
            transition: isHovered ? "width 0.1s linear" : "width 0.05s linear",
          }}
        />
      </div>

      {/* Efecto de borde brillante */}
      <div className="toast-border" />

      <style jsx>{`
        .toast-premium {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 10000;
          min-width: 360px;
          max-width: 420px;
          animation: slideInPremium 0.5s cubic-bezier(0.34, 1.2, 0.64, 1);
          transform-origin: right center;
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
        }

        .toast-premium.exit {
          animation: slideOutPremium 0.35s cubic-bezier(0.55, 0.085, 0.68, 0.53)
            forwards;
        }

        .toast-premium:hover {
          transform: translateX(-4px) scale(1.02);
          transition: transform 0.2s ease;
        }

        /* Partículas */
        .toast-particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          pointer-events: none;
          animation: particleFloat 1s ease-out forwards;
          opacity: 0.8;
          z-index: 1;
        }

        @keyframes particleFloat {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translate(
                calc(var(--x, 20px) * (0.5 - Math.random())),
                calc(var(--y, -30px) * (0.3 + Math.random()))
              )
              scale(0);
            opacity: 0;
          }
        }

        /* Glow */
        .toast-glow {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        /* Contenedor principal */
        .toast-container {
          position: relative;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          backdrop-filter: blur(12px);
          z-index: 2;
        }

        /* Icono con pulsación */
        .toast-icon-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .toast-icon-pulse {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          animation: pulseRing 1.5s ease-out infinite;
          opacity: 0.5;
        }

        @keyframes pulseRing {
          0% {
            transform: scale(0.8);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        .toast-icon {
          position: relative;
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          animation: iconBounce 0.5s cubic-bezier(0.34, 1.2, 0.64, 1);
        }

        @keyframes iconBounce {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Mensaje */
        .toast-message {
          flex: 1;
        }

        .toast-title {
          font-size: 14px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.2px;
          margin-bottom: 2px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .toast-text {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.92);
          line-height: 1.4;
          letter-spacing: -0.1px;
        }

        /* Botón cerrar */
        .toast-close {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: all 0.2s ease;
          flex-shrink: 0;
          backdrop-filter: blur(4px);
        }

        .toast-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05) rotate(90deg);
        }

        /* Barra de progreso */
        .toast-progress-container {
          position: relative;
          height: 3px;
          background: rgba(0, 0, 0, 0.15);
          width: 100%;
          z-index: 2;
        }

        .toast-progress-bar {
          height: 100%;
          transition: width 0.05s linear;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }

        .toast-progress-bar::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        /* Borde brillante */
        .toast-border {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.3),
            rgba(255, 255, 255, 0.05)
          );
          mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          pointer-events: none;
          z-index: 1;
        }

        /* Animaciones principales */
        @keyframes slideInPremium {
          0% {
            opacity: 0;
            transform: translateX(100px) scale(0.9) rotate(2deg);
          }
          30% {
            transform: translateX(-10px) scale(1.02) rotate(-1deg);
          }
          60% {
            transform: translateX(5px) scale(1) rotate(0.5deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1) rotate(0);
          }
        }

        @keyframes slideOutPremium {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1) rotate(0);
          }
          100% {
            opacity: 0;
            transform: translateX(100px) scale(0.8) rotate(-2deg);
          }
        }

        /* Responsive */
        @media (max-width: 480px) {
          .toast-premium {
            left: 16px;
            right: 16px;
            min-width: auto;
            max-width: none;
          }
          .toast-container {
            padding: 14px 16px;
          }
          .toast-icon {
            width: 38px;
            height: 38px;
          }
          .toast-title {
            font-size: 13px;
          }
          .toast-text {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
