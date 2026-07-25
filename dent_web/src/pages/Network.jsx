import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, doc, setDoc, updateDoc, getDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Award, 
  Send, 
  UserPlus, 
  Check, 
  Image, 
  Tag,
  Compass,
  MoreVertical,
  Plus
} from 'lucide-react';

export default function Network() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Post Composer
  const [newPostText, setNewPostText] = useState('');
  const [newPostTag, setNewPostTag] = useState('');
  const [newPostImages, setNewPostImages] = useState([]);
  const [composerOpen, setComposerOpen] = useState(false);

  // Comments and Detail views
  const [activePostComments, setActivePostComments] = useState(null); // ID of post currently showing comments
  const [commentsList, setCommentsList] = useState({}); // postId -> array of comments
  const [newCommentText, setNewCommentText] = useState('');

  // Connections and Peers
  const [peers, setPeers] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [savedPostIds, setSavedPostIds] = useState(new Set());

  // Mock Stories for clinician online status (Screen 50)
  const stories = [
    { id: 'arun', name: 'Dr. Arun', photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150', online: true },
    { id: 'sarah', name: 'Dr. Sarah', photo: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150', online: true },
    { id: 'john', name: 'Dr. John', photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150', online: true },
    { id: 'emily', name: 'Dr. Emily', photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150', online: false },
  ];

  // Fetch initial feed, peers, and connections status
  const fetchFeedAndPeers = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      // 1. Fetch Feed posts
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => {
        const item = d.data();
        // Include post if public (or default), or owned by current user, or if visibility isn't private
        if (!item.visibility || item.visibility === 'public' || item.visibility === 'connections' || item.userId === userProfile.uid) {
          list.push({ id: d.id, ...item });
        }
      });

      // Pre-seed mock posts in Firestore if empty
      if (list.length === 0) {
        const seedPosts = [
          {
            postId: 'p1',
            userId: 'sarah',
            userName: 'Dr. Sarah Jenkins',
            userRole: 'Orthodontist specialist',
            userPhoto: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150',
            caseTitle: 'Molar extraction and alignment',
            diagnosis: 'Class II Malocclusion',
            caption: 'Successfully resolved a severe Class II Malocclusion with customized self-ligating brackets and distalization. Total therapy length: 14 months.',
            imageUrls: ['https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=600'],
            likesCount: 14,
            commentsCount: 2,
            timestamp: Date.now() - 3600000 * 4
          },
          {
            postId: 'p2',
            userId: 'john',
            userName: 'Dr. John Myers',
            userRole: 'Endodontist specialist',
            userPhoto: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150',
            caseTitle: 'S-shaped canal RCT obturation',
            diagnosis: 'Symptomatic Irreversible Pulpitis',
            caption: 'Challenging obturation of an S-shaped canal in a mandibular first molar. Instrumented using rotary NiTi files with continuous irrigation of sodium hypochlorite. Obturated with Gutta-Percha and bioceramic sealer.',
            imageUrls: ['https://images.unsplash.com/photo-1579684389782-64d84b5e901d?auto=format&fit=crop&q=80&w=600'],
            likesCount: 8,
            commentsCount: 1,
            timestamp: Date.now() - 3600000 * 20
          }
        ];
        
        for (const item of seedPosts) {
          await setDoc(doc(db, 'posts', item.postId), item);
        }
        list.push(...seedPosts);
      }
      setPosts(list);

      // 2. Fetch comments lists
      for (const p of list) {
        const cSnap = await getDocs(collection(db, 'posts', p.id, 'comments'));
        const comments = [];
        cSnap.forEach(cd => comments.push(cd.data()));
        if (comments.length === 0 && p.id === 'p1') {
          // seed mock comments
          const mockC = [
            { authorName: 'Dr. John Myers', text: 'Stunning orthodontic positioning!', timestamp: Date.now() - 3600000 * 3 },
            { authorName: 'Dr. Emily Watson', text: 'Which size wire did you use for finishing?', timestamp: Date.now() - 3600000 * 2 }
          ];
          for (let idx = 0; idx < mockC.length; idx++) {
            await setDoc(doc(collection(db, 'posts', p.id, 'comments')), mockC[idx]);
          }
          comments.push(...mockC);
        }
        setCommentsList(prev => ({ ...prev, [p.id]: comments }));
      }

      // 3. Fetch Clinician Peers Directory (users collection)
      const usersRef = collection(db, 'users');
      const uSnap = await getDocs(usersRef);
      const peerList = [];
      uSnap.forEach((uDoc) => {
        if (uDoc.id !== userProfile.uid) {
          peerList.push({ id: uDoc.id, ...uDoc.data() });
        }
      });
      setPeers(peerList);

      // Seed connection requests if empty
      const requestsRef = collection(db, 'users', userProfile.uid, 'connectionRequests');
      const rSnap = await getDocs(requestsRef);
      const requests = [];
      rSnap.forEach(rd => requests.push({ id: rd.id, ...rd.data() }));
      
      if (requests.length === 0) {
        const demoReq = { id: 'emily', fromId: 'emily', fromName: 'Dr. Emily Watson', specialization: 'Periodontist', photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150' };
        await setDoc(doc(db, 'users', userProfile.uid, 'connectionRequests', demoReq.id), demoReq);
        requests.push(demoReq);
      }
      setConnectionRequests(requests);

      // Setup simulated follows
      const savedSnap = await getDocs(collection(db, 'users', userProfile.uid, 'savedPosts'));
      const savedSet = new Set();
      savedSnap.forEach(d => savedSet.add(d.id));
      setSavedPostIds(savedSet);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedAndPeers();
  }, [userProfile]);

  // Handle Like trigger
  const handleLike = async (postId, currentLikes) => {
    try {
      const postRef = doc(db, 'posts', postId);
      const newCount = (currentLikes || 0) + 1;
      await updateDoc(postRef, { likesCount: newCount });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likesCount: newCount } : p));
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Save Post
  const handleSavePost = async (postId) => {
    if (!userProfile?.uid) return;
    try {
      const updated = new Set(savedPostIds);
      if (updated.has(postId)) {
        updated.delete(postId);
        // Remove document
        // Simulated local database delete
      } else {
        updated.add(postId);
        await setDoc(doc(db, 'users', userProfile.uid, 'savedPosts', postId), { savedAt: Date.now() });
      }
      setSavedPostIds(updated);
      alert(updated.has(postId) ? 'Post saved to bookmarks!' : 'Post removed from bookmarks.');
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Share copy link
  const handleShare = (postId) => {
    const postUrl = `${window.location.origin}/network/post/${postId}`;
    navigator.clipboard.writeText(postUrl);
    alert('Post link copied to clipboard!');
  };

  // Submit new post composer
  const handleCreatePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() || !userProfile?.uid) return;

    try {
      const postRef = doc(collection(db, 'posts'));
      const newPost = {
        postId: postRef.id,
        userId: userProfile.uid,
        userName: userProfile.name,
        userRole: userProfile.specialization || 'Dentist Practitioner',
        userPhoto: userProfile.photoUrl || '',
        caseTitle: newPostTag ? `Topic: ${newPostTag}` : 'Clinical update',
        diagnosis: newPostTag,
        caption: newPostText,
        imageUrls: newPostImages,
        likesCount: 0,
        commentsCount: 0,
        timestamp: Date.now()
      };

      await setDoc(postRef, newPost);
      
      // Update locally
      setPosts(prev => [newPost, ...prev]);
      setNewPostText('');
      setNewPostTag('');
      setComposerOpen(false);
      alert('Post shared in community feed!');
    } catch (err) {
      console.error('Create post failed:', err);
    }
  };

  // Handle comment submit
  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!newCommentText.trim() || !userProfile?.uid) return;

    try {
      const commentRef = doc(collection(db, 'posts', postId, 'comments'));
      const commentObj = {
        authorName: userProfile.name,
        text: newCommentText,
        timestamp: Date.now()
      };

      await setDoc(commentRef, commentObj);
      
      // Update local comments lists state
      setCommentsList(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), commentObj]
      }));

      // Update post comment count
      const postRef = doc(db, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      const newCommentsCount = (post?.commentsCount || 0) + 1;
      await updateDoc(postRef, { commentsCount: newCommentsCount });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: newCommentsCount } : p));
      
      setNewCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Connection triggers
  const handleConnect = async (peer) => {
    if (!userProfile?.uid) return;
    try {
      const updated = new Set(connectedIds);
      if (updated.has(peer.id)) {
        updated.delete(peer.id);
      } else {
        updated.add(peer.id);
        // Create request
        await setDoc(doc(db, 'users', peer.id, 'connectionRequests', userProfile.uid), {
          fromId: userProfile.uid,
          fromName: userProfile.name,
          specialization: userProfile.specialization,
          photoUrl: userProfile.photoUrl
        });
      }
      setConnectedIds(updated);
      alert('Connection request sent to Dr. ' + peer.name.split(' ')[0] + '!');
    } catch (e) {
      console.error(e);
    }
  };

  // Accept request
  const handleAcceptRequest = async (reqId) => {
    if (!userProfile?.uid) return;
    try {
      setConnectionRequests(prev => prev.filter(r => r.id !== reqId));
      // Delete request document
      await deleteDoc(doc(db, 'users', userProfile.uid, 'connectionRequests', reqId));
      alert('Connection accepted!');
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* 1. Main Feed Column (Left/Center) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Clinicians Online Stories Row */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-soft overflow-x-auto whitespace-nowrap flex gap-4 scrollbar-thin">
          {stories.map(s => (
            <Link key={s.id} to={`/chat/${s.id}`} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
              <div className="relative w-12 h-12 rounded-full border-2 border-primary/20 p-0.5">
                <img src={s.photo} alt={s.name} className="w-full h-full rounded-full object-cover" />
                {s.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>}
              </div>
              <span className="text-[10px] font-bold text-slate-600">{s.name}</span>
            </Link>
          ))}
        </div>

        {/* Create Post composer box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft space-y-4">
          <div className="flex gap-3">
            <img 
              src={userProfile?.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150'} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <button 
              onClick={() => setComposerOpen(true)}
              className="flex-1 text-left px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Share a patient case study or clinically log findings...
            </button>
          </div>
        </div>

        {/* Composer Modal popup */}
        {composerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleCreatePostSubmit} className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="text-sm font-bold text-slate-800">Create Community Post</h3>
                <button type="button" onClick={() => setComposerOpen(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                  Cancel
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Discussion caption</label>
                  <textarea 
                    rows="4" 
                    placeholder="Discuss canal cleaning steps, crown preparations, or patient complications..."
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    required
                    className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-xs resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Topic / Diagnosis tags</label>
                  <div className="relative">
                    <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. Endodontics, Malocclusion" 
                      value={newPostTag}
                      onChange={(e) => setNewPostTag(e.target.value)}
                      className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-xs"
                    />
                  </div>
                </div>

                {/* Simulated image uploads */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Add photos</label>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setNewPostImages(['https://images.unsplash.com/photo-1579684389782-64d84b5e901d?auto=format&fit=crop&q=80&w=600'])}
                      className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-600 rounded-lg transition-colors"
                    >
                      <Image size={13} />
                      <span>Seed Case Image</span>
                    </button>
                    {newPostImages.length > 0 && <span className="text-[10px] text-emerald-500 font-bold self-center">✓ Attachment seeded</span>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-50">
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/10"
                >
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Post Feed List */}
        {loading ? (
          <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-soft">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft space-y-4">
                
                {/* Author Info */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <Link to={`/profile/${post.userId}`}>
                      <img 
                        src={post.userPhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150'} 
                        alt="Author" 
                        className="w-10 h-10 rounded-full object-cover border border-slate-50 shadow-sm"
                      />
                    </Link>
                    <div>
                      <Link to={`/profile/${post.userId}`} className="block font-bold text-sm text-slate-800 hover:text-primary transition-colors">
                        Dr. {post.userName ? post.userName.replace(/^(dr\.\s*|dr\s+)+/i, '') : 'Dentist'}
                      </Link>
                      <span className="block text-[10px] text-slate-400 font-medium">
                        {post.userRole}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">{formatDate(post.timestamp)}</span>
                </div>

                {/* Case Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500 rounded-lg">
                    {post.caseTitle || 'Clinical Study'}
                  </span>
                  {post.diagnosis && (
                    <span className="px-2.5 py-1 bg-primary/5 text-[10px] font-bold text-primary rounded-lg flex items-center gap-1">
                      <Tag size={10} />
                      <span>{post.diagnosis}</span>
                    </span>
                  )}
                </div>

                {/* Caption */}
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {post.caption}
                </p>

                {/* Attachments Images */}
                {post.imageUrls && post.imageUrls.length > 0 && (
                  <div className="rounded-xl overflow-hidden aspect-video border border-slate-50 bg-slate-50 max-h-[300px]">
                    <img src={post.imageUrls[0]} alt="Case attachment" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Actions indicators */}
                <div className="flex items-center justify-between border-t border-b border-slate-50 py-3.5 px-1.5">
                  <button 
                    onClick={() => handleLike(post.id, post.likesCount)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <Heart size={16} className={post.likesCount > 0 ? 'text-red-500 fill-red-500' : ''} />
                    <span>{post.likesCount || 0} Likes</span>
                  </button>

                  <button 
                    onClick={() => setActivePostComments(activePostComments === post.id ? null : post.id)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors"
                  >
                    <MessageSquare size={16} />
                    <span>{post.commentsCount || 0} Comments</span>
                  </button>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleSavePost(post.id)}
                      className="p-1 hover:text-slate-700 text-slate-400"
                      title="Save Post"
                    >
                      <Bookmark size={16} className={savedPostIds.has(post.id) ? 'text-slate-800 fill-slate-800' : ''} />
                    </button>
                    <button 
                      onClick={() => handleShare(post.id)}
                      className="p-1 hover:text-slate-700 text-slate-400"
                      title="Share link"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Comments section */}
                {activePostComments === post.id && (
                  <div className="space-y-4 animate-fade-in pt-1">
                    {/* Write comment */}
                    <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Write a peer observation..." 
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        className="flex-1 py-2 px-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs"
                      />
                      <button 
                        type="submit"
                        className="p-2 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-primary/10 shrink-0"
                      >
                        <Send size={14} />
                      </button>
                    </form>

                    {/* Comments list */}
                    <div className="space-y-3 pt-1">
                      {commentsList[post.id]?.map((c, cIdx) => (
                        <div key={cIdx} className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-700">Dr. {c.authorName}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{formatDate(c.timestamp)}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </article>
            ))}
          </div>
        )}

      </div>

      {/* 2. Directory Sidebar (Right) */}
      <aside className="space-y-6">
        
        {/* Connection Requests (Screen 46) */}
        {connectionRequests.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-0.5">Connection Requests</h3>
            
            <div className="space-y-3.5">
              {connectionRequests.map(req => (
                <div key={req.id} className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <img src={req.photoUrl} alt="avatar" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block font-bold text-xs text-slate-800 truncate">{req.fromName}</span>
                    <span className="block text-[9px] text-slate-400 truncate">{req.specialization}</span>
                    
                    <div className="flex gap-1.5 mt-2">
                      <button 
                        onClick={() => handleAcceptRequest(req.id)}
                        className="flex-1 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-hover shadow-sm"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => setConnectionRequests(prev => prev.filter(r => r.id !== req.id))}
                        className="px-2.5 py-1.5 border border-slate-200 text-slate-400 text-[10px] font-bold rounded-lg hover:bg-slate-100"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Peer Directory (Screen 44, 45) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-0.5">Clinician Directory</h3>
            <Link to="/search" className="text-[10px] font-extrabold text-primary hover:underline">Search All</Link>
          </div>

          <div className="space-y-4">
            {peers.slice(0, 4).map((peer) => (
              <div key={peer.id} className="flex justify-between items-center gap-3">
                <Link to={`/profile/${peer.id}`} className="flex items-center gap-2.5 min-w-0">
                  <img 
                    src={peer.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150'} 
                    alt="avatar" 
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-50"
                  />
                  <div className="min-w-0">
                    <span className="block font-bold text-xs text-slate-800 hover:text-primary transition-colors truncate">
                      Dr. {peer.name.split(' ')[0]}
                    </span>
                    <span className="block text-[9px] text-slate-400 font-semibold truncate">
                      {peer.specialization}
                    </span>
                  </div>
                </Link>

                <button 
                  onClick={() => handleConnect(peer)}
                  className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                    connectedIds.has(peer.id) 
                      ? 'bg-slate-50 border-slate-200 text-slate-400' 
                      : 'border-primary/20 text-primary hover:bg-primary/5'
                  }`}
                  title="Connect / Follow"
                >
                  {connectedIds.has(peer.id) ? <Check size={13} strokeWidth={2.5} /> : <UserPlus size={13} />}
                </button>
              </div>
            ))}
          </div>
        </div>

      </aside>

    </div>
  );
}
