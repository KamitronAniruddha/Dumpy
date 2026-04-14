import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Heart, Search, Filter, Play, Ghost, MessageCircle, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface Quiz {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  createdAt: any;
  questions: any[];
  type?: 'standard' | 'secret-dump';
  category?: string;
}

export default function GalleryPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'romantic', 'funny', 'spicy', 'deep', 'memories'];

  useEffect(() => {
    let q = query(
      collection(db, 'quizzes'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quizData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Quiz[];
      setQuizzes(quizData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching gallery:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         quiz.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || quiz.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
        <h1 className="font-serif text-5xl font-bold bg-gradient-to-r from-primary to-romantic-600 bg-clip-text text-transparent">
          Quiz Gallery
        </h1>
        <p className="text-muted-foreground text-lg">
          Explore romantic quizzes created by the Amore community.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-12">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search quizzes..." 
            className="pl-10 h-12 rounded-2xl border-primary/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              className="rounded-full capitalize whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Heart className="w-12 h-12 text-primary animate-pulse fill-primary/20" />
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-20 bg-secondary/30 rounded-3xl border-2 border-dashed border-primary/20">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No quizzes found</h2>
          <p className="text-muted-foreground">Try adjusting your search or category filters.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full border-primary/10 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 group flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="rounded-full capitalize">
                        {quiz.category || 'romantic'}
                      </Badge>
                      {quiz.type === 'secret-dump' && (
                        <Badge variant="outline" className="rounded-full border-primary/20 text-primary">
                          Secret Dump
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                      {quiz.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                      {quiz.description || "A romantic quiz for someone special."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>By {quiz.creatorName}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4" />
                          {quiz.questions.length} Questions
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {quiz.createdAt?.toDate ? format(quiz.createdAt.toDate(), 'MMM d') : 'New'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Link to={`/quiz/${quiz.id}`} className="w-full">
                      <Button className="w-full rounded-xl gap-2 bg-primary hover:bg-primary/90">
                        <Play className="w-4 h-4 fill-current" />
                        Play Quiz
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
