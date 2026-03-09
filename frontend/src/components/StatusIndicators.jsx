// ═══════════════════════════════════════════════════════════════
// ENHANCED STATUS INDICATORS - Real-time service status with modern UI
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';
import { mlService } from '../services/mlService';
import { C } from '../constants/colors';

/**
 * Pulse Animation Indicator
 */
const PulseIndicator = ({ color, size = 10 }) => (
  <div style={{ position: "relative", width: size, height: size }}>
    <div style={{ 
      position: "absolute", 
      width: size, 
      height: size, 
      borderRadius: "50%", 
      background: color,
      animation: "pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
    }} />
    <div style={{ 
      position: "absolute", 
      width: size, 
      height: size, 
      borderRadius: "50%", 
      background: color,
      opacity: 0.5,
      animation: "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
    }} />
    <style>{`
      @keyframes pulse-dot {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(0.95); }
      }
      @keyframes pulse-ring {
        0% { transform: scale(1); opacity: 0.5; }
        100% { transform: scale(2.5); opacity: 0; }
      }
    `}</style>
  </div>
);

/**
 * Enhanced WebSocket Connection Status Indicator
 */
export const WebSocketStatus = () => {
  const { connected, latency, error } = useRealtime();
  const [hov, setHov] = useState(false);

  return (
    <div 
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8,
        padding: '8px 14px',
        borderRadius: 10,
        background: connected ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' : error ? 'linear-gradient(135deg, #FFF0F0 0%, #FFE5E5 100%)' : C.lightGray,
        border: `2px solid ${connected ? '#10B981' : error ? C.red : C.border}`,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? (connected ? '0 4px 20px rgba(16,185,129,0.25)' : error ? '0 4px 20px rgba(225,6,0,0.25)' : 'none') : 'none'
      }}
      title={error || `WebSocket Latency: ${latency}ms`}
    >
      <PulseIndicator color={connected ? '#10B981' : error ? C.red : C.textMuted} size={10} />
      <span style={{ color: connected ? '#059669' : error ? C.red : C.textSub }}>
        {connected ? `LIVE ${latency}ms` : error ? 'OFFLINE' : 'CONNECTING...'}
      </span>
    </div>
  );
};

/**
 * Enhanced ML Service Status Indicator
 */
export const MLServiceStatus = () => {
  const [status, setStatus] = useState({ available: false, models: [], loading: true });
  const [hov, setHov] = useState(false);

  useEffect(() => {
    const checkMLStatus = async () => {
      try {
        const [health, modelInfo] = await Promise.all([
          mlService.checkHealth(),
          mlService.getModelInfo().catch(() => null)
        ]);
        
        setStatus({
          available: health.status === 'healthy',
          modelLoaded: health.model_loaded || false,
          models: modelInfo ? [modelInfo.name] : [],
          loading: false,
          version: modelInfo?.version || 'v1.0',
          confidence: health.confidence || 0.5
        });
      } catch (error) {
        console.error('ML Service health check failed:', error);
        setStatus({ available: false, models: [], loading: false, error: error.message });
      }
    };

    checkMLStatus();
    const interval = setInterval(checkMLStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status.loading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          padding: '8px 14px',
          borderRadius: 10,
          background: C.lightGray,
          border: `2px solid ${C.border}`,
          fontSize: 11,
          fontWeight: 700,
          color: C.textSub,
          letterSpacing: 0.5
        }}
      >
        <div 
          style={{ 
            width: 10, 
            height: 10, 
            borderRadius: '50%', 
            border: '2px solid #E8E8ED',
            borderTop: '2px solid #9CA3AF',
            animation: 'spin 0.8s linear infinite'
          }} 
        />
        ML CHECKING...
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const isOnline = status.available;
  const hasModel = status.modelLoaded;

  return (
    <div 
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8,
        padding: '8px 14px',
        borderRadius: 10,
        background: isOnline 
          ? (hasModel ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)')
          : 'linear-gradient(135deg, #FFF0F0 0%, #FFE5E5 100%)',
        border: `2px solid ${isOnline ? (hasModel ? '#3B82F6' : '#F59E0B') : C.red}`,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? (isOnline ? '0 4px 20px rgba(59,130,246,0.25)' : '0 4px 20px rgba(225,6,0,0.25)') : 'none'
      }}
      title={isOnline 
        ? `🤖 ML Service Online\nModels: ${status.models.length}\nVersion: ${status.version}\nMode: ${hasModel ? 'RL Active' : 'Heuristic'}\nConfidence: ${(status.confidence * 100).toFixed(0)}%`
        : `❌ ML Service Offline\n${status.error || 'Service not responding'}`
      }
    >
      {isOnline ? (
        <PulseIndicator color={hasModel ? '#3B82F6' : '#F59E0B'} size={10} />
      ) : (
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.red }} />
      )}
      <span style={{ color: isOnline ? (hasModel ? '#2563EB' : '#D97706') : C.red }}>
        {isOnline ? (
          <>
            {hasModel ? '🤖 ML ACTIVE' : '⚡ ML ONLINE'} {status.models.length}
          </>
        ) : (
          '❌ ML OFFLINE'
        )}
      </span>
    </div>
  );
};

/**
 * Combined Status Bar
 */
export const StatusBar = ({ style = {} }) => {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', ...style }}>
      <WebSocketStatus />
      <MLServiceStatus />
    </div>
  );
};
