import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Eye, ChevronUp, Clock, Tag } from 'lucide-react';
import { Link } from 'wouter';
import { Question, Blog, UserProfile } from '@workspace/api-client-react';
import { formatDistanceToNow } from 'date-fns';

export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative z-10 max-h-[90vh] flex flex-col border border-border"
          >
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-xl font-display font-semibold text-foreground">{title}</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Avatar({ url, name, className = "w-10 h-10" }: { url?: string | null, name: string, className?: string }) {
  return (
    <img 
      src={url || `${import.meta.env.BASE_URL}images/default-avatar.png`} 
      alt={name}
      className={`rounded-full object-cover border border-border/50 ${className}`}
    />
  );
}

export function QuestionCard({ question }: { question: Question }) {
  return (
    <Link href={`/qa/${question.id}`} className="block">
      <div className="bg-card p-6 rounded-2xl border border-border card-hover">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center p-3 rounded-xl bg-muted/50 min-w-[4rem]">
            <ChevronUp className="w-5 h-5 text-primary mb-1" />
            <span className="font-bold text-lg leading-none">{question.votes}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-semibold">Votes</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-bold tracking-wide">
                {question.category}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(question.createdAt))} ago
              </span>
            </div>
            <h3 className="text-xl font-display font-bold text-foreground mb-2 line-clamp-2">{question.title}</h3>
            <p className="text-muted-foreground line-clamp-2 text-sm mb-4">{question.body}</p>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Avatar url={question.author.avatarUrl} name={question.author.displayName} className="w-6 h-6" />
                  <span className="text-sm font-medium">{question.author.displayName}</span>
                </div>
                {question.tags?.length > 0 && (
                  <div className="hidden sm:flex items-center gap-2 border-l border-border pl-3">
                    {question.tags.map(tag => (
                      <span key={tag} className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                        <Tag className="w-3 h-3" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                <span className={`flex items-center gap-1.5 ${question.hasBestAnswer ? 'text-green-600 dark:text-green-400' : ''}`}>
                  <MessageSquare className="w-4 h-4" /> {question.answerCount}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> {question.viewCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function BlogCard({ blog }: { blog: Blog }) {
  return (
    <Link href={`/blog/${blog.id}`} className="block h-full">
      <div className="bg-card h-full flex flex-col rounded-2xl border border-border card-hover overflow-hidden group">
        <div className="aspect-[16/9] relative overflow-hidden bg-muted">
          <img 
            src={blog.coverImageUrl || `${import.meta.env.BASE_URL}images/default-cover.png`} 
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-lg bg-background/90 backdrop-blur-md text-foreground text-xs font-bold shadow-sm">
              {blog.category}
            </span>
          </div>
        </div>
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl font-display font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {blog.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-3 mb-6 font-serif">
            {blog.excerpt || blog.content.substring(0, 150) + '...'}
          </p>
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Avatar url={blog.author.avatarUrl} name={blog.author.displayName} className="w-8 h-8" />
              <span>{blog.author.displayName}</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {formatDistanceToNow(new Date(blog.createdAt))} ago
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
