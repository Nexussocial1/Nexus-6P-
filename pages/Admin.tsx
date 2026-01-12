
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Report, Post, UserProfile } from '../types';
import PostCard from '../components/PostCard';

const Admin: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [view, setView] = useState<'reports' | 'allPosts' | 'users'>('reports');
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    // Simplified queries (remove orderBy) to prevent permission issues on uninitialized fields
    const reportQ = query(collection(db, 'reports'));
    const unsubscribeReports = onSnapshot(reportQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Report[];
      data.sort((a, b) => (b.timestamp?.toMillis ? b.timestamp.toMillis() : 0) - (a.timestamp?.toMillis ? a.timestamp.toMillis() : 0));
      setReports(data);
    }, (err) => console.error("Admin reports error:", err));

    const postQ = query(collection(db, 'posts'));
    const unsubscribePosts = onSnapshot(postQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
      data.sort((a, b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0));
      setPosts(data);
    }, (err) => console.error("Admin posts error:", err));

    const userQ = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(userQ, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      data.sort((a, b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0));
      setUsers(data);
      setPermissionError(false);
    }, (err) => {
      console.error("Admin users error:", err);
      if (err.code === 'permission-denied') setPermissionError(true);
    });

    return () => {
      unsubscribeReports();
      unsubscribePosts();
      unsubscribeUsers();
    };
  }, []);

  const dismissReport = async (reportId: string) => {
    await deleteDoc(doc(db, 'reports', reportId));
  };

  return (
    <div className="max-w-5xl mx-auto">
      {permissionError && (
        <div className="glass border-red-500/50 border p-4 mb-6 rounded-xl flex items-center space-x-4 bg-red-500/5">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="text-red-400 font-bold uppercase text-xs tracking-widest">Database Restriction</h4>
            <p className="text-slate-400 text-xs mt-1">Firestore rules are blocking access to collections. Ensure your project has 'read' permissions enabled for all collections during development.</p>
          </div>
        </div>
      )}

      <header className="glass rounded-2xl p-8 mb-8 flex flex-col md:flex-row justify-between items-center border-l-4 border-cyan-500 shadow-2xl">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-black text-white mb-1 tracking-tight">NEXUS COMMAND</h1>
          <p className="text-cyan-400 font-mono text-sm">Administrator: Ajay Abdulazak</p>
        </div>
        <div className="flex space-x-3">
          <StatBox label="Reports" value={reports.length} color="text-red-500" />
          <StatBox label="Signals" value={posts.length} color="text-cyan-400" />
          <StatBox label="Operators" value={users.length} color="text-purple-400" />
        </div>
      </header>

      <div className="flex flex-wrap gap-2 mb-8">
        <NavButton active={view === 'reports'} onClick={() => setView('reports')} label="Incidents" />
        <NavButton active={view === 'allPosts'} onClick={() => setView('allPosts')} label="Transmissions" />
        <NavButton active={view === 'users'} onClick={() => setView('users')} label="User Matrix" />
      </div>

      <div className="space-y-6">
        {view === 'reports' && (
          reports.length > 0 ? reports.map(report => (
            <div key={report.id} className="glass rounded-xl p-6 border-l-4 border-red-500 animate-in slide-in-from-left-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-mono bg-red-500/20 text-red-400 px-2 py-1 rounded">PRIORITY 1: VIOLATION</span>
                  <h3 className="text-lg font-bold mt-2 text-white">Issue: {report.reason}</h3>
                  <p className="text-xs text-slate-500">Reported by: {report.reportedBy}</p>
                </div>
                <button onClick={() => dismissReport(report.id)} className="text-xs text-slate-400 hover:text-white glass px-3 py-1 rounded">Dismiss</button>
              </div>
              <div className="bg-black/60 p-4 rounded-lg border border-white/5 mb-4 font-mono text-sm text-slate-300">
                "{report.postContent}"
              </div>
              <div className="flex justify-end">
                <button onClick={async () => {
                  if(window.confirm("Purge original post?")) {
                    await deleteDoc(doc(db, 'posts', report.postId));
                    await deleteDoc(doc(db, 'reports', report.id));
                  }
                }} className="bg-red-600/80 hover:bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-500/20">
                  EXECUTE PURGE
                </button>
              </div>
            </div>
          )) : <EmptyState message="No network violations detected." />
        )}

        {view === 'allPosts' && posts.map(post => (
          <PostCard key={post.id} post={post} isAdmin />
        ))}

        {view === 'users' && (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/10">
                  <th className="px-6 py-4">Operator</th>
                  <th className="px-6 py-4">Signal Source</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                          {u.displayName?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-bold text-white">{u.displayName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${u.email === 'hh527924@gmail.com' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {u.email === 'hh527924@gmail.com' ? 'Admin' : 'Operator'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.email !== 'hh527924@gmail.com' && (
                        <button className="text-red-400 hover:text-red-300 text-xs font-bold">Restrict</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="glass px-6 py-3 rounded-xl text-center min-w-[100px]">
    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{label}</div>
    <div className={`text-2xl font-black ${color}`}>{value}</div>
  </div>
);

const NavButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button onClick={onClick} className={`px-6 py-3 rounded-xl font-bold transition-all border ${active ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'glass border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
    {label}
  </button>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="glass rounded-xl p-20 text-center text-slate-500 border-dashed border-2 border-white/5">
    <div className="text-4xl mb-4 opacity-30">🛡️</div>
    <p className="italic">{message}</p>
  </div>
);

export default Admin;
