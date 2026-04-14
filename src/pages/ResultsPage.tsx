import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy, doc, getDoc, where, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Heart, ArrowLeft, User, Calendar, Trophy, Share2, MessageCircle, Ghost, CheckCircle2, Download, FileText, Copy, Check, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

interface Response {
  id: string;
  respondentName: string;
  respondentEmail?: string;
  respondentPhoto?: string;
  score: number;
  totalQuestions: number;
  createdAt: any;
  answers: any[];
  type?: 'standard' | 'secret-dump';
  metrics?: {
    totalWords: number;
    totalChars: number;
    avgWpm: number;
    vocabRichness: number;
    duration: number;
    finalMood: string;
  };
}

interface Quiz {
  id: string;
  title: string;
  questions: any[];
  type?: 'standard' | 'secret-dump';
}

export default function ResultsPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<Response[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!quizId) return;

    const fetchQuiz = async () => {
      const docRef = doc(db, 'quizzes', quizId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setQuiz({ id: docSnap.id, ...docSnap.data() } as Quiz);
      }
    };
    fetchQuiz();

    const q = query(
      collection(db, 'responses'),
      where('quizId', '==', quizId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const responseData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Response[];
      setResponses(responseData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching responses:", error);
      toast.error("Failed to load responses");
      setLoading(false);
    });

    return unsubscribe;
  }, [quizId]);

  const copyLink = () => {
    const url = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(url);
    toast.success('Quiz link copied!');
  };

  const handleDeleteQuiz = async () => {
    if (!quizId) return;
    setIsDeleting(true);
    try {
      // 1. Delete all associated responses first
      // This is necessary because security rules check the quiz document for ownership
      const responsesQuery = query(collection(db, 'responses'), where('quizId', '==', quizId));
      const responsesSnapshot = await getDocs(responsesQuery);
      
      const deletePromises = responsesSnapshot.docs.map(responseDoc => 
        deleteDoc(doc(db, 'responses', responseDoc.id))
      );
      
      await Promise.all(deletePromises);

      // 2. Delete the quiz itself
      await deleteDoc(doc(db, 'quizzes', quizId));
      
      toast.success('Quiz and all responses deleted');
      navigate('/dashboard');
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error('Failed to delete quiz');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const copyResponseText = (response: Response) => {
    let text = `Response for: ${quiz?.title}\n`;
    text += `Respondent: ${response.respondentName} (${response.respondentEmail || 'No Email'})\n`;
    text += `Score: ${response.score}/${response.totalQuestions}\n`;
    text += `Date: ${response.createdAt?.toDate ? format(response.createdAt.toDate(), 'PPP p') : 'N/A'}\n\n`;
    text += `ANSWERS:\n`;
    
    response.answers.forEach((answer, index) => {
      const question = quiz?.questions[index];
      text += `${index + 1}. ${question?.text || 'Question'}\n`;
      if (quiz?.type === 'standard') {
        const selectedOption = question?.options[answer.selectedOptionIndex];
        const correctOption = question?.options[question.correctOptionIndex];
        text += `   Selected: ${selectedOption || 'N/A'}\n`;
        text += `   Correct: ${correctOption}\n`;
        text += `   Result: ${answer.isCorrect ? 'Correct' : 'Incorrect'}\n`;
      } else {
        text += `   Response: ${answer.textAnswer || 'No response'}\n`;
      }
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedId(response.id);
    toast.success('Response text copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportToPDF = async (elementId?: string, filename?: string) => {
    const element = elementId ? document.getElementById(elementId) : resultsRef.current;
    if (!element) {
      toast.error('Export target not found');
      return;
    }

    setExporting(true);
    const loadingToast = toast.loading('Preparing high-quality PDF...');

    try {
      // Ensure we are at the top for capture
      window.scrollTo(0, 0);
      
      // Wait a bit for any layout shifts to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 3, // Higher resolution for "best" look
        backgroundColor: '#ffffff',
        style: {
          padding: '40px',
          borderRadius: '0'
        },
        filter: (node: any) => {
          if (node.classList && node.classList.contains('no-export')) {
            return false;
          }
          // Show export-only elements
          if (node.classList && node.classList.contains('export-only')) {
            node.style.display = 'block';
          }
          return true;
        }
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const img = new Image();
      img.src = dataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = pdfWidth;
      const imgHeight = (img.height * pdfWidth) / img.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add subsequent pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(filename || `${quiz?.title || 'Quiz'}_Results.pdf`);
      toast.dismiss(loadingToast);
      toast.success('PDF generated successfully!');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)]">
      <Heart className="w-12 h-12 text-primary animate-pulse" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl" ref={resultsRef}>
      {/* PDF Branding Header (Hidden in UI, visible in PDF) */}
      <div className="hidden export-only mb-12 border-b-2 border-primary/20 pb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Heart className="w-10 h-10 text-primary fill-primary/20" />
          </div>
          <h1 className="font-serif text-5xl font-bold text-primary tracking-tight">AmoreQuiz</h1>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-serif font-medium text-foreground/80">{quiz?.title}</p>
          <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">Official Response Report • {format(new Date(), 'PPP')}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12 no-export">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-serif text-3xl font-bold">{quiz?.title}</h1>
            <p className="text-muted-foreground">Responses and Analytics</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={copyLink} variant="outline" className="rounded-full gap-2 border-primary/20 hover:bg-primary/5">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button onClick={() => navigate(`/edit/${quizId}`)} variant="outline" className="rounded-full gap-2 border-primary/20 hover:bg-primary/5">
            <Pencil className="w-4 h-4" />
            Edit Quiz
          </Button>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger render={<Button variant="outline" className="rounded-full gap-2 border-destructive/20 text-destructive hover:bg-destructive/5" />}>
              <Trash2 className="w-4 h-4" />
              Delete Quiz
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl text-destructive">Delete this Quiz?</DialogTitle>
                <DialogDescription>
                  This will permanently remove "{quiz?.title}" and all {responses.length} responses. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteQuiz} 
                  disabled={isDeleting}
                  className="rounded-xl gap-2"
                >
                  {isDeleting ? <Heart className="w-4 h-4 animate-pulse" /> : <Trash2 className="w-4 h-4" />}
                  Delete Everything
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            onClick={() => exportToPDF(undefined, `${quiz?.title}_Full_Report.pdf`)} 
            disabled={exporting || responses.length === 0}
            className="rounded-full gap-2 bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4" />
            Export All (PDF)
          </Button>
        </div>
      </div>

      {responses.length === 0 ? (
        <div className="text-center py-20 bg-secondary/30 rounded-3xl border-2 border-dashed border-primary/20">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No responses yet</h2>
          <p className="text-muted-foreground mb-8">Share your quiz link to start seeing results!</p>
          <Button onClick={copyLink} className="bg-primary hover:bg-primary/90 rounded-full px-8">
            Copy Link
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-primary/10">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{responses.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Total Responses</div>
              </CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {(responses.reduce((acc, r) => acc + r.score, 0) / responses.length).toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Avg. Score</div>
              </CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {Math.max(...responses.map(r => r.score))}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">High Score</div>
              </CardContent>
            </Card>
            <Card className="border-primary/10">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {responses.filter(r => r.score === r.totalQuestions).length}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Perfect Scores</div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Section */}
          {responses.length > 0 && quiz?.type === 'standard' && (
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="border-primary/10 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Score Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={
                      Array.from({ length: (quiz?.questions.length || 0) + 1 }, (_, i) => ({
                        score: i,
                        count: responses.filter(r => r.score === i).length
                      }))
                    }>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="score" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: 'rgba(var(--primary), 0.05)' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {responses.map((_, index) => (
                          <Cell key={`cell-${index}`} fill="var(--primary)" fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-primary/10 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Pass/Fail Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Perfect', value: responses.filter(r => r.score === r.totalQuestions).length },
                          { name: 'Passed', value: responses.filter(r => r.score >= r.totalQuestions / 2 && r.score < r.totalQuestions).length },
                          { name: 'Needs Work', value: responses.filter(r => r.score < r.totalQuestions / 2).length },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#ec4899" />
                        <Cell fill="#f472b6" />
                        <Cell fill="#fbcfe8" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{responses.length}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">Total</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Responses List */}
          <div className="grid gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 mt-8">
              {quiz?.type === 'secret-dump' ? (
                <Ghost className="w-5 h-5 text-primary" />
              ) : (
                <Trophy className="w-5 h-5 text-primary" />
              )}
              {quiz?.type === 'secret-dump' ? 'Secret Dumps' : 'Leaderboard'}
            </h2>
            <AnimatePresence>
              {responses.map((response, index) => (
                <motion.div
                  key={response.id}
                  id={`response-${response.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-primary/10 hover:border-primary/30 transition-all overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {response.respondentPhoto ? (
                              <img src={response.respondentPhoto} alt={response.respondentName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold truncate">{response.respondentName}</h3>
                              {quiz?.type === 'standard' && response.score === response.totalQuestions && (
                                <Badge className="bg-primary hover:bg-primary">Perfect!</Badge>
                              )}
                              {quiz?.type === 'secret-dump' && (
                                <Badge variant="outline" className="border-primary/20 text-primary">Secret Dump</Badge>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-1">
                              {response.respondentEmail && (
                                <span className="truncate">{response.respondentEmail}</span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {response.createdAt?.toDate ? format(response.createdAt.toDate(), 'MMM d, HH:mm') : 'Just now'}
                              </span>
                              {quiz?.type === 'secret-dump' && response.metrics && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Badge variant="secondary" className="text-[10px] h-5 rounded-full bg-romantic-50 text-romantic-600 border-romantic-100">
                                    {response.metrics.totalWords} words
                                  </Badge>
                                  <Badge variant="secondary" className="text-[10px] h-5 rounded-full bg-romantic-50 text-romantic-600 border-romantic-100">
                                    {response.metrics.avgWpm} WPM
                                  </Badge>
                                  <Badge variant="secondary" className="text-[10px] h-5 rounded-full bg-romantic-50 text-romantic-600 border-romantic-100">
                                    {response.metrics.vocabRichness}% Richness
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 no-export">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => copyResponseText(response)}
                              className="rounded-full h-8 w-8"
                              title="Copy Text"
                            >
                              {copiedId === response.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => exportToPDF(`response-${response.id}`, `${response.respondentName}_Response.pdf`)}
                              className="rounded-full h-8 w-8"
                              title="Export PDF"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            {quiz?.type === 'standard' && (
                              <div className="text-right ml-2">
                                <div className="text-2xl font-bold text-primary">
                                  {response.score}<span className="text-sm text-muted-foreground font-normal">/{response.totalQuestions}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {quiz?.type === 'secret-dump' && (
                          <div className="space-y-4 mt-4 pt-4 border-t border-primary/5">
                            {response.answers.map((answer: any, aIndex: number) => (
                              <div key={aIndex} className="space-y-2">
                                <p className="text-xs font-bold text-primary uppercase tracking-wider">
                                  {quiz.questions[aIndex]?.text || `Prompt ${aIndex + 1}`}
                                </p>
                                <div className="p-4 bg-primary/5 rounded-2xl text-sm leading-relaxed">
                                  {answer.textAnswer || "No response provided."}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      
      {/* PDF Branding Footer (Hidden in UI, visible in PDF) */}
      <div className="hidden export-only mt-12 pt-8 border-t border-primary/10 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          Generated by AmoreQuiz • The Ultimate Romantic Quiz Platform
        </p>
        <p className="text-[10px] text-muted-foreground/50 mt-1">
          © {new Date().getFullYear()} AmoreQuiz. All rights reserved.
        </p>
      </div>

      <style>{`
        @media print {
          .no-export { display: none !important; }
          .export-only { display: block !important; }
        }
        .export-only { display: none; }
        
        /* PDF Specific Styling for the "Best" Look */
        .pdf-page-break { page-break-before: always; }
        .pdf-card { 
          border: 1px solid rgba(var(--primary), 0.1);
          box-shadow: none !important;
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
}
