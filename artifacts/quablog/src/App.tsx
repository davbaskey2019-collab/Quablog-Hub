import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Home } from "@/pages/home";
import { QAList } from "@/pages/qa/qa-list";
import { QADetail } from "@/pages/qa/qa-detail";
import { AskQuestion } from "@/pages/qa/ask";
import { BlogList } from "@/pages/blog/blog-list";
import { BlogDetail } from "@/pages/blog/blog-detail";
import { WriteBlog } from "@/pages/blog/write";
import { Login } from "@/pages/auth/login";
import { Signup } from "@/pages/auth/signup";
import { Profile } from "@/pages/profile";
import { Settings as UserSettings } from "@/pages/settings";
import { Admin } from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Auth pages — no layout */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      {/* Admin — no layout */}
      <Route path="/admin" component={Admin} />
      {/* Main app pages */}
      <Route>
        {() => (
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/qa" component={QAList} />
              <Route path="/qa/ask" component={AskQuestion} />
              <Route path="/qa/:id" component={QADetail} />
              <Route path="/blog" component={BlogList} />
              <Route path="/blog/write" component={WriteBlog} />
              <Route path="/blog/:id" component={BlogDetail} />
              <Route path="/profile/:id" component={Profile} />
              <Route path="/settings" component={UserSettings} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
