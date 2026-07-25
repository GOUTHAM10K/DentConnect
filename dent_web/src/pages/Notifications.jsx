import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  Bell, 
  Settings, 
  Trash2, 
  Heart, 
  MessageSquare, 
  UserPlus, 
  ArrowLeft,
  Mail,
  Smartphone,
  CheckCheck
} from 'lucide-react';

export default function Notifications() {
  const { userProfile, updateProfileData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('center'); // 'center' or 'preferences'
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotify, setSelectedNotify] = useState(null);

  // Preference states loaded from profile
  const [prefs, setPrefs] = useState({
    likes: true,
    comments: true,
    connections: true,
    chat: true,
    email: true,
    push: true
  });

  useEffect(() => {
    if (userProfile?.notificationSettings) {
      setPrefs(userProfile.notificationSettings);
    }

    const fetchNotifications = async () => {
      if (!userProfile?.uid) return;
      setLoading(true);
      try {
        // Fetch or simulate notifications list
        // In actual implementation, we read from users/uid/notifications
        // We'll pre-populate with nice demo data if none exists
        const notifyRef = collection(db, 'users', userProfile.uid, 'notifications');
        const notifySnap = await getDocs(notifyRef);
        
        let list = [];
        notifySnap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        if (list.length === 0) {
          // Setup initial demo notifications
          const demoList = [
            { id: '1', type: 'like', text: 'Dr. Sarah liked your pre-op annotations on RCT Retreatment Case.', time: '2 hours ago', read: false, sender: 'Dr. Sarah' },
            { id: '2', type: 'comment', text: 'Dr. John commented: "Excellent choice of MTA obturation material."', time: '5 hours ago', read: false, sender: 'Dr. John' },
            { id: '3', type: 'connection', text: 'Dr. Emily started following your clinical publications.', time: '1 day ago', read: true, sender: 'Dr. Emily' },
            { id: '4', type: 'like', text: 'Dr. Mike liked your profile presentation.', time: '2 days ago', read: true, sender: 'Dr. Mike' }
          ];
          
          // Seed Firestore so it holds actual documents
          for (const item of demoList) {
            await setDoc(doc(db, 'users', userProfile.uid, 'notifications', item.id), item);
          }
          list = demoList;
        }
        
        setNotifications(list);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userProfile]);

  const togglePreference = async (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    try {
      await updateProfileData({
        notificationSettings: updated
      });
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  const markAllRead = async () => {
    if (!userProfile?.uid) return;
    try {
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      for (const item of notifications) {
        await updateDoc(doc(db, 'users', userProfile.uid, 'notifications', item.id), {
          read: true
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id) => {
    if (!userProfile?.uid) return;
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (selectedNotify?.id === id) setSelectedNotify(null);
      await deleteDoc(doc(db, 'users', userProfile.uid, 'notifications', id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotifyClick = async (n) => {
    setSelectedNotify(n);
    if (!n.read && userProfile?.uid) {
      try {
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
        await updateDoc(doc(db, 'users', userProfile.uid, 'notifications', n.id), {
          read: true
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={16} className="text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageSquare size={16} className="text-blue-500 fill-blue-500" />;
      case 'connection':
        return <UserPlus size={16} className="text-emerald-500" />;
      default:
        return <Bell size={16} className="text-primary" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-soft">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors text-slate-600"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Notification Center</h2>
            <p className="text-xs text-slate-400 font-medium">Manage and review clinician responses</p>
          </div>
        </div>

        <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100 self-stretch sm:self-auto">
          <button 
            onClick={() => setActiveTab('center')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'center' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Alerts
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'preferences' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings size={13} />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Section left: List or Preferences */}
        <div className="lg:col-span-2 space-y-4">
          
          {activeTab === 'center' ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
              <div className="flex justify-between items-center px-5 py-4 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Alerts</span>
                {notifications.some(n => !n.read) && (
                  <button 
                    onClick={markAllRead}
                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                  >
                    <CheckCheck size={14} />
                    <span>Mark all as read</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <div className="p-4 bg-slate-50 text-slate-300 rounded-full"><Bell size={32} /></div>
                  <p className="text-sm font-semibold text-slate-500">Inbox is empty</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => handleNotifyClick(n)}
                      className={`flex justify-between items-start p-5 hover:bg-slate-50/70 transition-colors cursor-pointer relative group ${
                        !n.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      {!n.read && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full"></span>}
                      <div className="flex gap-4">
                        <div className="p-2.5 bg-slate-100 rounded-xl shrink-0 mt-0.5">{getIcon(n.type)}</div>
                        <div>
                          <p className="text-sm text-slate-700 leading-normal font-medium">{n.text}</p>
                          <span className="block text-[10px] text-slate-400 mt-1 font-semibold">{n.time}</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4"
                        aria-label="Delete alert"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Preferences Form */
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Notification Preferences</h3>
                <p className="text-xs text-slate-400 font-medium">Control what events notify you and where</p>
              </div>

              {/* In-app triggers */}
              <div className="space-y-4">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Activity Triggers</span>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold text-slate-800">Likes & Annotations</span>
                    <span className="block text-[11px] text-slate-400">Notify when peers like or annotate shared cases</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={prefs.likes} 
                    onChange={() => togglePreference('likes')}
                    className="w-4 h-4 text-primary bg-slate-50 border-slate-200 rounded focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold text-slate-800">Comments & Answers</span>
                    <span className="block text-[11px] text-slate-400">Notify when comments are left on your posts</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={prefs.comments} 
                    onChange={() => togglePreference('comments')}
                    className="w-4 h-4 text-primary bg-slate-50 border-slate-200 rounded focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold text-slate-800">Connections Requests</span>
                    <span className="block text-[11px] text-slate-400">Notify when clinicians request to connect with you</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={prefs.connections} 
                    onChange={() => togglePreference('connections')}
                    className="w-4 h-4 text-primary bg-slate-50 border-slate-200 rounded focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold text-slate-800">Direct Messages</span>
                    <span className="block text-[11px] text-slate-400">Notify when you receive a message in Chat</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={prefs.chat} 
                    onChange={() => togglePreference('chat')}
                    className="w-4 h-4 text-primary bg-slate-50 border-slate-200 rounded focus:ring-primary"
                  />
                </div>
              </div>

              {/* Delivery Channels */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Channels</span>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <div className="p-2 bg-slate-50 text-slate-500 rounded-lg"><Mail size={16} /></div>
                    <div>
                      <span className="block text-sm font-bold text-slate-800">Email Notifications</span>
                      <span className="block text-[11px] text-slate-400">Send digests and clinical logs to your email</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={prefs.email} 
                    onChange={() => togglePreference('email')}
                    className="w-4 h-4 text-primary bg-slate-50 border-slate-200 rounded focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <div className="p-2 bg-slate-50 text-slate-500 rounded-lg"><Smartphone size={16} /></div>
                    <div>
                      <span className="block text-sm font-bold text-slate-800">Push Notifications</span>
                      <span className="block text-[11px] text-slate-400">Receive instant alerts directly in this browser</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={prefs.push} 
                    onChange={() => togglePreference('push')}
                    className="w-4 h-4 text-primary bg-slate-50 border-slate-200 rounded focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Section right: Detail View */}
        <div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft sticky top-24 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <Bell size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-slate-800">Notification Detail</h3>
            </div>

            {selectedNotify ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-xl">{getIcon(selectedNotify.type)}</div>
                  <div>
                    <span className="block text-xs font-bold text-slate-800">{selectedNotify.sender}</span>
                    <span className="block text-[10px] text-slate-400 font-semibold">{selectedNotify.time}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl">
                  {selectedNotify.text}
                </p>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (selectedNotify.type === 'like' || selectedNotify.type === 'comment') {
                        navigate('/network');
                      } else if (selectedNotify.type === 'connection') {
                        navigate('/profile');
                      }
                    }}
                    className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors"
                  >
                    Open Destination
                  </button>
                  <button 
                    onClick={() => deleteNotification(selectedNotify.id)}
                    className="px-3.5 py-2.5 border border-red-100 text-red-500 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-xs text-slate-400 font-medium">Select an alert to view complete findings and links.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
