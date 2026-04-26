import { useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { getAiBehaviorFromStorage, getAiChatbotReply, getAiUserId } from '../../lib/ai-api';

type ChatMessage = {
  id: number;
  type: 'bot' | 'user';
  text: string;
  timestamp: Date;
};

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const userId = getAiUserId();

  const handleSend = async () => {
    if (!message.trim()) return;

    const currentMessage = message;
    const newMessage: ChatMessage = {
      id: messages.length + 1,
      type: 'user',
      text: currentMessage,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage('');

    try {
      setIsSending(true);
      const payload = await getAiChatbotReply({
        userId,
        message: currentMessage,
        behavior: getAiBehaviorFromStorage(),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          type: 'bot',
          text: payload.reply,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          type: 'bot',
          text: 'Hiện chưa kết nối được AI Service. Vui lòng thử lại sau.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button
          size="lg"
          className="rounded-full h-14 px-6 shadow-2xl hover:shadow-xl transition-all"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          <span>Hỗ trợ AI 24/7</span>
          <Badge className="ml-2 bg-green-500 w-2 h-2 p-0 rounded-full" />
        </Button>
      ) : (
        <Card className="w-95 h-150 flex flex-col overflow-hidden shadow-2xl">
          <div className="bg-linear-to-r from-primary to-secondary flex items-center justify-between p-4 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Ecomerge Assistant</h3>
                <p className="text-xs opacity-90 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  Trực tuyến
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-4 border-b border-border">
            <p className="text-xs text-muted-foreground">Khu vực hội thoại sẽ hiển thị tin nhắn thực khi bạn nhập bên dưới.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
                <div>
                  <Sparkles className="mx-auto mb-3 h-5 w-5 text-primary" />
                  <p className="text-sm font-medium">Chưa có tin nhắn</p>
                  <p className="text-xs text-muted-foreground">Nhập nội dung để gọi trực tiếp AI Service.</p>
                </div>
              </div>
            ) : messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.type === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.type === 'bot' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-xs font-medium">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Nhập tin nhắn..."
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={isSending}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}