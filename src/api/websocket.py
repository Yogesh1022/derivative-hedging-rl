"""WebSocket server for real-time updates."""

import asyncio
import logging
from typing import Dict, Any
import socketio

logger = logging.getLogger(__name__)

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',  # Configure properly in production
    logger=True,
    engineio_logger=False,
)

# Wrap with ASGI app
socket_app = socketio.ASGIApp(sio)

# Active connections tracker
active_connections: Dict[str, Any] = {}


@sio.event
async def connect(sid, environ):
    """Handle client connection."""
    logger.info(f"🔌 WebSocket client connected: {sid}")
    active_connections[sid] = {
        'connected_at': asyncio.get_event_loop().time(),
        'subscriptions': [],
    }
    await sio.emit('connection_established', {'sid': sid, 'status': 'connected'}, room=sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnection."""
    logger.info(f"❌ WebSocket client disconnected: {sid}")
    if sid in active_connections:
        del active_connections[sid]


@sio.event
async def subscribe(sid, data):
    """
    Subscribe to specific data streams.
    
    Data format:
    {
        "type": "market_data" | "training_progress" | "risk_metrics" | "hedging_signals",
        "id": "unique_identifier"
    }
    """
    stream_type = data.get('type')
    identifier = data.get('id')
    
    logger.info(f"📡 Client {sid} subscribing to {stream_type}:{identifier}")
    
    if sid in active_connections:
        subscription = {
            'type': stream_type,
            'id': identifier,
        }
        if subscription not in active_connections[sid]['subscriptions']:
            active_connections[sid]['subscriptions'].append(subscription)
    
    await sio.emit('subscribed', {
        'type': stream_type,
        'id': identifier,
        'status': 'success',
        'message': f'Subscribed to {stream_type}:{identifier}'
    }, room=sid)


@sio.event
async def unsubscribe(sid, data):
    """Unsubscribe from data streams."""
    stream_type = data.get('type')
    identifier = data.get('id')
    
    logger.info(f"🔇 Client {sid} unsubscribing from {stream_type}:{identifier}")
    
    if sid in active_connections:
        active_connections[sid]['subscriptions'] = [
            sub for sub in active_connections[sid]['subscriptions']
            if not (sub['type'] == stream_type and sub['id'] == identifier)
        ]
    
    await sio.emit('unsubscribed', {
        'type': stream_type,
        'id': identifier,
        'status': 'success',
        'message': f'Unsubscribed from {stream_type}:{identifier}'
    }, room=sid)


@sio.event
async def ping(sid):
    """Handle ping requests."""
    await sio.emit('pong', {'timestamp': asyncio.get_event_loop().time()}, room=sid)


# Broadcast functions for use throughout the application

async def broadcast_training_progress(job_id: str, progress: Dict[str, Any]):
    """
    Broadcast training progress to subscribed clients.
    
    Args:
        job_id: Training job identifier
        progress: Progress data including metrics, episode number, etc.
    """
    for sid, conn_data in active_connections.items():
        for sub in conn_data['subscriptions']:
            if sub['type'] == 'training_progress' and sub['id'] == job_id:
                await sio.emit('training_progress', {
                    'job_id': job_id,
                    'progress': progress,
                    'timestamp': asyncio.get_event_loop().time()
                }, room=sid)


async def broadcast_market_data(symbol: str, data: Dict[str, Any]):
    """
    Broadcast market data updates to subscribed clients.
    
    Args:
        symbol: Stock/option symbol
        data: Market data (price, volume, Greeks, etc.)
    """
    for sid, conn_data in active_connections.items():
        for sub in conn_data['subscriptions']:
            if sub['type'] == 'market_data' and sub['id'] == symbol:
                await sio.emit('market_data', {
                    'symbol': symbol,
                    'data': data,
                    'timestamp': asyncio.get_event_loop().time()
                }, room=sid)


async def broadcast_risk_metrics(portfolio_id: str, metrics: Dict[str, Any]):
    """
    Broadcast risk metrics to subscribed clients.
    
    Args:
        portfolio_id: Portfolio identifier
        metrics: Risk metrics (VaR, CVaR, Greeks, etc.)
    """
    for sid, conn_data in active_connections.items():
        for sub in conn_data['subscriptions']:
            if sub['type'] == 'risk_metrics' and sub['id'] == portfolio_id:
                await sio.emit('risk_metrics', {
                    'portfolio_id': portfolio_id,
                    'metrics': metrics,
                    'timestamp': asyncio.get_event_loop().time()
                }, room=sid)


async def broadcast_hedging_signals(strategy_id: str, signals: Dict[str, Any]):
    """
    Broadcast hedging signals to subscribed clients.
    
    Args:
        strategy_id: Strategy identifier
        signals: Hedging signals (action, hedge_ratio, etc.)
    """
    for sid, conn_data in active_connections.items():
        for sub in conn_data['subscriptions']:
            if sub['type'] == 'hedging_signals' and sub['id'] == strategy_id:
                await sio.emit('hedging_signals', {
                    'strategy_id': strategy_id,
                    'signals': signals,
                    'timestamp': asyncio.get_event_loop().time()
                }, room=sid)


async def broadcast_to_all(event: str, data: Dict[str, Any]):
    """
    Broadcast a message to all connected clients.
    
    Args:
        event: Event name
        data: Event data
    """
    logger.info(f"📢 Broadcasting {event} to all clients ({len(active_connections)})")
    await sio.emit(event, data)


def get_active_connections():
    """Get count of active connections."""
    return len(active_connections)


def get_connection_info():
    """Get detailed connection information."""
    return {
        'total_connections': len(active_connections),
        'connections': [
            {
                'sid': sid,
                'connected_at': conn_data['connected_at'],
                'subscriptions': conn_data['subscriptions']
            }
            for sid, conn_data in active_connections.items()
        ]
    }


# Export for use in FastAPI app
def get_socket_app():
    """Get Socket.IO ASGI app for mounting in FastAPI."""
    return socket_app


# Export Socket.IO instance for use in other modules
__all__ = [
    'sio',
    'socket_app',
    'get_socket_app',
    'broadcast_training_progress',
    'broadcast_market_data',
    'broadcast_risk_metrics',
    'broadcast_hedging_signals',
    'broadcast_to_all',
    'get_active_connections',
    'get_connection_info',
]
