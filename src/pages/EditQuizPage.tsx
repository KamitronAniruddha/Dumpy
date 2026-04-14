import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth-context';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Heart, Plus, Trash2, Save, ArrowLeft, CheckCircle2, Sparkles, Calendar, ArrowUp, ArrowDown, Ghost, Loader2, Book } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

interface Question {
  text: string;
  options: string[];
  correctOptionIndex: number;
}

export default function EditQuizPage() {
  const { quizId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizType, setQuizType] = useState<'standard' | 'secret-dump'>('standard');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('romantic');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', options: ['', ''], correctOptionIndex: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId || !user) return;
      try {
        const docRef = doc(db, 'quizzes', quizId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Security check: only creator can edit
          if (data.creatorId !== user.uid) {
            toast.error("You don't have permission to edit this quiz");
            navigate('/dashboard');
            return;
          }
          
          setTitle(data.title || '');
          setDescription(data.description || '');
          setCategory(data.category || 'romantic');
          setVisibility(data.visibility || 'public');
          setQuizType(data.type || 'standard');
          setQuestions(data.questions || []);
        } else {
          toast.error("Quiz not found");
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
        toast.error("Failed to load quiz data");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, user, navigate]);

  const addQuestion = () => {
    setQuestions([...questions, { 
      text: '', 
      options: quizType === 'standard' ? ['', ''] : [], 
      correctOptionIndex: quizType === 'standard' ? 0 : -1 
    }]);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) return;
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length >= 4) return;
    newQuestions[qIndex].options.push('');
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length <= 2) return;
    newQuestions[qIndex].options.splice(oIndex, 1);
    if (newQuestions[qIndex].correctOptionIndex >= newQuestions[qIndex].options.length) {
      newQuestions[qIndex].correctOptionIndex = 0;
    }
    setQuestions(newQuestions);
  };

  const handleUpdate = async () => {
    if (!title.trim()) return toast.error('Please enter a quiz title');
    if (!quizId) return;
    
    const isStandard = quizType === 'standard';
    const hasInvalidQuestions = questions.some(q => {
      if (!q.text.trim()) return true;
      if (isStandard && (q.options.length < 2 || q.options.some(o => !o.trim()))) return true;
      return false;
    });

    if (hasInvalidQuestions) {
      return toast.error(isStandard ? 'Please fill in all questions and at least 2 options for each' : 'Please fill in all prompt texts');
    }

    setSaving(true);
    try {
      const docRef = doc(db, 'quizzes', quizId);
      await updateDoc(docRef, {
        title,
        description,
        questions,
        type: quizType,
        category,
        visibility,
        updatedAt: new Date(),
      });
      toast.success('Quiz updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error("Error updating quiz:", error);
      toast.error('Failed to update quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleTypeChange = (newType: 'standard' | 'secret-dump') => {
    setQuizType(newType);
    setQuestions(questions.map(q => ({
      ...q,
      options: newType === 'standard' ? (q.options.length >= 2 ? q.options : ['', '']) : [],
      correctOptionIndex: newType === 'standard' ? (q.correctOptionIndex >= 0 ? q.correctOptionIndex : 0) : -1
    })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-3xl font-bold">Edit Quiz</h1>
        </div>
        
        <Tabs value={quizType} onValueChange={(v: any) => handleTypeChange(v)} className="w-auto">
          <TabsList className="rounded-full p-1 h-12">
            <TabsTrigger value="standard" className="rounded-full px-6 gap-2">
              <Heart className="w-4 h-4" /> Standard
            </TabsTrigger>
            <TabsTrigger value="secret-dump" className="rounded-full px-6 gap-2">
              <Book className="w-4 h-4" /> Diary Mode
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-8">
        {quizType === 'secret-dump' && (
          <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Book className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Diary Mode</h2>
            </div>
            <p className="text-muted-foreground">
              In this mode, the respondent will feel like they're writing in a beautiful, private diary. 
              They'll see a date, time, and word count, creating a safe space to dump their thoughts.
              <strong> You'll still receive all their entries securely!</strong>
            </p>
          </div>
        )}

        {/* Quiz Info */}
        <Card className="border-primary/10 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
            <CardDescription>Update your quiz title and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                placeholder="How well do you know me?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl h-12"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select 
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="romantic">Romantic</option>
                  <option value="funny">Funny</option>
                  <option value="spicy">Spicy</option>
                  <option value="deep">Deep & Meaningful</option>
                  <option value="memories">Memories</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <select 
                  id="visibility"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="public">Public (Gallery)</option>
                  <option value="private">Private (Link Only)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="A little quiz for my favorite person..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary fill-primary" />
              Questions
            </h2>
            <span className="text-sm text-muted-foreground">{questions.length} total</span>
          </div>

          <AnimatePresence mode="popLayout">
            {questions.map((q, qIndex) => (
              <motion.div
                key={qIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-primary/10 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        Question {qIndex + 1}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveQuestion(qIndex, 'up')}
                          disabled={qIndex === 0}
                          className="h-8 w-8 rounded-full"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveQuestion(qIndex, 'down')}
                          disabled={qIndex === questions.length - 1}
                          className="h-8 w-8 rounded-full"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={questions.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>{quizType === 'standard' ? 'Question Text' : 'Prompt Text'}</Label>
                      <Input
                        placeholder={quizType === 'standard' ? "What is my favorite color?" : "Tell me how you feel today..."}
                        value={q.text}
                        onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                        className="rounded-xl"
                      />
                    </div>

                    {quizType === 'standard' && (
                      <div className="space-y-3">
                        <Label>Options</Label>
                        <div className="grid gap-3">
                          {q.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex gap-2 items-center">
                              <Button
                                variant={q.correctOptionIndex === oIndex ? "default" : "outline"}
                                size="icon"
                                onClick={() => updateQuestion(qIndex, 'correctOptionIndex', oIndex)}
                                className={`shrink-0 rounded-full h-8 w-8 ${q.correctOptionIndex === oIndex ? 'bg-primary' : 'border-primary/20'}`}
                              >
                                {q.correctOptionIndex === oIndex ? <CheckCircle2 className="w-4 h-4" /> : (oIndex + 1)}
                              </Button>
                              <Input
                                placeholder={`Option ${oIndex + 1}`}
                                value={option}
                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                className="rounded-xl"
                              />
                              {q.options.length > 2 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeOption(qIndex, oIndex)}
                                  className="shrink-0 text-muted-foreground"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        {q.options.length < 4 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addOption(qIndex)}
                            className="text-primary hover:text-primary hover:bg-primary/10 mt-2"
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add Option
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            variant="outline"
            className="w-full border-dashed border-2 h-16 rounded-2xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
            onClick={addQuestion}
          >
            <Plus className="w-5 h-5 mr-2 text-primary" />
            Add Another Question
          </Button>
        </div>

        <div className="pt-8 flex gap-4">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
            onClick={handleUpdate}
            disabled={saving}
          >
            {saving ? 'Updating Quiz...' : 'Save Changes'}
            {!saving && <Save className="ml-2 w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
