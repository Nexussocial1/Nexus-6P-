
import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Group, Post } from '../types';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupPosts, setGroupPosts] = useState<Post[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    // Simplified query: remove orderBy to minimize permission/index hurdles
    const q = query(collection(db, 'groups'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Group[];
      
      // Sort on client side
      data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      setGroups(data);
      setPermissionError(false);
    }, (err) => {
      console.error("Groups list error:", err);
      if (err.code === 'permission-denied') {
        setPermissionError(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;
    const q = query(
      collection(db, 'posts'),
      where('groupId', '==', selectedGroup.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
      
      data.sort((a, b) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA;
      });

      setGroupPosts(data);
    }, (err) => console.error("Group posts error:", err));
    return () => unsubscribe();
  }, [selectedGroup]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !auth.currentUser) return;
    try {
      await addDoc(collection(db, 'groups'), {
        name: newGroupName,
        description: newGroupDesc,
        createdBy: auth.currentUser.uid,
        members: [auth.currentUser.uid]
      });
      setNewGroupName('');
      setNewGroupDesc('');
      setIsCreating(false);
    } catch (err) {
      console.error("Error creating group:", err);
      alert("Check your Firestore rules. 'groups' collection might be locked.");
    }
  };

  const filteredGroups = groups.filter(g => {
    const name = (g.name || '').toLowerCase();
    const query = groupSearch.toLowerCase();
    return name.includes(query);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="glass rounded-2xl p-6 shadow-xl sticky top-24">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-xl text-white tracking-tight">SECTORS</h3>
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${isCreating ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'}`}
            >
              {isCreating ? 'CANCEL' : 'LAUNCH NEW'}
            </button>
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search frequencies..."
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {permissionError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] text-red-400">
              <p className="font-bold mb-1 uppercase tracking-widest">Uplink Blocked</p>
              Firestore security rules are preventing group access. Set rules to 'allow read, write: if true;' for testing.
            </div>
          )}

          {isCreating && (
            <form onSubmit={handleCreateGroup} className="space-y-4 mb-6 p-4 glass rounded-xl border-cyan-500/20 animate-in slide-in-from-top-2">
              <input
                type="text"
                required
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Sector Name"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500"
              />
              <textarea
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                placeholder="Transmission details"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm h-20 focus:outline-none focus:border-cyan-500"
              />
              <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 py-3 rounded-xl text-sm font-black text-white shadow-lg">INITIALIZE</button>
            </form>
          )}

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scroll">
            {filteredGroups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${selectedGroup?.id === group.id ? 'bg-cyan-500/10 border-cyan-500/40' : 'border-transparent hover:bg-white/5'}`}
              >
                <div className="font-bold text-white mb-1"># {group.name || 'Unnamed Sector'}</div>
                <div className="text-[10px] text-slate-500 truncate leading-tight">{group.description || 'No description available.'}</div>
              </button>
            ))}
            {!permissionError && groups.length === 0 && (
              <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest py-4">No sectors found</p>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        {selectedGroup ? (
          <div className="animate-in fade-in duration-500">
            <div className="glass rounded-2xl p-8 mb-8 border-l-4 border-cyan-500 shadow-xl">
              <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">/ {selectedGroup.name || 'Unnamed Sector'}</h2>
              <p className="text-slate-400 text-lg">{selectedGroup.description || 'No description available.'}</p>
            </div>
            <CreatePost groupId={selectedGroup.id} />
            <div className="space-y-6">
              {groupPosts.map(post => <PostCard key={post.id} post={post} />)}
              {groupPosts.length === 0 && (
                <div className="text-center py-20 glass rounded-2xl border-dashed border-2 border-white/5 text-slate-600 italic">
                  No signals detected on this frequency.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass rounded-3xl p-32 text-center flex flex-col items-center justify-center space-y-6 animate-float">
            <div className="text-6xl text-cyan-500/50">🛰️</div>
            <h2 className="text-3xl font-black text-white tracking-widest">SIGNAL LOST</h2>
            <p className="text-slate-500 max-w-md mx-auto">Select a sector frequency from the uplink console to begin monitoring transmissions.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
