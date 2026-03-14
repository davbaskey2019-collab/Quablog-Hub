import { useState, useRef } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import {
  useGetAdminStats,
  useListUsers,
  useDeleteUser,
  useBlockUser,
  useUpdateSettings,
  useGetSettings,
  useUpdateAdminProfile,
  useListQuestions,
  useListBlogs,
  useDeleteQuestion,
  useDeleteBlog,
  useUploadImage,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Users, MessageCircleQuestion, FileText, Activity,
  Shield, Settings, LogOut, Upload, Eye, Trash2, Ban,
  ChevronRight, Star, BarChart3, Lock, User as UserIcon,
  TrendingUp, Plus, Edit, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

type AdminTab = 'overview' | 'users' | 'questions' | 'blogs' | 'settings' | 'profile';

export function Admin() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 bg-card rounded-2xl shadow-lg border border-border">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You don't have permission to access the admin panel.</p>
          <Link href="/" className="btn-primary px-6 py-2">Go Home</Link>
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'questions', label: 'Questions', icon: MessageCircleQuestion },
    { id: 'blogs', label: 'Blog Posts', icon: FileText },
    { id: 'settings', label: 'Site Settings', icon: Settings },
    { id: 'profile', label: 'My Profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user.displayName}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors px-4 py-2 rounded-lg hover:bg-destructive/10">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              {tabs.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                      tab === t.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-4">
            <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              {tab === 'overview' && <OverviewTab />}
              {tab === 'users' && <UsersTab />}
              {tab === 'questions' && <QuestionsTab />}
              {tab === 'blogs' && <BlogsTab />}
              {tab === 'settings' && <SettingsTab />}
              {tab === 'profile' && <ProfileTab />}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, today, icon: Icon, color }: any) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground">{value?.toLocaleString()}</p>
      {today !== undefined && (
        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> +{today} today
        </p>
      )}
    </div>
  );
}

