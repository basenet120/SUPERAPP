import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (userId) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnected(true);
      setError(null);

      // Authenticate with user ID
      if (userId) {
        socket.emit('authenticate', { userId });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(err.message);
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  // Join a channel
  const joinChannel = useCallback((channelId) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('join_channel', channelId);
    }
  }, [connected]);

  // Leave a channel
  const leaveChannel = useCallback((channelId) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('leave_channel', channelId);
    }
  }, [connected]);

  // Listen to events
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    connected,
    error,
    joinChannel,
    leaveChannel,
    on,
    off
  };
};

export default useSocket;
