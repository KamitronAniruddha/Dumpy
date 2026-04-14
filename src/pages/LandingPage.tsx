import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Sparkles, Share2, Trophy, ArrowRight, Hash, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Input } from '../components/ui/input';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

export default function LandingPage() {
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  const handleJoinQuiz = async (e: React.FormEvent) => {
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
      
      if (!querySnapshot.empty) {
        const quizDoc = querySnapshot.docs[0];
        navigate(`/quiz/${quizDoc.id}`);
      } else {
        toast.error('Invalid quiz code. Please check and try again.');
      }
    } catch (error) {
      toast.error('Failed to join quiz');
    } finally {
      setJoining(false);
    }
  };
  return (
    <div className="relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -10, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-1/2 -right-24 w-80 h-80 bg-romantic-300/10 rounded-full blur-3xl" 
        />
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>The #1 Love Quiz Creator</span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary to-romantic-600 bg-clip-text text-transparent">
            Share Your Heart <br /> Through Quizzes
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Create beautiful, personalized quizzes for your partner, friends, or crush. 
            Discover how well you truly know each other in a fun and romantic way.
          </p>
          
          <div className="max-w-md mx-auto mb-12 p-2 bg-background rounded-2xl shadow-xl border border-primary/10 flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Enter Quiz Code" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="pl-9 border-none focus-visible:ring-0 h-12 text-lg font-mono tracking-widest uppercase"
              />
            </div>
            <Button 
              onClick={handleJoinQuiz} 
              disabled={joining || !joinCode}
              className="bg-primary hover:bg-primary/90 rounded-xl px-6 h-12"
            >
              {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : "Join Quiz"}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-primary/20 hover:bg-primary/5">
                View Examples
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Floating Hearts Animation */}
        <div className="mt-20 relative h-40 max-w-lg mx-auto">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0.5],
                y: [-20, -150],
                x: [0, (i % 2 === 0 ? 50 : -50) * Math.random()]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2, 
                repeat: Infinity,
                delay: i * 0.8
              }}
              className="absolute left-1/2 bottom-0"
            >
              <Heart className={`w-8 h-8 ${i % 2 === 0 ? 'text-primary fill-primary' : 'text-romantic-400 fill-romantic-400'} opacity-40`} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary/50 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Three simple steps to spread the love</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "Create Your Quiz",
                desc: "Add personal questions about your relationship, memories, and favorites."
              },
              {
                icon: Share2,
                title: "Share the Link",
                desc: "Send the unique quiz link to your partner or friends via any platform."
              },
              {
                icon: Trophy,
                title: "See Results",
                desc: "Track responses in real-time and see who knows you best!"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-background p-8 rounded-3xl border border-primary/10 shadow-sm"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <span className="font-serif font-bold text-lg">AmoreQuiz</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Made with love for lovers everywhere. © 2024 AmoreQuiz.
          </p>
        </div>
      </footer>
    </div>
  );
}
