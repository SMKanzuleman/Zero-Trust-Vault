import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, Download, LogOut, FileText, Loader2, User, KeyRound, Search, Image, Film, Archive, LayoutGrid, Eye, Trash2, Lock, FileCode, FileAudio, File } from 'lucide-react';

const getFileIconInfo = (filename) => {
  if (!filename) return { icon: File, color: 'text-accent', bg: 'bg-accent-light' };
  
  const ext = filename.split('.').pop().toLowerCase();
  
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
    return { icon: Image, color: 'text-blue-500', bg: 'bg-blue-500/10' };
  }
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
    return { icon: Film, color: 'text-purple-500', bg: 'bg-purple-500/10' };
  }
  if (['mp3', 'wav', 'ogg'].includes(ext)) {
    return { icon: FileAudio, color: 'text-pink-500', bg: 'bg-pink-500/10' };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { icon: Archive, color: 'text-amber-500', bg: 'bg-amber-500/10' };
  }
  if (['pdf'].includes(ext)) {
    return { icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10' };
  }
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json'].includes(ext)) {
    return { icon: FileCode, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
  }
  if (['doc', 'docx', 'txt', 'csv'].includes(ext)) {
    return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' };
  }
  
  return { icon: File, color: 'text-accent', bg: 'bg-accent-light' };
};
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState({});
  const [verifyingFiles, setVerifyingFiles] = useState({});
  const [totalUsedBytes, setTotalUsedBytes] = useState(0);
  const [profile, setProfile] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/files/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(res.data.files);
      setTotalUsedBytes(res.data.totalUsedBytes || 0);
    } catch (err) {
      toast.error('Failed to load files');
      if (err.response?.status === 401) handleLogout();
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
      fetchFiles();
      fetchProfile();
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size must be under 15MB');
      e.target.value = null;
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/files/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('File uploaded successfully!');
      
      // Update UI instantly without reloading all files
      if (res.data.file) {
        setFiles(prev => [{
          _id: res.data.file.id || res.data.file._id,
          fileName: res.data.file.fileName,
          uploadedAt: res.data.file.uploadedAt,
          uploadedBy: profile || user
        }, ...prev]);
        
        // Optionally update total used bytes locally
        if (file.size) {
          setTotalUsedBytes(prev => prev + file.size);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = null; // reset input
    }
  };

  const handleDownload = async (fileId, fileName) => {
    // ── Pre-flight Verification ──────────────────────────────────────────────
    setVerifyingFiles(prev => ({ ...prev, [fileId]: 'download' }));
    const toastId = toast.loading('Verifying file integrity...');
    try {
      const verifyRes = await axios.get(`http://localhost:5000/api/files/verify/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (verifyRes.data.status === 'corrupted') {
        toast.error('Integrity Check Failed! File is corrupted.', { id: toastId });
        setFiles(prev => prev.map(f => f._id === fileId ? { ...f, isCorrupted: true } : f));
        return;
      }
      toast.success('File integrity verified.', { id: toastId });
    } catch (err) {
      toast.error('Failed to verify file integrity.', { id: toastId });
      return;
    } finally {
      setVerifyingFiles(prev => {
        const newState = { ...prev };
        delete newState[fileId];
        return newState;
      });
    }

    try {
      setDownloading(prev => ({ ...prev, [fileId]: 0 }));
      const res = await axios.get(`http://localhost:5000/api/files/download/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Important for binary data
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloading(prev => ({ ...prev, [fileId]: percentCompleted }));
          } else {
            setDownloading(prev => ({ ...prev, [fileId]: 'infinite' }));
          }
        }
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Download complete!');
    } catch (err) {
      toast.error('Failed to download file');
    } finally {
      setDownloading(prev => {
        const newState = { ...prev };
        delete newState[fileId];
        return newState;
      });
    }
  };

  const handleView = async (fileId) => {
    // ── Pre-flight Verification ──────────────────────────────────────────────
    setVerifyingFiles(prev => ({ ...prev, [fileId]: 'view' }));
    const toastId = toast.loading('Verifying file integrity...');
    try {
      const verifyRes = await axios.get(`http://localhost:5000/api/files/verify/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (verifyRes.data.status === 'corrupted') {
        toast.error('Integrity Check Failed! File is corrupted.', { id: toastId });
        setFiles(prev => prev.map(f => f._id === fileId ? { ...f, isCorrupted: true } : f));
        return;
      }
      toast.success('File integrity verified.', { id: toastId });
    } catch (err) {
      toast.error('Failed to verify file integrity.', { id: toastId });
      return;
    } finally {
      setVerifyingFiles(prev => {
        const newState = { ...prev };
        delete newState[fileId];
        return newState;
      });
    }

    window.open(`http://localhost:5000/api/files/view/${fileId}?token=${token}`, '_blank');
  };

  const handleRecover = async (fileId) => {
    const toastId = toast.loading('Recovering file from secure backup...');
    try {
      await axios.post(`http://localhost:5000/api/files/recover/${fileId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('File recovered successfully!', { id: toastId });
      setFiles(prev => prev.map(f => f._id === fileId ? { ...f, isCorrupted: false } : f));
    } catch (err) {
      toast.error('Failed to recover file.', { id: toastId });
    }
  };


  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(prev => prev.filter(f => f._id !== fileId));
      toast.success('File deleted successfully');
    } catch (err) {
      toast.error('Failed to delete file');
    }
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

  const MAX_STORAGE_BYTES = 100 * 1024 * 1024;
  const usagePercentage = Math.min((totalUsedBytes / MAX_STORAGE_BYTES) * 100, 100);
  const formattedUsedMB = (totalUsedBytes / (1024 * 1024)).toFixed(2);

  const getFileCategory = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext)) return 'Documents';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'Images';
    if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) return 'Videos';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'Archives';
    return 'Other';
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || getFileCategory(file.fileName) === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen p-8 max-w-[1000px] mx-auto">
      <header className="flex justify-between items-center mb-12 pb-6 border-b border-border">
        <h1 
          className="text-2xl font-black tracking-widest text-accent cursor-pointer hover:opacity-80 transition-opacity" 
          style={{ fontFamily: "'Orbitron', sans-serif" }}
          onClick={() => navigate('/')}
        >
          ZERO TRUST VAULT
        </h1>
        
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center gap-2.5 cursor-pointer py-2"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className={`w-9 h-9 rounded-full overflow-hidden bg-accent-light text-accent flex items-center justify-center font-bold text-sm transition-transform border border-border/50 ${isDropdownOpen ? 'scale-105 ring-2 ring-accent/30' : 'hover:scale-105'}`}>
              {profile?.profilePicture ? (
                <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (profile?.username || user?.username)?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <span className="font-semibold text-sm text-text">{profile?.username || user?.username || 'User'}</span>
          </div>
          
          <div className={`absolute left-full top-0 ml-3 w-52 bg-surface border border-border rounded-md shadow-lg transition-all duration-200 z-50 overflow-hidden ${isDropdownOpen ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible -translate-x-2'}`}>
            <div className="py-1">
              <button 
                onClick={() => navigate('/profile')}
                className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-border/30 flex items-center gap-3 transition-colors"
              >
                <User size={16} className="text-muted" /> Edit Profile
              </button>
              <button 
                onClick={() => navigate('/password')}
                className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-border/30 flex items-center gap-3 transition-colors"
              >
                <KeyRound size={16} className="text-muted" /> Change Password
              </button>
              <div className="h-px bg-border my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-1">Your Encrypted Files</h2>
          <p className="text-sm text-muted">All files are encrypted on the server before storage.</p>
        </div>
        
        <div className="w-full md:w-[250px] bg-surface border border-border p-3.5 rounded-[8px] shadow-sm">
          <div className="flex justify-between text-xs font-semibold mb-2.5">
            <span className="text-text">Free Storage Quota</span>
            <span className={usagePercentage > 90 ? 'text-red-500' : 'text-muted'}>
              {formattedUsedMB} MB / 100 MB
            </span>
          </div>
          <div className="h-1.5 w-full bg-border/60 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${usagePercentage > 90 ? 'bg-red-500' : 'bg-accent'}`} 
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="shrink-0">
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            onChange={handleFileUpload} 
            disabled={uploading}
          />
          <label 
            htmlFor="file-upload" 
            className={`flex items-center justify-center gap-2 bg-text text-white py-2.5 px-5 rounded-[6px] font-semibold cursor-pointer hover:bg-text/90 transition-colors shadow-sm ${uploading ? 'opacity-70 pointer-events-none' : ''}`}
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {uploading ? 'Encrypting...' : 'Upload File'}
          </label>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            placeholder="Search encrypted files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['All', 'Documents', 'Images', 'Videos', 'Archives'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat 
                  ? 'bg-accent text-white border border-accent' 
                  : 'bg-surface text-text border border-border hover:bg-border/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {cat === 'All' && <LayoutGrid size={14} />}
                {cat === 'Documents' && <FileText size={14} />}
                {cat === 'Images' && <Image size={14} />}
                {cat === 'Videos' && <Film size={14} />}
                {cat === 'Archives' && <Archive size={14} />}
                {cat}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border border-border rounded-[10px] overflow-hidden bg-surface shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-muted flex flex-col items-center gap-3">
            <Loader2 size={24} className="animate-spin" />
            <p>Loading vault contents...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-16 text-center text-muted">
            <FileText size={48} className="mx-auto mb-4 text-border" />
            <p className="text-lg font-medium text-text mb-1">
              {files.length === 0 ? "Your vault is empty" : "No files found"}
            </p>
            <p className="text-sm">
              {files.length === 0 ? "Upload a file to securely store it." : "Try adjusting your search or category filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Header row */}
            <div className="grid grid-cols-[minmax(200px,1fr)_100px_120px_160px] gap-4 p-4 border-b border-border bg-border/20 text-xs font-semibold text-muted uppercase tracking-wider items-center">
              <div>File Details</div>
              <div>Size</div>
              <div>Uploaded</div>
              <div className="text-right pr-2">Actions</div>
            </div>
            
            {/* File List */}
            {filteredFiles.map(file => (
              <div 
                key={file._id} 
                className={`p-4 grid grid-cols-[minmax(200px,1fr)_100px_120px_160px] gap-4 items-center transition-colors border-b last:border-0 ${file.isCorrupted ? 'bg-red-500/10 border-red-500/30' : 'hover:bg-border/20 border-border'}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`p-2 rounded-md shrink-0 ${file.isCorrupted ? 'bg-red-500/20 text-red-500' : getFileIconInfo(file.fileName).bg + ' ' + getFileIconInfo(file.fileName).color}`}>
                    {React.createElement(getFileIconInfo(file.fileName).icon, { size: 20 })}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-semibold truncate text-sm ${file.isCorrupted ? 'text-red-400' : 'text-text'}`}>
                      {file.fileName}
                    </h3>
                    <p className={`text-xs truncate mt-0.5 ${file.isCorrupted ? 'text-red-400/70' : 'text-muted'}`}>
                      {file.isCorrupted ? 'File is corrupted' : `Uploaded by ${file.uploadedBy?.username || 'You'}`}
                    </p>
                  </div>
                </div>
                
                <div className="text-sm text-muted">
                  {file.fileSize > 1024 * 1024 
                    ? `${(file.fileSize / (1024 * 1024)).toFixed(1)} MB` 
                    : `${Math.round(file.fileSize / 1024)} KB`}
                </div>
                
                <div className="text-sm text-muted">
                  {new Date(file.uploadedAt).toLocaleDateString('en-GB')}
                </div>
                
                <div className="flex items-center justify-end gap-2">
                  {file.isCorrupted ? (
                    <button 
                      onClick={() => handleRecover(file._id)} 
                      className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 rounded-md hover:bg-red-500 transition-colors shadow-sm shadow-red-500/20"
                    >
                      Recover
                    </button>
                  ) : (
                    <>
                      <button onClick={() => handleView(file._id)} disabled={verifyingFiles[file._id] === 'view'} className="p-2 text-muted hover:text-text hover:bg-border/50 rounded-md transition-colors border border-border disabled:opacity-50" title="View">
                        {verifyingFiles[file._id] === 'view' ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => handleDownload(file._id, file.fileName)} disabled={downloading[file._id] !== undefined || verifyingFiles[file._id] === 'download'} className="p-2 text-muted hover:text-text hover:bg-border/50 rounded-md transition-colors border border-border disabled:opacity-50" title="Download">
                        {downloading[file._id] !== undefined || verifyingFiles[file._id] === 'download' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      </button>
                    </>
                  )}

                  <button onClick={() => handleDelete(file._id)} className="p-2 text-muted hover:text-red-500 hover:bg-red-50 hover:border-red-200 rounded-md transition-colors border border-border" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
