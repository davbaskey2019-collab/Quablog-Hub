import { useRoute, Link } from 'wouter';
import { useGetBlog, useDeleteBlog } from '@workspace/api-client-react';
import { Avatar } from '@/components/shared';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '@/lib/auth';
import { Clock, Tag, Trash2, ChevronLeft } from 'lucide-react';

export function BlogDetail() {
  const [, params] = useRoute('/blog/:id');
  const id = Number(params?.id);
  const { user } = useAuth();
  
  const { data: blog, isLoading } = useGetBlog(id);
  const delB = useDeleteBlog();

  if (isLoading || !blog) return <div className="p-20 text-center">Loading article...</div>;

  const isAuthorOrAdmin = user?.id === blog.authorId || user?.role === 'admin';

  const handleDelete = async () => {
    if (confirm('Delete this blog post?')) {
      await delB.mutateAsync({ id });
      window.location.href = '/blog';
    }
  };

  return (
    <article className="pb-20">
      {/* Cover Header */}
      <div className="relative h-[60vh] min-h-[400px] w-full bg-muted flex items-end">
        <img 
          src={blog.coverImageUrl || `${import.meta.env.BASE_URL}images/default-cover.png`} 
          alt={blog.title} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <Link href="/blog" className="inline-flex items-center gap-1 text-white/70 hover:text-white font-medium mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Journal
          </Link>
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1 rounded bg-primary text-white font-bold text-xs uppercase tracking-wider">
              {blog.category}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-6">
            {blog.title}
          </h1>
          <div className="flex items-center justify-between text-white/80">
            <div className="flex items-center gap-4">
              <Avatar url={blog.author.avatarUrl} name={blog.author.displayName} className="w-12 h-12 border-white/20" />
              <div>
                <div className="font-semibold text-white">{blog.author.displayName}</div>
                <div className="text-sm">{format(new Date(blog.createdAt), 'MMMM d, yyyy')}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Clock className="w-4 h-4" /> {blog.readTime || 5} min read
              </span>
              {isAuthorOrAdmin && (
                <button onClick={handleDelete} className="p-2 bg-red-500/20 text-red-300 hover:bg-red-500/40 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {blog.excerpt && (
          <p className="text-xl md:text-2xl text-muted-foreground font-serif italic mb-10 leading-relaxed border-l-4 border-primary pl-6">
            {blog.excerpt}
          </p>
        )}
        
        <div className="prose prose-lg dark:prose-invert max-w-none font-serif text-foreground/90 whitespace-pre-wrap leading-loose">
          {blog.content}
        </div>

        {blog.tags?.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border flex gap-2 flex-wrap">
            {blog.tags.map(t => (
              <span key={t} className="px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
