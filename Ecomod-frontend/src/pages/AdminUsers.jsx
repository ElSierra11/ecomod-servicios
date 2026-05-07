import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { authApi } from "../services/api";
import {
  Users,
  Shield,
  User,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Mail,
  Calendar,
  AlertCircle,
  Crown,
  Sparkles,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [message, setMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await authApi.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
      setMessage({
        type: "error",
        text: error.message || "No se pudieron cargar los usuarios",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Auto-clear messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await authApi.updateUserRole(userId, newRole);
      setMessage({ type: "success", text: "Rol actualizado correctamente" });
      loadUsers();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    try {
      await authApi.updateUserStatus(userId, isActive);
      setMessage({
        type: "success",
        text: `Usuario ${isActive ? "activado" : "desactivado"} correctamente`,
      });
      loadUsers();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleDelete = async (userId) => {
    if (
      !confirm(
        "¿Estás seguro de eliminar este usuario?\n\nEsta acción no se puede deshacer y eliminará todos los datos asociados.",
      )
    )
      return;

    setDeletingId(userId);
    try {
      await authApi.deleteUser(userId);
      setMessage({
        type: "success",
        text: "Usuario eliminado permanentemente",
      });
      loadUsers();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      u.apellido?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" ? u.is_active : !u.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
    admins: users.filter((u) => u.role === "admin").length,
    clients: users.filter((u) => u.role === "cliente").length,
  };

  const activeFiltersCount =
    (filterRole !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);

  return (
    <div className={`au-root ${isDark ? "dark" : "light"}`}>
      {/* Header */}
      <div className="au-header">
        <div className="au-header-left">
          <div className="au-badge">
            <Crown size={14} strokeWidth={2.5} />
            <span>PANEL ADMIN</span>
          </div>
          <h1 className="au-title">
            <Users size={28} strokeWidth={2.5} style={{ color: "#e8291c" }} />
            Gestión de Usuarios
          </h1>
          <p className="au-sub">
            Administra roles, estados y permisos de tu base de usuarios
          </p>
        </div>
        <div className="au-header-right">
          <div className="au-count">
            <span className="au-count-value">{stats.total}</span>
            <span className="au-count-label">usuarios</span>
          </div>
          <button className="au-refresh-btn" onClick={loadUsers}>
            <RefreshCw size={16} strokeWidth={2} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`au-message ${message.type}`}>
          {message.type === "success" ? (
            <CheckCircle size={18} strokeWidth={2.5} />
          ) : (
            <AlertCircle size={18} strokeWidth={2.5} />
          )}
          <span>{message.text}</span>
          <button className="au-message-close" onClick={() => setMessage(null)}>
            <XCircle size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="au-stats">
        {[
          {
            icon: Users,
            label: "Total",
            value: stats.total,
            color: "#e8291c",
            bg: "rgba(232,41,28,.1)",
          },
          {
            icon: UserCheck,
            label: "Activos",
            value: stats.active,
            color: "#10b981",
            bg: "rgba(16,185,129,.1)",
          },
          {
            icon: UserX,
            label: "Inactivos",
            value: stats.inactive,
            color: "#f59e0b",
            bg: "rgba(245,158,11,.1)",
          },
          {
            icon: Shield,
            label: "Admins",
            value: stats.admins,
            color: "#8b5cf6",
            bg: "rgba(139,92,246,.1)",
          },
        ].map(({ icon: Icon, label, value, color, bg }, i) => (
          <div
            key={label}
            className="au-stat"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="au-stat-icon" style={{ background: bg, color }}>
              <Icon size={20} strokeWidth={2} />
            </div>
            <div className="au-stat-body">
              <span className="au-stat-value" style={{ color }}>
                {value}
              </span>
              <span className="au-stat-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="au-filters">
        <div className="au-search">
          <Search size={16} strokeWidth={2} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="au-search-clear" onClick={() => setSearch("")}>
              <XCircle size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="au-filter-pills">
          <div className="au-filter-group">
            <Filter size={14} strokeWidth={2} />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="cliente">Clientes</option>
            </select>
          </div>

          <div className="au-filter-group">
            <UserCheck size={14} strokeWidth={2} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          {activeFiltersCount > 0 && (
            <button
              className="au-clear-filters"
              onClick={() => {
                setFilterRole("all");
                setFilterStatus("all");
                setSearch("");
              }}
            >
              <XCircle size={12} strokeWidth={2.5} />
              Limpiar {activeFiltersCount} filtro
              {activeFiltersCount > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="au-results">
        <span>
          Mostrando <strong>{filteredUsers.length}</strong> de{" "}
          <strong>{users.length}</strong> usuarios
        </span>
        {(search || activeFiltersCount > 0) && (
          <span className="au-results-filtered">(filtrados)</span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="au-loading">
          <div className="au-spinner" />
          <span>Cargando usuarios...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="au-empty">
          <Users size={48} strokeWidth={1} />
          <h3>No se encontraron usuarios</h3>
          <p>Intenta ajustar los filtros de búsqueda</p>
          {(search || activeFiltersCount > 0) && (
            <button
              className="au-empty-btn"
              onClick={() => {
                setSearch("");
                setFilterRole("all");
                setFilterStatus("all");
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="au-table-wrap">
          <div className="au-table">
            <div className="au-table-header">
              <span className="au-col-user">Usuario</span>
              <span className="au-col-contact">Contacto</span>
              <span className="au-col-role">Rol</span>
              <span className="au-col-status">Estado</span>
              <span className="au-col-date">Registro</span>
              <span className="au-col-actions">Acciones</span>
            </div>

            {filteredUsers.map((u, i) => {
              const isSelf = u.id === currentUser?.id;
              const initials = u.nombre
                ? `${u.nombre[0]}${u.apellido ? u.apellido[0] : ""}`.toUpperCase()
                : u.email[0].toUpperCase();

              return (
                <div
                  key={u.id}
                  className={`au-table-row ${isSelf ? "is-self" : ""}`}
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  {/* User Info */}
                  <div className="au-col-user">
                    <div
                      className="au-avatar"
                      style={{
                        background: `linear-gradient(135deg, ${
                          u.role === "admin" ? "#8b5cf6" : "#e8291c"
                        }, ${u.role === "admin" ? "#7c3aed" : "#f97316"})`,
                      }}
                    >
                      {initials}
                    </div>
                    <div className="au-user-info">
                      <span className="au-user-name">
                        {u.nombre} {u.apellido}
                        {isSelf && <span className="au-self-badge">Tú</span>}
                      </span>
                      <span className="au-user-handle">
                        @{u.username || u.email.split("@")[0]}
                      </span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="au-col-contact">
                    <Mail size={13} strokeWidth={2} />
                    <span>{u.email}</span>
                  </div>

                  {/* Role */}
                  <div className="au-col-role">
                    <div className="au-select-wrap">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={isSelf}
                        className={u.role}
                      >
                        <option value="cliente">Cliente</option>
                        <option value="admin">Administrador</option>
                      </select>
                      <ChevronDown size={12} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="au-col-status">
                    <button
                      className={`au-status-toggle ${u.is_active ? "active" : "inactive"}`}
                      onClick={() => handleStatusChange(u.id, !u.is_active)}
                      disabled={isSelf}
                    >
                      <span className="au-status-dot" />
                      <span>{u.is_active ? "Activo" : "Inactivo"}</span>
                    </button>
                  </div>

                  {/* Date */}
                  <div className="au-col-date">
                    <Calendar size={12} strokeWidth={2} />
                    <span>{formatDate(u.created_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="au-col-actions">
                    <button
                      className="au-delete-btn"
                      onClick={() => handleDelete(u.id)}
                      disabled={isSelf || deletingId === u.id}
                      title={
                        isSelf
                          ? "No puedes eliminarte a ti mismo"
                          : "Eliminar usuario"
                      }
                    >
                      {deletingId === u.id ? (
                        <span className="au-btn-spinner" />
                      ) : (
                        <Trash2 size={16} strokeWidth={2} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@400;600;700;800&display=swap');

        .au-root {
          font-family: 'Inter', sans-serif;
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .au-root.dark {
          --card: #1c1c24;
          --border: rgba(255,255,255,.08);
          --text: #f0f0f5;
          --text2: #a0a0b0;
          --text3: #6b6b80;
          --bg: #0f0f13;
          --bg2: #16161e;
          --hover-bg: rgba(232,41,28,.05);
        }
        .au-root.light {
          --card: #ffffff;
          --border: #e5e7eb;
          --text: #1a1a1a;
          --text2: #4b5563;
          --text3: #9ca3af;
          --bg: #f5f5f5;
          --bg2: #fafafa;
          --hover-bg: #fff5f5;
        }

        /* Header */
        .au-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 28px; flex-wrap: wrap; gap: 16px;
        }
        .au-header-left { flex: 1; }
        .au-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 5px 14px;
          background: rgba(232,41,28,.08);
          border: 1.5px solid rgba(232,41,28,.15);
          border-radius: 20px;
          font-size: 10px; font-weight: 800;
          letter-spacing: .12em; color: #e8291c;
          margin-bottom: 12px; text-transform: uppercase;
        }
        .au-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 32px; font-weight: 800;
          color: var(--text); margin: 0 0 8px;
          display: flex; align-items: center; gap: 12px;
          letter-spacing: -.02em;
        }
        .au-sub {
          font-size: 15px; color: var(--text3);
          margin: 0; font-weight: 500;
        }
        .au-header-right {
          display: flex; align-items: center; gap: 16px;
        }
        .au-count {
          text-align: center; padding: 12px 20px;
          background: var(--bg2);
          border: 1.5px solid var(--border);
          border-radius: 14px;
        }
        .au-count-value {
          display: block;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 28px; font-weight: 800;
          color: #e8291c; line-height: 1;
        }
        .au-count-label {
          font-size: 11px; color: var(--text3);
          font-weight: 600; text-transform: uppercase;
          letter-spacing: .05em;
        }
        .au-refresh-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          background: var(--bg2);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          font-size: 13px; font-weight: 700;
          color: var(--text2); cursor: pointer;
          transition: all .2s;
        }
        .au-refresh-btn:hover {
          border-color: #e8291c; color: #e8291c;
          background: var(--hover-bg);
        }

        /* Message */
        .au-message {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px; border-radius: 12px;
          margin-bottom: 24px;
          animation: slideDown .3s ease;
          font-size: 14px; font-weight: 600;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .au-message.success {
          background: rgba(16,185,129,.08);
          border: 1.5px solid rgba(16,185,129,.2);
          color: #10b981;
        }
        .au-message.error {
          background: rgba(220,38,38,.08);
          border: 1.5px solid rgba(220,38,38,.2);
          color: #dc2626;
        }
        .au-message-close {
          margin-left: auto; background: none; border: none;
          cursor: pointer; color: currentColor;
          display: flex; align-items: center;
          padding: 4px; border-radius: 6px;
          transition: all .15s;
        }
        .au-message-close:hover { background: rgba(0,0,0,.05); }

        /* Stats */
        .au-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 16px; margin-bottom: 28px;
        }
        .au-stat {
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 16px; padding: 18px;
          display: flex; align-items: center; gap: 14px;
          animation: fadeUp .5s ease forwards;
          opacity: 0; transition: all .25s;
        }
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
          from { opacity: 0; transform: translateY(16px); }
        }
        .au-stat:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,.08);
          border-color: rgba(232,41,28,.2);
        }
        .au-stat-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .au-stat-value {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 26px; font-weight: 800;
          line-height: 1;
        }
        .au-stat-label {
          font-size: 12px; color: var(--text3);
          font-weight: 600; margin-top: 4px;
        }

        /* Filters */
        .au-filters {
          display: flex; gap: 12px; margin-bottom: 16px;
          flex-wrap: wrap; align-items: center;
        }
        .au-search {
          flex: 1; min-width: 260px;
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px;
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          transition: all .2s;
        }
        .au-search:focus-within {
          border-color: #e8291c;
          box-shadow: 0 0 0 4px rgba(232,41,28,.08);
        }
        .au-search input {
          flex: 1; background: none; border: none; outline: none;
          font-family: 'Inter', sans-serif; font-size: 14px;
          color: var(--text);
        }
        .au-search input::placeholder { color: var(--text3); }
        .au-search-clear {
          background: none; border: none; cursor: pointer;
          color: var(--text3); display: flex; align-items: center;
          transition: color .15s;
        }
        .au-search-clear:hover { color: #e8291c; }

        .au-filter-pills {
          display: flex; gap: 10px; flex-wrap: wrap;
        }
        .au-filter-group {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px;
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 10px; color: var(--text2);
        }
        .au-filter-group select {
          background: none; border: none; outline: none;
          font-family: 'Inter', sans-serif; font-size: 13px;
          font-weight: 600; color: var(--text);
          cursor: pointer;
        }
        .au-clear-filters {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 14px;
          background: rgba(220,38,38,.08);
          border: 1.5px solid rgba(220,38,38,.2);
          border-radius: 10px;
          font-size: 12px; font-weight: 700;
          color: #dc2626; cursor: pointer;
          transition: all .15s;
        }
        .au-clear-filters:hover {
          background: rgba(220,38,38,.12);
        }

        /* Results */
        .au-results {
          font-size: 13px; color: var(--text3);
          margin-bottom: 16px; font-weight: 500;
        }
        .au-results strong { color: var(--text); }
        .au-results-filtered {
          color: #e8291c; font-weight: 700;
          margin-left: 4px;
        }

        /* Table */
        .au-table-wrap {
          background: var(--card);
          border: 1.5px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
        }
        .au-table {
          display: flex; flex-direction: column;
        }
        .au-table-header {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1.2fr 1.2fr 0.8fr;
          gap: 16px;
          padding: 16px 24px;
          background: var(--bg2);
          border-bottom: 1.5px solid var(--border);
        }
        .au-table-header span {
          font-size: 11px; font-weight: 800;
          color: var(--text3); text-transform: uppercase;
          letter-spacing: .06em;
        }

        .au-table-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1.2fr 1.2fr 0.8fr;
          gap: 16px;
          padding: 14px 24px;
          border-bottom: 1px solid var(--border);
          align-items: center;
          animation: fadeUp .4s ease forwards;
          opacity: 0;
          transition: all .2s;
        }
        .au-table-row:last-child { border-bottom: none; }
        .au-table-row:hover { background: var(--hover-bg); }
        .au-table-row.is-self {
          background: rgba(232,41,28,.03);
          border-left: 3px solid #e8291c;
        }

        /* Columns */
        .au-col-user {
          display: flex; align-items: center; gap: 12px;
        }
        .au-avatar {
          width: 40px; height: 40px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 13px;
          color: #fff; flex-shrink: 0;
        }
        .au-user-info { display: flex; flex-direction: column; gap: 2px; }
        .au-user-name {
          font-size: 14px; font-weight: 700;
          color: var(--text); display: flex; align-items: center; gap: 8px;
        }
        .au-self-badge {
          padding: 2px 8px;
          background: rgba(232,41,28,.1);
          border: 1px solid rgba(232,41,28,.2);
          border-radius: 20px;
          font-size: 9px; font-weight: 800;
          color: #e8291c; text-transform: uppercase;
          letter-spacing: .05em;
        }
        .au-user-handle {
          font-size: 12px; color: var(--text3);
          font-weight: 500;
        }

        .au-col-contact {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: var(--text2);
        }
        .au-col-contact svg { color: var(--text3); flex-shrink: 0; }

        .au-select-wrap {
          position: relative; display: flex; align-items: center;
        }
        .au-select-wrap select {
          padding: 8px 28px 8px 12px;
          background: var(--bg2);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 700;
          color: var(--text); cursor: pointer;
          appearance: none;
          transition: all .2s;
        }
        .au-select-wrap select:hover { border-color: #e8291c; }
        .au-select-wrap select:focus { outline: none; border-color: #e8291c; }
        .au-select-wrap select.admin {
          background: rgba(139,92,246,.1);
          border-color: rgba(139,92,246,.3);
          color: #8b5cf6;
        }
        .au-select-wrap select.cliente {
          background: rgba(59,130,246,.1);
          border-color: rgba(59,130,246,.3);
          color: #3b82f6;
        }
        .au-select-wrap svg {
          position: absolute; right: 10px;
          pointer-events: none; color: var(--text3);
        }

        .au-status-toggle {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px; font-weight: 700;
          cursor: pointer; transition: all .2s;
          border: 1.5px solid transparent;
        }
        .au-status-toggle.active {
          background: rgba(16,185,129,.1);
          border-color: rgba(16,185,129,.2);
          color: #10b981;
        }
        .au-status-toggle.inactive {
          background: rgba(220,38,38,.08);
          border-color: rgba(220,38,38,.2);
          color: #dc2626;
        }
        .au-status-toggle:hover:not(:disabled) { transform: scale(1.05); }
        .au-status-toggle:disabled { opacity: .5; cursor: not-allowed; }
        .au-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: currentColor;
        }

        .au-col-date {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--text3);
        }

        .au-delete-btn {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: none; border: 1.5px solid var(--border);
          color: var(--text3); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .2s;
        }
        .au-delete-btn:hover:not(:disabled) {
          background: rgba(220,38,38,.1);
          border-color: rgba(220,38,38,.3);
          color: #dc2626;
        }
        .au-delete-btn:disabled { opacity: .4; cursor: not-allowed; }
        .au-btn-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(220,38,38,.3);
          border-top-color: #dc2626;
          border-radius: 50%;
          animation: spin .6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Loading & Empty */
        .au-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 300px; gap: 16px;
          color: var(--text3);
        }
        .au-spinner {
          width: 44px; height: 44px;
          border: 3px solid rgba(232,41,28,.12);
          border-top-color: #e8291c;
          border-radius: 50%;
          animation: spin .8s linear infinite;
        }
        .au-empty {
          text-align: center; padding: 60px 24px;
          display: flex; flex-direction: column;
          align-items: center; gap: 16px;
          color: var(--text3);
        }
        .au-empty h3 {
          font-size: 18px; font-weight: 800;
          color: var(--text2); margin: 0;
        }
        .au-empty p { font-size: 14px; margin: 0; }
        .au-empty-btn {
          padding: 10px 24px;
          background: linear-gradient(135deg, #e8291c, #c2200f);
          border: none; border-radius: 10px;
          color: #fff; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all .25s;
          margin-top: 8px;
        }
        .au-empty-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(232,41,28,.3);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .au-stats { grid-template-columns: repeat(2, 1fr); }
          .au-table-header,
          .au-table-row {
            grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr 0.8fr;
          }
        }
        @media (max-width: 768px) {
          .au-header { flex-direction: column; }
          .au-header-right { width: 100%; justify-content: space-between; }
          .au-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .au-stat { padding: 14px; }
          .au-table-wrap { overflow-x: auto; }
          .au-table { min-width: 800px; }
          .au-filters { flex-direction: column; align-items: stretch; }
          .au-search { min-width: auto; }
        }
        @media (max-width: 480px) {
          .au-root { padding: 16px; }
          .au-title { font-size: 26px; }
          .au-stats { grid-template-columns: 1fr 1fr; }
          .au-stat-icon { width: 36px; height: 36px; }
          .au-stat-value { font-size: 22px; }
        }
      `}</style>
    </div>
  );
}
