import { useState, useEffect } from 'react';
import { useListQuestions, ListQuestionsSort } from '@workspace/api-client-react';
import { QuestionCard } from '@/components/shared';
import { CATEGORIES } from '@/lib/constants';
import { Search, Filter, Loader2, PenSquare } from 'lucide-react';
import { Link } from 'wouter';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function QAList() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [category, setCategory] = useState<string>('');
  const [sort, setSort] = useState<ListQuestionsSort>('newest');

  const { data, isLoading } = useListQuestions({
    page: 1, limit: 20, 
    search: debouncedSearch || undefined, 
    category: category || undefined, 
    sort
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
        <div>
          <Link href="/ask" className="w-full btn-primary flex items-center justify-center gap-2 text-center">
            <PenSquare className="w-5 h-5" /> Ask Question
          </Link>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border">
          <h3 className="font-display font-bold mb-4 flex items-center gap-2"><Filter className="w-5 h-5 text-primary"/> Categories</h3>
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => setCategory('')}
              className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!category ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              All Categories
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${category === cat ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border">
          <h3 className="font-display font-bold mb-4">Sort By</h3>
          <select 
            value={sort}
            onChange={(e) => setSort(e.target.value as ListQuestionsSort)}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="unanswered">Unanswered</option>
          </select>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-foreground shadow-sm"
          />
        </div>

        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : data?.questions.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
              <MessageCircleQuestion className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-foreground mb-1">No questions found</h3>
              <p className="text-muted-foreground">Be the first to ask something in this category!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {data?.questions.map(q => <QuestionCard key={q.id} question={q} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
