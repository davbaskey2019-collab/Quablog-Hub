import { useState } from 'react';
import { useRoute } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useGetQuestion, useVoteQuestion, useCreateAnswer, 
  useVoteAnswer, useMarkBestAnswer, useDeleteQuestion, useDeleteAnswer, getGetQuestionQueryKey
} from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@/components/shared';
import { formatDistanceToNow } from 'date-fns';
import { ChevronUp, ChevronDown, CheckCircle2, MessageSquare, Tag, Trash2, Edit } from 'lucide-react';

export function QADetail() {
  const [, params] = useRoute('/qa/:id');
  const id = Number(params?.id);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: q, isLoading } = useGetQuestion(id);
  const voteQ = useVoteQuestion();
  const delQ = useDeleteQuestion();

  const handleVoteQuestion = async (val: 1 | -1) => {
    if (!user) return alert('Please login to vote');
    // If already voted same, undo it (vote: 0)
    const voteVal = q?.userVote === val ? 0 : val;
    await voteQ.mutateAsync({ id, data: { vote: voteVal } });
    queryClient.invalidateQueries({ queryKey: getGetQuestionQueryKey(id) });
  };

  const handleDelete = async () => {
    if (confirm('Delete this question?')) {
      await delQ.mutateAsync({ id });
      window.location.href = '/qa';
    }
  };

  if (isLoading || !q) return <div className="p-20 text-center text-muted-foreground">Loading...</div>;

  const isAuthorOrAdmin = user?.id === q.authorId || user?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Question Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-md bg-primary/10 text-primary font-bold text-sm tracking-wide">
            {q.category}
          </span>
          <span className="text-sm text-muted-foreground">
            Asked {formatDistanceToNow(new Date(q.createdAt))} ago
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-foreground mb-4">{q.title}</h1>
        
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar url={q.author.avatarUrl} name={q.author.displayName} className="w-10 h-10" />
            <div>
              <div className="font-semibold">{q.author.displayName}</div>
              <div className="text-xs text-muted-foreground">@{q.author.username}</div>
            </div>
          </div>
          {isAuthorOrAdmin && (
            <div className="flex gap-2">
              <button onClick={handleDelete} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Question Body */}
      <div className="flex gap-6 mb-12">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={() => handleVoteQuestion(1)}
            className={`p-2 rounded-full transition-colors ${q.userVote === 1 ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            <ChevronUp className="w-8 h-8" />
          </button>
          <span className="text-xl font-bold font-display">{q.votes}</span>
          <button 
            onClick={() => handleVoteQuestion(-1)}
            className={`p-2 rounded-full transition-colors ${q.userVote === -1 ? 'bg-destructive/20 text-destructive' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            <ChevronDown className="w-8 h-8" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="prose dark:prose-invert max-w-none text-lg text-foreground/90 whitespace-pre-wrap">
            {q.body}
          </div>
          {q.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8">
              {q.tags.map(tag => (
                <span key={tag} className="text-sm text-muted-foreground flex items-center gap-1 bg-muted px-3 py-1 rounded-lg">
                  <Tag className="w-3.5 h-3.5" /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Answers Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2 mb-6">
          <MessageSquare className="w-6 h-6 text-primary" /> {q.answers.length} Answers
        </h2>
        
        <div className="space-y-6">
          {/* Sort answers: Best first */}
          {[...q.answers].sort((a, b) => (b.isBest ? 1 : 0) - (a.isBest ? 1 : 0)).map(ans => (
            <AnswerItem key={ans.id} answer={ans} question={q} />
          ))}
        </div>
      </div>

      {/* Add Answer */}
      {user ? (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="text-xl font-display font-bold mb-4">Your Answer</h3>
          <AddAnswerForm questionId={id} />
        </div>
      ) : (
        <div className="bg-muted p-8 rounded-2xl text-center border border-border border-dashed">
          <h3 className="text-lg font-bold mb-2">Want to answer?</h3>
          <p className="text-muted-foreground mb-4">You need to log in to post an answer.</p>
          <a href="/login" className="btn-primary inline-block">Log in</a>
        </div>
      )}
    </div>
  );
}

function AnswerItem({ answer, question }: { answer: any, question: any }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const voteA = useVoteAnswer();
  const markBest = useMarkBestAnswer();
  const delA = useDeleteAnswer();

  const handleVote = async (val: 1 | -1) => {
    if (!user) return alert('Please login to vote');
    const voteVal = answer.userVote === val ? 0 : val;
    await voteA.mutateAsync({ id: answer.id, data: { vote: voteVal } });
    queryClient.invalidateQueries({ queryKey: getGetQuestionQueryKey(question.id) });
  };

  const handleMarkBest = async () => {
    await markBest.mutateAsync({ id: answer.id });
    queryClient.invalidateQueries({ queryKey: getGetQuestionQueryKey(question.id) });
  };

  const handleDelete = async () => {
    if (confirm('Delete answer?')) {
      await delA.mutateAsync({ id: answer.id });
      queryClient.invalidateQueries({ queryKey: getGetQuestionQueryKey(question.id) });
    }
  };

  const isQAuthor = user?.id === question.authorId;
  const isAAuthorOrAdmin = user?.id === answer.authorId || user?.role === 'admin';

  return (
    <div className={`p-6 rounded-2xl border ${answer.isBest ? 'border-green-500/50 bg-green-50/30 dark:bg-green-900/10' : 'border-border bg-card'}`}>
      {answer.isBest && (
        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-bold text-sm mb-4">
          <CheckCircle2 className="w-5 h-5" /> Best Answer
        </div>
      )}
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <button onClick={() => handleVote(1)} className={`p-1 rounded-full transition-colors ${answer.userVote === 1 ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}>
            <ChevronUp className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg">{answer.votes}</span>
          <button onClick={() => handleVote(-1)} className={`p-1 rounded-full transition-colors ${answer.userVote === -1 ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-foreground'}`}>
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap mb-4">
            {answer.body}
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <Avatar url={answer.author.avatarUrl} name={answer.author.displayName} className="w-8 h-8" />
              <div>
                <div className="font-semibold text-sm">{answer.author.displayName}</div>
                <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(answer.createdAt))} ago</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isQAuthor && !answer.isBest && (
                <button onClick={handleMarkBest} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:border-green-500 hover:text-green-600 transition-colors">
                  Mark Best
                </button>
              )}
              {isAAuthorOrAdmin && (
                <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive p-1.5 rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddAnswerForm({ questionId }: { questionId: number }) {
  const [body, setBody] = useState('');
  const createA = useCreateAnswer();
  const queryClient = useQueryClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (body.length < 10) return alert('Answer must be at least 10 chars');
    await createA.mutateAsync({ questionId, data: { body } });
    setBody('');
    queryClient.invalidateQueries({ queryKey: getGetQuestionQueryKey(questionId) });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <textarea 
        className="input-field min-h-[120px] resize-y" 
        placeholder="Type your answer here... (markdown supported)"
        value={body}
        onChange={e => setBody(e.target.value)}
        required
      />
      <div className="flex justify-end">
        <button type="submit" disabled={createA.isPending} className="btn-primary">
          {createA.isPending ? 'Posting...' : 'Post Answer'}
        </button>
      </div>
    </form>
  );
}
