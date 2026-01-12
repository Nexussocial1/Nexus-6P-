
import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Post } from '../types';

interface GlassCommentBoxProps {
  post: Post;
}

const GlassCommentBox: React.FC<GlassCommentBoxProps> = ({ post }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !auth.currentUser) return;

    setIsSubmitting(true);
    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        comments: arrayUnion({
          id: Date.now().toString(),
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0],
          text: text.trim(),
          createdAt: new Date().toISOString()
        })
      });
      setText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="space-y-3">
        {post.comments?.map((comment) => (
          <div key={comment.id} className="glass rounded-lg p-3 border border-white/5 hover:bg-white/10 transition-all">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-cyan-400">{comment.userName}</span>
              <span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm text-slate-300">{comment.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Inject comment..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          disabled={isSubmitting || !text.trim()}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default GlassCommentBox;
