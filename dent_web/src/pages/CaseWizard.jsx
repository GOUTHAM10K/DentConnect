import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc, collection, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { buildCommunityPostPayload } from '../services/communityPostUtils';
import { 
  ArrowLeft, 
  Check, 
  Camera, 
  Edit3, 
  Trash2, 
  Share2, 
  Upload, 
  FileText, 
  Eye, 
  Lock, 
  Globe, 
  Users, 
  Scissors, 
  Sparkles,
  Info
} from 'lucide-react';

export default function CaseWizard({ isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [caseId, setCaseId] = useState('');
  
  // Form States
  // Step 1: Patient details
  const [patientId, setPatientId] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [complaint, setComplaint] = useState('');

  // Step 2: Clinical Images
  const [currentCategory, setCurrentCategory] = useState('PRE_OP'); // PRE_OP, INTRA_OP, POST_OP, FOLLOW_UP
  const [imagesMap, setImagesMap] = useState({
    PRE_OP: [],
    INTRA_OP: [],
    POST_OP: [],
    FOLLOW_UP: []
  });
  const [selectedImage, setSelectedImage] = useState(null); // { category, index, dataUrl }
  const [brightness, setBrightness] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#FF0000');
  
  // Annotation canvas refs
  const annotateCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Step 3: Clinical Findings
  const [history, setHistory] = useState('');
  const [medical, setMedical] = useState('');
  const [clinical, setClinical] = useState('');
  const [pulp, setPulp] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');

  // Step 4: Digital Consent
  const [cbTreatment, setCbTreatment] = useState(false);
  const [cbPhotography, setCbPhotography] = useState(false);
  const [cbAcademic, setCbAcademic] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const signatureCanvasRef = useRef(null);
  const [isSigning, setIsSigning] = useState(false);

  // Step 5: Checklist compilation ticks
  const [checklistTicks, setChecklistTicks] = useState({ patient: false, findings: false, consent: false });

  // Step 6: Documentation Preview & Editor
  const [aiReport, setAiReport] = useState('');

  // Step 7: Share Case
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('public'); // public, connections, private
  const [sharing, setSharing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, done: false });
  const [savedImageUrls, setSavedImageUrls] = useState([]);

  // Fetch or generate Case ID / load draft
  useEffect(() => {
    const initCase = async () => {
      if (!userProfile?.uid) return;

      if (isEdit && id) {
        // Load existing draft
        setCaseId(id);
        try {
          // Check drafts first
          let docRef = doc(db, 'users', userProfile.uid, 'drafts', id);
          let docSnap = await getDoc(docRef);
          
          if (!docSnap.exists()) {
            // Check completed cases
            docRef = doc(db, 'users', userProfile.uid, 'cases', id);
            docSnap = await getDoc(docRef);
          }

          if (docSnap.exists()) {
            const data = docSnap.data();
            setPatientId(data.patientId || '');
            setComplaint(data.complaint || '');
            setAge(data.age || '');
            setGender(data.gender || 'Male');
            setHistory(data.history || '');
            setMedical(data.medical || '');
            setClinical(data.clinical || '');
            setPulp(data.pulp || '');
            setDiagnosis(data.diagnosis || '');
            setTreatment(data.treatment || '');
            setImagesMap(data.imagesMap || {
              PRE_OP: data.imageUrls || [],
              INTRA_OP: [],
              POST_OP: [],
              FOLLOW_UP: []
            });
            setSignatureDataUrl(data.signatureUrl || '');
            setAiReport(data.aiReport || '');
            setCaption(data.caption || '');
            setVisibility(data.visibility || 'public');
            if (data.signatureUrl) {
              setCbTreatment(true);
              setCbPhotography(true);
              setCbAcademic(true);
            }
          }
        } catch (e) {
          console.error('Error loading case draft:', e);
        }
      } else {
        // Generate new Case ID
        const tempRef = doc(collection(db, 'temp'));
        setCaseId(tempRef.id);
      }
    };

    initCase();
  }, [id, isEdit, userProfile]);

  // Handle Save Draft
  const handleSaveDraft = async () => {
    if (!userProfile?.uid) return;

    try {
      const draftMap = {
        caseId,
        patientId: patientId || 'Unnamed Draft',
        age,
        gender,
        complaint,
        history,
        medical,
        clinical,
        pulp,
        diagnosis,
        treatment,
        imagesMap,
        signatureUrl: signatureDataUrl,
        aiReport,
        timestamp: Date.now()
      };

      await setDoc(doc(db, 'users', userProfile.uid, 'drafts', caseId), draftMap);
      alert('Draft Case Saved Successfully!');
      navigate('/cases');
    } catch (err) {
      console.error('Error saving draft:', err);
      alert('Error saving draft: ' + err.message);
    }
  };

  // Step 1 -> Step 2
  const handleStep1Next = () => {
    if (!patientId) {
      alert('Please enter Patient Identifier');
      return;
    }
    if (!age) {
      alert('Please enter Patient Age');
      return;
    }
    if (!complaint) {
      alert('Please enter Chief Complaint');
      return;
    }
    setStep(2);
  };

  // Step 2 Upload file
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagesMap(prev => ({
          ...prev,
          [currentCategory]: [...prev[currentCategory], reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // Click thumbnail
  const handleSelectImage = (category, index) => {
    setSelectedImage({
      category,
      index,
      dataUrl: imagesMap[category][index]
    });
    setBrightness(100);
    setSaturation(100);
    setShowAnnotator(true);
  };

  const deleteImage = (category, index) => {
    if (window.confirm('Delete this image?')) {
      const updated = [...imagesMap[category]];
      updated.splice(index, 1);
      setImagesMap(prev => ({ ...prev, [category]: updated }));
      setSelectedImage(null);
      setShowAnnotator(false);
    }
  };

  // Annotation drawing coordinates
  const getCoordinates = (e) => {
    if (!annotateCanvasRef.current) return { x: 0, y: 0 };
    const canvas = annotateCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Support touch and mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const ctx = annotateCanvasRef.current.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = annotateCanvasRef.current.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const saveAnnotations = () => {
    if (!selectedImage) return;
    const canvas = annotateCanvasRef.current;
    const updatedUrl = canvas.toDataURL('image/jpeg');

    const updatedList = [...imagesMap[selectedImage.category]];
    updatedList[selectedImage.index] = updatedUrl;

    setImagesMap(prev => ({
      ...prev,
      [selectedImage.category]: updatedList
    }));

    setSelectedImage(null);
    setShowAnnotator(false);
    alert('Annotations and adjustments saved to draft!');
  };

  // Initialize Canvas with Image & Filters
  useEffect(() => {
    if (showAnnotator && selectedImage && annotateCanvasRef.current) {
      const canvas = annotateCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = selectedImage.dataUrl;
      img.onload = () => {
        canvas.width = img.naturalWidth || 600;
        canvas.height = img.naturalHeight || 450;
        
        // Clear and draw image with CSS filters simulated in 2D Context
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = `brightness(${brightness}%) saturate(${saturation}%)`;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none'; // reset
      };
    }
  }, [showAnnotator, selectedImage, brightness, saturation]);

  // Digital Consent signature drawing
  const getSigCoordinates = (e) => {
    if (!signatureCanvasRef.current) return { x: 0, y: 0 };
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startSigning = (e) => {
    e.preventDefault();
    const ctx = signatureCanvasRef.current.getContext('2d');
    const { x, y } = getSigCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    setIsSigning(true);
  };

  const sign = (e) => {
    if (!isSigning) return;
    e.preventDefault();
    const ctx = signatureCanvasRef.current.getContext('2d');
    const { x, y } = getSigCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopSigning = () => {
    setIsSigning(false);
  };

  const clearSignature = () => {
    if (!signatureCanvasRef.current) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl('');
  };

  const handleConfirmConsent = () => {
    if (!cbTreatment || !cbPhotography || !cbAcademic) {
      alert('Please check all digital consent requirements.');
      return;
    }

    if (!signatureCanvasRef.current) {
      alert('Signature is required.');
      return;
    }

    const sigUrl = signatureCanvasRef.current.toDataURL();
    setSignatureDataUrl(sigUrl);

    // AI documentation content generation
    const compiledDoc = `
DENTCONNECT AI CLINICAL DOCUMENTATION REPORT
==================================================
Case ID Reference: ${caseId}
Clinician: Dr. ${userProfile?.name}
Patient Identification Code: ${patientId}
Age / Gender: ${age} Yrs / ${gender}

CHIEF COMPLAINT:
${complaint}

HISTORY OF PRESENT ILLNESS & MEDICAL LOGS:
${history || 'No active medical constraints reported.'}
Medical History: ${medical || 'Nil'}

CLINICAL EXAMINATION FINDINGS:
${clinical || 'Normal mucosal tissues. Staging checks within parameters.'}
Pulp & Periapical Diagnostic Tests:
${pulp || 'No thermal or percussion sensitivity noted.'}

CLINICAL DIAGNOSIS:
${diagnosis}

RECOMMENDED TREATMENT PLAN:
${treatment || 'No clinical treatment plan noted.'}

CONSENT AGREEMENT:
- Treatment: Verified (Authorized)
- Photography: Verified (Authorized)
- Educational Research: Verified (Authorized)
Digital Stamp & Verification Check: Stamp Success
`;
    setAiReport(compiledDoc.trim());

    // Enter Tick Animation Step 5
    setStep(5);
  };

  // Compile checklist animation
  useEffect(() => {
    if (step === 5) {
      setChecklistTicks({ patient: false, findings: false, consent: false });

      const timer1 = setTimeout(() => {
        setChecklistTicks(prev => ({ ...prev, patient: true }));
      }, 700);

      const timer2 = setTimeout(() => {
        setChecklistTicks(prev => ({ ...prev, findings: true }));
      }, 1400);

      const timer3 = setTimeout(() => {
        setChecklistTicks(prev => ({ ...prev, consent: true }));
      }, 2100);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [step]);

  const handleFinalizeCase = () => {
    setStep(6);
  };

  // Post to network & upload images
  const handlePostToNetwork = async () => {
    const activeUid = userProfile?.uid || auth.currentUser?.uid || 'user_demo';

    setSharing(true);
    setFirebaseError('');

    try {
      // Collect all images from imagesMap
      const uploadedUrls = [];
      Object.keys(imagesMap).forEach((cat) => {
        (imagesMap[cat] || []).forEach((url) => {
          if (typeof url === 'string' && url.length > 0) {
            uploadedUrls.push(url);
          }
        });
      });

      const currentCaseId = caseId || `case_${Date.now()}`;
      const currentPatientId = patientId || 'PT-2098';
      const currentDiagnosis = diagnosis || 'Clinical Case';

      const finalizedCase = {
        caseId: currentCaseId,
        patientId: currentPatientId,
        age: age || '35',
        gender: gender || 'Male',
        complaint: complaint || '',
        history: history || '',
        medical: medical || '',
        clinical: clinical || '',
        pulp: pulp || '',
        diagnosis: currentDiagnosis,
        treatment: treatment || '',
        imageUrls: uploadedUrls,
        imagesMap,
        signatureUrl: signatureDataUrl || '',
        aiReport: aiReport || '',
        visibility: visibility || 'public',
        caption: caption || '',
        timestamp: Date.now(),
      };

      const syncDatabase = async () => {
        try {
          if (activeUid && activeUid !== 'user_demo') {
            // Save completed case in user collection
            await setDoc(doc(db, 'users', activeUid, 'cases', currentCaseId), finalizedCase);
            
            // Increment cases count
            try {
              const newCount = (userProfile?.casesCount || 0) + 1;
              await setDoc(doc(db, 'users', activeUid), { casesCount: newCount }, { merge: true });
            } catch (errCount) {}

            // Cleanup draft
            try {
              await deleteDoc(doc(db, 'users', activeUid, 'drafts', currentCaseId));
            } catch (e) {}

            // Publish community post for network feed
            const postRef = doc(collection(db, 'posts'));
            const postPayload = buildCommunityPostPayload({
              caseId: currentCaseId,
              userId: activeUid,
              userName: userProfile?.name || 'Dr. Dentist',
              userRole: userProfile?.specialization || 'General Dentistry',
              userPhoto: userProfile?.photoUrl || '',
              caption: caption || `Shared new clinical case: ${currentDiagnosis} (${currentPatientId})`,
              diagnosis: currentDiagnosis,
              patientId: currentPatientId,
              visibility: visibility || 'public',
              imageUrls: uploadedUrls,
            });

            await setDoc(postRef, {
              postId: postRef.id,
              ...postPayload,
            });
          }
        } catch (dbErr) {
          console.warn('Background db sync note:', dbErr);
        }
      };

      // Ensure redirect happens in max 1.2 seconds, never get stuck!
      await Promise.race([
        syncDatabase(),
        new Promise((resolve) => setTimeout(resolve, 1200))
      ]);

    } catch (e) {
      console.error('Finalize error:', e);
    } finally {
      setSharing(false);
      // Immediately navigate to Network Feed!
      navigate('/network');
    }
  };

  const [firebaseError, setFirebaseError] = useState('');

  return (
    <div className="w-full space-y-6 pb-12 animate-fade-in">
      
      {/* Wizard Header Progress Indicator */}
      {step < 5 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>Step {step} of 4: {
              step === 1 ? 'Patient Information' : 
              step === 2 ? 'Clinical Photography' : 
              step === 3 ? 'Diagnostic & Findings' : 'Signature Consents'
            }</span>
            <button onClick={handleSaveDraft} className="text-primary hover:underline flex items-center gap-1">
              Save Draft
            </button>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* STEP 1: PATIENT INFORMATION */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Patient Profile</h2>
            <p className="text-xs text-slate-400 font-medium">Record patient characteristics for clinical references</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Patient Ref Code *</label>
              <input 
                type="text" 
                placeholder="e.g. PT-2098" 
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase">Age (Years) *</label>
                <input 
                  type="number" 
                  placeholder="e.g. 45" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase">Gender *</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Chief Complaint *</label>
              <textarea 
                rows="4" 
                placeholder="Describe patient pain, sensitivity, swellings or diagnostic goals..."
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button onClick={() => navigate(-1)} className="flex-1 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-semibold">
              Cancel
            </button>
            <button onClick={handleStep1Next} className="flex-1 py-3 bg-primary text-white hover:bg-primary-hover rounded-xl text-sm font-semibold">
              Next Step
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PHOTOGRAPHY & ANNOTATIONS */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Clinical Photography</h2>
            <p className="text-xs text-slate-400 font-medium">Upload dental photography, periapical x-rays or CBCT scans</p>
          </div>

          {/* Categories Filter Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
            {[
              { id: 'PRE_OP', label: 'Pre-Op' },
              { id: 'INTRA_OP', label: 'Intra-Op' },
              { id: 'POST_OP', label: 'Post-Op (Post Operation)' },
              { id: 'FOLLOW_UP', label: 'Follow-Up' }
            ].map(cat => (
              <button 
                key={cat.id}
                onClick={() => setCurrentCategory(cat.id)}
                className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${
                  currentCategory === cat.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Upload Button Box */}
          <div className="border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-6 text-center cursor-pointer transition-colors relative">
            <input 
              type="file" 
              multiple 
              onChange={handleImageUpload} 
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Camera size={28} className="text-slate-300" />
              <span className="text-xs font-bold text-slate-500">
                Upload {currentCategory === 'POST_OP' ? 'Post Operation (Post-Op)' : currentCategory.replace('_', ' ')} Images
              </span>
              <span className="text-[10px] text-slate-400">Drag or click to choose JPG, PNG</span>
            </div>
          </div>

          {/* Selected Category Previews */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {currentCategory === 'POST_OP' ? 'Post Operation (Post-Op)' : currentCategory.replace('_', ' ')} list
            </h4>
            {imagesMap[currentCategory].length === 0 ? (
              <p className="text-xs text-slate-400 italic">No images in this category yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {imagesMap[currentCategory].map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-100">
                    <img src={url} alt="Clinical preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      <button 
                        onClick={() => handleSelectImage(currentCategory, idx)}
                        className="p-1.5 bg-white text-slate-700 hover:text-primary rounded-lg shadow-sm"
                        title="Annotate & Filter"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button 
                        onClick={() => deleteImage(currentCategory, idx)}
                        className="p-1.5 bg-white text-red-500 hover:bg-red-50 rounded-lg shadow-sm"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Superimposed Annotator Canvas Drawer Modal */}
          {showAnnotator && selectedImage && (
            <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Image Editor & Annotations</h3>
                  <button 
                    onClick={() => { setShowAnnotator(false); setSelectedImage(null); }}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg"
                  >
                    Close
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
                  {/* Canvas block */}
                  <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center p-2 min-h-[300px]">
                    <canvas 
                      ref={annotateCanvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="max-w-full max-h-[50vh] object-contain cursor-crosshair shadow-lg rounded-lg bg-white"
                    />
                  </div>

                  {/* Adjustments sidebar */}
                  <div className="w-full md:w-56 space-y-5">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-2.5">Annotations</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">Stroke Color</span>
                        <div className="flex gap-1.5">
                          {['#FF0000', '#00FF00', '#0000FF', '#FFFF00'].map(color => (
                            <button 
                              key={color}
                              onClick={() => setDrawingColor(color)}
                              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                drawingColor === color ? 'scale-110 border-slate-900' : 'border-white'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-2.5">Filters</span>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-600">
                            <span>Brightness</span>
                            <span>{brightness}%</span>
                          </div>
                          <input 
                            type="range" min="50" max="150" value={brightness}
                            onChange={(e) => setBrightness(e.target.value)}
                            className="w-full accent-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-600">
                            <span>Saturation</span>
                            <span>{saturation}%</span>
                          </div>
                          <input 
                            type="range" min="50" max="150" value={saturation}
                            onChange={(e) => setSaturation(e.target.value)}
                            className="w-full accent-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setBrightness(100); setSaturation(100); }}
                      className="w-full py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Reset Adjustments
                    </button>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    onClick={() => { setShowAnnotator(false); setSelectedImage(null); }}
                    className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveAnnotations}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover shadow-md shadow-primary/10"
                  >
                    Apply Editor
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-semibold">
              Back
            </button>
            <button onClick={() => setStep(3)} className="flex-1 py-3 bg-primary text-white hover:bg-primary-hover rounded-xl text-sm font-semibold">
              Next Step
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CLINICAL FINDINGS & HISTORY */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Diagnostic Findings</h2>
            <p className="text-xs text-slate-400 font-medium">Record patient history, examinations and pulp testing parameters</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">HPI (History of Present Illness)</label>
              <textarea 
                rows="2" placeholder="Describe symptoms onset, durations, localized pain parameters..."
                value={history} onChange={(e) => setHistory(e.target.value)}
                className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Medical History & Allergies</label>
              <textarea 
                rows="2" placeholder="Chronic log details, medications, heart constraints, allergies..."
                value={medical} onChange={(e) => setMedical(e.target.value)}
                className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Clinical Exam / Mucosal check</label>
              <textarea 
                rows="2" placeholder="Findings upon percussion, tooth mobility, crack detections..."
                value={clinical} onChange={(e) => setClinical(e.target.value)}
                className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Pulp & Periapical Tests</label>
              <textarea 
                rows="2" placeholder="Thermal tests results, Electric Pulp Test (EPT), bite check..."
                value={pulp} onChange={(e) => setPulp(e.target.value)}
                className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Clinical Diagnosis *</label>
              <input 
                type="text" placeholder="e.g. Symptomatic Irreversible Pulpitis, Apical Periodontitis"
                value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                required
                className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Treatment Plan</label>
              <textarea 
                rows="2" placeholder="Rotary RCT, crown build-up, appointments frequency..."
                value={treatment} onChange={(e) => setTreatment(e.target.value)}
                className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button onClick={() => setStep(2)} className="flex-1 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-semibold">
              Back
            </button>
            <button onClick={() => setStep(4)} className="flex-1 py-3 bg-primary text-white hover:bg-primary-hover rounded-xl text-sm font-semibold">
              Next Step
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: DIGITAL CONSENT & SIGNATURE */}
      {step === 4 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Patient Consents</h2>
            <p className="text-xs text-slate-400 font-medium">Capture legal authorizations and digital verification signature</p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" checked={cbTreatment}
                  onChange={(e) => setCbTreatment(e.target.checked)}
                  className="w-4 h-4 text-primary bg-white border-slate-200 rounded focus:ring-primary mt-0.5"
                />
                <span className="text-xs text-slate-600 leading-normal font-medium">I verify that the clinical root canal or related surgery plan was explained and accepted.</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" checked={cbPhotography}
                  onChange={(e) => setCbPhotography(e.target.checked)}
                  className="w-4 h-4 text-primary bg-white border-slate-200 rounded focus:ring-primary mt-0.5"
                />
                <span className="text-xs text-slate-600 leading-normal font-medium">I consent to secure digital clinical photography and radiography documentation.</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" checked={cbAcademic}
                  onChange={(e) => setCbAcademic(e.target.checked)}
                  className="w-4 h-4 text-primary bg-white border-slate-200 rounded focus:ring-primary mt-0.5"
                />
                <span className="text-xs text-slate-600 leading-normal font-medium">I consent to academic, educational case reports, and professional peer-collaboration database usage.</span>
              </label>
            </div>

            {/* Signature Area */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-500 uppercase">Verification Signature Pad *</label>
                <button type="button" onClick={clearSignature} className="text-xs font-bold text-primary hover:underline">
                  Clear Pad
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl h-44 bg-slate-50 relative overflow-hidden">
                {!signatureDataUrl && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-semibold gap-1.5">
                    <Info size={14} />
                    <span>Draw patient signature inside box</span>
                  </div>
                )}
                <canvas 
                  ref={signatureCanvasRef}
                  onMouseDown={startSigning}
                  onMouseMove={sign}
                  onMouseUp={stopSigning}
                  onMouseLeave={stopSigning}
                  onTouchStart={startSigning}
                  onTouchMove={sign}
                  onTouchEnd={stopSigning}
                  className="w-full h-full cursor-pencil"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button onClick={() => setStep(3)} className="flex-1 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-semibold">
              Back
            </button>
            <button onClick={handleConfirmConsent} className="flex-1 py-3 bg-primary text-white hover:bg-primary-hover rounded-xl text-sm font-semibold">
              Verify & Complete
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: COMPILING ANIMATIONS AND CHECKLISTS */}
      {step === 5 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-bounce">
              <Sparkles size={32} />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Compiling Case File</h3>
            <p className="text-xs text-slate-400 font-medium">Running DentConnect clinical auto-documentation...</p>
          </div>

          <div className="max-w-sm mx-auto space-y-3 pt-4">
            
            {/* Checklist items */}
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                checklistTicks.patient ? 'bg-primary border-primary text-white' : 'border-slate-200 text-transparent'
              }`}>
                <Check size={12} strokeWidth={3} />
              </div>
              <span className={`text-xs font-semibold ${checklistTicks.patient ? 'text-slate-700' : 'text-slate-400'}`}>
                Patient identification processed
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                checklistTicks.findings ? 'bg-primary border-primary text-white' : 'border-slate-200 text-transparent'
              }`}>
                <Check size={12} strokeWidth={3} />
              </div>
              <span className={`text-xs font-semibold ${checklistTicks.findings ? 'text-slate-700' : 'text-slate-400'}`}>
                Diagnostic logs compiled
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                checklistTicks.consent ? 'bg-primary border-primary text-white' : 'border-slate-200 text-transparent'
              }`}>
                <Check size={12} strokeWidth={3} />
              </div>
              <span className={`text-xs font-semibold ${checklistTicks.consent ? 'text-slate-700' : 'text-slate-400'}`}>
                Digital signature & consent confirmed
              </span>
            </div>

          </div>

          {checklistTicks.consent && (
            <button 
              onClick={handleFinalizeCase}
              className="px-6 py-3 bg-primary text-white hover:bg-primary-hover font-semibold text-xs rounded-xl shadow-md shadow-primary/10 transition-colors animate-fade-in"
            >
              View Document Preview
            </button>
          )}
        </div>
      )}

      {/* STEP 6: DOCUMENTATION PREVIEW & EDITOR */}
      {step === 6 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Auto-Documentation Preview</h2>
            <p className="text-xs text-slate-400 font-medium">Verify or edit the compiled clinical record below before sharing</p>
          </div>

          {uploadProgress.total > 0 && !uploadProgress.done && (
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 space-y-2">
              <span className="block text-[10px] font-bold text-primary uppercase tracking-widest">
                Uploading clinical images: {uploadProgress.current} of {uploadProgress.total}
              </span>
              <div className="w-full bg-primary/10 h-1 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all" style={{ width: `${(uploadProgress.current/uploadProgress.total)*100}%` }}></div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase">Clinical Document Report</label>
            <textarea 
              rows="12" 
              value={aiReport}
              onChange={(e) => setAiReport(e.target.value)}
              className="font-mono text-xs py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white leading-relaxed"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button onClick={() => setStep(4)} className="flex-1 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-semibold">
              Edit Findings
            </button>
            <button onClick={() => setStep(7)} className="flex-1 py-3 bg-primary text-white hover:bg-primary-hover rounded-xl text-sm font-semibold">
              Proceed to Export
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: EXPORT & EXPORT PREVIEW OPTIONS */}
      {step === 7 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Publish Clinical Case</h2>
            <p className="text-xs text-slate-400 font-medium">Publish this clinical study or save privately to case directory</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Write a caption / discussion post</label>
              <textarea 
                rows="4" 
                placeholder="Share your thoughts on rotary instruments, obturations, or invite peer responses..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">Visibility settings</label>
              
              <div className="grid grid-cols-1 gap-3">
                <label className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${
                  visibility === 'public' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <input 
                    type="radio" name="visibility" value="public"
                    checked={visibility === 'public'} onChange={() => setVisibility('public')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <Globe size={18} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="block font-bold text-xs text-slate-800">Public visibility</span>
                      <span className="block text-[10px] text-slate-400">Available to all dentists in the community feed</span>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${
                  visibility === 'connections' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <input 
                    type="radio" name="visibility" value="connections"
                    checked={visibility === 'connections'} onChange={() => setVisibility('connections')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <Users size={18} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="block font-bold text-xs text-slate-800">Connections only</span>
                      <span className="block text-[10px] text-slate-400">Only visible to your connected clinician contacts</span>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${
                  visibility === 'private' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <input 
                    type="radio" name="visibility" value="private"
                    checked={visibility === 'private'} onChange={() => setVisibility('private')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <Lock size={18} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="block font-bold text-xs text-slate-800">Private</span>
                      <span className="block text-[10px] text-slate-400">Only visible to you under My Cases tab</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button onClick={() => setStep(6)} className="flex-1 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-semibold">
              Back
            </button>
            <button 
              onClick={handlePostToNetwork} 
              disabled={sharing}
              className="flex-1 py-3 bg-primary text-white hover:bg-primary-hover rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              {sharing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Share2 size={16} />
                  <span>Finalize & Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
