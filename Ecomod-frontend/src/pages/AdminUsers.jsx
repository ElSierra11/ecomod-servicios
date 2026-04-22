import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import {
  Users,
  Shield,
  User,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Mail,
  Calendar,
  AlertCircle,
} from "lucide-react";

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [message, setMessage] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await authApi.getAllUsers();
      setUsers(data);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

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
        text: `Usuario ${isActive ? "activado" : "desactivado"}`,
      });
      loadUsers();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleDelete = async (userId) => {
    if (
      !confirm(
        "¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.",
      )
    )
      return;
    try {
      await authApi.deleteUser(userId);
      setMessage({ type: "success", text: "Usuario eliminado correctamente" });
      loadUsers();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.nombre?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" ? u.is_active : !u.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="admin-users">
      <div className="page-header">
        <div className="page-title">
          <Users size={24} />
          <h1>Gestión de Usuarios</h1>
        </div>
        <button className="refresh-btn" onClick={loadUsers}>
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}>✕</button>
        </div>
      )}

      <div className="filters">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por email, usuario o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="cliente">Clientes</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando usuarios...</div>
      ) : (
        <div className="users-table">
          <div className="table-header">
            <span>Usuario</span>
            <span>Contacto</span>
            <span>Rol</span>
            <span>Estado</span>
            <span>Registro</span>
            <span>Acciones</span>
          </div>
          {filteredUsers.map((u) => (
            <div key={u.id} className="table-row">
              <div className="user-info">
                <div className="user-avatar">
                  {u.nombre ? u.nombre[0] : u.email[0]}
                </div>
                <div>
                  <div className="user-name">
                    {u.nombre} {u.apellido}
                  </div>
                  <div className="user-username">
                    @{u.username || u.email.split("@")[0]}
                  </div>
                </div>
              </div>
              <div className="user-contact">
                <Mail size={14} />
                <span>{u.email}</span>
              </div>
              <div className="user-role">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  disabled={u.id === currentUser?.id}
                >
                  <option value="cliente">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="user-status">
                <button
                  className={`status-badge ${u.is_active ? "active" : "inactive"}`}
                  onClick={() => handleStatusChange(u.id, !u.is_active)}
                  disabled={u.id === currentUser?.id}
                >
                  {u.is_active ? (
                    <CheckCircle size={12} />
                  ) : (
                    <XCircle size={12} />
                  )}
                  {u.is_active ? "Activo" : "Inactivo"}
                </button>
              </div>
              <div className="user-date">
                <Calendar size={12} />
                {new Date(u.created_at).toLocaleDateString("es-CO")}
              </div>
              <div className="user-actions">
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(u.id)}
                  disabled={u.id === currentUser?.id}
                  title={
                    u.id === currentUser?.id
                      ? "No puedes eliminarte a ti mismo"
                      : "Eliminar usuario"
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .admin-users {
          padding: 24px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .page-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-title h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        .message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .message.success {
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.3);
          color: #00ff88;
        }

        .message.error {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.3);
          color: #ff6b6b;
        }

        .message button {
          margin-left: auto;
          background: none;
          border: none;
          color: currentColor;
          cursor: pointer;
        }

        .filters {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 12px;
          flex: 1;
          min-width: 200px;
        }

        .search-box input {
          flex: 1;
          background: none;
          border: none;
          color: var(--text);
          outline: none;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 12px;
        }

        .filter-group select {
          background: none;
          border: none;
          color: var(--text);
          outline: none;
        }

        .users-table {
          background: var(--surface);
          border-radius: 16px;
          border: 1px solid var(--border);
          overflow-x: auto;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr 1.5fr 1fr;
          padding: 16px;
          background: var(--bg2);
          border-bottom: 1px solid var(--border);
          font-size: 12px;
          font-weight: 600;
          color: var(--text2);
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr 1.5fr 1fr;
          padding: 16px;
          border-bottom: 1px solid var(--border);
          align-items: center;
          transition: background 0.2s;
        }

        .table-row:hover {
          background: var(--bg2);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .user-name {
          font-weight: 600;
          font-size: 14px;
        }

        .user-username {
          font-size: 11px;
          color: var(--text3);
        }

        .user-contact {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .user-role select {
          padding: 4px 8px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          font-size: 12px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .status-badge.active {
          background: rgba(0, 255, 136, 0.1);
          color: #00ff88;
          border: 1px solid rgba(0, 255, 136, 0.2);
        }

        .status-badge.inactive {
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
          border: 1px solid rgba(255, 107, 107, 0.2);
        }

        .user-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text3);
        }

        .delete-btn {
          background: none;
          border: none;
          color: var(--text3);
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .delete-btn:hover:not(:disabled) {
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
        }

        .delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: var(--text3);
        }

        @media (max-width: 1024px) {
          .table-header,
          .table-row {
            grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr 0.8fr;
          }
        }

        @media (max-width: 768px) {
          .users-table {
            overflow-x: scroll;
          }
          .table-header,
          .table-row {
            min-width: 800px;
          }
        }
      `}</style>
    </div>
  );
}
