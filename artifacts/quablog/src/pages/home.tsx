import { Link } from 'wouter';
import { ArrowRight, MessageCircleQuestion, Sparkles } from 'lucide-react';
import { useListQuestions, useListBlogs } from '@workspace/api-client-react';
import { QuestionCard, BlogCard } from '@/components/shared';

export function Home() {
  const { data: qaData } = useListQuestions({ limit: 3, sort: 'popular' });
  const { data: blogData } = useListBlogs({ limit: 3, status: 'published' });

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-background">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Abstract geometric background" 
            className="w-full h-full object-cover opacity-90 mix-blend-multiply dark:mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6 border border-primary/20 backdrop-blur-md">
            <Sparkles className="w-4 h-4" /> Welcome to Quablog
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground tracking-tight max-w-4xl mx-auto leading-tight mb-6">
            Share Knowledge. <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Tell Stories.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            A vibrant community where curiosity meets depth. Ask pressing questions, discover profound answers, and read beautifully crafted articles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/qa" className="btn-primary flex items-center justify-center gap-2 text-lg px-8 py-4">
              Explore Q&A <MessageCircleQuestion className="w-5 h-5" />
            </Link>
            <Link href="/blog" className="btn-secondary flex items-center justify-center gap-2 text-lg px-8 py-4 bg-card border border-border">
              Read Blogs <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Questions */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground">Trending Discussions</h2>
              <p className="text-muted-foreground mt-2">Join the conversation on our most active topics.</p>
            </div>
            <Link href="/qa" className="hidden sm:flex items-center gap-1 text-primary font-semibold hover:underline">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {qaData?.questions.map(q => <QuestionCard key={q.id} question={q} />)}
          </div>
          <Link href="/qa" className="sm:hidden mt-6 flex items-center justify-center gap-1 text-primary font-semibold w-full py-3 bg-primary/5 rounded-xl">
            View all Q&A <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Featured Blogs */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground">Editor's Picks</h2>
              <p className="text-muted-foreground mt-2">Deep dives, tutorials, and stories from top writers.</p>
            </div>
            <Link href="/blog" className="hidden sm:flex items-center gap-1 text-primary font-semibold hover:underline">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogData?.blogs.map(b => <BlogCard key={b.id} blog={b} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
