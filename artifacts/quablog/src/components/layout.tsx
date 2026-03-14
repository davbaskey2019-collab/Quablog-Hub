import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useGetSettings } from '@workspace/api-client-react';
import { Menu, X, User, LogOut, Settings, Shield, PlusCircle, FileText } from 'lucide-react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <Navbar />
      <main className="flex-1 w-full mt-20">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: settings } = useGetSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const siteName = settings?.siteName || 'Quablog';

  return (
    <header className="fixed top-0 inset-x-0 z-40 glass-panel border-b-0 h-20 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center">
        {/* Logo & Main Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={siteName} className="h-8 w-auto" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-display font-bold text-xl group-hover:shadow-lg group-hover:shadow-primary/20 transition-all">
                Q
              </div>
            )}
            <span className="font-display font-bold text-2xl tracking-tight text-foreground hidden sm:block">
              {siteName}
            </span>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <NavLink href="/qa" current={location}>Q&A</NavLink>
            <NavLink href="/blog" current={location}>Blog</NavLink>
          </nav>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link href="/ask" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <PlusCircle className="w-4 h-4" /> Ask
              </Link>
              <Link href="/write" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <FileText className="w-4 h-4" /> Write
              </Link>
              
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <img 
                    src={user.avatarUrl || `${import.meta.env.BASE_URL}images/default-avatar.png`} 
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-card rounded-2xl shadow-xl border border-border overflow-hidden py-2"
                    >
                      <div className="px-4 py-3 border-b border-border/50">
                        <p className="font-semibold text-foreground truncate">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="py-2">
                        <MenuLink href={`/profile/${user.id}`} icon={<User className="w-4 h-4" />} onClick={() => setIsUserMenuOpen(false)}>Profile</MenuLink>
                        <MenuLink href="/settings" icon={<Settings className="w-4 h-4" />} onClick={() => setIsUserMenuOpen(false)}>Settings</MenuLink>
                        {user.role === 'admin' && (
                          <MenuLink href="/admin" icon={<Shield className="w-4 h-4" />} onClick={() => setIsUserMenuOpen(false)}>Admin Dashboard</MenuLink>
                        )}
                      </div>
                      <div className="border-t border-border/50 py-2">
                        <button 
                          onClick={() => { logout(); setIsUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">Log In</Link>
              <Link href="/signup" className="btn-primary py-2 px-4 text-sm">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button 
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="absolute top-20 left-0 right-0 bg-card border-b border-border overflow-hidden md:hidden shadow-xl"
          >
            <div className="p-4 flex flex-col gap-4">
              <Link href="/qa" className="font-semibold text-lg" onClick={() => setIsMobileMenuOpen(false)}>Q&A</Link>
              <Link href="/blog" className="font-semibold text-lg" onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>
              <hr className="border-border" />
              {user ? (
                <>
                  <Link href="/ask" className="font-semibold" onClick={() => setIsMobileMenuOpen(false)}>Ask a Question</Link>
                  <Link href="/write" className="font-semibold" onClick={() => setIsMobileMenuOpen(false)}>Write a Post</Link>
                  <Link href={`/profile/${user.id}`} className="font-semibold" onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
                  <Link href="/settings" className="font-semibold" onClick={() => setIsMobileMenuOpen(false)}>Settings</Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="font-semibold text-primary" onClick={() => setIsMobileMenuOpen(false)}>Admin Dashboard</Link>
                  )}
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-left font-semibold text-destructive">Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="font-semibold" onClick={() => setIsMobileMenuOpen(false)}>Log In</Link>
                  <Link href="/signup" className="font-semibold text-primary" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({ href, current, children }: { href: string, current: string, children: ReactNode }) {
  const isActive = current === href || current.startsWith(`${href}/`);
  return (
    <Link 
      href={href} 
      className={`relative px-1 py-2 font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {children}
      {isActive && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -bottom-1.5 left-0 right-0 h-1 bg-primary rounded-t-full"
        />
      )}
    </Link>
  );
}

function MenuLink({ href, icon, children, onClick }: { href: string, icon: ReactNode, children: ReactNode, onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </Link>
  );
}

function Footer() {
  const { data: settings } = useGetSettings();
  return (
    <footer className="bg-card border-t border-border py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start">
          <span className="font-display font-bold text-xl">{settings?.siteName || 'Quablog'}</span>
          <span className="text-sm text-muted-foreground mt-1">{settings?.tagline || 'Knowledge and stories combined.'}</span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/qa" className="hover:text-primary transition-colors">Q&A</Link>
          <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
        </div>
      </div>
    </footer>
  );
}
