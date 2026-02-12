import ChatInterface from '../components/chat/ChatInterface';

export default function ChatPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-900">Chat</h1>
          <p className="text-primary-500 mt-1">Communicate with clients about their bookings</p>
        </div>
      </div>

      {/* Chat Interface */}
      <ChatInterface />
    </div>
  );
}
