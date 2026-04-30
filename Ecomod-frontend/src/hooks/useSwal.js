import Swal from "sweetalert2";

// ─── Configuración base con tu paleta EcoMod ───────────────────────────────
const baseConfig = {
  confirmButtonColor: "#e8291c",
  cancelButtonColor: "#6b7280",
  background: "#ffffff",
  color: "#1a1a1a",
  borderRadius: "16px",
  confirmButtonText: "Confirmar",
  cancelButtonText: "Cancelar",
  showClass: {
    popup: "animate__animated animate__fadeInUp animate__faster",
  },
  hideClass: {
    popup: "animate__animated animate__fadeOutDown animate__faster",
  },
  customClass: {
    popup: "ec-swal-popup",
    title: "ec-swal-title",
    htmlContainer: "ec-swal-text",
    confirmButton: "ec-swal-btn-confirm",
    cancelButton: "ec-swal-btn-cancel",
    icon: "ec-swal-icon",
  },
};

// ─── Dark mode config ──────────────────────────────────────────────────────
const darkConfig = {
  ...baseConfig,
  background: "#1c1c24",
  color: "#f0f0f5",
};

export function useSwal(isDark = false) {
  const theme = isDark ? darkConfig : baseConfig;

  return {
    // Alerta simple de éxito
    success: (title, text) => {
      return Swal.fire({
        ...theme,
        icon: "success",
        title,
        text,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    },

    // Alerta de error
    error: (title, text) => {
      return Swal.fire({
        ...theme,
        icon: "error",
        title,
        text,
        confirmButtonText: "Entendido",
      });
    },

    // Alerta de información
    info: (title, text) => {
      return Swal.fire({
        ...theme,
        icon: "info",
        title,
        text,
      });
    },

    // Alerta de advertencia
    warning: (title, text) => {
      return Swal.fire({
        ...theme,
        icon: "warning",
        title,
        text,
      });
    },

    // Confirmación (reemplaza confirm nativo)
    confirm: (
      title,
      text,
      confirmText = "Sí, confirmar",
      cancelText = "Cancelar",
    ) => {
      return Swal.fire({
        ...theme,
        icon: "question",
        title,
        text,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true,
      });
    },

    // Confirmación de eliminación (con icono de warning)
    delete: (
      title = "¿Eliminar?",
      text = "Esta acción no se puede deshacer.",
    ) => {
      return Swal.fire({
        ...theme,
        icon: "warning",
        title,
        text,
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
        reverseButtons: true,
      });
    },

    // Input para texto
    prompt: (title, inputPlaceholder, inputValue = "") => {
      return Swal.fire({
        ...theme,
        title,
        input: "text",
        inputPlaceholder,
        inputValue,
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
        inputValidator: (value) => {
          if (!value) return "Este campo es obligatorio";
        },
      });
    },

    // Toast notification (esquina superior)
    toast: (icon, title) => {
      return Swal.fire({
        ...theme,
        toast: true,
        position: "top-end",
        icon,
        title,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
      });
    },

    // Loading con spinner
    loading: (title = "Procesando...") => {
      return Swal.fire({
        ...theme,
        title,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    },

    // Cerrar cualquier modal abierto
    close: () => Swal.close(),
  };
}
