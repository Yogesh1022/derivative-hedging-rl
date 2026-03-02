import { useState, useEffect } from "react";
import { C } from "../../constants/colors";
import { authService } from "../../services/authService";
import { alertService } from "../../services/alertService";
import { CreateAlertModal } from "../modals/CreateAlertModal";

export const TopBar = ({ role, onLogout, onNavigate }) => {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const roleLabel =
    { trader: "Trader", analyst: "Analyst", risk_manager: "Risk Manager", admin: "Admin" }[
      role
    ] || role;

  // Get current user from storage
  const currentUser = authService.getCurrentUser();
  const userName = currentUser?.name || "User";
  const userEmail = currentUser?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  // Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const alertsData = await alertService.getAllAlerts({ limit: 10 });
        setAlerts(alertsData || []);
      } catch (err) {
        console.error("Error fetching alerts:", err);
        setAlerts([]);
      }
    };

    fetchAlerts();
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.isRead);
  const notifCount = unreadAlerts.length;

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "🔴";
      case "WARNING":
        return "🟡";
      case "INFO":
        return "🔵";
      default:
        return "🟢";
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await alertService.markAsRead(alertId);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)));
    } catch (err) {
      console.error("Error marking alert as read:", err);
    }
  };

  const handleCreateAlert = async (alertData) => {
    try {
      const newAlert = await alertService.createAlert(alertData);
      setAlerts((prev) => [newAlert, ...prev]);
      setShowCreateAlert(false);
    } catch (err) {
      console.error("Error creating alert:", err);
      alert("Failed to create alert: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div
      style={{
        height: 64,
        background: C.white,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
        position: "sticky",
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Market tickers */}
      <div style={{ display: "flex", gap: 20, flex: 1 }}>
        {[
          ["SPY", "485.20", "+0.87%", true],
          ["VIX", "14.32", "-2.10%", false],
          ["QQQ", "412.48", "+1.12%", true],
        ].map(([t, p, c, up]) => (
          <div key={t} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>{t}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: up ? C.success : C.red }}>
              {c}
            </span>
          </div>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.lightGray,
              cursor: "pointer",
              fontSize: 16,
              position: "relative",
            }}
          >
            🔔
            {notifCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 16,
                  height: 16,
                  background: C.red,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: C.white,
                  fontWeight: 700,
                }}
              >
                {notifCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 46,
                width: 320,
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                boxShadow: C.shadowMd,
                zIndex: 200,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: `1px solid ${C.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 13 }}>Notifications</span>
                <button
                  onClick={() => {
                    setShowNotif(false);
                    setShowCreateAlert(true);
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: `1px solid ${C.red}`,
                    background: "transparent",
                    color: C.red,
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: 600,
                  }}
                >
                  + New Alert
                </button>
              </div>
              {alerts.length === 0 ? (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    fontSize: 12,
                    color: C.textMuted,
                  }}
                >
                  No notifications
                </div>
              ) : (
                alerts.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    onClick={() => handleMarkAsRead(a.id)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: `1px solid ${C.borderLight}`,
                      display: "flex",
                      gap: 10,
                      cursor: "pointer",
                      background: a.isRead ? "transparent" : C.offWhite,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.lightGray)}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = a.isRead
                        ? "transparent"
                        : C.offWhite)
                    }
                  >
                    <span style={{ fontSize: 14 }}>{getSeverityIcon(a.severity)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: C.text, marginBottom: 2 }}>
                        {a.message}
                      </div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>
                        {getTimeAgo(a.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.lightGray,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: C.red,
                color: C.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {userInitial}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{userName}</span>
            <span style={{ fontSize: 10, color: C.textMuted }}>▾</span>
          </button>
          {showProfile && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 46,
                width: 200,
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                boxShadow: C.shadowMd,
                zIndex: 200,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{userName}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{userEmail}</div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                  {roleLabel}
                </div>
              </div>
              <button
                onClick={onLogout}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 13,
                  color: C.red,
                  fontFamily: "inherit",
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Alert Modal */}
      {showCreateAlert && (
        <CreateAlertModal
          onClose={() => setShowCreateAlert(false)}
          onCreate={handleCreateAlert}
        />
      )}
    </div>
  );
};
