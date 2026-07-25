import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, doc, setDoc, addDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  ArrowLeft,
  UserPlus,
  Image,
  CheckCheck
} from 'lucide-react';

export default function Chat() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  
  const [newChatModal, setNewChatModal] = useState(false);
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const scrollRef = useRef(null);

  // Fetch conversations and contacts list
  useEffect(() => {
    if (!userProfile?.uid) return;
    setLoading(true);

    // Initial contacts/peers lookup
    const fetchPeers = async () => {
      const uSnap = await getDocs(collection(db, 'users'));
      const list = [];
      uSnap.forEach(d => {
        if (d.id !== userProfile.uid) {
          list.push({ id: d.id, ...d.data() });
        }
      });
      setPeers(list);
    };
    fetchPeers();

    // Setup active chats channels lists
    const unsubscribeChannels = onSnapshot(
      collection(db, 'users', userProfile.uid, 'conversations'),
      (snap) => {
        const list = [];
        snap.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // If empty, seed mock conversations
        if (list.length === 0) {
          const seeds = [
            { id: 'sarah', name: 'Dr. Sarah Jenkins', specialization: 'Orthodontist', photoUrl: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150', lastMessage: 'Let me look at your pre-op scan.', time: '10:30 AM', online: true, unreadCount: 1 },
            { id: 'john', name: 'Dr. John Myers', specialization: 'Endodontist', photoUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150', lastMessage: 'That sealer is perfect.', time: 'Yesterday', online: true, unreadCount: 0 }
          ];
          seeds.forEach(async (item) => {
            await setDoc(doc(db, 'users', userProfile.uid, 'conversations', item.id), item);
          });
          setChannels(seeds);
        } else {
          setChannels(list);
        }
        setLoading(false);
      }
    );

    return () => unsubscribeChannels();
  }, [userProfile]);

  // Load message logs for active channel
  useEffect(() => {
    if (!userProfile?.uid || !activeChannel) return;

    // Create unique room ID
    const roomId = [userProfile.uid, activeChannel.id].sort().join('_');
    
    // Set unread count to 0 in conversation card
    setDoc(doc(db, 'users', userProfile.uid, 'conversations', activeChannel.id), { unreadCount: 0 }, { merge: true });

    const q = query(collection(db, 'chats', roomId, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribeMessages = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data());
      });

      if (list.length === 0) {
        // seed initial messages
        const initial = [
          { senderId: activeChannel.id, text: `Hello Dr. ${userProfile.name.split(' ')[0]}, thanks for reaching out.`, timestamp: Date.now() - 60000 * 5 },
          { senderId: activeChannel.id, text: `Are you referencing the RCT molar case?`, timestamp: Date.now() - 60000 * 4 }
        ];
        initial.forEach(async (m) => {
          await addDoc(collection(db, 'chats', roomId, 'messages'), m);
        });
        setMessages(initial);
      } else {
        setMessages(list);
      }
    });

    return () => unsubscribeMessages();
  }, [activeChannel, userProfile]);

  // Handle route param redirects
  useEffect(() => {
    if (uid && peers.length > 0) {
      const selected = peers.find(p => p.id === uid);
      if (selected) {
        setActiveChannel({
          id: selected.uid,
          name: selected.name,
          specialization: selected.specialization,
          photoUrl: selected.photoUrl,
          online: true
        });
      }
    }
  }, [uid, peers]);

  // Scroll to bottom on messages load
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSend = async (e, mediaUrl = null) => {
    e?.preventDefault();
    if ((!text.trim() && !mediaUrl) || !userProfile?.uid || !activeChannel) return;

    const roomId = [userProfile.uid, activeChannel.id].sort().join('_');
    const msg = {
      senderId: userProfile.uid,
      text: text,
      mediaUrl: mediaUrl,
      timestamp: Date.now()
    };

    try {
      await addDoc(collection(db, 'chats', roomId, 'messages'), msg);
      
      // Update last message in local user's conversations
      await setDoc(doc(db, 'users', userProfile.uid, 'conversations', activeChannel.id), {
        id: activeChannel.id,
        name: activeChannel.name,
        specialization: activeChannel.specialization,
        photoUrl: activeChannel.photoUrl,
        lastMessage: mediaUrl ? '📸 Shared an image attachment' : text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCount: 0,
        online: true
      });

      // Update peer's conversations with unread increment
      await setDoc(doc(db, 'users', activeChannel.id, 'conversations', userProfile.uid), {
        id: userProfile.uid,
        name: userProfile.name,
        specialization: userProfile.specialization || 'Clinical practitioner',
        photoUrl: userProfile.photoUrl || '',
        lastMessage: mediaUrl ? '📸 Shared an image attachment' : text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCount: 1,
        online: true
      });

      setText('');
    } catch (e) {
      console.error('Failed to send chat message:', e);
    }
  };

  // Media sharing simulation upload
  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      // Simulate direct save by sending the dataURL as a media message
      handleSend(null, reader.result);
      alert('Media attachment sent successfully!');
    };
    reader.readAsDataURL(file);
  };

  // Start new channel from contacts list
  const handleStartConversation = (peer) => {
    setActiveChannel({
      id: peer.uid,
      name: peer.name,
      specialization: peer.specialization,
      photoUrl: peer.photoUrl,
      online: true
    });
    setNewChatModal(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden h-[78vh] flex animate-fade-in">
      
      {/* 1. Chats Directory List Sidebar */}
      <div className={`w-full md:w-80 flex flex-col border-r border-slate-100 shrink-0 ${
        activeChannel ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-slate-800">Messages</h2>
          
          <button 
            onClick={() => setNewChatModal(true)}
            className="p-1.5 bg-primary/10 hover:bg-primary/15 text-primary rounded-xl text-xs font-bold transition-colors"
          >
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-slate-50">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Search size={14} className="text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="bg-transparent text-xs border-none p-0 outline-none w-full"
            />
          </div>
        </div>

        {/* Channel Cards */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : channels.length === 0 ? (
            <p className="text-xs text-slate-400 p-6 text-center italic">No messages found. Click 'New Chat' to start.</p>
          ) : (
            channels.map((chan) => (
              <div 
                key={chan.id}
                onClick={() => setActiveChannel(chan)}
                className={`flex gap-3.5 p-4 items-center cursor-pointer hover:bg-slate-50/50 transition-colors relative ${
                  activeChannel?.id === chan.id ? 'bg-primary/5' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <img src={chan.photoUrl} alt="avatar" className="w-11 h-11 rounded-full object-cover border border-slate-100" />
                  {chan.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-extrabold text-xs text-slate-800 truncate">{chan.name}</span>
                    <span className="text-[9px] text-slate-400 font-semibold">{chan.time}</span>
                  </div>
                  <p className={`text-[11px] truncate leading-relaxed ${chan.unreadCount > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                    {chan.lastMessage}
                  </p>
                </div>

                {chan.unreadCount > 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary text-[8px] font-extrabold text-white rounded-full flex items-center justify-center">
                    {chan.unreadCount}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Active Chat Pane (Right) */}
      <div className={`flex-1 flex flex-col bg-slate-50/40 relative ${
        !activeChannel ? 'hidden md:flex items-center justify-center text-slate-400' : 'flex'
      }`}>
        {activeChannel ? (
          <>
            {/* Thread Header */}
            <div className="bg-white px-5 py-3 border-b border-slate-100 flex justify-between items-center z-10 shrink-0">
              <div className="flex items-center gap-3">
                {/* Back button on mobile */}
                <button 
                  onClick={() => setActiveChannel(null)}
                  className="md:hidden p-2 hover:bg-slate-50 border border-slate-100 rounded-xl text-slate-500"
                >
                  <ArrowLeft size={16} />
                </button>
                <img src={activeChannel.photoUrl} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-slate-100" />
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800">{activeChannel.name}</h3>
                  <span className="block text-[9px] text-primary font-bold">{activeChannel.specialization}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${activeChannel.online ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                <span className="text-[10px] text-slate-400 font-semibold">{activeChannel.online ? 'Online' : 'Offline'}</span>
              </div>
            </div>

            {/* Messages Viewport */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m, idx) => {
                const isMe = m.senderId === userProfile.uid;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3.5 rounded-2xl text-xs font-semibold leading-normal ${
                      isMe 
                        ? 'bg-primary text-white rounded-tr-sm shadow-md shadow-primary/10' 
                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                    }`}>
                      {m.text && <p className="whitespace-pre-line">{m.text}</p>}
                      
                      {m.mediaUrl && (
                        <div className="rounded-xl overflow-hidden mt-1 max-w-[200px] border border-slate-100">
                          <img src={m.mediaUrl} alt="Sent media" className="w-full object-cover" />
                        </div>
                      )}

                      <div className={`flex justify-end gap-1 items-center mt-1 text-[8px] ${
                        isMe ? 'text-white/60' : 'text-slate-400'
                      }`}>
                        <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <CheckCheck size={10} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef}></div>
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSend} className="bg-white border-t border-slate-100 p-4 flex gap-3 shrink-0 items-center">
              
              {/* Media Sharing attachment anchor */}
              <div className="relative">
                <input 
                  type="file" 
                  id="chat-media-upload"
                  onChange={handleMediaUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-9"
                  accept="image/*"
                />
                <button 
                  type="button" 
                  className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors"
                  aria-label="Upload media"
                >
                  <Paperclip size={16} />
                </button>
              </div>

              <input 
                type="text" 
                placeholder="Type your message here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-xs"
              />
              
              <button 
                type="submit"
                className="p-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-primary/10 transition-colors shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <CheckCheck size={28} className="text-slate-300 animate-pulse" />
            <p className="text-xs text-slate-400 font-semibold">Select a peer clinician conversation thread to begin messaging.</p>
          </div>
        )}
      </div>

      {/* 3. New Chat Modal (Screen 49) */}
      {newChatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h3 className="text-xs font-bold text-slate-800">Select Clinician Contacts</h3>
              <button onClick={() => setNewChatModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                Cancel
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50">
              {peers.map((peer) => (
                <div 
                  key={peer.id}
                  onClick={() => handleStartConversation(peer)}
                  className="flex gap-3 py-3 px-1 items-center cursor-pointer hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <img src={peer.photoUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block font-bold text-xs text-slate-800 truncate">Dr. {peer.name ? peer.name.replace(/^(dr\.\s*|dr\s+)+/i, '') : 'Clinician'}</span>
                    <span className="block text-[10px] text-slate-400 truncate">{peer.specialization}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
