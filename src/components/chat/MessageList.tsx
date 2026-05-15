import { User, Bookmark, BookmarkCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  image?: string;
  subject?: string;
  is_bookmarked?: boolean;
}

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  isResponding?: boolean;
  onToggleBookmark: (messageId: string, currentStatus: boolean) => void;
}

export function MessageList({ messages, loading, isResponding, onToggleBookmark }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((message) => {
        const isAi = message.role === 'ai';
        return (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
          >
            {isAi && (
              <div className="flex-shrink-0">
                <img src="/app_icon.svg" alt="AI" className="h-9 w-9" />
              </div>
            )}
            <div
              className={`relative max-w-[75%] rounded-2xl p-4 shadow-sm ${
                isAi
                  ? 'bg-muted text-foreground rounded-tl-none'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
              }`}
            >
              {/* Bookmark Button (Only for AI messages, and not the initial greeting) */}
              {isAi && message.id !== '1' && (
                <button
                  onClick={() => onToggleBookmark(message.id, !!message.is_bookmarked)}
                  className="absolute top-2 right-2 p-1 hover:text-purple-600 transition-colors"
                >
                  {message.is_bookmarked ? (
                    <BookmarkCheck className="h-4 w-4 text-purple-600" />
                  ) : (
                    <Bookmark className="h-4 w-4 text-muted-foreground hover:text-purple-600" />
                  )}
                </button>
              )}

              {message.image && (
                <div className="mb-2 max-w-sm mt-1">
                  <img src={message.image} alt="Uploaded" className="rounded-lg border border-white/20" />
                </div>
              )}
              
              <div className="text-sm leading-relaxed mt-1 pr-6">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-bold mb-1">{children}</h3>,
                    code: ({ children }) => <code className="bg-background/20 px-1 rounded text-xs">{children}</code>,
                    pre: ({ children }) => <pre className="bg-background/20 p-2 rounded-lg text-xs overflow-x-auto mb-2">{children}</pre>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
            {!isAi && (
              <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        );
      })}
      {loading && isResponding && (
        <div className="flex items-start gap-3 justify-start">
          <div className="flex-shrink-0">
            <img src="/app_icon.svg" alt="AI" className="h-9 w-9" />
          </div>
          <div className="bg-muted rounded-2xl p-4 flex items-center gap-2 rounded-tl-none">
            <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      )}
    </div>
  );
}
