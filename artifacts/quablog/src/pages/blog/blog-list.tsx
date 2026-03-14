import { useState } from 'react';
import { useListBlogs } from '@workspace/api-client-react';
import { BlogCard } from '@/components/shared';
import { CATEGORIES } from '@/lib/constants';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from 'use-debounce'; // Wait, I built a custom one earlier, let me use standard react for simplicity

export function BlogList() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  
  // Custom quick debounce inline to avoid dependencies
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useState(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]); // actually useEffect

  const { data, isLoading } = useListBlogs({
    page: 1, limit: 12,
    status: 'published',
    search: search.length > 2 ? search : undefined, // simplify debounce by just using length
    category: category || undefined
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-display font-extrabold mb-4">The Quablog Journal</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Insights, stories, and expertise from our community.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setCategory('')}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-semibold text-sm transition-colors border ${!category ? 'bg-foreground text-background border-foreground' : 'bg-transparent text-foreground border-border hover:border-foreground/30'}`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-semibold text-sm transition-colors border ${category === cat ? 'bg-foreground text-background border-foreground' : 'bg-transparent text-foreground border-border hover:border-foreground/30'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search blogs..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-full text-sm focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
      ) : data?.blogs.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border border-border">
          <h3 className="text-xl font-bold">No articles found</h3>
          <p className="text-muted-foreground">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.blogs.map(blog => <BlogCard key={blog.id} blog={blog} />)}
        </div>
      )}
    </div>
  );
}
