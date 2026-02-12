import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (userId) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(err.message);
      setConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      if (userId) {
        socket.emit('authenticate', { userId });
      }
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

  // Send typing indicator
  const sendTyping = useCallback((channelId, isTyping) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('typing', { channelId, isTyping });
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

  const emit = useCallback((event, data) => {
    if (socketRef.current && connected) {
      socketRef.current.emit(event, data);
    }
  }, [connected]);

  return {
    socket: socketRef.current,
    connected,
    error,
    joinChannel,
    leaveChannel,
    sendTyping,
    on,
    off,
    emit,
  };
};

// Hook for real-time chat
export const useRealtimeChat = (channelId, userId) => {
  const { socket, connected, joinChannel, leaveChannel, on, off } = useSocket(userId);
  const [typingUsers, setTypingUsers] = useState([]);
  const [newMessages, setNewMessages] = useState([]);

  useEffect(() => {
    if (!channelId || !connected) return;

    joinChannel(channelId);

    // Listen for new messages
    const handleNewMessage = (message) => {
      setNewMessages(prev => [...prev, message]);
    };

    // Listen for typing indicators
    const handleTyping = ({ userId: typingUserId, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping && !prev.includes(typingUserId)) {
          return [...prev, typingUserId];
        }
        if (!isTyping) {
          return prev.filter(id => id !== typingUserId);
        }
        return prev;
      });
    };

    // Listen for user joined/left
    const handleUserJoined = (data) => {
      console.log('User joined channel:', data);
    };

    const handleUserLeft = (data) => {
      console.log('User left channel:', data);
    };

    on('new_message', handleNewMessage);
    on('typing', handleTyping);
    on('user_joined', handleUserJoined);
    on('user_left', handleUserLeft);

    return () => {
      leaveChannel(channelId);
      off('new_message', handleNewMessage);
      off('typing', handleTyping);
      off('user_joined', handleUserJoined);
      off('user_left', handleUserLeft);
    };
  }, [channelId, connected, joinChannel, leaveChannel, on, off]);

  return {
    connected,
    typingUsers,
    newMessages,
    clearNewMessages: () => setNewMessages([]),
  };
};

// Hook for booking updates
export const useRealtimeBookings = (userId) => {
  const { socket, connected, on, off } = useSocket(userId);
  const [bookingUpdates, setBookingUpdates] = useState([]);

  useEffect(() => {
    if (!connected) return;

    const handleBookingUpdate = (data) => {
      setBookingUpdates(prev => [data, ...prev].slice(0, 10));
    };

    on('booking_update', handleBookingUpdate);

    return () => {
      off('booking_update', handleBookingUpdate);
    };
  }, [connected, on, off]);

  return {
    connected,
    bookingUpdates,
    clearUpdates: () => setBookingUpdates([]),
  };
};

// Hook for notifications
export const useRealtimeNotifications = (userId) => {
  const { socket, connected, on, off } = useSocket(userId);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!connected) return;

    const handleNotification = (data) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    on('notification', handleNotification);

    return () => {
      off('notification', handleNotification);
    };
  }, [connected, on, off]);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    connected,
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
  };
};

export default useSocket;
