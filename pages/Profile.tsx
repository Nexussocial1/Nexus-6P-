
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Post } from '../types';
import PostCard from '../components/PostCard';

const Profile: React.FC = () => {
  const user = auth.currentUser;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // We fetch without server-side orderBy to avoid requiring a composite index
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
      
      // Sort manually
      data.sort((a, b) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA;
      });

      setPosts(data);
      setLoading(false);
    }, (err) => {
      console.error("Profile posts error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass rounded-2xl p-8 mb-8 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 p-1 mb-4 shadow-xl shadow-cyan-500/20">
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-3xl font-bold">
            {user.displayName?.[0]?.toUpperCase() || user.email?.[0].toUpperCase()}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white">{user.displayName}</h1>
        <p className="text-slate-500 font-mono text-sm mt-1">{user.email}</p>
        <div className="mt-6 flex space-x-4">
          <div className="glass px-6 py-2 rounded-xl">
            <span className="block text-2xl font-bold text-cyan-400">{posts.length}</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Signals Sent</span>
          </div>
          <div className="glass px-6 py-2 rounded-xl">
            <span className="block text-2xl font-bold text-purple-400">{posts.reduce((acc, p) => acc + (p.likes?.length || 0), 0)}</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Impact</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-300 mb-4 px-2">Encryption Log (My Posts)</h3>
        {loading ? (
           <div className="text-center py-10 animate-pulse text-slate-600">Retrieving local cache...</div>
        ) : posts.length > 0 ? (
          posts.map(post => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="glass rounded-xl p-10 text-center text-slate-500 border-dashed border-2 border-white/5">
            The void is silent. Start a transmission.
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
