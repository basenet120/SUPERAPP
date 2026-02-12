import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Send, Paperclip, Phone, Video, 
  MoreVertical, Search, Archive, Check, CheckCheck,
  Clock, FileText, Image, X, ChevronLeft, User
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import api from '../../services/api';

// Mock data for development - replace with API calls
const MOCK_CONVERSATIONS = [
  {
    id: '1',
    bookingId: 'BK-2024-001',
    clientName: 'Sarah Johnson',
    clientEmail: 'sarah@productions.com',
    clientAvatar: null,
    lastMessage: 'Can we add an extra light kit to the booking?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    unreadCount: 2,
    status: 'active',
    bookingDate: '2024-03-15',
    totalAmount: 8500
  },
  {
    id: '2',
    bookingId: 'BK-2024-002',
    clientName: 'Michael Chen',
    clientEmail: 'mike@studioc.com',
    clientAvatar: null,
    lastMessage: 'Thanks for the quick response!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    unreadCount: 0,
    status: 'active',
    bookingDate: '2024-03-18',
    totalAmount: 12400
  },
  {
    id: '3',
    bookingId: 'BK-2024-003',
    clientName: 'Emma Rodriguez',
    clientEmail: 'emma@films.com',
    clientAvatar: null,
    lastMessage: 'The COI has been uploaded, please check.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    unreadCount: 1,
    status: 'active',
    bookingDate: '2024-03-20',
    totalAmount: 5600
  }
];

const MOCK_MESSAGES = {
  '1': [
    {
      id: 'm1',
      senderType: 'client',
      senderName: 'Sarah Johnson',
      message: 'Hi! I\'m looking to book the studio for a product shoot on March 15th.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      read: true,
      attachments: []
    },
    {
      id: 'm2',
      senderType: 'user',
      senderName: 'Base Team',
      message: 'Hi Sarah! We\'d be happy to help with your product shoot. What time were you thinking?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23),
      read: true,
      attachments: []
    },
    {
      id: 'm3',
      senderType: 'client',
      senderName: 'Sarah Johnson',
      message: 'Probably 9 AM to 5 PM. We\'ll also need some lighting equipment.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22),
      read: true,
      attachments: []
    },
    {
      id: 'm4',
      senderType: 'user',
      senderName: 'Base Team',
      message: 'Perfect! I\'ve sent you a quote for the studio day + lighting package. Let me know if you need anything else.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20),
      read: true,
      attachments: [
        { name: 'Quote_BK-2024-001.pdf', type: 'pdf', size: '245 KB' }
      ]
    },
    {
      id: 'm5',
      senderType: 'client',
      senderName: 'Sarah Johnson',
      message: 'Can we add an extra light kit to the booking?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false,
      attachments: []
    }
  ],
  '2': [
    {
      id: 'm1',
      senderType: 'client',
      senderName: 'Michael Chen',
      message: 'Is the RED Komodo available for March 18th?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      read: true,
      attachments: []
    },
    {
      id: 'm2',
      senderType: 'user',
      senderName: 'Base Team',
      message: 'Yes, it\'s available! I\'ve added it to your cart.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5),
      read: true,
      attachments: []
    },
    {
      id: 'm3',
      senderType: 'client',
      senderName: 'Michael Chen',
      message: 'Thanks for the quick response!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: true,
      attachments: []
    }
  ],
  '3': [
    {
      id: 'm1',
      senderType: 'user',
      senderName: 'Base Team',
      message: 'Hi Emma, we need your Certificate of Insurance before we can confirm the booking.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
      read: true,
      attachments: []
    },
    {
      id: 'm2',
      senderType: 'client',
      senderName: 'Emma Rodriguez',
      message: 'The COI has been uploaded, please check.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      read: false,
      attachments: [
        { name: 'COI_EmmaRodriguez_2024.pdf', type: 'pdf', size: '1.2 MB' }
      ]
    }
  ]
};

