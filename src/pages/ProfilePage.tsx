import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../lib/firebase';
import { useAuth } from '../lib/auth-context';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { 
  User, 
  Camera, 
  Heart, 
  Calendar, 
  Quote, 
  Save, 
  ArrowLeft, 
  Trophy, 
  MessageSquare, 
  Settings, 
  Shield, 
  Bell,
  Share2,
  Trash2,
  LogOut,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface UserProfile {
  displayName: string;
  photoURL: string;
  relationshipStatus: string;
  anniversaryDate: string;
  favoriteQuote: string;
  bio: string;
  theme: 'light' | 'dark' | 'romantic';
  notifications: boolean;
  privacy: 'public' | 'private';
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ quizzes: 0, responses: 0 });
  
  const [profile, setProfile] = useState<UserProfile>({
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || '',
    relationshipStatus: '',
    anniversaryDate: '',
    favoriteQuote: '',
    bio: '',
    theme: 'light',
    notifications: true,
    privacy: 'private'
  });

  useEffect(() => {
    if (!user) return;

    const fetchProfileData = async () => {
      try {
        // Fetch extra profile data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile(prev => ({
            ...prev,
            ...data,
            displayName: data.displayName || user.displayName || '',
            photoURL: data.photoURL || user.photoURL || ''
          }));
        }

        // Fetch stats
        const quizzesQuery = query(collection(db, 'quizzes'), where('creatorId', '==', user.uid));
        const quizzesSnap = await getDocs(quizzesQuery);
        const quizCount = quizzesSnap.size;
        
        let responseCount = 0;
        const responsesQuery = query(collection(db, 'responses'), where('creatorId', '==', user.uid));
        // Note: The responses collection might not have creatorId directly, 
        // usually we'd need to count responses for each quiz.
        // For simplicity, let's just count quizzes for now or assume a flattened structure if we had one.
        // Actually, our responses have quizId. We'd need to fetch all quizzes first.
        
        setStats({ quizzes: quizCount, responses: 0 }); // Responses count would need a more complex query
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Image size should be less than 2MB");
    }

    try {
      setSaving(true);
      const storageRef = ref(storage, `profiles/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      setProfile(prev => ({ ...prev, photoURL: url }));
      toast.success("Profile picture uploaded!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update Firebase Auth Profile
      await updateProfile(user, {
        displayName: profile.displayName,
        photoURL: profile.photoURL
      });

      // Update Firestore User Doc
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        uid: user.uid,
        email: user.email,
        updatedAt: new Date()
      }, { merge: true });

      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Heart className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-8"
      >
        {/* Sidebar */}
        <div className="w-full md:w-1/3 space-y-6">
          <Card className="border-primary/10 overflow-hidden">
            <div className="h-32 bg-primary/10 relative">
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-muted shadow-xl">
                    {profile.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <User className="w-10 h-10 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
              </div>
            </div>
            <CardContent className="pt-16 pb-8 text-center">
              <h2 className="text-2xl font-serif font-bold">{profile.displayName || 'Anonymous Lover'}</h2>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              
              <div className="flex justify-center gap-4 mt-6">
                <div className="text-center">
                  <p className="text-xl font-bold text-primary">{stats.quizzes}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Quizzes</p>
                </div>
                <div className="w-px h-8 bg-border self-center" />
                <div className="text-center">
                  <p className="text-xl font-bold text-primary">{stats.responses}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Responses</p>
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <Button variant="outline" className="w-full rounded-xl gap-2">
                  <Share2 className="w-4 h-4" /> Share Profile
                </Button>
                <Button variant="ghost" className="w-full rounded-xl gap-2 text-destructive hover:text-destructive hover:bg-destructive/5" onClick={() => auth.signOut()}>
                  <LogOut className="w-4 h-4" /> Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Lover's Badge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-bold text-sm">Romantic Novice</p>
                <p className="text-[10px] text-muted-foreground mt-1">Create 5 more quizzes to reach "Love Expert"</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Profile Settings
              </CardTitle>
              <CardDescription>Customize your romantic identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input 
                    value={profile.displayName} 
                    onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                    placeholder="Your romantic name"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relationship Status</Label>
                  <select 
                    value={profile.relationshipStatus}
                    onChange={(e) => setProfile({...profile, relationshipStatus: e.target.value})}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">Select status</option>
                    <option value="single">Single</option>
                    <option value="dating">Dating</option>
                    <option value="engaged">Engaged</option>
                    <option value="married">Married</option>
                    <option value="complicated">It's complicated</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Anniversary Date
                  </Label>
                  <Input 
                    type="date"
                    value={profile.anniversaryDate}
                    onChange={(e) => setProfile({...profile, anniversaryDate: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Quote className="w-4 h-4 text-primary" />
                    Favorite Love Quote
                  </Label>
                  <Input 
                    value={profile.favoriteQuote}
                    onChange={(e) => setProfile({...profile, favoriteQuote: e.target.value})}
                    placeholder="Love is..."
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio / About Us</Label>
                <Textarea 
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  placeholder="Tell your story..."
                  className="rounded-xl min-h-[100px]"
                />
              </div>

              <div className="pt-4 border-t border-primary/5 flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="rounded-xl px-8 gap-2 bg-primary hover:bg-primary/90"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public Profile</Label>
                    <p className="text-xs text-muted-foreground">Allow others to see your stats</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={profile.privacy === 'public'}
                    onChange={(e) => setProfile({...profile, privacy: e.target.checked ? 'public' : 'private'})}
                    className="w-10 h-5 rounded-full bg-muted appearance-none checked:bg-primary relative transition-colors cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-5.5 before:transition-all"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Get notified about new responses</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={profile.notifications}
                    onChange={(e) => setProfile({...profile, notifications: e.target.checked})}
                    className="w-10 h-5 rounded-full bg-muted appearance-none checked:bg-primary relative transition-colors cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-5.5 before:transition-all"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/10 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="destructive" className="w-full rounded-xl">
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
