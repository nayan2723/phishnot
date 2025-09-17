import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Shield,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string;
}

interface AIChatAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ isOpen, onToggle, className }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your PhishNot AI Assistant. I can help you with cybersecurity questions, explain phishing detection results, and provide safety recommendations. How can I assist you today?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: input,
          context: 'cybersecurity',
          clerk_user_id: user?.id || 'anonymous'
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        context: data.context
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const QuickActions = () => (
    <div className="flex flex-wrap gap-2 p-3 border-t border-border/40">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setInput("What are the signs of a phishing email?")}
        className="text-xs"
      >
        Phishing Signs
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setInput("How can I improve my email security?")}
        className="text-xs"
      >
        Email Security
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setInput("What should I do if I clicked a suspicious link?")}
        className="text-xs"
      >
        Clicked Suspicious Link
      </Button>
    </div>
  );

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={onToggle}
          size="lg"
          className="rounded-full h-14 w-14 bg-primary hover:bg-primary/90 shadow-lg glow-primary"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={`fixed bottom-6 right-6 z-50 ${className}`}
    >
      <Card className={`w-96 bg-background/95 backdrop-blur border-border/40 shadow-xl ${
        isMinimized ? 'h-16' : 'h-96'
      } transition-all duration-300`}>
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">AI Assistant</CardTitle>
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Cybersecurity
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0"
            >
              {isMinimized ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent className="p-0 flex flex-col h-80">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 mt-1">
                            <Bot className="h-3 w-3 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg p-3 text-sm ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.content}
                        </div>
                        {message.role === 'user' && (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/20 mt-1">
                            <User className="h-3 w-3 text-secondary" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20">
                          <Bot className="h-3 w-3 text-primary" />
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                <QuickActions />

                <div className="p-3 border-t border-border/40">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about cybersecurity..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      size="sm"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default AIChatAssistant;