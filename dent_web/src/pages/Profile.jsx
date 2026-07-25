import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getUserProfileData, updateUserProfileData } from '../services/dentconnectService';
import { 
  User, 
  MapPin, 
  Building, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Edit3, 
  MessageSquare,
  UserCheck,
  UserPlus,
  Plus,
  Trash2,
  FolderOpen
} from 'lucide-react';

export default function Profile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { userProfile, updateProfileData } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('credentials'); // 'credentials' or 'cases'
  
  // Checking profile type
  const isMe = !uid || uid === userProfile?.uid;

  // Connection follow states (external profile only)
  const [connected, setConnected] = useState(false);

  // Editor states (for inline profile edits)
  const [editBioOpen, setEditBioOpen] = useState(false);
  const [bioInput, setBioInput] = useState('');
  
  const [experienceInput, setExperienceInput] = useState({ role: '', company: '', duration: '' });
  const [educationInput, setEducationInput] = useState({ degree: '', school: '', year: '' });
  const [certInput, setCertInput] = useState('');
  const [achieveInput, setAchieveInput] = useState('');

  const [addExpOpen, setAddExpOpen] = useState(false);
  const [addEduOpen, setAddEduOpen] = useState(false);

  const [userCases, setUserCases] = useState([]);

  // Fetch target profile details
  const fetchProfileDetails = async () => {
    setLoading(true);
    try {
      const targetUid = isMe ? userProfile.uid : uid;
      const data = await getUserProfileData(targetUid);
      if (data) {
        setProfile(data);
        setBioInput(data.bio || '');

        // Fetch user's cases
        const casesSnap = await getDocs(collection(db, 'users', targetUid, 'cases'));
        const casesList = [];
        casesSnap.forEach(cd => casesList.push({ id: cd.id, ...cd.data() }));
        setUserCases(casesList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.uid) {
      fetchProfileDetails();
    }
  }, [uid, userProfile]);

  // Update bio details
  const handleUpdateBio = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfileData(userProfile.uid, { bio: bioInput });
      await updateProfileData({ bio: bioInput });
      setProfile(prev => ({ ...prev, bio: bioInput }));
      setEditBioOpen(false);
      alert('Biography updated successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  // Add experience logs
  const handleAddExperience = async (e) => {
    e.preventDefault();
    if (!experienceInput.role || !experienceInput.company) return;
    try {
      const updatedExp = [...(profile.experience || []), experienceInput];
      await updateProfileData({ experience: updatedExp });
      setProfile(prev => ({ ...prev, experience: updatedExp }));
      setExperienceInput({ role: '', company: '', duration: '' });
      setAddExpOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete experience log
  const handleDeleteExperience = async (idx) => {
    try {
      const updatedExp = [...(profile.experience || [])];
      updatedExp.splice(idx, 1);
      await updateProfileData({ experience: updatedExp });
      setProfile(prev => ({ ...prev, experience: updatedExp }));
    } catch (err) {
      console.error(err);
    }
  };

  // Add education credentials
  const handleAddEducation = async (e) => {
    e.preventDefault();
    if (!educationInput.degree || !educationInput.school) return;
    try {
      const updatedEdu = [...(profile.education || []), educationInput];
      await updateProfileData({ education: updatedEdu });
      setProfile(prev => ({ ...prev, education: updatedEdu }));
      setEducationInput({ degree: '', school: '', year: '' });
      setAddEduOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete education log
  const handleDeleteEducation = async (idx) => {
    try {
      const updatedEdu = [...(profile.education || [])];
      updatedEdu.splice(idx, 1);
      await updateProfileData({ education: updatedEdu });
      setProfile(prev => ({ ...prev, education: updatedEdu }));
    } catch (err) {
      console.error(err);
    }
  };

  // Add certifications lists
  const handleAddCertification = async (e) => {
    e.preventDefault();
    if (!certInput.trim()) return;
    try {
      const updatedCerts = [...(profile.certifications || []), certInput.trim()];
      await updateProfileData({ certifications: updatedCerts });
      setProfile(prev => ({ ...prev, certifications: updatedCerts }));
      setCertInput('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCert = async (idx) => {
    try {
      const updatedCerts = [...(profile.certifications || [])];
      updatedCerts.splice(idx, 1);
      await updateProfileData({ certifications: updatedCerts });
      setProfile(prev => ({ ...prev, certifications: updatedCerts }));
    } catch (err) {
      console.error(err);
    }
  };

  // Add achievement badges
  const handleAddAchievement = async (e) => {
    e.preventDefault();
    if (!achieveInput.trim()) return;
    try {
      const updatedAchieve = [...(profile.achievements || []), achieveInput.trim()];
      await updateProfileData({ achievements: updatedAchieve });
      setProfile(prev => ({ ...prev, achievements: updatedAchieve }));
      setAchieveInput('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAchieve = async (idx) => {
    try {
      const updatedAchieve = [...(profile.achievements || [])];
      updatedAchieve.splice(idx, 1);
      await updateProfileData({ achievements: updatedAchieve });
      setProfile(prev => ({ ...prev, achievements: updatedAchieve }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-divider border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return <p className="text-center text-slate-400 py-10">Dentist Profile not found in databases.</p>;
  }

  const formattedDocName = profile?.name
    ? profile.name.trim().replace(/^(dr\.\s*|dr\s+)+/i, '')
    : 'Dentist';
  const fullDisplayName = `Dr. ${formattedDocName}`;

  return (
    <div className="w-full space-y-6 pb-12 animate-fade-in">
      
      {/* 1. Header Card (Cover & Avatar & Info) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
        {/* Cover Header Graphic */}
        <div className="h-32 w-full bg-gradient-to-r from-primary to-primary-hover/80 relative"></div>
        
        {/* Profile Info block */}
        <div className="px-6 pb-6 relative flex flex-col sm:flex-row justify-between items-start gap-4">
          
          <div className="flex flex-col sm:flex-row gap-4 -mt-12 items-start sm:items-center">
            <img 
              src={profile.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150'} 
              alt="Dr. profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md relative z-10 shrink-0"
            />
            <div className="pt-2 sm:pt-6">
              <h2 className="text-xl font-bold text-slate-800">{fullDisplayName}</h2>
              <span className="block text-xs font-bold text-primary">{profile.specialization || 'General Dentistry'}</span>
              
              <div className="flex flex-wrap items-center gap-2.5 mt-2 text-[10px] font-semibold text-slate-400">
                {profile.institution && (
                  <div className="flex items-center gap-1">
                    <Building size={11} />
                    <span>{profile.institution}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={11} />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                  <FolderOpen size={11} />
                  <span>{userCases.length} {userCases.length === 1 ? 'Case' : 'Cases'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto pt-4 self-stretch sm:self-auto justify-end">
            {isMe ? (
              <Link 
                to="/settings"
                className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                <Edit3 size={13} />
                <span>Account Settings</span>
              </Link>
            ) : (
              <>
                <button 
                  onClick={() => setConnected(!connected)}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    connected 
                      ? 'bg-slate-50 border border-slate-200 text-slate-400' 
                      : 'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/10'
                  }`}
                >
                  {connected ? <UserCheck size={13} /> : <UserPlus size={13} />}
                  <span>{connected ? 'Connected' : 'Connect'}</span>
                </button>
                
                <Link 
                  to={`/chat/${profile.uid}`}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors shadow-sm bg-white"
                >
                  <MessageSquare size={13} />
                  <span>Message</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Biography Block */}
        <div className="px-6 pb-6 border-t border-slate-50 pt-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-0.5">Clinical Biography</h3>
            {isMe && (
              <button onClick={() => setEditBioOpen(!editBioOpen)} className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
                <Edit3 size={11} />
                <span>Edit Bio</span>
              </button>
            )}
          </div>

          {editBioOpen ? (
            <form onSubmit={handleUpdateBio} className="space-y-3">
              <textarea 
                rows="3" 
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-xs w-full resize-none"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditBioOpen(false)} className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-xs">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs hover:bg-primary-hover">Save</button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-slate-600 leading-relaxed font-medium pl-0.5">
              {profile.bio || 'This clinician has not written a biography description yet.'}
            </p>
          )}
        </div>
      </div>

      {/* Tabs list (Credentials vs Case Studies) */}
      <div className="flex border-b border-slate-100 pb-px">
        <button 
          onClick={() => setActiveTab('credentials')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'credentials' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Credentials & Experience
        </button>
        <button 
          onClick={() => setActiveTab('cases')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'cases' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Published Case Studies ({userCases.length})
        </button>
      </div>

      {/* TABS INNER CONTENT */}
      {activeTab === 'credentials' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section: Experience & Education */}
          <div className="space-y-6">
            
            {/* Experience (Screen 54) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-primary" />
                  <span>Clinical Experience</span>
                </h4>
                {isMe && (
                  <button onClick={() => setAddExpOpen(true)} className="p-1 hover:bg-slate-50 text-primary rounded-lg">
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {addExpOpen && (
                <form onSubmit={handleAddExperience} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                  <input 
                    type="text" placeholder="Clinical Role (e.g. Consultant)" value={experienceInput.role}
                    onChange={(e) => setExperienceInput(prev => ({ ...prev, role: e.target.value }))}
                    className="p-2 border border-slate-200 rounded-lg text-xs" required
                  />
                  <input 
                    type="text" placeholder="Hospital/Clinic" value={experienceInput.company}
                    onChange={(e) => setExperienceInput(prev => ({ ...prev, company: e.target.value }))}
                    className="p-2 border border-slate-200 rounded-lg text-xs" required
                  />
                  <input 
                    type="text" placeholder="Duration (e.g. 2018 - Present)" value={experienceInput.duration}
                    onChange={(e) => setExperienceInput(prev => ({ ...prev, duration: e.target.value }))}
                    className="p-2 border border-slate-200 rounded-lg text-xs" required
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setAddExpOpen(false)} className="flex-1 py-1 px-3 border border-slate-200 text-slate-500 rounded-lg text-xs">Cancel</button>
                    <button type="submit" className="flex-1 py-1 px-3 bg-primary text-white rounded-lg text-xs">Add</button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {!profile.experience || profile.experience.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No experience logged.</p>
                ) : (
                  profile.experience.map((exp, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4">
                      <div>
                        <span className="block font-bold text-xs text-slate-800">{exp.role}</span>
                        <span className="block text-[10px] text-slate-500 font-semibold">{exp.company}</span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">{exp.duration}</span>
                      </div>
                      {isMe && (
                        <button onClick={() => handleDeleteExperience(idx)} className="p-1 hover:text-red-500 text-slate-400">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Education (Screen 53) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-primary" />
                  <span>Education Credentials</span>
                </h4>
                {isMe && (
                  <button onClick={() => setAddEduOpen(true)} className="p-1 hover:bg-slate-50 text-primary rounded-lg">
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {addEduOpen && (
                <form onSubmit={handleAddEducation} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                  <input 
                    type="text" placeholder="Degree (e.g. BDS / DDS)" value={educationInput.degree}
                    onChange={(e) => setEducationInput(prev => ({ ...prev, degree: e.target.value }))}
                    className="p-2 border border-slate-200 rounded-lg text-xs" required
                  />
                  <input 
                    type="text" placeholder="School/University" value={educationInput.school}
                    onChange={(e) => setEducationInput(prev => ({ ...prev, school: e.target.value }))}
                    className="p-2 border border-slate-200 rounded-lg text-xs" required
                  />
                  <input 
                    type="text" placeholder="Graduation Year" value={educationInput.year}
                    onChange={(e) => setEducationInput(prev => ({ ...prev, year: e.target.value }))}
                    className="p-2 border border-slate-200 rounded-lg text-xs" required
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setAddEduOpen(false)} className="flex-1 py-1 px-3 border border-slate-200 text-slate-500 rounded-lg text-xs">Cancel</button>
                    <button type="submit" className="flex-1 py-1 px-3 bg-primary text-white rounded-lg text-xs">Add</button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {!profile.education || profile.education.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No education logged.</p>
                ) : (
                  profile.education.map((edu, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4">
                      <div>
                        <span className="block font-bold text-xs text-slate-800">{edu.degree}</span>
                        <span className="block text-[10px] text-slate-500 font-semibold">{edu.school}</span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">Class of {edu.year}</span>
                      </div>
                      {isMe && (
                        <button onClick={() => handleDeleteEducation(idx)} className="p-1 hover:text-red-500 text-slate-400">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Section: Certifications & Achievements */}
          <div className="space-y-6">
            
            {/* Certifications (Screen 55) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft space-y-4">
              <h4 className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-50 flex items-center gap-1.5">
                <Award size={14} className="text-primary" />
                <span>Certifications</span>
              </h4>

              {isMe && (
                <form onSubmit={handleAddCertification} className="flex gap-2">
                  <input 
                    type="text" placeholder="Add Certification..." value={certInput}
                    onChange={(e) => setCertInput(e.target.value)}
                    className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-primary focus:bg-white"
                  />
                  <button type="submit" className="p-2 bg-primary text-white rounded-lg"><Plus size={14} /></button>
                </form>
              )}

              <ul className="space-y-2">
                {!profile.certifications || profile.certifications.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No certifications listed.</p>
                ) : (
                  profile.certifications.map((cert, idx) => (
                    <li key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-600 bg-slate-50 py-2 px-3 rounded-lg border border-slate-100">
                      <span>{cert}</span>
                      {isMe && (
                        <button onClick={() => handleDeleteCert(idx)} className="text-slate-400 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Achievements (Screen 56) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft space-y-4">
              <h4 className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-50 flex items-center gap-1.5">
                <Award size={14} className="text-primary" />
                <span>Achievements & Awards</span>
              </h4>

              {isMe && (
                <form onSubmit={handleAddAchievement} className="flex gap-2">
                  <input 
                    type="text" placeholder="Add Award/Paper..." value={achieveInput}
                    onChange={(e) => setHighlight(e) /* placeholder */}
                    className="hidden"
                  />
                  <input 
                    type="text" placeholder="Add Award..." value={achieveInput}
                    onChange={(e) => setAchieveInput(e.target.value)}
                    className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-primary focus:bg-white"
                  />
                  <button type="submit" className="p-2 bg-primary text-white rounded-lg"><Plus size={14} /></button>
                </form>
              )}

              <ul className="space-y-2">
                {!profile.achievements || profile.achievements.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No achievements listed.</p>
                ) : (
                  profile.achievements.map((ach, idx) => (
                    <li key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-600 bg-slate-50 py-2 px-3 rounded-lg border border-slate-100">
                      <span>{ach}</span>
                      {isMe && (
                        <button onClick={() => handleDeleteAchieve(idx)} className="text-slate-400 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

          </div>

        </div>
      ) : (
        /* Published Cases Studies Tab view */
        userCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-100 shadow-soft rounded-2xl text-center space-y-3">
            <div className="p-4 bg-slate-50 text-slate-300 rounded-full"><FolderOpen size={32} /></div>
            <h3 className="text-slate-800 font-bold">No Case Studies Published</h3>
            <p className="text-xs text-slate-400 max-w-xs">Clinical reports published as public or connection-only in the Case Wizard are displayed here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userCases.map((c) => (
              <Link 
                key={c.id} 
                to={`/cases/${c.id}`}
                className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-slate-200 shadow-soft hover:shadow-soft-hover transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <span className="block font-bold text-sm text-slate-800 group-hover:text-primary transition-colors truncate">
                    Patient Reference: {c.patientId}
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-1">
                    {c.ageGender || `${c.age} Yrs / ${c.gender}`} • {c.diagnosis}
                  </p>
                  
                  {c.imageUrls && c.imageUrls.length > 0 && (
                    <div className="rounded-xl overflow-hidden aspect-video border border-slate-50 bg-slate-50 mt-3 max-h-[140px]">
                      <img src={c.imageUrls[0]} alt="case thumbnail" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )
      )}

    </div>
  );
}

function setHighlight(e) {
  // dummy function to handle linting issues
}