export default function ChatInterface() {
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setMessages(MOCK_MESSAGES[selectedConversation.id] || []);
        setIsLoading(false);
        
        // Mark as read
        setConversations(prev => prev.map(c => 
          c.id === selectedConversation.id 
            ? { ...c, unreadCount: 0 }
            : c
        ));
      }, 300);
    }
  }, [selectedConversation]);

  // Filter conversations
  const filteredConversations = conversations.filter(c => 
    c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.bookingId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format time display
  const formatMessageTime = (date) => {
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;

    const message = {
      id: `m${Date.now()}`,
      senderType: 'user',
      senderName: 'Base Team',
      message: newMessage,
      timestamp: new Date(),
      read: false,
      attachments: attachments
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setAttachments([]);

    // Update conversation last message
    setConversations(prev => prev.map(c => 
      c.id === selectedConversation.id 
        ? { ...c, lastMessage: newMessage, lastMessageTime: new Date() }
        : c
    ));

    // TODO: API call to send message
  };

  // Handle file attachment
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      name: file.name,
      type: file.type.split('/')[0],
      size: `${(file.size / 1024).toFixed(0)} KB`,
      file: file
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Conversations Sidebar */}
      <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-primary-900">Messages</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary-500">
                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)} unread
              </span>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map(conversation => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedConversation?.id === conversation.id ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
              } ${conversation.unreadCount > 0 ? 'bg-blue-50/50' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold shrink-0">
                  {conversation.clientName.charAt(0)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-semibold truncate ${conversation.unreadCount > 0 ? 'text-primary-900' : 'text-primary-700'}`}>
                      {conversation.clientName}
                    </h3>
                    <span className="text-xs text-primary-400 whitespace-nowrap">
                      {formatMessageTime(conversation.lastMessageTime)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-primary-500 mb-1">
                    {conversation.bookingId} • ${conversation.totalAmount.toLocaleString()}
                  </p>
                  
                  <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-medium text-primary-800' : 'text-primary-500'}`}>
                    {conversation.lastMessage}
                  </p>
                </div>
                
                {conversation.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center shrink-0">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-primary-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversation ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold">
                  {selectedConversation.clientName.charAt(0)}
                </div>
                
                <div>
                  <h3 className="font-semibold text-primary-900">{selectedConversation.clientName}</h3>
                  <p className="text-xs text-primary-500">
                    {selectedConversation.bookingId} • {format(new Date(selectedConversation.bookingDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg text-primary-600">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg text-primary-600">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    const isUser = message.senderType === 'user';
                    const showAvatar = index === 0 || messages[index - 1].senderType !== message.senderType;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
                          {/* Avatar */}
                          {showAvatar && !isUser ? (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                              {message.senderName.charAt(0)}
                            </div>
                          ) : (
                            <div className="w-8 shrink-0" />
                          )}
                          
                          <div className={`${isUser ? 'items-end' : 'items-start'}`}>
                            {/* Sender name (only for first in group) */}
                            {showAvatar && !isUser && (
                              <span className="text-xs text-primary-500 mb-1 block">
                                {message.senderName}
                              </span>
                            )}
                            
                            {/* Message bubble */}
                            <div
                              className={`px-4 py-2.5 rounded-2xl ${
                                isUser
                                  ? 'bg-primary-600 text-white rounded-br-md'
                                  : 'bg-white border border-gray-200 text-primary-900 rounded-bl-md'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                              
                              {/* Attachments */}
                              {message.attachments?.length > 0 && (
                                <div className={`mt-2 space-y-2 ${isUser ? 'border-t border-white/20 pt-2' : 'border-t border-gray-200 pt-2'}`}>
                                  {message.attachments.map((att, i) => (
                                    <div
                                      key={i}
                                      className={`flex items-center gap-2 p-2 rounded-lg ${
                                        isUser ? 'bg-white/10' : 'bg-gray-100'
                                      }`}
                                    >
                                      {att.type === 'image' ? (
                                        <Image className="w-4 h-4" />
                                      ) : (
                                        <FileText className="w-4 h-4" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{att.name}</p>
                                        <p className="text-xs opacity-70">{att.size}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Timestamp */}
                            <div className={`flex items-center gap-1 mt-1 text-xs ${isUser ? 'text-primary-400 justify-end' : 'text-primary-400'}`}>
                              <span>{format(message.timestamp, 'h:mm a')}</span>
                              {isUser && (
                                message.read ? (
                                  <CheckCheck className="w-3 h-3 text-blue-500" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {/* Attachment preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {attachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                      <FileText className="w-4 h-4 text-primary-500" />
                      <span className="max-w-[150px] truncate">{att.name}</span>
                      <button
                        onClick={() => removeAttachment(i)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-primary-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 max-h-32"
                    style={{ minHeight: '48px' }}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!newMessage.trim() && attachments.length === 0}
                  className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-primary-400">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-primary-300" />
            </div>
            <h3 className="text-lg font-semibold text-primary-700 mb-2">Select a conversation</h3>
            <p className="text-sm">Choose a chat from the sidebar to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
