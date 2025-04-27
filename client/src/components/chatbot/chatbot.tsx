import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Quick replies for common questions
const QUICK_REPLIES = [
  { id: 'booking', text: 'How do I create a booking?' },
  { id: 'credits', text: 'How do credits work?' },
  { id: 'join', text: 'How do I join a team?' },
  { id: 'payment', text: 'How do I add payment details?' }
];

// Bot responses based on user queries
const BOT_RESPONSES: Record<string, string> = {
  'booking': 'To create a booking, go to the Bookings page, click "Create Booking", select venue, date and time, and confirm. You\'ll need enough credits for all players.',
  'credits': 'Credits are used to book slots for your team. You purchase credits in advance, and they\'re used when you or your players join a booking. 1 credit = 1 player slot.',
  'join': 'You can join a team by using an invitation code. Ask your team admin for the code, then go to "Join Team" and enter the code.',
  'payment': 'Go to Settings > Payment Methods to add your card details. We use Stripe for secure payment processing.',
  'default': 'I\'m your KickBook assistant. I can help with bookings, credits, team management, and more. What would you like to know?',
  'greeting': 'Hello! I\'m your KickBook assistant. How can I help you today?',
  'subscription': 'We offer three subscription plans: Basic (free), Pro (£29/month), and Enterprise (£99/month). Pro includes unlimited players and stats tracking.',
  'contact': 'For support, please email support@kickbook.com or use the Help section in Settings.',
  'achievements': 'You earn achievements by participating in matches and meeting certain criteria. Check your Achievements page to see what you\'ve earned.',
  'stats': 'Player statistics are tracked automatically if you\'re on a Pro or Enterprise plan. Admins can also manually enter stats after matches.'
};

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize with bot greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'greeting',
          text: BOT_RESPONSES.greeting,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSend = () => {
    if (input.trim() === "") return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    // Generate bot response based on keywords
    setTimeout(() => {
      const userText = input.toLowerCase();
      
      // Check for keyword matches
      let responseText = BOT_RESPONSES.default;
      
      if (userText.includes('book') || userText.includes('slot') || userText.includes('venue')) {
        responseText = BOT_RESPONSES.booking;
      } else if (userText.includes('credit') || userText.includes('payment') || userText.includes('pay')) {
        responseText = BOT_RESPONSES.credits;
      } else if (userText.includes('join') || userText.includes('team') || userText.includes('invite')) {
        responseText = BOT_RESPONSES.join;
      } else if (userText.includes('card') || userText.includes('payment method') || userText.includes('billing')) {
        responseText = BOT_RESPONSES.payment;
      } else if (userText.includes('hello') || userText.includes('hi') || userText.includes('hey')) {
        responseText = BOT_RESPONSES.greeting;
      } else if (userText.includes('plan') || userText.includes('subscription') || userText.includes('upgrade')) {
        responseText = BOT_RESPONSES.subscription;
      } else if (userText.includes('support') || userText.includes('help') || userText.includes('contact')) {
        responseText = BOT_RESPONSES.contact;
      } else if (userText.includes('achievement') || userText.includes('reward') || userText.includes('badge')) {
        responseText = BOT_RESPONSES.achievements;
      } else if (userText.includes('stat') || userText.includes('score') || userText.includes('performance')) {
        responseText = BOT_RESPONSES.stats;
      }
      
      const botResponse: ChatMessage = {
        id: 'bot-' + Date.now().toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleQuickReply = (replyId: string) => {
    const quickReply = QUICK_REPLIES.find(qr => qr.id === replyId);
    if (quickReply) {
      setInput(quickReply.text);
      
      // Simulate clicking send after a brief delay
      setTimeout(() => {
        handleSend();
      }, 100);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Bot className="h-6 w-6" />
          )}
        </Button>
      </div>
      
      {/* Chat Widget */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 sm:w-96 z-50 shadow-2xl">
          <CardHeader className="bg-primary text-white py-3">
            <CardTitle className="text-lg flex items-center">
              <Bot className="h-5 w-5 mr-2" />
              KickBook Assistant
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <Avatar className={`h-8 w-8 ${message.sender === 'user' ? 'ml-2' : 'mr-2'}`}>
                      <AvatarFallback>{message.sender === 'user' ? 'U' : 'B'}</AvatarFallback>
                      {message.sender === 'bot' && (
                        <AvatarImage src="/bot-avatar.png" alt="Bot" />
                      )}
                      {message.sender === 'user' && (
                        <AvatarImage src="/user-avatar.png" alt="User" />
                      )}
                    </Avatar>
                    
                    <div 
                      className={`rounded-lg px-3 py-2 text-sm ${
                        message.sender === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Quick Replies */}
            {messages.length < 3 && (
              <div className="p-3 border-t overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex space-x-2">
                  {QUICK_REPLIES.map((reply) => (
                    <Button 
                      key={reply.id}
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={() => handleQuickReply(reply.id)}
                    >
                      {reply.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-3 border-t">
            <div className="flex w-full items-center space-x-2">
              <Input
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1"
              />
              <Button size="icon" onClick={handleSend}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
}