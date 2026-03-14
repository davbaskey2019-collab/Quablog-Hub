import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateQuestion } from '@workspace/api-client-react';
import { CATEGORIES } from '@/lib/constants';

const schema = z.object({
  title: z.string().min(10, 'Title must be at least 10 chars').max(300),
  body: z.string().min(20, 'Provide more details (min 20 chars)'),
  category: z.string().min(1, 'Select a category'),
  tagsString: z.string().optional()
});
type FormType = z.infer<typeof schema>;

export function AskQuestion() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormType>({
    resolver: zodResolver(schema)
  });
  const create = useCreateQuestion();

  const onSubmit = async (data: FormType) => {
    const tags = data.tagsString ? data.tagsString.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5) : [];
    const res = await create.mutateAsync({
      data: { title: data.title, body: data.body, category: data.category, tags }
    });
    window.location.href = `/qa/${res.id}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-display font-extrabold mb-8">Ask a Question</h1>
      <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block font-bold text-foreground mb-1">Title</label>
            <p className="text-xs text-muted-foreground mb-2">Be specific and imagine you're asking a question to another person.</p>
            <input {...register('title')} className="input-field font-semibold text-lg" placeholder="e.g. How do I optimize React Context re-renders?" />
            {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block font-bold text-foreground mb-1">Details</label>
            <p className="text-xs text-muted-foreground mb-2">Include all the information someone would need to answer your question.</p>
            <textarea {...register('body')} className="input-field min-h-[200px]" placeholder="Explain your problem..." />
            {errors.body && <p className="mt-1 text-sm text-destructive">{errors.body.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-bold text-foreground mb-1">Category</label>
              <select {...register('category')} className="input-field bg-background">
                <option value="">Select category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="mt-1 text-sm text-destructive">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">Tags (comma separated)</label>
              <input {...register('tagsString')} className="input-field" placeholder="react, performance, hooks" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <button type="button" onClick={() => window.history.back()} className="btn-secondary bg-transparent border border-border">Cancel</button>
            <button type="submit" disabled={create.isPending} className="btn-primary px-8">
              {create.isPending ? 'Posting...' : 'Post Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
