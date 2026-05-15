import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageIcon, Send, X } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string, image?: string) => void;
  disabled: boolean;
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!content.trim() && !image) return;
    onSendMessage(content, image || undefined);
    setContent('');
    setImage(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 border-t border-border/40 bg-card/40">
      {image && (
        <div className="relative inline-block mb-3 ml-2">
          <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-border/60">
            <img src={image} alt="Preview" className="h-full w-full object-cover" />
          </div>
          <button
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full shadow-lg"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="rounded-full h-11 w-11 bg-background/50 hover:bg-purple-500/10 hover:text-purple-600 transition-all"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>
        <Input
          placeholder="Ask anything..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={disabled}
          className="flex-1 bg-background/50 focus-visible:ring-purple-500 transition-all h-11"
        />
        <Button 
          onClick={handleSend} 
          disabled={disabled || (!content.trim() && !image)}
          className="rounded-full h-11 w-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.05]"
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
