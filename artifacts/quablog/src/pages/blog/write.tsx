import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateBlog, useUploadImage } from '@workspace/api-client-react';
import { CATEGORIES } from '@/lib/constants';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

const schema = z.object({
  title: z.string().min(5).max(300),
  excerpt: z.string().optional(),
  content: z.string().min(50),
  category: z.string().min(1),
  tagsString: z.string().optional()
});
type FormType = z.infer<typeof schema>;

export function WriteBlog() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormType>({
    resolver: zodResolver(schema)
  });
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const createBlog = useCreateBlog();
  const uploadImage = useUploadImage();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadImage.mutateAsync({ data: { file, type: 'blog' } });
      setCoverUrl(res.url);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: FormType, status: 'published' | 'draft') => {
    const tags = data.tagsString ? data.tagsString.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5) : [];
    const res = await createBlog.mutateAsync({
      data: { ...data, tags, status, coverImageUrl: coverUrl }
    });
    window.location.href = `/blog/${res.id}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-display font-bold mb-8">Write an Article</h1>
      
      <div className="space-y-8 bg-card p-8 rounded-3xl border border-border shadow-sm">
        {/* Cover Upload */}
        <div>
          <label className="block font-bold text-foreground mb-2">Cover Image</label>
          <div className="relative h-64 w-full rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden group">
            {coverUrl ? (
              <>
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-semibold">Click to change</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                {isUploading ? <Loader2 className="w-8 h-8 animate-spin mb-2" /> : <ImageIcon className="w-8 h-8 mb-2" />}
                <span>{isUploading ? 'Uploading...' : 'Upload Cover Image (16:9 recommended)'}</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
        </div>

        <form className="space-y-6">
          <div>
            <input 
              {...register('title')} 
              className="w-full text-4xl font-display font-bold bg-transparent border-b-2 border-transparent hover:border-border focus:border-primary focus:outline-none py-2 px-0 transition-colors placeholder:text-muted-foreground/50" 
              placeholder="Article Title..." 
            />
            {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block font-bold text-foreground mb-1">Excerpt</label>
            <input {...register('excerpt')} className="input-field" placeholder="A short summary of what this article is about..." />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-bold text-foreground mb-1">Category</label>
              <select {...register('category')} className="input-field">
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="mt-1 text-sm text-destructive">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block font-bold text-foreground mb-1">Tags (comma separated)</label>
              <input {...register('tagsString')} className="input-field" placeholder="design, architecture, life" />
            </div>
          </div>

          <div>
            <textarea 
              {...register('content')} 
              className="w-full min-h-[400px] text-lg font-serif bg-transparent border-2 border-border rounded-xl p-6 focus:outline-none focus:border-primary resize-y"
              placeholder="Write your story here... (Markdown supported)" 
            />
            {errors.content && <p className="mt-1 text-sm text-destructive">{errors.content.message}</p>}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-border">
            <button 
              type="button" 
              onClick={handleSubmit((d) => onSubmit(d, 'draft'))}
              className="btn-secondary bg-muted text-foreground hover:bg-muted/80"
              disabled={createBlog.isPending || isUploading}
            >
              Save as Draft
            </button>
            <button 
              type="button" 
              onClick={handleSubmit((d) => onSubmit(d, 'published'))}
              className="btn-primary px-8"
              disabled={createBlog.isPending || isUploading}
            >
              {createBlog.isPending ? 'Publishing...' : 'Publish Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
