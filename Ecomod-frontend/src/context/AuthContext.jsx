import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { authApi, cartApi } from "../services/api";

const AuthContext = createContext(null);

const AUTH_EVENTS = {
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_ERROR: "LOGIN_ERROR",
  LOGOUT: "LOGOUT",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  TOKEN_REFRESHED: "TOKEN_REFRESHED",
  PROFILE_UPDATED: "PROFILE_UPDATED",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const decodeToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        exp: payload.exp * 1000,
        userId: payload.sub,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
      };
    } catch {
      return null;
    }
  };

  const isTokenExpired = useCallback((token) => {
    const decoded = decodeToken(token);
    if (!decoded) return true;
    return Date.now() >= decoded.exp;
  }, []);

  const isSessionExpiringSoon = useCallback(() => {
    if (!sessionExpiresAt) return false;
    const timeUntilExpiry = sessionExpiresAt - Date.now();
    return timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000;
  }, [sessionExpiresAt]);

  const addNotification = useCallback(
    ({ type, message, severity = "info" }) => {
      const newNotification = {
        id: Date.now(),
        type,
        message,
        severity,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev].slice(0, 50));
      if (severity !== "error") {
        setTimeout(() => {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== newNotification.id),
          );
        }, 5000);
      }
    },
    [],
  );

  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  const handleCartMerge = useCallback(async (userId) => {
    const anonToken = localStorage.getItem("ecomod_anon_token");
    if (!anonToken) return;

    try {
      await cartApi.merge({
        user_id: userId,
        anonymous_token: anonToken
      });
      localStorage.removeItem("ecomod_anon_token");
      console.log("Carrito anónimo fusionado correctamente");
    } catch (error) {
      console.error("Error fusionando carrito:", error);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    const res = await authApi.profile();
    return res;
  }, []);

  const refreshToken = useCallback(async () => {
    if (isRefreshing) return null;
    setIsRefreshing(true);
    try {
      const refreshTk = localStorage.getItem("ecomod_refresh_token");
      if (!refreshTk) return null;
      const data = await authApi.refreshToken(refreshTk);
      if (data?.access_token) {
        localStorage.setItem("ecomod_token", data.access_token);
        if (data.refresh_token)
          localStorage.setItem("ecomod_refresh_token", data.refresh_token);
        const decoded = decodeToken(data.access_token);
        setSessionExpiresAt(decoded?.exp || null);
        addNotification({
          type: AUTH_EVENTS.TOKEN_REFRESHED,
          message: "Sesión renovada",
          severity: "info",
        });
        return data.access_token;
      }
      return null;
    } catch {
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, addNotification]);

  const login = useCallback(
    async (credentials) => {
      setLoading(true);
      setError(null);
      try {
        const data = await authApi.login(credentials);
        localStorage.setItem("ecomod_token", data.access_token);
        if (data.refresh_token)
          localStorage.setItem("ecomod_refresh_token", data.refresh_token);
        const decoded = decodeToken(data.access_token);
        setSessionExpiresAt(decoded?.exp || null);
        setUser(data.user);
        setPermissions(data.user?.permissions || []);

        // Fusión de carrito
        handleCartMerge(data.user.id);

        addNotification({
          type: AUTH_EVENTS.LOGIN_SUCCESS,
          message: `Bienvenido, ${data.user?.nombre || data.user?.email || "Usuario"}!`,
          severity: "success",
        });
        return data;
      } catch (err) {
        setError(err.message);
        addNotification({
          type: AUTH_EVENTS.LOGIN_ERROR,
          message: err.message || "Error al iniciar sesión",
          severity: "error",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addNotification, handleCartMerge],
  );

  // NUEVO: Login con Google — recibe la respuesta del backend y guarda tokens
  const loginWithToken = useCallback(
    (data) => {
      localStorage.setItem("ecomod_token", data.access_token);
      if (data.refresh_token)
        localStorage.setItem("ecomod_refresh_token", data.refresh_token);
      const decoded = decodeToken(data.access_token);
      setSessionExpiresAt(decoded?.exp || null);
      setUser(data.user);
      setPermissions(data.user?.permissions || []);

      // FusiÃ³n de carrito
      handleCartMerge(data.user.id);

      addNotification({
        type: AUTH_EVENTS.LOGIN_SUCCESS,
        message: `Bienvenido, ${data.user?.nombre || data.user?.email || "Usuario"}!`,
        severity: "success",
      });
    },
    [addNotification],
  );

  const logout = useCallback(
    async (sessionExpired = false) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("ecomod_token");
        if (token && !sessionExpired) await authApi.logout().catch(() => {});
      } finally {
        localStorage.removeItem("ecomod_token");
        localStorage.removeItem("ecomod_refresh_token");
        localStorage.removeItem("ecomod_remember_me");
        setUser(null);
        setPermissions([]);
        setSessionExpiresAt(null);
        setError(null);
        if (!sessionExpired) {
          addNotification({
            type: AUTH_EVENTS.LOGOUT,
            message: "SesiÃ³n cerrada correctamente",
            severity: "info",
          });
        } else {
          addNotification({
            type: AUTH_EVENTS.SESSION_EXPIRED,
            message:
              "Tu sesiÃ³n ha expirado. Por favor, inicia sesiÃ³n nuevamente.",
            severity: "warning",
          });
        }
        setLoading(false);
      }
    },
    [addNotification],
  );

  const updateProfile = useCallback(
    async (profileData) => {
      setLoading(true);
      try {
        const updatedUser = await authApi.updateProfile(profileData);
        setUser(updatedUser);
        addNotification({
          type: AUTH_EVENTS.PROFILE_UPDATED,
          message: "Perfil actualizado correctamente",
          severity: "success",
        });
        return updatedUser;
      } catch (err) {
        addNotification({
          type: AUTH_EVENTS.PROFILE_UPDATED,
          message: err.message || "Error al actualizar perfil",
          severity: "error",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addNotification],
  );

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      setLoading(true);
      try {
        await authApi.changePassword({ currentPassword, newPassword });
        addNotification({
          type: "PASSWORD_CHANGED",
          message: "ContraseÃ±a actualizada correctamente",
          severity: "success",
        });
        return true;
      } catch (err) {
        addNotification({
          type: "PASSWORD_CHANGE_ERROR",
          message: err.message || "Error al cambiar contraseÃ±a",
          severity: "error",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addNotification],
  );

  const hasPermission = useCallback(
    (requiredPermission) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      return permissions.includes(requiredPermission);
    },
    [user, permissions],
  );

  const hasRole = useCallback(
    (requiredRole) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      return user.role === requiredRole;
    },
    [user],
  );

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("ecomod_token");
      if (token && !isTokenExpired(token)) {
        try {
          const profile = await fetchProfile();
          const decoded = decodeToken(token);
          setSessionExpiresAt(decoded?.exp || null);
          setUser(profile);
          setPermissions(profile?.permissions || []);
        } catch (error) {
          if (!isTokenExpired(token)) {
            const newToken = await refreshToken();
            if (newToken) await fetchProfile();
            else logout(true);
          } else {
            logout(true);
          }
        }
      } else if (token && isTokenExpired(token)) {
        const newToken = await refreshToken();
        if (!newToken) logout(true);
      }
      setInitialized(true);
      setLoading(false);
    };
    initAuth();
  }, [fetchProfile, isTokenExpired, logout, refreshToken]);

  const value = useMemo(
    () => ({
      user,
      loading,
      initialized,
      error,
      permissions,
      notifications,
      isAuthenticated: !!user,
      isSessionExpiringSoon: isSessionExpiringSoon(),
      sessionExpiresAt,
      login,
      loginWithToken, // âœ… expuesto para Google
      logout,
      updateProfile,
      changePassword,
      hasPermission,
      hasRole,
      addNotification,
      markNotificationAsRead,
      clearNotifications,
      refreshToken,
    }),
    [
      user,
      loading,
      initialized,
      error,
      permissions,
      notifications,
      isSessionExpiringSoon,
      sessionExpiresAt,
      login,
      loginWithToken,
      logout,
      updateProfile,
      changePassword,
      hasPermission,
      hasRole,
      addNotification,
      markNotificationAsRead,
      clearNotifications,
      refreshToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const useRoleCheck = (requiredRole) => {
  const { hasRole } = useAuth();
  return hasRole(requiredRole);
};

export const usePermissionCheck = (requiredPermission) => {
  const { hasPermission } = useAuth();
  return hasPermission(requiredPermission);
};
