
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Post } from '../types';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We remove orderBy('createdAt', 'desc') to avoid requiring a composite index with groupId
    const q = query(
      collection(db, 'posts'),
      where('groupId', '==', null)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];

      // Sort manually on client-side to bypass index requirement
      postsData.sort((a, b) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA;
      });

      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Feed Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPosts = posts.filter(post => {
    const content = (post.content || '').toLowerCase();
    const userName = (post.userName || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return content.includes(query) || userName.includes(query);
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="relative glass rounded-xl p-1 mb-6 flex items-center">
          <span className="pl-4 pr-2 text-slate-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the Nexus protocols..."
            className="w-full bg-transparent p-3 text-slate-200 focus:outline-none"
          />
        </div>
        <CreatePost />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-mono tracking-widest uppercase animate-pulse">Initializing Flux...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="glass rounded-xl p-10 text-center text-slate-500 border-dashed border-2 border-white/5">
              No signals found in this sector.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Feed;
