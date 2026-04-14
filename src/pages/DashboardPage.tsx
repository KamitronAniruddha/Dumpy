import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth-context';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Heart, Plus, Share2, Trash2, Eye, MessageCircle, Calendar, Copy, QrCode, Hash, Ghost, Play, Pencil, Book } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '../components/ui/badge';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface Quiz {
  id: string;
  title: string;
  description: string;
  createdAt: any;
  questions: any[];
  shortCode?: string;
  type?: 'standard' | 'secret-dump';
}

function ShareDialog({ quiz }: { quiz: Quiz }) {
  const quizUrl = `${window.location.origin}/quiz/${quiz.id}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" />}>
        <Share2 className="w-4 h-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-primary">Share Quiz</DialogTitle>
          <DialogDescription>
            Choose your preferred method to share "{quiz.title}"
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl">
            <TabsTrigger value="link" className="rounded-lg gap-2">
              <Copy className="w-4 h-4" /> Link
            </TabsTrigger>
            <TabsTrigger value="qr" className="rounded-lg gap-2">
              <QrCode className="w-4 h-4" /> QR
            </TabsTrigger>
            <TabsTrigger value="code" className="rounded-lg gap-2">
              <Hash className="w-4 h-4" /> Code
            </TabsTrigger>
          </TabsList>
          <TabsContent value="link" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Direct Link</Label>
              <div className="flex gap-2">
                <Input readOnly value={quizUrl} className="rounded-xl" />
                <Button onClick={() => copyToClipboard(quizUrl)} className="bg-primary rounded-xl">
                  Copy
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="qr" className="flex flex-col items-center justify-center pt-4 space-y-4">
            <div className="p-4 bg-white rounded-2xl shadow-inner">
              <QRCodeCanvas value={quizUrl} size={200} level="H" />
            </div>
            <p className="text-sm text-muted-foreground">Scan this code to start the quiz</p>
          </TabsContent>
          <TabsContent value="code" className="space-y-4 pt-4 text-center">
            <div className="space-y-2">
              <Label>Quiz Join Code</Label>
              <div className="flex flex-col items-center gap-4">
                <div className="text-4xl font-mono font-bold tracking-widest text-primary bg-primary/5 p-6 rounded-2xl border-2 border-dashed border-primary/20">
                  {quiz.shortCode || 'N/A'}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(quiz.shortCode || '')}
                  className="rounded-xl gap-2"
                  disabled={!quiz.shortCode}
                >
                  <Copy className="w-4 h-4" /> Copy Code
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function DeleteQuizDialog({ quiz, onDelete }: { quiz: Quiz, onDelete: (id: string) => Promise<void> }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(quiz.id);
    setIsDeleting(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10" />}>
        <Trash2 className="w-4 h-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-destructive">Delete Quiz?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete "{quiz.title}" and all its responses.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="rounded-xl gap-2"
          >
            {isDeleting ? (
              <Heart className="w-4 h-4 animate-pulse" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete Permanently
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'quizzes'),
      where('creatorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quizData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Quiz[];
      setQuizzes(quizData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to load quizzes");
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    try {
      const q = query(
        collection(db, 'quizzes'),
        where('shortCode', '==', joinCode.trim().toUpperCase()),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('Invalid quiz code');
      } else {
        const quizId = querySnapshot.docs[0].id;
        navigate(`/quiz/${quizId}`);
      }
    } catch (error) {
      toast.error('Error joining quiz');
    } finally {
      setJoining(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // 1. Delete all associated responses first
      // This is necessary because security rules check the quiz document for ownership
      const responsesQuery = query(collection(db, 'responses'), where('quizId', '==', id));
      const responsesSnapshot = await getDocs(responsesQuery);
      
      const deletePromises = responsesSnapshot.docs.map(responseDoc => 
        deleteDoc(doc(db, 'responses', responseDoc.id))
      );
      
      await Promise.all(deletePromises);

      // 2. Delete the quiz itself
      await deleteDoc(doc(db, 'quizzes', id));
      
      toast.success('Quiz and all responses deleted');
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error('Failed to delete quiz');
    }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/quiz/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="font-serif text-4xl font-bold mb-2">My Quizzes</h1>
          <p className="text-muted-foreground">Manage and track your romantic quizzes</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleJoinByCode} className="flex gap-2">
            <Input 
              placeholder="Enter Quiz Code" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="rounded-full px-4 h-12 w-40 border-primary/20 focus:border-primary"
              maxLength={6}
            />
            <Button 
              type="submit" 
              variant="outline" 
              disabled={joining}
              className="rounded-full h-12 gap-2 border-primary/20 hover:bg-primary/5"
            >
              <Play className="w-4 h-4" />
              Join
            </Button>
          </form>
          <Link to="/create">
            <Button className="bg-primary hover:bg-primary/90 rounded-full px-6 h-12 gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" />
              Create New Quiz
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Heart className="w-8 h-8 text-primary animate-pulse" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-20 bg-secondary/30 rounded-3xl border-2 border-dashed border-primary/20">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No quizzes yet</h2>
          <p className="text-muted-foreground mb-8">Create your first love quiz and share it with someone special!</p>
          <Link to="/create">
            <Button variant="outline" className="rounded-full border-primary/20">
              Create My First Quiz
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {quizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/5 rounded-lg">
                          {quiz.type === 'secret-dump' ? (
                            <Book className="w-5 h-5 text-primary" />
                          ) : (
                            <Heart className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        {quiz.type === 'secret-dump' && (
                          <Badge variant="outline" className="rounded-full border-primary/20 text-primary text-[10px] h-5">
                            Secret Dump
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <ShareDialog quiz={quiz} />
                        <Link to={`/edit/${quiz.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <DeleteQuizDialog quiz={quiz} onDelete={handleDelete} />
                      </div>
                    </div>
                    <CardTitle className="line-clamp-1">{quiz.title}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                      {quiz.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4" />
                        {quiz.questions.length} Questions
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {quiz.createdAt?.toDate ? format(quiz.createdAt.toDate(), 'MMM d, yyyy') : 'Recently'}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Link to={`/results/${quiz.id}`} className="w-full">
                      <Button variant="secondary" className="w-full rounded-xl gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Eye className="w-4 h-4" />
                        View Responses
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
