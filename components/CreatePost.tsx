
import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface CreatePostProps {
  groupId?: string;
}

const CreatePost: React.FC<CreatePostProps> = ({ groupId }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !auth.currentUser) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0],
        content: content.trim(),
        createdAt: serverTimestamp(),
        likes: [],
        groupId: groupId || null,
        reportCount: 0
      });
      setContent('');
    } catch (err) {
      console.error("Error creating post", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass rounded-xl p-4 mb-6 neon-border transition-all duration-300">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={groupId ? "Post something to this group..." : "What's on your mind, Matrix dweller?"}
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[100px] resize-none"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? 'Syncing...' : 'Blast Out'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
