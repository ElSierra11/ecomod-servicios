import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { paymentsApi } from "../services/api";
import { CheckCircle, XCircle, Loader } from "lucide-react";

export default function PaypalReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const paymentId = searchParams.get("paymentId");
    const payerId = searchParams.get("PayerID");
    const orderId = searchParams.get("order_id");

    if (!paymentId || !payerId) {
      setStatus("error");
      setMessage("No se recibió información de pago");
      return;
    }

    const executePayment = async () => {
      try {
        const result = await paymentsApi.executePaypalOrder(
          paymentId,
          payerId,
          orderId,
        );
        if (result.success) {
          setStatus("success");
          setMessage("¡Pago completado exitosamente!");
          setTimeout(() => {
            navigate("/payments");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(result.error || "Error al procesar el pago");
        }
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "Error al procesar el pago");
      }
    };

    executePayment();
  }, [searchParams, navigate]);

  return (
    <div className="paypal-return">
      <div className="paypal-return-card">
        {status === "loading" && (
          <>
            <Loader size={48} className="spinner" />
            <h2>Procesando pago...</h2>
            <p>Por favor espera, estamos confirmando tu transacción.</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle size={48} color="#00ff88" />
            <h2>¡Pago exitoso!</h2>
            <p>{message}</p>
            <p>Redirigiendo a pagos...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={48} color="#ff6b6b" />
            <h2>Error en el pago</h2>
            <p>{message}</p>
            <button onClick={() => navigate("/payments")}>
              Volver a pagos
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .paypal-return {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          padding: 24px;
        }
        .paypal-return-card {
          background: var(--surface);
          border-radius: 24px;
          padding: 48px;
          text-align: center;
          border: 1px solid var(--border);
          max-width: 500px;
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .paypal-return-card h2 {
          margin: 20px 0 10px;
          font-size: 24px;
        }
        .paypal-return-card p {
          color: var(--text3);
          margin-bottom: 20px;
        }
        .paypal-return-card button {
          padding: 12px 24px;
          background: var(--accent);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
