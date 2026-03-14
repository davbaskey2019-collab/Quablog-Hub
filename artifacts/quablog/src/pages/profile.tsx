import { useRoute } from 'wouter';
import { useGetUser } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { CalendarDays, FileText, MessageSquare, Shield } from 'lucide-react';
import { Avatar } from '@/components/shared';

export function Profile() {
  const [, params] = useRoute('/profile/:id');
  const id = Number(params?.id);
  const { data: user, isLoading } = useGetUser(id);

  if (isLoading || !user) return <div className="p-20 text-center">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Profile Header */}
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-primary to-accent" />
        <div className="px-8 pb-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 relative">
          <Avatar url={user.avatarUrl} name={user.displayName} className="w-32 h-32 border-4 border-card bg-card shadow-lg" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
              {user.displayName}
              {user.role === 'admin' && <Shield className="w-5 h-5 text-primary" title="Admin" />}
            </h1>
            <p className="text-muted-foreground font-medium">@{user.username}</p>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground font-medium bg-muted px-4 py-2 rounded-xl">
            <CalendarDays className="w-4 h-4" /> Joined {format(new Date(user.createdAt), 'MMM yyyy')}
          </div>
        </div>
        {user.bio && (
          <div className="px-8 pb-8 text-center sm:text-left max-w-2xl">
            <p className="text-foreground/90 leading-relaxed font-serif text-lg">{user.bio}</p>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard icon={<FileText />} label="Articles" value={user._count.blogs || 0} />
        <StatCard icon={<MessageSquare />} label="Questions" value={user._count.questions || 0} />
        <StatCard icon={<MessageSquare className="rotate-180" />} label="Answers" value={user._count.answers || 0} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: any, label: string, value: number }) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border flex items-center gap-4">
      <div className="p-3 bg-primary/10 text-primary rounded-xl">
        {icon}
      </div>
      <div>
        <div className="text-3xl font-bold font-display">{value}</div>
        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}