function OverviewTab() {
  const { data: stats } = useGetAdminStats();
  if (!stats) return <div className="text-center py-20 text-muted-foreground">Loading stats...</div>;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} today={stats.newUsersToday} icon={Users} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30" />
        <StatCard label="Questions" value={stats.totalQuestions} today={stats.newQuestionsToday} icon={MessageCircleQuestion} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30" />
        <StatCard label="Answers" value={stats.totalAnswers} icon={CheckCircle} color="bg-green-100 text-green-600 dark:bg-green-900/30" />
        <StatCard label="Blog Posts" value={stats.totalBlogs} today={stats.newBlogsToday} icon={FileText} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Recent Users</h3>
          <div className="space-y-3">
            {stats.recentUsers?.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {u.displayName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> Recent Blogs</h3>
          <div className="space-y-3">
            {stats.recentBlogs?.map((b: any) => (
              <div key={b.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.author?.displayName} · {format(new Date(b.createdAt), 'MMM d')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data } = useListUsers({ search: search || undefined, page, limit: 15 });
  const deleteUser = useDeleteUser();
  const blockUser = useBlockUser();
  const qc = useQueryClient();

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await deleteUser.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: ['listUsers'] });
  };

  const handleBlock = async (id: number, blocked: boolean) => {
    await blockUser.mutateAsync({ id, data: { blocked: !blocked } });
    qc.invalidateQueries({ queryKey: ['listUsers'] });
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users by name or email..."
            className="flex-1 px-4 py-2 bg-muted rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">User</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Role</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Joined</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                        {u.displayName[0]}
                      </div>
                      <span className="font-medium text-foreground">{u.displayName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{u.role}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isBlocked ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleBlock(u.id, u.isBlocked)} className={`p-1.5 rounded-lg transition-colors ${u.isBlocked ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30' : 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30'}`} title={u.isBlocked ? 'Unblock' : 'Block'}>
                        <Ban className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded-lg text-sm ${page === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionsTab() {
  const [search, setSearch] = useState('');
  const { data } = useListQuestions({ search: search || undefined, limit: 20 });
  const deleteQuestion = useDeleteQuestion();
  const qc = useQueryClient();

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this question and all its answers?')) return;
    await deleteQuestion.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: ['listQuestions'] });
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <div className="mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full px-4 py-2 bg-muted rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="space-y-3">
        {data?.questions?.map((q: any) => (
          <div key={q.id} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-all">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{q.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{q.category} · {q.votes} votes · {q.answerCount} answers · by {q.author?.displayName}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/qa/${q.id}`} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" title="View">
                <Eye className="w-4 h-4" />
              </Link>
              <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {(!data?.questions?.length) && <p className="text-center text-muted-foreground py-8">No questions found</p>}
      </div>
    </div>
  );
}

function BlogsTab() {
  const [search, setSearch] = useState('');
  const { data } = useListBlogs({ search: search || undefined, limit: 20 });
  const deleteBlog = useDeleteBlog();
  const qc = useQueryClient();

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this blog post?')) return;
    await deleteBlog.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: ['listBlogs'] });
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <div className="mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search blog posts..."
          className="w-full px-4 py-2 bg-muted rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="space-y-3">
        {data?.blogs?.map((b: any) => (
          <div key={b.id} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-all">
            {b.coverImageUrl && <img src={b.coverImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{b.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{b.category} · {b.status} · by {b.author?.displayName}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/blog/${b.id}`} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" title="View">
                <Eye className="w-4 h-4" />
              </Link>
              <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {(!data?.blogs?.length) && <p className="text-center text-muted-foreground py-8">No blog posts found</p>}
      </div>
    </div>
  );
}

function SettingsTab() {
  const { data: settings } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const uploadImage = useUploadImage();
  const qc = useQueryClient();

  const [form, setForm] = useState({ siteName: '', tagline: '' });
  const [msg, setMsg] = useState('');
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    await updateSettings.mutateAsync({ data: { siteName: form.siteName || settings?.siteName, tagline: form.tagline || settings?.tagline } });
    setMsg('Settings saved!');
    qc.invalidateQueries({ queryKey: ['getSettings'] });
    setTimeout(() => setMsg(''), 3000);
  };

  const handleUpload = async (file: File, type: 'logo' | 'favicon') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    const res = await uploadImage.mutateAsync({ data: fd as any });
    await updateSettings.mutateAsync({ data: { [type === 'logo' ? 'logoUrl' : 'faviconUrl']: res.url } });
    qc.invalidateQueries({ queryKey: ['getSettings'] });
    setMsg(`${type === 'logo' ? 'Logo' : 'Favicon'} updated!`);
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {msg && <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" />{msg}</div>}

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h3 className="font-semibold text-foreground mb-4">Site Identity</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Site Name</label>
            <input
              value={form.siteName || settings?.siteName || ''}
              onChange={e => setForm(f => ({ ...f, siteName: e.target.value }))}
              placeholder={settings?.siteName}
              className="w-full px-4 py-2 bg-muted rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tagline</label>
            <input
              value={form.tagline || settings?.tagline || ''}
              onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
              placeholder={settings?.tagline || 'Your site tagline...'}
              className="w-full px-4 py-2 bg-muted rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button onClick={handleSave} className="btn-primary px-6 py-2 text-sm">Save Changes</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-4">Site Logo</h3>
          {settings?.logoUrl && (
            <div className="mb-4 p-3 bg-muted rounded-xl flex items-center justify-center">
              <img src={settings.logoUrl} alt="Logo" className="h-12 object-contain" />
            </div>
          )}
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')} />
          <button onClick={() => logoRef.current?.click()} className="w-full btn-secondary flex items-center justify-center gap-2 text-sm py-2">
            <Upload className="w-4 h-4" /> {settings?.logoUrl ? 'Change Logo' : 'Upload Logo'}
          </button>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-4">Favicon</h3>
          {settings?.faviconUrl && (
            <div className="mb-4 p-3 bg-muted rounded-xl flex items-center justify-center">
              <img src={settings.faviconUrl} alt="Favicon" className="h-12 object-contain" />
            </div>
          )}
          <input ref={faviconRef} type="file" accept="image/*,.ico" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'favicon')} />
          <button onClick={() => faviconRef.current?.click()} className="w-full btn-secondary flex items-center justify-center gap-2 text-sm py-2">
            <Upload className="w-4 h-4" /> {settings?.faviconUrl ? 'Change Favicon' : 'Upload Favicon'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const updateProfile = useUpdateAdminProfile();
  const [form, setForm] = useState({ email: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setErr('New passwords do not match'); return;
    }
    try {
      const payload: any = {};
      if (form.email) payload.email = form.email;
      if (form.newPassword) { payload.currentPassword = form.currentPassword; payload.newPassword = form.newPassword; }
      await updateProfile.mutateAsync({ data: payload });
      setMsg('Profile updated successfully!');
      setForm({ email: '', currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      setErr(e.message || 'Failed to update profile');
    }
    setTimeout(() => { setMsg(''); setErr(''); }, 4000);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
          {user?.displayName[0]}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{user?.displayName}</h3>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium mt-1 inline-block">Administrator</span>
        </div>
      </div>

      {msg && <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 mb-4"><CheckCircle className="w-4 h-4" />{msg}</div>}
      {err && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm font-medium mb-4">{err}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">New Email Address</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder={user?.email}
            className="w-full px-4 py-2 bg-muted rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="border-t border-border pt-4">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h4>
          <div className="space-y-3">
            <input
              type="password"
              value={form.currentPassword}
              onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
              placeholder="Current password"
              className="w-full px-4 py-2 bg-muted rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="password"
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              placeholder="New password (min 6 characters)"
              className="w-full px-4 py-2 bg-muted rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
              className="w-full px-4 py-2 bg-muted rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <button type="submit" disabled={updateProfile.isPending} className="btn-primary px-6 py-2 text-sm disabled:opacity-50">
          {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
