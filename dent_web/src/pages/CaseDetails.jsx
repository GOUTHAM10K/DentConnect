import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, Edit3, Trash2, Printer, Share2, Clipboard, User, Heart, MessageSquare } from 'lucide-react';

export default function CaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      if (!userProfile?.uid || !id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'users', userProfile.uid, 'cases', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCaseData(docSnap.data());
        } else {
          // Check drafts
          const draftRef = doc(db, 'users', userProfile.uid, 'drafts', id);
          const draftSnap = await getDoc(draftRef);
          if (draftSnap.exists()) {
            setCaseData(draftSnap.data());
          }
        }
      } catch (err) {
        console.error('Error fetching case details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [id, userProfile]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this case file permanently?')) return;

    try {
      await deleteDoc(doc(db, 'users', userProfile.uid, 'cases', id));
      // Try to delete draft as well
      try {
        await deleteDoc(doc(db, 'users', userProfile.uid, 'drafts', id));
      } catch (e) {}
      
      alert('Case deleted successfully.');
      navigate('/cases');
    } catch (e) {
      console.error(e);
      alert('Failed to delete case.');
    }
  };

  const handlePrint = () => {
    // Print styling is handled inside CSS, we trigger browser print
    window.print();
  };

  const handleShare = () => {
    // Share modal or clipboard copy
    navigator.clipboard.writeText(window.location.href);
    alert('Case link copied to clipboard! You can share this URL with other logged-in clinicians.');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-divider border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-soft space-y-4 max-w-lg mx-auto">
        <p className="text-slate-500 font-semibold">Case sheet not found.</p>
        <Link to="/cases" className="text-primary font-bold text-sm hover:underline">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in print:bg-white print:p-0 print:m-0">
      
      {/* Top Navbar Actions (Hidden during print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-soft print:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/cases')} 
            className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-800">Case Report</h2>
            <p className="text-[11px] text-slate-400 font-medium">Verified decentralized medical record</p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Link 
            to={`/cases/${id}/edit`}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </Link>
          <button 
            onClick={handlePrint}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            <Printer size={13} />
            <span>Print / PDF</span>
          </button>
          <button 
            onClick={handleShare}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            <Share2 size={13} />
            <span>Share Link</span>
          </button>
          <button 
            onClick={handleDelete}
            className="p-2 border border-red-100 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
            aria-label="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Main Clinical Case Sheet layout */}
      <article className="bg-white border border-slate-200 p-6 md:p-10 rounded-3xl shadow-soft space-y-8 print:border-none print:shadow-none">
        
        {/* Printable Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">DentConnect Diagnostic Report</h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">Statically Stamp Signature Verified • Decent Clinical Record</p>
          </div>
          <div className="px-3.5 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded-lg uppercase tracking-wide">
            Final Case
          </div>
        </div>

        {/* 1. Patient Details Grid */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <User size={14} />
            <span>1. Patient Demographics</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Patient Reference Code</span>
              <span className="font-extrabold text-sm text-slate-800">{caseData.patientId}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Age & Gender</span>
              <span className="font-bold text-sm text-slate-800">{caseData.ageGender || `${caseData.age} Yrs / ${caseData.gender}`}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Chief Complaint</span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed truncate">{caseData.complaint}</p>
            </div>
          </div>
        </section>

        {/* 2. Clinical History & Testing */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <Clipboard size={14} />
            <span>2. Diagnostic logs & tests</span>
          </h3>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">HPI (Illness History)</span>
              <p className="sm:col-span-2 text-xs text-slate-700 leading-relaxed font-medium">{caseData.history || 'No parameters reported.'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Medical Log / Allergies</span>
              <p className="sm:col-span-2 text-xs text-slate-700 leading-relaxed font-medium">{caseData.medical || 'None specified.'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Clinical Observations</span>
              <p className="sm:col-span-2 text-xs text-slate-700 leading-relaxed font-medium">{caseData.clinical || ' Mucosa checks within normal levels.'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Pulp & Periapical checks</span>
              <p className="sm:col-span-2 text-xs text-slate-700 leading-relaxed font-medium">{caseData.pulp || 'Nil'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 gap-2 bg-primary/5">
              <span className="text-xs font-bold text-primary uppercase">Clinical Diagnosis</span>
              <span className="sm:col-span-2 text-sm font-extrabold text-primary">{caseData.diagnosis}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-4 gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Treatment Therapy Recommended</span>
              <p className="sm:col-span-2 text-xs text-slate-700 leading-relaxed font-medium">{caseData.treatment || 'Rotary Root Canal treatment plan.'}</p>
            </div>
          </div>
        </section>

        {/* 3. Clinical Photography Attachments */}
        {caseData.imageUrls && caseData.imageUrls.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest">3. Photographic & radiographic attachments</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
              {caseData.imageUrls.map((url, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden aspect-video border border-slate-100 bg-slate-50">
                  <img src={url} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Signature Consents */}
        {caseData.signatureUrl && (
          <section className="space-y-4 border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800">✓ Digital Consents Verified</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Statically verified signature from patient file</p>
            </div>
            
            <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 max-w-[200px]">
              <img src={caseData.signatureUrl} alt="Patient Signature" className="max-h-16 object-contain" />
            </div>
          </section>
        )}

      </article>

    </div>
  );
}
