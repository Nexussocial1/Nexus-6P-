
import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Post } from '../types';
import GlassCommentBox from './GlassCommentBox';

interface PostCardProps {
  post: Post;
  isAdmin?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, isAdmin }) => {
  const [showComments, setShowComments] = useState(false);
  const user = auth.currentUser;
  
  // Safe check for likes array
  const likesArray = post.likes || [];
  const isLiked = user && likesArray.includes(user.uid);

  const handleLike = async () => {
    if (!user) return;
    const postRef = doc(db, 'posts', post.id);
    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Purge this transmission?")) return;
    await deleteDoc(doc(db, 'posts', post.id));
  };

  const handleReport = async () => {
    if (!user) return;
    const reason = window.prompt("Reason for reporting?");
    if (!reason) return;

    await addDoc(collection(db, 'reports'), {
      postId: post.id,
      postContent: post.content,
      reportedBy: user.email,
      reason,
      timestamp: serverTimestamp()
    });

    const postRef = doc(db, 'posts', post.id);
    await updateDoc(postRef, {
      reportCount: (post.reportCount || 0) + 1
    });

    alert("Report filed. Nexus observers notified.");
  };

  return (
    <div className="glass rounded-xl p-6 mb-6 group hover:border-cyan-500/50 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-lg">
            {post.userName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h4 className="font-bold text-white leading-tight">{post.userName || 'Anonymous'}</h4>
            <span className="text-xs text-slate-400">
              {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'Just now'}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          {isAdmin && (
            <button onClick={handleDelete} className="text-red-400 hover:text-red-300 p-2 glass rounded-lg">
              Delete
            </button>
          )}
          {!isAdmin && (
            <button onClick={handleReport} className="text-slate-500 hover:text-yellow-400 p-2 glass rounded-lg transition-colors">
              Report
            </button>
          )}
        </div>
      </div>

      <p className="text-slate-200 text-lg leading-relaxed mb-6 whitespace-pre-wrap">
        {post.content || ''}
      </p>

      <div className="flex items-center space-x-6 border-t border-white/5 pt-4">
        <button 
          onClick={handleLike}
          className={`flex items-center space-x-2 px-3 py-1 rounded-full transition-colors ${isLiked ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-400 hover:text-cyan-400'}`}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span>
          <span className="font-medium">{likesArray.length}</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 text-slate-400 hover:text-purple-400 transition-colors"
        >
          <span>💬</span>
          <span className="font-medium">{post.comments?.length || 0}</span>
        </button>
      </div>

      {showComments && <GlassCommentBox post={post} />}
    </div>
  );
};

export default PostCard;
