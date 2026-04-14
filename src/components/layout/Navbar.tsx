import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { auth } from '../../lib/firebase';
import { Button } from '../ui/button';
import { Heart, LogOut, User, Moon, Sun, LayoutDashboard, PlusCircle, Sparkles, Ghost, Book } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isDumpMode, setIsDumpMode] = useState(false);

  useEffect(() => {
    // Observer for body attribute to detect Secret Dump mode
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-quiz-type') {
          const type = document.body.getAttribute('data-quiz-type');
          setIsDumpMode(type === 'secret-dump');
        }
      });
    });

    observer.observe(document.body, { attributes: true });
    
    // Initial check
    setIsDumpMode(document.body.getAttribute('data-quiz-type') === 'secret-dump');

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <nav className={`sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors duration-500 ${isDumpMode ? 'bg-romantic-950/80 border-romantic-500/30' : 'bg-background/80 border-b'}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className={`p-2 rounded-full transition-colors ${isDumpMode ? 'bg-romantic-500/20 group-hover:bg-romantic-500/30' : 'bg-primary/10 group-hover:bg-primary/20'}`}>
            {isDumpMode ? (
              <Book className="w-6 h-6 text-romantic-400 group-hover:scale-110 transition-transform" />
            ) : (
              <Heart className="w-6 h-6 text-primary fill-primary/20 group-hover:fill-primary/40 transition-all" />
            )}
          </div>
          <span className={`font-serif text-xl font-bold tracking-tight transition-colors ${isDumpMode ? 'text-romantic-300' : 'text-primary'}`}>
            {isDumpMode ? 'Diary' : 'AmoreQuiz'}
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            className="rounded-full"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/gallery">
                <Button variant="ghost" className="hidden sm:flex gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Gallery
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" className="hidden sm:flex gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/create">
                <Button variant="default" className="hidden sm:flex gap-2 bg-primary hover:bg-primary/90">
                  <PlusCircle className="w-4 h-4" />
                  Create Quiz
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="ghost" size="icon" className="rounded-full border border-primary/20">
                    <User className="w-5 h-5 text-primary" />
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium border-b mb-1">
                    {user.email}
                  </div>
                  <DropdownMenuItem render={
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                  } />
                  <DropdownMenuItem render={
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                  } className="sm:hidden" />
                  <DropdownMenuItem render={
                    <Link to="/create" className="flex items-center gap-2">
                      <PlusCircle className="w-4 h-4" /> Create Quiz
                    </Link>
                  } className="sm:hidden" />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-primary hover:bg-primary/90">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
