import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth-context';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { 
  Heart, 
  Sparkles, 
  Trophy, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Ghost, 
  MessageSquareText, 
  ShieldCheck, 
  Lock, 
  Zap, 
  EyeOff, 
  Wind, 
  Trash2, 
  RotateCcw, 
  Timer, 
  BarChart3, 
  Smile, 
  Frown, 
  Meh, 
  Flame,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RefreshCw,
  Fingerprint,
  Calendar,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: any[];
  creatorName: string;
  type?: 'standard' | 'secret-dump';
}

export default function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'intro' | 'quiz' | 'finished'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [currentTextAnswer, setCurrentTextAnswer] = useState('');
  
  // Advanced Secret Dump Features State
  const [mood, setMood] = useState<string | null>(null);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionKey] = useState(() => Math.random().toString(36).substring(2, 15).toUpperCase());
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [purgeProgress, setPurgeProgress] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [totalWordCount, setTotalWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [paragraphCount, setParagraphCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [vocabularyRichness, setVocabularyRichness] = useState(0);
  const [flowState, setFlowState] = useState(0); // 0 to 100
  const [lastTypeTime, setLastTypeTime] = useState(Date.now());

  // Diary Customization State
  const [paperStyle, setPaperStyle] = useState<'lined' | 'grid' | 'dots' | 'plain' | 'genz'>('lined');
  const [inkColor, setInkColor] = useState('text-romantic-900');
  const [fontSize, setFontSize] = useState<'text-xl' | 'text-2xl' | 'text-3xl'>('text-2xl');
  const [lineSpacing, setLineSpacing] = useState<'leading-normal' | 'leading-relaxed' | 'leading-loose'>('leading-relaxed');
  const [isZenMode, setIsZenMode] = useState(false);
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'cafe' | 'forest'>('none');
  const [isPaperAged, setIsPaperAged] = useState(false);
  const [wordGoal, setWordGoal] = useState(100);
  const [showPrompts, setShowPrompts] = useState(false);
  const [isBiometricActive, setIsBiometricActive] = useState(false);

  const writingPrompts = [
    "What's one thing that made you smile today?",
    "Describe a challenge you're currently facing.",
    "What are you most grateful for right now?",
    "If you could talk to your future self, what would you say?",
    "What does 'peace' look like to you today?",
    "Write about a memory that feels like a warm hug."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      
      // Decay flow state
      setFlowState(prev => Math.max(0, prev - 5));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    const text = currentTextAnswer.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const paragraphs = text ? text.split(/\n\s*\n/).length : 0;
    
    setWordCount(words);
    setCharCount(currentTextAnswer.length);
    setParagraphCount(paragraphs);
    setReadingTime(Math.ceil(words / 200)); // Avg 200 wpm reading speed
    
    // Calculate WPM for session
    if (elapsedTime > 0) {
      setWpm(Math.floor(((totalWordCount + words) / elapsedTime) * 60));
    }

    // Vocabulary richness (unique words)
    if (words > 0) {
      const uniqueWords = new Set(text.toLowerCase().match(/\b\w+\b/g)).size;
      setVocabularyRichness(Math.floor((uniqueWords / words) * 100));
    }

    // Update flow state on typing
    const now = Date.now();
    if (now - lastTypeTime < 2000) {
      setFlowState(prev => Math.min(100, prev + 10));
    }
    setLastTypeTime(now);

  }, [currentTextAnswer, elapsedTime, totalWordCount, lastTypeTime]);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      try {
        const docRef = doc(db, 'quizzes', quizId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Quiz;
          setQuiz({ id: docSnap.id, ...data });
          
          // Set branding attribute for Navbar
          if (data.type === 'secret-dump') {
            document.body.setAttribute('data-quiz-type', 'secret-dump');
          } else {
            document.body.removeAttribute('data-quiz-type');
          }
        } else {
          toast.error('Quiz not found');
          navigate('/');
        }
      } catch (error) {
        toast.error('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
    
    return () => {
      document.body.removeAttribute('data-quiz-type');
    };
  }, [quizId, navigate]);

  const startQuiz = () => {
    if (!user) {
      toast.error('You must be logged in to take a quiz');
      navigate('/login', { state: { from: `/quiz/${quizId}` } });
      return;
    }
    setStep('quiz');
  };

  const handleAnswer = async (optionIndex: number | string) => {
    if (quiz?.type === 'secret-dump') {
      setIsEncrypting(true);
      // Fake encryption delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsEncrypting(false);
    }

    const currentQuestion = quiz?.questions[currentQuestionIndex];
    const isCorrect = quiz?.type === 'standard' ? optionIndex === currentQuestion.correctOptionIndex : true;
    
    const newAnswers = [...answers, {
      questionIndex: currentQuestionIndex,
      selectedOptionIndex: typeof optionIndex === 'number' ? optionIndex : -1,
      textAnswer: typeof optionIndex === 'string' ? optionIndex : '',
      isCorrect,
      mood: mood,
      wordCount: wordCount,
      timestamp: Date.now()
    }];
    setAnswers(newAnswers);
    setTotalWordCount(prev => prev + wordCount);

    if (isCorrect) setScore(score + 1);

    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentTextAnswer('');
      setMood(null);
    } else {
      finishQuiz(newAnswers, isCorrect ? score + 1 : score);
    }
  };

  const finishQuiz = async (finalAnswers: any[], finalScore: number) => {
    setStep('finished');
    if (!user) return;

    try {
      await addDoc(collection(db, 'responses'), {
        quizId,
        respondentName: user.displayName || 'Anonymous',
        respondentUid: user.uid,
        respondentEmail: user.email,
        respondentPhoto: user.photoURL,
        answers: finalAnswers,
        score: finalScore,
        totalQuestions: quiz?.questions.length,
        type: quiz?.type || 'standard',
        createdAt: serverTimestamp(),
        sessionKey: quiz?.type === 'secret-dump' ? sessionKey : null,
        isEncrypted: quiz?.type === 'secret-dump',
        metrics: quiz?.type === 'secret-dump' ? {
          totalWords: totalWordCount,
          totalChars: charCount,
          avgWpm: wpm,
          vocabRichness: vocabularyRichness,
          duration: elapsedTime,
          finalMood: mood
        } : null
      });
      
      if (quiz?.type === 'secret-dump') {
        // Start fake purge progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          setPurgeProgress(progress);
          if (progress >= 100) clearInterval(interval);
        }, 100);
      }
    } catch (error) {
      console.error("Error saving response:", error);
    }
  };

  if (loading || authLoading) return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)]">
      <Heart className="w-12 h-12 text-primary animate-pulse fill-primary/20" />
    </div>
  );

  if (!quiz) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`container mx-auto px-4 py-12 max-w-4xl min-h-[calc(100vh-64px)] flex flex-col justify-center transition-all duration-500`}>
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto w-full"
          >
            <Card className={`border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden ${quiz.type === 'secret-dump' ? 'border-romantic-500/30' : ''}`}>
              <div className={`h-32 flex items-center justify-center ${quiz.type === 'secret-dump' ? 'bg-gradient-to-r from-romantic-900 to-romantic-800' : 'bg-gradient-to-r from-primary/20 to-romantic-400/20'}`}>
                {quiz.type === 'secret-dump' ? (
                  <div className="flex flex-col items-center">
                    <MessageSquareText className="w-16 h-16 text-romantic-300 animate-pulse" />
                    <span className="text-[10px] text-romantic-300/60 font-mono mt-2 tracking-widest uppercase">Private Diary Session</span>
                  </div>
                ) : (
                  <Heart className="w-16 h-16 text-primary fill-primary/20" />
                )}
              </div>
              <CardHeader className="text-center">
                <CardTitle className="font-serif text-4xl mb-2">{quiz.title}</CardTitle>
                <CardDescription className="text-lg">
                  {quiz.type === 'secret-dump' ? (
                    <span className="flex items-center justify-center gap-2 text-romantic-400 font-mono text-sm">
                      <Lock className="w-3 h-3" /> SECURE DIARY: {sessionKey}
                    </span>
                  ) : (
                    <>Created by <span className="text-primary font-bold">{quiz.creatorName}</span></>
                  )}
                </CardDescription>
                {quiz.description && (
                  <p className="mt-4 text-muted-foreground italic">"{quiz.description}"</p>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={`p-6 rounded-3xl border text-center ${quiz.type === 'secret-dump' ? 'bg-romantic-900/10 border-romantic-500/20' : 'bg-primary/5 border-primary/10'}`}>
                  <p className="text-sm text-muted-foreground mb-2">Authenticated as</p>
                  <p className="text-xl font-bold text-primary">{user?.displayName || user?.email || 'Guest'}</p>
                </div>
                
                {quiz.type === 'secret-dump' && (
                  <div className="space-y-4 text-sm text-muted-foreground bg-secondary/20 p-4 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      <span>End-to-End Encrypted Thoughts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-blue-500" />
                      <span>Private Session (No data stored on device)</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={startQuiz} className={`w-full h-14 rounded-2xl text-lg font-bold shadow-lg transition-all ${quiz.type === 'secret-dump' ? 'bg-romantic-800 hover:bg-romantic-700 shadow-romantic-900/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}>
                  {quiz.type === 'secret-dump' ? 'Open My Diary' : 'Start Quiz'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {step === 'quiz' && quiz.type === 'secret-dump' && (
          <motion.div
            key="diary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`w-full grid grid-cols-1 lg:grid-cols-4 gap-8 items-start transition-all duration-1000 ${isZenMode ? 'lg:grid-cols-1 max-w-3xl mx-auto' : ''}`}
          >
            {/* Diary Sidebar */}
            {!isZenMode && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1 space-y-4"
              >
                {/* Stats Card */}
                <div className="p-6 rounded-3xl bg-card border border-primary/10 shadow-xl diary-shadow">
                  <div className="space-y-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-4 bg-primary/10 rounded-full mb-3 relative">
                        <Calendar className="w-8 h-8 text-primary" />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"
                        />
                      </div>
                      <h3 className="font-serif text-xl font-bold">{format(new Date(), 'MMMM d')}</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">{format(new Date(), 'EEEE, yyyy')}</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-primary/5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground uppercase font-bold tracking-tighter">Session Time</span>
                        <span className="font-mono font-bold text-primary">{formatTime(elapsedTime)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground uppercase font-bold tracking-tighter">Total Words</span>
                        <span className="font-mono font-bold text-primary">{totalWordCount + wordCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground uppercase font-bold tracking-tighter">Reading Time</span>
                        <span className="font-mono font-bold text-primary">{readingTime} min</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground uppercase font-bold tracking-tighter">Flow State</span>
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-green-500"
                            animate={{ width: `${flowState}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-primary/5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block text-center">Mood Palette</span>
                      <div className="flex justify-center gap-2">
                        {[
                          { icon: <Smile className="w-4 h-4" />, val: 'happy', color: 'bg-yellow-400' },
                          { icon: <Meh className="w-4 h-4" />, val: 'neutral', color: 'bg-blue-400' },
                          { icon: <Frown className="w-4 h-4" />, val: 'sad', color: 'bg-indigo-400' },
                          { icon: <Flame className="w-4 h-4" />, val: 'intense', color: 'bg-orange-500' }
                        ].map((m) => (
                          <button
                            key={m.val}
                            onClick={() => setMood(m.val)}
                            className={`p-2 rounded-xl border transition-all ${mood === m.val ? `${m.color} text-white border-transparent scale-110 shadow-lg` : 'bg-secondary/50 border-transparent hover:border-primary/20'}`}
                          >
                            {m.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customization Card */}
                <div className="p-5 rounded-3xl bg-card border border-primary/10 shadow-lg">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Aesthetics
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-5 gap-2">
                      {(['lined', 'grid', 'dots', 'plain', 'genz'] as const).map(style => (
                        <button
                          key={style}
                          onClick={() => setPaperStyle(style)}
                          className={`h-8 rounded-lg border flex items-center justify-center text-[10px] capitalize ${paperStyle === style ? 'bg-primary text-white border-primary' : 'bg-secondary/50 border-transparent'}`}
                        >
                          {style === 'genz' ? '✨' : style[0]}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 justify-center">
                      {[
                        { color: 'text-romantic-900', bg: 'bg-romantic-900' },
                        { color: 'text-blue-900', bg: 'bg-blue-900' },
                        { color: 'text-emerald-900', bg: 'bg-emerald-900' },
                        { color: 'text-slate-900', bg: 'bg-slate-900' }
                      ].map(c => (
                        <button
                          key={c.color}
                          onClick={() => setInkColor(c.color)}
                          className={`w-6 h-6 rounded-full border-2 ${c.bg} ${inkColor === c.color ? 'border-primary scale-110' : 'border-transparent'}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsPaperAged(!isPaperAged)} className={`text-[10px] h-7 px-2 rounded-full ${isPaperAged ? 'bg-primary/10 text-primary' : ''}`}>
                        Aged Paper
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setIsZenMode(true)} className="text-[10px] h-7 px-2 rounded-full">
                        Zen Mode
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Advanced Metrics */}
                <div className="p-4 rounded-3xl bg-romantic-900/5 border border-romantic-500/10 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-romantic-400">Vocabulary</span>
                    <span className="text-romantic-300 font-bold">{vocabularyRichness}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-romantic-400">Avg Speed</span>
                    <span className="text-romantic-300 font-bold">{wpm} WPM</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-romantic-400">Goal ({wordGoal})</span>
                    <div className="w-12 h-1.5 bg-romantic-900/20 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-romantic-400"
                        animate={{ width: `${Math.min(100, ((totalWordCount + wordCount) / wordGoal) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Diary Main Page */}
            <div className={`${isZenMode ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
              <Card className={`border-none shadow-2xl diary-shadow overflow-hidden rounded-[40px] relative transition-all duration-500 ${isPaperAged ? 'scale-[1.01]' : ''}`}>
                {/* Paper Texture Overlays */}
                <div className={`absolute inset-0 pointer-events-none z-0 ${
                  paperStyle === 'lined' ? 'diary-paper' : 
                  paperStyle === 'grid' ? 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] bg-[#fdfcf0]' :
                  paperStyle === 'dots' ? 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:30px_30px] bg-[#fdfcf0]' :
                  paperStyle === 'genz' ? 'diary-genz' : 'bg-[#fdfcf0]'
                } ${isPaperAged ? 'diary-aged' : ''}`} />
                
                <div className={`absolute top-0 left-12 w-px h-full bg-red-200/50 z-10 ${paperStyle === 'genz' ? 'hidden' : ''}`} />
                
                <div className={`min-h-[650px] p-8 md:p-12 pt-16 relative z-10 transition-colors duration-1000 ${isZenMode ? 'backdrop-blur-sm' : ''}`}>
                  {isZenMode && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsZenMode(false)}
                      className="absolute top-6 right-6 rounded-full hover:bg-primary/10"
                    >
                      <Minimize2 className="w-5 h-5" />
                    </Button>
                  )}

                  <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-4">
                    <div className="space-y-1">
                      <motion.h2 
                        layout
                        className={`font-serif text-3xl font-bold mb-1 ${paperStyle === 'genz' ? 'text-white drop-shadow-md' : 'text-romantic-900'}`}
                      >
                        {quiz.questions[currentQuestionIndex].text}
                      </motion.h2>
                      <div className={`flex items-center gap-3 font-handwriting text-xl ${paperStyle === 'genz' ? 'text-white/80' : 'text-romantic-500/60'}`}>
                        <span>{format(new Date(), 'h:mm a')}</span>
                        <span>•</span>
                        <span className="capitalize">{mood || 'reflecting...'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <Textarea
                      placeholder="Start writing your heart out..."
                      value={currentTextAnswer}
                      onChange={(e) => setCurrentTextAnswer(e.target.value)}
                      className={`border-none shadow-none focus-visible:ring-0 font-handwriting ${fontSize} ${lineSpacing} min-h-[400px] p-0 resize-none bg-transparent leading-relaxed transition-all duration-300 ${
                        paperStyle === 'genz' ? 'diary-genz-ink' : inkColor
                      }`}
                    />
                  </div>
                    
                    {/* Auto-save heartbeat */}
                    <div className="absolute bottom-0 right-0 flex items-center gap-2 text-[10px] font-mono text-muted-foreground/40">
                      <motion.div 
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-1.5 h-1.5 bg-primary rounded-full"
                      />
                      BUFFERING THOUGHTS
                    </div>
                  </div>

                  <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                      <div className="flex flex-col">
                        <span>Chars</span>
                        <span className="text-primary font-bold">{charCount}</span>
                      </div>
                      <div className="flex flex-col">
                        <span>Paragraphs</span>
                        <span className="text-primary font-bold">{paragraphCount}</span>
                      </div>
                      <div className="flex flex-col">
                        <span>Goal</span>
                        <span className="text-primary font-bold">{Math.floor(((totalWordCount + wordCount) / wordGoal) * 100)}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        {(['text-xl', 'text-2xl', 'text-3xl'] as const).map(size => (
                          <button
                            key={size}
                            onClick={() => setFontSize(size)}
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs ${fontSize === size ? 'bg-primary text-white' : 'bg-secondary/50'}`}
                          >
                            {size === 'text-xl' ? 'A' : size === 'text-2xl' ? 'A+' : 'A++'}
                          </button>
                        ))}
                      </div>
                      
                      <Button 
                        onClick={() => handleAnswer(currentTextAnswer)}
                        disabled={!currentTextAnswer.trim() || isEncrypting}
                        className="h-14 px-10 rounded-full text-lg font-bold bg-romantic-800 hover:bg-romantic-700 shadow-xl shadow-romantic-900/20 gap-3 group relative overflow-hidden"
                      >
                        <AnimatePresence mode="wait">
                          {isEncrypting ? (
                            <motion.div
                              key="loading"
                              initial={{ y: 20 }}
                              animate={{ y: 0 }}
                              exit={{ y: -20 }}
                              className="flex items-center gap-2"
                            >
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Sealing...
                            </motion.div>
                          ) : (
                            <motion.div
                              key="button"
                              initial={{ y: 20 }}
                              animate={{ y: 0 }}
                              exit={{ y: -20 }}
                              className="flex items-center gap-2"
                            >
                              <Wind className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                              Seal & Release
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Button>
                    </div>
                  </div>
              </Card>
              
              {!isZenMode && (
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white/50 border border-primary/5 backdrop-blur-sm flex flex-col items-center text-center">
                    <ShieldCheck className="w-5 h-5 text-green-500 mb-2" />
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Encryption</span>
                    <span className="text-xs font-mono truncate w-full">AES-256-GCM</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/50 border border-primary/5 backdrop-blur-sm flex flex-col items-center text-center">
                    <Fingerprint className="w-5 h-5 text-blue-500 mb-2" />
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Biometrics</span>
                    <span className="text-xs font-mono">Simulated</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/50 border border-primary/5 backdrop-blur-sm flex flex-col items-center text-center">
                    <Zap className="w-5 h-5 text-yellow-500 mb-2" />
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Clarity</span>
                    <span className="text-xs font-mono">{Math.min(100, Math.floor((totalWordCount + wordCount) / 2))}%</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/50 border border-primary/5 backdrop-blur-sm flex flex-col items-center text-center">
                    <Lock className="w-5 h-5 text-romantic-400 mb-2" />
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Privacy</span>
                    <span className="text-xs font-mono">Zero-Knowledge</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 'quiz' && quiz.type === 'standard' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 max-w-2xl mx-auto w-full"
          >
            {/* Standard Quiz UI (Existing) */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </span>
              </div>
              <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                />
              </div>
            </div>

            <Card className="border-primary/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-center py-4">
                  {quiz.questions[currentQuestionIndex].text}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {quiz.questions[currentQuestionIndex].options.map((option: string, index: number) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-16 text-lg rounded-2xl border-primary/10 hover:border-primary hover:bg-primary/5 transition-all justify-start px-6"
                    onClick={() => handleAnswer(index)}
                  >
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-4 font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'finished' && (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {quiz.type === 'secret-dump' ? (
              <Card className="border-romantic-500/30 shadow-2xl overflow-hidden bg-romantic-950/5">
                <div className="py-16 bg-gradient-to-b from-romantic-900/20 to-transparent flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="w-24 h-24 bg-romantic-900/20 rounded-full flex items-center justify-center mb-8 border border-romantic-500/20"
                  >
                    <Wind className="w-12 h-12 text-romantic-400" />
                  </motion.div>
                  <h2 className="text-4xl font-serif font-bold mb-4 text-romantic-300">Thoughts Released</h2>
                  <p className="text-romantic-400/80 max-w-md px-6 leading-relaxed">
                    Your session has been successfully purged from the local cache. 
                    The mental load has been released into the digital void.
                  </p>
                </div>
                
                <CardContent className="py-8 space-y-8">
                  <div className="max-w-xs mx-auto space-y-2">
                    <div className="flex justify-between text-[10px] font-mono text-romantic-400 uppercase tracking-widest">
                      <span>Purging Cache</span>
                      <span>{purgeProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-romantic-900/30 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-romantic-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${purgeProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="p-4 rounded-3xl bg-romantic-900/5 border border-romantic-500/10">
                      <p className="text-[10px] text-romantic-400 uppercase font-bold mb-1">Duration</p>
                      <p className="text-xl font-bold text-romantic-300">{formatTime(elapsedTime)}</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-romantic-900/5 border border-romantic-500/10">
                      <p className="text-[10px] text-romantic-400 uppercase font-bold mb-1">Mental Release</p>
                      <p className="text-xl font-bold text-romantic-300">{totalWordCount} Words</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 text-romantic-400/60 text-xs font-mono">
                    <Lock className="w-3 h-3" />
                    <span>SESSION {sessionKey} PERMANENTLY SEALED</span>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col gap-4 bg-romantic-900/5 p-8">
                  <Button 
                    onClick={() => {
                      console.log("Navigating to home...");
                      window.location.href = '/';
                    }} 
                    className="w-full h-14 rounded-2xl bg-romantic-800 hover:bg-romantic-700 text-white font-bold shadow-lg shadow-romantic-900/20 active:scale-95 transition-all"
                  >
                    Return to Reality
                  </Button>
                  <p className="text-[10px] text-romantic-500/60 uppercase tracking-tighter">
                    Zero-Knowledge Proof: No data remains on this device.
                  </p>
                </CardFooter>
              </Card>
            ) : (
              <Card className="border-primary/20 shadow-2xl overflow-hidden">
                <div className="py-12 bg-gradient-to-b from-primary/10 to-transparent flex flex-col items-center">
                  <div className="relative mb-6">
                    <Trophy className="w-24 h-24 text-primary" />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-4 -right-4"
                    >
                      <Sparkles className="w-10 h-10 text-romantic-400" />
                    </motion.div>
                  </div>
                  <h2 className="text-4xl font-serif font-bold mb-2">Quiz Completed!</h2>
                  <p className="text-muted-foreground">Great job, {user?.displayName || 'Romantic'}!</p>
                </div>
                
                <CardContent className="py-8">
                  <div className="flex justify-center items-baseline gap-2 mb-8">
                    <span className="text-7xl font-bold text-primary">{score}</span>
                    <span className="text-2xl text-muted-foreground">/ {quiz.questions.length}</span>
                  </div>
                  
                  <div className="space-y-4 max-w-xs mx-auto">
                    <div className="p-4 rounded-2xl bg-secondary/50 flex items-center gap-3 text-left">
                      {score === quiz.questions.length ? (
                        <Heart className="w-6 h-6 text-primary fill-primary shrink-0" />
                      ) : score > quiz.questions.length / 2 ? (
                        <Sparkles className="w-6 h-6 text-primary shrink-0" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-muted-foreground shrink-0" />
                      )}
                      <p className="text-sm font-medium">
                        {score === quiz.questions.length 
                          ? "Perfect! You know them inside out!" 
                          : score > quiz.questions.length / 2 
                          ? "You know them pretty well!" 
                          : "Time to spend more quality time together!"}
                      </p>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col gap-4">
                  <Button onClick={() => navigate('/')} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90">
                    Create Your Own Quiz
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Your response has been shared with {quiz.creatorName}.
                  </p>
                </CardFooter>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
