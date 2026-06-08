import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, HardDrive, Search, LogOut, Shield, CheckCircle2, XCircle, Loader2, User, KeyRound, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to retrieve administrator statistics');
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data.user);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchProfile();
    } else {
      navigate('/login');
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUserFromToken = () => {
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  };

  const user = getUserFromToken();

  const handleDeleteUser = async (userId, userName) => {
    if (user && user.id === userId) {
      toast.error('You cannot delete your own administrator account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the user "${userName || 'Unknown User'}"? This will permanently delete their account, all uploaded secure files, and backups. This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || 'User deleted successfully.');
      fetchStats(); // Refresh table
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const filteredUsers = stats?.users.filter(u => {
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  const totalStorage = stats?.summary.totalStorageBytes || 0;

  return (
    <div className="min-h-screen p-8 max-w-[1100px] mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-12 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Shield className="text-accent" size={28} />
          <div>
            <h1 
              className="text-2xl font-black tracking-widest text-accent hover:opacity-80 transition-opacity cursor-pointer" 
              style={{ fontFamily: "'Orbitron', sans-serif" }}
              onClick={() => navigate('/')}
            >
              CIPHERNEST
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted block -mt-1">
              Admin Control Panel
            </span>
          </div>
        </div>
        
        {/* Admin Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center gap-2.5 cursor-pointer py-2"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className={`w-9 h-9 rounded-full overflow-hidden bg-accent-light text-accent flex items-center justify-center font-bold text-sm transition-transform border border-border/50 ${isDropdownOpen ? 'scale-105 ring-2 ring-accent/30' : 'hover:scale-105'}`}>
              {profile?.profilePicture ? (
                <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (profile?.name || user?.name)?.charAt(0).toUpperCase() || 'A'
              )}
            </div>
            <span className="font-semibold text-sm text-text">{profile?.name || user?.name || 'Admin'}</span>
          </div>
          
          <div className={`absolute right-0 top-full mt-2 w-52 bg-surface border border-border rounded-md shadow-lg transition-all duration-200 z-50 overflow-hidden ${isDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
            <div className="py-1">
              <button 
                onClick={() => navigate('/profile')}
                className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-border/30 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <User size={16} className="text-muted" /> Edit Profile
              </button>
              <button 
                onClick={() => navigate('/password')}
                className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-border/30 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <KeyRound size={16} className="text-muted" /> Change Password
              </button>
              <div className="h-px bg-border my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="p-24 text-center text-muted flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-accent" />
          <p className="text-sm font-semibold">Loading system statistics...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Card 1: Users */}
            <div className="bg-surface border border-border p-6 rounded-xl shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.01]">
              <div className="p-4 rounded-lg bg-accent/10 text-accent shrink-0">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Total Users</p>
                <h3 className="text-2xl font-bold text-text">{stats?.summary.totalUsers}</h3>
              </div>
            </div>

            {/* Card 2: Total Storage */}
            <div className="bg-surface border border-border p-6 rounded-xl shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.01]">
              <div className="p-4 rounded-lg bg-accent/10 text-accent shrink-0">
                <HardDrive size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Total Storage Consumed</p>
                <h3 className="text-2xl font-bold text-text">{formatBytes(totalStorage)}</h3>
              </div>
            </div>

            {/* Card 3: Verified Users */}
            <div className="bg-surface border border-border p-6 rounded-xl shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.01]">
              <div className="p-4 rounded-lg bg-accent/10 text-accent shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Verified Users</p>
                <h3 className="text-2xl font-bold text-text">
                  {stats?.summary.verifiedUsers || 0} / {stats?.summary.totalUsers || 0}
                </h3>
              </div>
            </div>
          </div>

          {/* User Section Header & Search */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Registered Vault Identics</h2>
              <p className="text-xs text-muted">Manage user spaces, verification status, and perform cascading account deletions.</p>
            </div>
            
            <div className="relative w-full md:w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>

          {/* User Table */}
          <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-border/20 text-xs font-semibold text-muted uppercase tracking-wider border-b border-border">
                    <th className="p-4 pl-6">Vault Identity</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Email Status</th>
                    <th className="p-4">Files Stored</th>
                    <th className="p-4 text-right">Space Consumed</th>
                    <th className="p-4 pr-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-10 text-center text-muted text-sm">
                        No vault identities match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((userItem) => (
                      <tr key={userItem._id} className="hover:bg-border/10 transition-colors text-sm">
                        {/* Vault Identity */}
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm shrink-0 border border-accent/20 overflow-hidden">
                              {userItem.profilePicture ? (
                                <img src={userItem.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                (userItem.name || 'U').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-text">{userItem.name || 'Unknown User'}</div>
                              <div className="text-xs text-muted">{userItem.email || 'No Email'}</div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Role */}
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${userItem.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                            {userItem.role === 'admin' ? 'Admin' : 'User'}
                          </span>
                        </td>
                        
                        {/* Email Status */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            {userItem.isEmailVerified ? (
                              <span className="flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 size={14} /> Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600">
                                <XCircle size={14} /> Unverified
                              </span>
                            )}
                          </div>
                        </td>
                        
                        {/* Files Stored */}
                        <td className="p-4 font-semibold text-text">
                          {userItem.filesCount} files
                        </td>
                        
                        {/* Space Consumed */}
                        <td className="p-4 text-right font-bold text-text">
                          {formatBytes(userItem.totalUsedBytes)}
                        </td>

                        {/* Actions */}
                        <td className="p-4 pr-6 text-center">
                          {userItem.role !== 'admin' ? (
                            <button
                              onClick={() => handleDeleteUser(userItem._id, userItem.name)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <span className="text-xs text-muted italic">Protected</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
