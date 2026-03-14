import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { useUpdateUser, useUploadImage } from '@workspace/api-client-react';
import { Avatar } from '@/components/shared';
import { Loader2, CheckCircle2 } from 'lucide-react';

const schema = z.object({
  displayName: z.string().min(2),
  bio: z.string().optional(),
});
type FormType = z.infer<typeof schema>;

export function Settings() {
  const { user } = useAuth();
  const updateU = useUpdateUser();
  const uploadImg = useUploadImage();
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset } = useForm<FormType>({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    if (user) {
      reset({ displayName: user.displayName, bio: user.bio || '' });
      setAvatarUrl(user.avatarUrl || null);
    }
  }, [user, reset]);

  if (!user) return null;

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadImg.mutateAsync({ data: { file, type: 'avatar' } });
    setAvatarUrl(res.url);
  };

  const onSubmit = async (data: FormType) => {
    setSuccess(false);
    await updateU.mutateAsync({
      id: user.id,
      data: { ...data, avatarUrl: avatarUrl || undefined }
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-bold mb-8">Account Settings</h1>
      
      <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Avatar */}
          <div className="flex items-center gap-6 pb-8 border-b border-border">
            <Avatar url={avatarUrl} name={user.displayName} className="w-24 h-24" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Profile Picture</h3>
              <div className="relative">
                <button type="button" className="btn-secondary py-2 px-4 text-sm" disabled={uploadImg.isPending}>
                  {uploadImg.isPending ? 'Uploading...' : 'Change Picture'}
                </button>
                <input type="file" onChange={handleAvatar} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <label className="block font-bold text-foreground mb-1">Display Name</label>
              <input {...register('displayName')} className="input-field" />
            </div>
            
            <div>
              <label className="block font-bold text-foreground mb-1">Bio</label>
              <textarea {...register('bio')} className="input-field min-h-[120px]" placeholder="Tell us about yourself" />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            {success ? (
              <span className="text-green-600 flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5"/> Saved successfully</span>
            ) : <span/>}
            <button type="submit" disabled={updateU.isPending} className="btn-primary">
              {updateU.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
