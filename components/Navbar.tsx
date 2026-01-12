
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { signOut, User } from 'firebase/auth';
import { auth } from '../firebase';

interface NavbarProps {
  user: User;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const navigate = ReactRouterDOM.useNavigate();
  const isAdmin = user.email === 'hh527924@gmail.com';

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 h-16 flex items-center px-6">
      <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
        <ReactRouterDOM.Link to="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent neon-text">
          NEXUS
        </ReactRouterDOM.Link>

        <div className="flex items-center space-x-6">
          <ReactRouterDOM.Link to="/" className="hover:text-cyan-400 transition-colors">Feed</ReactRouterDOM.Link>
          <ReactRouterDOM.Link to="/groups" className="hover:text-cyan-400 transition-colors">Groups</ReactRouterDOM.Link>
          <ReactRouterDOM.Link to="/profile" className="hover:text-cyan-400 transition-colors">Profile</ReactRouterDOM.Link>
          {isAdmin && (
            <ReactRouterDOM.Link to="/admin" className="text-purple-400 hover:text-purple-300 font-semibold px-3 py-1 border border-purple-500/30 rounded-lg">Admin</ReactRouterDOM.Link>
          )}
          <button 
            onClick={handleLogout}
            className="text-sm bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-lg hover:bg-red-500/20 transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
