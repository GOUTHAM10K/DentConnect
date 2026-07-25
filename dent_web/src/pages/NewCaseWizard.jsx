import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../firebase';
import { collection, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { 
  ArrowLeft, Check, Camera, Edit3, Trash2, Share2,
  RotateCcw, Upload, CloudOff
} from 'lucide-react';

export default function NewCaseWizard({ draftData, onBack, onComplete }) {
  const [step, setStep] = useState(1);
  const [caseId, setCaseId] = useState('');
  
  // Step 1: Patient details
  const [patientId, setPatientId] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [complaint, setComplaint] = useState('');

  // Step 2: Case Images
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
  const [showFilters, setShowFilters] = useState(false);
  const [showAnnotator, setShowAnnotator] = useState(false);
  
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

  // Step 5: Checklist animation ticks
  const [checklistTicks, setChecklistTicks] = useState({ patient: false, findings: false, consent: false });

  // Step 7: Share Case
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('public'); // public, connections, private
  const [sharing, setSharing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, done: false });
  const [savedImageUrls, setSavedImageUrls] = useState([]); // Firebase Storage URLs saved after finalize

  // Fetch or generate Case ID / load draft
  useEffect(() => {
    const initCase = async () => {
      const user = auth.currentUser;
      if (!user) return;

      if (draftData) {
        // We are loading a draft/case
        const id = draftData.id || draftData.caseId;
        setCaseId(id);
        setPatientId(draftData.patientId || '');
        setComplaint(draftData.complaint || '');

        if (draftData.ageGender) {
          const parts = draftData.ageGender.split(' / ');
          setAge(parts[0]?.replace(' Yrs', '') || '');
          setGender(parts[1] || 'Male');
        } else {
          setAge(draftData.age || '');
          setGender(draftData.gender || 'Male');
        }

        // Check if there's full details (from existing case rather than simple draft)
        setHistory(draftData.history || '');
        setMedical(draftData.medical || '');
        setClinical(draftData.clinical || '');
        setPulp(draftData.pulp || '');
        setDiagnosis(draftData.diagnosis || '');
        setTreatment(draftData.treatment || '');
        setImagesMap(draftData.imagesMap || {
          PRE_OP: draftData.imageUrls || [],
          INTRA_OP: [],
          POST_OP: [],
          FOLLOW_UP: []
        });

        if (draftData.isFinal) {
          // Finalized sheet view directly
          setStep(6);
        }
      } else {
        // Generate new Case ID
        const newId = doc(collection(db, 'temp')).id;
        setCaseId(newId);
      }
    };

    initCase();
  }, [draftData]);

  // Handle Save Draft
  const handleSaveDraft = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const draftMap = {
        patientId: patientId || 'Unnamed Draft',
        ageGender: `${age} / ${gender}`,
        complaint: complaint,
        history,
        medical,
        clinical,
        pulp,
        diagnosis,
        treatment,
        imagesMap,
        timestamp: Date.now()
      };

      await setDoc(doc(db, 'users', user.uid, 'drafts', caseId), draftMap);
      alert('Draft Saved Successfully!');
      onBack();
    } catch (err) {
      console.error('Error saving draft:', err);
      alert('Error saving draft: ' + err.message);
    }
  };

  // Step 1 -> Step 2
  const handleStep1Next = () => {
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

  // Step 2 Image picker
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

  const handleSelectImage = (category, index) => {
    setSelectedImage({
      category,
      index,
      dataUrl: imagesMap[category][index]
    });
    setBrightness(100);
    setSaturation(100);
    setShowFilters(true);
    setShowAnnotator(false);
  };

  const deleteImage = (category, index) => {
    if (window.confirm('Delete this image?')) {
      const updated = [...imagesMap[category]];
      updated.splice(index, 1);
      setImagesMap(prev => ({ ...prev, [category]: updated }));
      setSelectedImage(null);
      setShowFilters(false);
    }
  };

  // Canvas filters & annotation implementation
  const applyFilters = () => {
    if (!selectedImage) return;

    const img = new Image();
    img.src = selectedImage.dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Apply CSS-like filters inside canvas context
      ctx.filter = `brightness(${brightness}%) saturate(${saturation}%)`;
      ctx.drawImage(img, 0, 0);

      const filteredUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Update images map
      const { category, index } = selectedImage;
      const updatedList = [...imagesMap[category]];
      updatedList[index] = filteredUrl;

      setImagesMap(prev => ({
        ...prev,
        [category]: updatedList
      }));

      setSelectedImage({
        ...selectedImage,
        dataUrl: filteredUrl
      });
      setShowFilters(false);
      alert('Adjustments Applied!');
    };
  };

  // Annotator drawing canvas
  const startDrawing = (e) => {
    const canvas = annotateCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    // Scale coords to match actual canvas resolution
    const x = ((e.clientX || e.touches[0].clientX) - rect.left) * (canvas.width / rect.width);
    const y = ((e.clientY || e.touches[0].clientY) - rect.top) * (canvas.height / rect.height);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = annotateCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left) * (canvas.width / rect.width);
    const y = ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top) * (canvas.height / rect.height);
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const initAnnotator = () => {
    setShowFilters(false);
    setShowAnnotator(true);
    
    // Wait for canvas to mount
    setTimeout(() => {
      const canvas = annotateCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // Setup brush style
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw background image
      const img = new Image();
      img.src = selectedImage.dataUrl;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        // Reset brush styles as sizing canvas resets context properties
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      };
    }, 100);
  };

  const saveAnnotation = () => {
    const canvas = annotateCanvasRef.current;
    if (!canvas) return;
    const annotatedUrl = canvas.toDataURL('image/jpeg', 0.9);

    const { category, index } = selectedImage;
    const updatedList = [...imagesMap[category]];
    updatedList[index] = annotatedUrl;

    setImagesMap(prev => ({
      ...prev,
      [category]: updatedList
    }));

    setSelectedImage({
      ...selectedImage,
      dataUrl: annotatedUrl
    });
    setShowAnnotator(false);
    alert('Annotation saved!');
  };

  const clearAnnotation = () => {
    const canvas = annotateCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Re-draw background image only
    const img = new Image();
    img.src = selectedImage.dataUrl;
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
  };

  // Step 4: Digital Signature Canvas pad logic
  const startSigning = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = ((e.clientX || e.touches[0].clientX) - rect.left) * (canvas.width / rect.width);
    const y = ((e.clientY || e.touches[0].clientY) - rect.top) * (canvas.height / rect.height);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsSigning(true);
  };

  const sign = (e) => {
    if (!isSigning) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left) * (canvas.width / rect.width);
    const y = ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top) * (canvas.height / rect.height);
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopSigning = () => {
    setIsSigning(false);
    if (signatureCanvasRef.current) {
      setSignatureDataUrl(signatureCanvasRef.current.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl('');
  };

  useEffect(() => {
    if (step === 4) {
      setTimeout(() => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#1A1C1E';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }, 200);
    }
  }, [step]);

  // Step 5 loading tick checklist animation
  useEffect(() => {
    if (step === 5) {
      // Animate ticks one by one
      const t1 = setTimeout(() => {
        setChecklistTicks(prev => ({ ...prev, patient: true }));
      }, 1000);

      const t2 = setTimeout(() => {
        setChecklistTicks(prev => ({ ...prev, findings: true }));
      }, 2000);

      const t3 = setTimeout(() => {
        setChecklistTicks(prev => ({ ...prev, consent: true }));
      }, 3000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [step]);

  // Step 4 Confirm & Save
  const handleConfirmConsent = async () => {
    if (!cbTreatment || !cbPhotography || !cbAcademic) {
      alert('Please check and accept all clinical consents to proceed.');
      return;
    }
    if (!signatureDataUrl) {
      alert('Please draw your digital signature on the signature pad.');
      return;
    }

    setStep(5);
  };

  // Step 6 View Case Sheet: Upload images to Firebase Storage → save URLs to Firestore
  const handleFinalizeCase = async () => {
    const user = auth.currentUser;

    // Move to Case Sheet immediately
    setStep(6);

    if (!user) return;

    try {
      const allBase64Images = Object.values(imagesMap).flat();
      const total = allBase64Images.length;
      setUploadProgress({ current: 0, total, done: false });

      const downloadUrls = [];

      // Upload each image to Firebase Storage
      for (let i = 0; i < allBase64Images.length; i++) {
        const base64 = allBase64Images[i];
        const storageRef = ref(storage, `cases/${user.uid}/${caseId}/img_${i}.jpg`);
        await uploadString(storageRef, base64, 'data_url');
        const url = await getDownloadURL(storageRef);
        downloadUrls.push(url);
        setUploadProgress({ current: i + 1, total, done: false });
      }

      setSavedImageUrls(downloadUrls);
      setUploadProgress({ current: total, total, done: true });

      // Save case to Firestore with real Storage image URLs
      const finalCaseId = caseId || `case_${Date.now()}`;
      const caseData = {
        caseId: finalCaseId,
        patientId: patientId || `Auto-Gen-${Date.now().toString().slice(-4)}`,
        age,
        gender,
        complaint,
        history,
        medical,
        clinical,
        pulp,
        diagnosis,
        treatment,
        consents: { cbTreatment, cbPhotography, cbAcademic },
        imageUrls: downloadUrls,
        timestamp: Date.now(),
        status: 'active'
      };

      await setDoc(doc(db, 'users', user.uid, 'cases', finalCaseId), caseData);

      // Clean up draft
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'drafts', finalCaseId));
      } catch (e) { /* draft may not exist, ignore */ }

    } catch (err) {
      console.warn('Image upload/save error (non-blocking):', err.message);
      setUploadProgress(prev => ({ ...prev, done: true }));
    }
  };


  // Step 7: Share Case to Network Feed (uses real Firebase Storage URLs)
  const handlePostToNetwork = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to share cases.');
      return;
    }

    setSharing(true);
    try {
      // Use already-uploaded Firebase Storage URLs if available,
      // otherwise upload now (e.g., if user skipped finalize)
      let imageUrlsToPost = savedImageUrls;

      if (imageUrlsToPost.length === 0) {
        const allBase64 = Object.values(imagesMap).flat();
        const uploaded = [];
        for (let i = 0; i < allBase64.length; i++) {
          const storageRef = ref(storage, `cases/${user.uid}/${caseId}/post_img_${i}.jpg`);
          await uploadString(storageRef, allBase64[i], 'data_url');
          const url = await getDownloadURL(storageRef);
          uploaded.push(url);
        }
        imageUrlsToPost = uploaded;
        setSavedImageUrls(uploaded);
      }

      // Fetch user profile for post metadata
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userName = userDoc.exists() ? userDoc.data().name : 'Dr. User';
      const userRole = userDoc.exists() ? userDoc.data().specialization : 'Dentist';
      const userPhoto = userDoc.exists() ? (userDoc.data().photoUrl || '') : '';

      // Create post in Firestore 'posts' collection
      const postRef = doc(collection(db, 'posts'));
      await setDoc(postRef, {
        postId: postRef.id,
        userId: user.uid,
        userName: userName,
        userRole: userRole,
        userPhoto: userPhoto,
        caption: caption,
        caseTitle: `Case - Patient: ${patientId || 'Anonymous'}`,
        diagnosis: diagnosis || 'Clinical Case',
        imageUrls: imageUrlsToPost,   // Real Firebase Storage URLs
        timestamp: Date.now(),
        likesCount: 0,
        commentsCount: 0,
        likedBy: [],
        visibility: visibility
      });

      alert('✅ Case shared to network successfully!');
      onComplete(); // Navigate to network feed
    } catch (err) {
      console.error('Post error:', err);
      alert('Failed to share: ' + err.message);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      {/* Step Indicator */}
      {step <= 4 && (
        <div style={styles.stepHeader}>
          <div style={styles.stepLabel}>Step {step} of 4</div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressBar, width: `${(step / 4) * 100}%` }}></div>
          </div>
        </div>
      )}

      {/* Step 1: Patient details */}
      {step === 1 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.title}>Patient Details</h2>
          <p style={styles.subtitle}>Enter basic information to begin case report</p>

          <div style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Patient ID / Reference (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. PAT-2024-912" 
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Patient Age *</label>
              <input 
                type="number" 
                placeholder="e.g. 34" 
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Patient Gender *</label>
              <div style={styles.chipRow}>
                {['Male', 'Female', 'Other'].map(g => (
                  <button
                    key={g}
                    type="button"
                    style={{
                      ...styles.chip,
                      backgroundColor: gender === g ? 'var(--primary)' : 'var(--card-bg)',
                      color: gender === g ? 'white' : 'var(--text-primary)',
                      borderColor: gender === g ? 'var(--primary)' : 'var(--divider)'
                    }}
                    onClick={() => setGender(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Chief Complaint *</label>
              <textarea 
                rows="4"
                placeholder="Describe patient chief complaint in detail..." 
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                required
              />
            </div>

            <div style={styles.wizardActions}>
              <button style={styles.btnSec} onClick={onBack}>Cancel</button>
              <button style={styles.btnSec} onClick={handleSaveDraft}>Save Draft</button>
              <button style={styles.btnPrimary} onClick={handleStep1Next}>Next Step</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Case Images */}
      {step === 2 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.title}>Clinical Photography</h2>
          <p style={styles.subtitle}>Upload and enhance intra-oral or radiographic images</p>

          {/* Tabs for Pre-Op, Intra-Op etc. */}
          <div style={styles.categoryTabs}>
            {['PRE_OP', 'INTRA_OP', 'POST_OP', 'FOLLOW_UP'].map(cat => (
              <button
                key={cat}
                type="button"
                style={{
                  ...styles.catTab,
                  borderBottomColor: currentCategory === cat ? 'var(--primary)' : 'transparent',
                  color: currentCategory === cat ? 'var(--primary)' : 'var(--text-secondary)'
                }}
                onClick={() => {
                  setCurrentCategory(cat);
                  setSelectedImage(null);
                  setShowFilters(false);
                }}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Add Image file input */}
          <div style={styles.uploadBox}>
            <label style={styles.uploadLabel}>
              <Camera size={24} color="var(--primary)" />
              <span>Add Images to {currentCategory.replace('_', ' ')}</span>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Images Grid */}
          <div style={styles.imagesGrid}>
            {imagesMap[currentCategory].map((imgUrl, i) => (
              <div 
                key={i} 
                style={{
                  ...styles.imageCard,
                  borderColor: selectedImage?.index === i ? 'var(--primary)' : 'var(--divider)'
                }}
                onClick={() => handleSelectImage(currentCategory, i)}
              >
                <img src={imgUrl} alt="Clinical photography" style={styles.gridImg} />
                <button 
                  style={styles.imgDeleteBtn}
                  onClick={(e) => { e.stopPropagation(); deleteImage(currentCategory, i); }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Image Editor Controls (filters / annotations) */}
          {selectedImage && showFilters && (
            <div style={styles.editorPanel} className="fade-in">
              <h4 style={styles.editorTitle}>Image Adjustments</h4>
              
              <div style={styles.sliderGroup}>
                <div style={styles.sliderLabelRow}>
                  <span>Brightness</span>
                  <span>{brightness - 100 > 0 ? `+${brightness - 100}` : brightness - 100}</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="150" 
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                />
              </div>

              <div style={styles.sliderGroup}>
                <div style={styles.sliderLabelRow}>
                  <span>Enhance Saturation</span>
                  <span>{saturation - 100 > 0 ? `+${saturation - 100}` : saturation - 100}</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="150" 
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                />
              </div>

              <div style={styles.editorActionRow}>
                <button style={styles.editToolBtn} onClick={initAnnotator}>
                  <Edit3 size={16} /> Annotate Image
                </button>
                <div style={{ display: 'flex', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                  <button style={{ ...styles.btnSec, padding: '8px 12px', width: 'auto' }} onClick={() => setShowFilters(false)}>Cancel</button>
                  <button style={{ ...styles.btnPrimary, padding: '8px 12px', width: 'auto' }} onClick={applyFilters}>Apply</button>
                </div>
              </div>
            </div>
          )}

          {/* Annotation Drawing Screen */}
          {selectedImage && showAnnotator && (
            <div style={styles.annotatorContainer} className="fade-in">
              <div style={styles.annotatorHeader}>
                <h4>Draw Clinical Annotations</h4>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={styles.annoBtn} onClick={clearAnnotation} title="Clear Drawing"><RotateCcw size={16} /></button>
                  <button style={styles.annoBtn} onClick={() => setShowAnnotator(false)}>Cancel</button>
                  <button style={{ ...styles.btnPrimary, width: 'auto', padding: '6px 12px' }} onClick={saveAnnotation}>Save</button>
                </div>
              </div>
              <div style={styles.canvasContainer}>
                <canvas 
                  ref={annotateCanvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={styles.annotateCanvas}
                />
              </div>
            </div>
          )}

          <div style={styles.wizardActions}>
            <button style={styles.btnSec} onClick={() => setStep(1)}>Back</button>
            <button style={styles.btnSec} onClick={handleSaveDraft}>Save Draft</button>
            <button style={styles.btnPrimary} onClick={() => setStep(3)}>Next Step</button>
          </div>
        </div>
      )}

      {/* Step 3: Clinical Findings */}
      {step === 3 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.title}>Clinical Findings</h2>
          <p style={styles.subtitle}>Document history, pulp tests, and diagnosis</p>

          <div style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>History of Present Illness</label>
              <textarea 
                rows="3" 
                placeholder="Detail history of tenderness, swelling, pain intensity..." 
                value={history}
                onChange={(e) => setHistory(e.target.value)}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Medical & Dental History</label>
              <textarea 
                rows="2" 
                placeholder="Allergies, chronic conditions, dental operations..." 
                value={medical}
                onChange={(e) => setMedical(e.target.value)}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Clinical Examination & Findings</label>
              <textarea 
                rows="2" 
                placeholder="Findings upon percussion, palpation, tooth mobility..." 
                value={clinical}
                onChange={(e) => setClinical(e.target.value)}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Pulp & Periapical Tests</label>
              <textarea 
                rows="2" 
                placeholder="Cold test, EPT, bite test results..." 
                value={pulp}
                onChange={(e) => setPulp(e.target.value)}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Diagnosis *</label>
              <input 
                type="text" 
                placeholder="e.g. Symptomatic Irreversible Pulpitis with Symptomatic Apical Periodontitis" 
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Treatment Plan</label>
              <textarea 
                rows="2" 
                placeholder="Proposed RCT therapy, root instrumentation details..." 
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
              />
            </div>

            <div style={styles.wizardActions}>
              <button style={styles.btnSec} onClick={() => setStep(2)}>Back</button>
              <button style={styles.btnSec} onClick={handleSaveDraft}>Save Draft</button>
              <button style={styles.btnPrimary} onClick={() => setStep(4)}>Next Step</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Digital Consent */}
      {step === 4 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.title}>Digital Consent</h2>
          <p style={styles.subtitle}>Check items and capture patient verification signature</p>

          <div style={styles.form}>
            <div style={styles.consentList}>
              <label style={styles.consentItem}>
                <input 
                  type="checkbox" 
                  checked={cbTreatment}
                  onChange={(e) => setCbTreatment(e.target.checked)}
                  style={styles.checkbox}
                />
                <span>I consent to the proposed endodontic treatment plan.</span>
              </label>

              <label style={styles.consentItem}>
                <input 
                  type="checkbox" 
                  checked={cbPhotography}
                  onChange={(e) => setCbPhotography(e.target.checked)}
                  style={styles.checkbox}
                />
                <span>I consent to clinical photography and radiographical documentation.</span>
              </label>

              <label style={styles.consentItem}>
                <input 
                  type="checkbox" 
                  checked={cbAcademic}
                  onChange={(e) => setCbAcademic(e.target.checked)}
                  style={styles.checkbox}
                />
                <span>I consent to academic, educational, and research database use.</span>
              </label>
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Digital Signature Pad *</label>
                <button type="button" onClick={clearSignature} style={styles.clearSigBtn}>Clear</button>
              </div>
              <div style={styles.signaturePadBox}>
                {!signatureDataUrl && <div style={styles.sigHint}>Draw signature inside box</div>}
                <canvas 
                  ref={signatureCanvasRef}
                  onMouseDown={startSigning}
                  onMouseMove={sign}
                  onMouseUp={stopSigning}
                  onMouseLeave={stopSigning}
                  onTouchStart={startSigning}
                  onTouchMove={sign}
                  onTouchEnd={stopSigning}
                  style={styles.signatureCanvas}
                />
              </div>
            </div>

            <div style={styles.wizardActions}>
              <button style={styles.btnSec} onClick={() => setStep(3)}>Back</button>
              <button style={styles.btnPrimary} onClick={handleConfirmConsent}>Confirm & Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Document Ticks animation */}
      {step === 5 && (
        <div style={styles.loadingChecklistContainer}>
          <div style={styles.checklistCard}>
            <h3 style={styles.checklistTitle}>Compiling Case File</h3>
            <p style={styles.checklistSub}>Writing secure decentralized clinical records...</p>
            
            <div style={styles.checkItems}>
              <div style={styles.checkItem}>
                <div style={{
                  ...styles.checkCircle,
                  backgroundColor: checklistTicks.patient ? 'var(--primary)' : 'var(--divider)',
                  borderColor: checklistTicks.patient ? 'var(--primary)' : 'var(--divider)'
                }}>
                  {checklistTicks.patient && <Check size={16} color="white" />}
                </div>
                <span style={{
                  ...styles.checkText,
                  color: checklistTicks.patient ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>Patient info generated</span>
              </div>

              <div style={styles.checkItem}>
                <div style={{
                  ...styles.checkCircle,
                  backgroundColor: checklistTicks.findings ? 'var(--primary)' : 'var(--divider)',
                  borderColor: checklistTicks.findings ? 'var(--primary)' : 'var(--divider)'
                }}>
                  {checklistTicks.findings && <Check size={16} color="white" />}
                </div>
                <span style={{
                  ...styles.checkText,
                  color: checklistTicks.findings ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>Clinical findings compiled</span>
              </div>

              <div style={styles.checkItem}>
                <div style={{
                  ...styles.checkCircle,
                  backgroundColor: checklistTicks.consent ? 'var(--primary)' : 'var(--divider)',
                  borderColor: checklistTicks.consent ? 'var(--primary)' : 'var(--divider)'
                }}>
                  {checklistTicks.consent && <Check size={16} color="white" />}
                </div>
                <span style={{
                  ...styles.checkText,
                  color: checklistTicks.consent ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>Digital consent verified</span>
              </div>
            </div>

            {checklistTicks.consent && (
              <button 
                style={{ ...styles.btnPrimary, marginTop: 30 }} 
                onClick={handleFinalizeCase}
              >
                View Case Sheet
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 6: Case Sheet View */}
      {step === 6 && (
        <div style={styles.stepContainer}>
          <div style={styles.sheetHeader}>
            <h2 style={styles.title}>Case Sheet Summary</h2>
            <div style={styles.sheetBadge}>Verified File</div>
          </div>
          <p style={styles.subtitle}>Patient clinical diagnostic report</p>

          {/* Upload Progress Banner */}
          {uploadProgress.total > 0 && !uploadProgress.done && (
            <div style={styles.uploadBanner} className="fade-in">
              <div style={styles.uploadBannerText}>
                <Upload size={14} />
                Uploading images to cloud: {uploadProgress.current} / {uploadProgress.total}
              </div>
              <div style={styles.uploadTrack}>
                <div style={{
                  ...styles.uploadFill,
                  width: `${(uploadProgress.current / uploadProgress.total) * 100}%`
                }}></div>
              </div>
            </div>
          )}
          {uploadProgress.done && uploadProgress.total > 0 && (
            <div style={styles.uploadDone} className="fade-in">
              <Check size={14} /> {uploadProgress.total} image{uploadProgress.total > 1 ? 's' : ''} uploaded & saved to database ✓
            </div>
          )}

          <div style={styles.clinicalSheet} className="card">
            <div style={styles.sheetSection}>
              <h4 style={styles.sheetSecTitle}>1. Patient Details</h4>
              <table style={styles.sheetTable}>
                <tbody>
                  <tr>
                    <td style={styles.tableLabel}>Patient Ref:</td>
                    <td style={styles.tableVal}>{patientId || 'Auto-Generated'}</td>
                  </tr>
                  <tr>
                    <td style={styles.tableLabel}>Age / Gender:</td>
                    <td style={styles.tableVal}>{age} Yrs / {gender}</td>
                  </tr>
                  <tr>
                    <td style={styles.tableLabel}>Chief Complaint:</td>
                    <td style={styles.tableVal}>{complaint}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={styles.sheetSection}>
              <h4 style={styles.sheetSecTitle}>2. Clinical Findings & Testing</h4>
              <table style={styles.sheetTable}>
                <tbody>
                  <tr>
                    <td style={styles.tableLabel}>HPI:</td>
                    <td style={styles.tableVal}>{history || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td style={styles.tableLabel}>Med/Dent Hist:</td>
                    <td style={styles.tableVal}>{medical || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td style={styles.tableLabel}>Clinical Exam:</td>
                    <td style={styles.tableVal}>{clinical || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td style={styles.tableLabel}>Pulp Testing:</td>
                    <td style={styles.tableVal}>{pulp || 'Not specified'}</td>
                  </tr>
                  <tr style={{ fontWeight: 'bold' }}>
                    <td style={styles.tableLabel}>Diagnosis:</td>
                    <td style={{ ...styles.tableVal, color: 'var(--primary)' }}>{diagnosis}</td>
                  </tr>
                  <tr>
                    <td style={styles.tableLabel}>Treatment Plan:</td>
                    <td style={styles.tableVal}>{treatment || 'Not specified'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Display signature if available */}
            {signatureDataUrl && (
              <div style={styles.sheetSection}>
                <h4 style={styles.sheetSecTitle}>3. Clinical Consents & Sign-Off</h4>
                <div style={styles.sigPreviewBlock}>
                  <div style={styles.sigText}>
                    <p style={{ margin: 0 }}>✓ Active Consent (Treatment, Photo, Academic)</p>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Digitally Stamped / Authenticated</span>
                  </div>
                  <img src={signatureDataUrl} alt="Signature Preview" style={styles.sigPreviewImg} />
                </div>
              </div>
            )}
          </div>

          <div style={styles.wizardActions}>
            <button style={styles.btnSec} onClick={() => setStep(3)}>Edit Sheet</button>
            <button style={styles.btnPrimary} onClick={() => setStep(7)}>
              <Share2 size={16} /> Export & Share
            </button>
          </div>
        </div>
      )}

      {/* Step 7: Share Case */}
      {step === 7 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.title}>Share to Network</h2>
          <p style={styles.subtitle}>Publish this case study to the professional clinician feed</p>

          <div style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Caption / Write something...</label>
              <textarea 
                rows="4" 
                placeholder="Discuss instrumentation, canal cleaning, obturation details with peer specialists..." 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Visibility settings</label>
              <div style={styles.visibilityBox}>
                <label style={styles.visOption}>
                  <input 
                    type="radio" 
                    name="visibility" 
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                  />
                  <div>
                    <span style={styles.visTitle}>Public</span>
                    <span style={styles.visSub}>Anyone on DentConnect can view</span>
                  </div>
                </label>

                <label style={styles.visOption}>
                  <input 
                    type="radio" 
                    name="visibility" 
                    value="connections"
                    checked={visibility === 'connections'}
                    onChange={() => setVisibility('connections')}
                  />
                  <div>
                    <span style={styles.visTitle}>Connections Only</span>
                    <span style={styles.visSub}>Only your verified clinician list</span>
                  </div>
                </label>

                <label style={styles.visOption}>
                  <input 
                    type="radio" 
                    name="visibility" 
                    value="private"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                  />
                  <div>
                    <span style={styles.visTitle}>Private</span>
                    <span style={styles.visSub}>Only you can view in Case history</span>
                  </div>
                </label>
              </div>
            </div>

            <div style={styles.wizardActions}>
              <button style={styles.btnSec} onClick={() => setStep(6)}>Back</button>
              <button style={styles.btnPrimary} onClick={handlePostToNetwork} disabled={sharing}>
                {sharing ? 'Posting...' : 'Share Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px 20px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'auto'
  },
  stepHeader: {
    marginBottom: 20
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'var(--primary)',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  progressTrack: {
    height: 6,
    width: '100%',
    backgroundColor: 'var(--divider)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'var(--primary)',
    transition: 'width 0.3s ease'
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 20
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: 'var(--text-secondary)'
  },
  chipRow: {
    display: 'flex',
    gap: 10
  },
  chip: {
    flex: 1,
    padding: '12px',
    border: '1.5px solid var(--divider)',
    borderRadius: 'var(--border-radius)',
    fontSize: 14,
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'var(--transition)'
  },
  wizardActions: {
    display: 'flex',
    gap: 10,
    marginTop: 24,
    marginBottom: 20
  },
  btnPrimary: {
    flex: 2
  },
  btnSec: {
    flex: 1,
    backgroundColor: 'var(--divider)',
    color: 'var(--text-primary)'
  },
  categoryTabs: {
    display: 'flex',
    borderBottom: '1.5px solid var(--divider)',
    marginBottom: 16,
    gap: 8
  },
  catTab: {
    flex: 1,
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '10px 0',
    fontSize: 11,
    fontWeight: '700',
    cursor: 'pointer',
    borderRadius: 0,
    transition: 'var(--transition)'
  },
  uploadBox: {
    border: '1.5px dashed var(--primary)',
    backgroundColor: 'var(--blue-bg)',
    borderRadius: 'var(--border-radius)',
    padding: '24px 16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    cursor: 'pointer'
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: '700',
    color: 'var(--primary)',
    cursor: 'pointer'
  },
  imagesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 20
  },
  imageCard: {
    position: 'relative',
    height: 120,
    borderRadius: 'var(--border-radius)',
    border: '2px solid transparent',
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  gridImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  imgDeleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 234, 234, 0.9)',
    color: '#EB5757',
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    padding: 0
  },
  editorPanel: {
    backgroundColor: 'var(--card-bg)',
    border: '1.5px solid var(--divider)',
    borderRadius: 'var(--border-radius)',
    padding: 16,
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    boxShadow: 'var(--box-shadow)'
  },
  editorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  sliderGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  sliderLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    fontWeight: '600',
    color: 'var(--text-secondary)'
  },
  editorActionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8
  },
  editToolBtn: {
    width: 'auto',
    padding: '8px 12px',
    backgroundColor: 'var(--blue-bg)',
    color: 'var(--primary)',
    fontSize: 12
  },
  annotatorContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 999,
    display: 'flex',
    flexDirection: 'column',
    padding: 16
  },
  annotatorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
    marginBottom: 16
  },
  annoBtn: {
    width: 'auto',
    padding: '6px 12px',
    backgroundColor: '#333',
    color: 'white',
    fontSize: 12
  },
  canvasContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  annotateCanvas: {
    maxWidth: '100%',
    maxHeight: '100%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    backgroundColor: 'black'
  },
  consentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    margin: '8px 0'
  },
  consentItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    cursor: 'pointer',
    fontSize: 13,
    lineHeight: '1.4',
    color: 'var(--text-primary)',
    fontWeight: '500'
  },
  checkbox: {
    width: 20,
    height: 20,
    marginTop: 2,
    cursor: 'pointer',
    flexShrink: 0
  },
  clearSigBtn: {
    width: 'auto',
    background: 'none',
    border: 'none',
    color: '#EB5757',
    fontWeight: '700',
    fontSize: 12,
    cursor: 'pointer',
    padding: 0
  },
  signaturePadBox: {
    position: 'relative',
    height: 180,
    backgroundColor: '#FFF',
    border: '1.5px solid var(--divider)',
    borderRadius: 'var(--border-radius)',
    overflow: 'hidden',
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.02)'
  },
  signatureCanvas: {
    width: '100%',
    height: '100%',
    display: 'block',
    cursor: 'crosshair'
  },
  sigHint: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'var(--text-secondary)',
    opacity: 0.4,
    fontSize: 13,
    pointerEvents: 'none',
    fontWeight: '500'
  },
  loadingChecklistContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    padding: 16
  },
  checklistCard: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '36px 24px',
    boxShadow: 'var(--box-shadow)',
    width: '100%',
    textAlign: 'center',
    border: '1px solid var(--divider)'
  },
  checklistTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginBottom: 6
  },
  checklistSub: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 32
  },
  checkItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    alignItems: 'flex-start',
    maxWidth: 240,
    margin: '0 auto'
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '2px solid transparent',
    transition: 'all 0.4s ease'
  },
  checkText: {
    fontSize: 14,
    fontWeight: '600',
    transition: 'color 0.4s ease'
  },
  sheetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  sheetBadge: {
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: '#E2FBE9',
    color: '#27AE60',
    padding: '4px 10px',
    borderRadius: 20,
    textTransform: 'uppercase'
  },
  clinicalSheet: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  sheetSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    borderBottom: '1px solid var(--divider)',
    paddingBottom: 14
  },
  sheetSecTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'var(--primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  sheetTable: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableLabel: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontWeight: '600',
    width: 110,
    verticalAlign: 'top',
    padding: '4px 0'
  },
  tableVal: {
    fontSize: 12,
    color: 'var(--text-primary)',
    fontWeight: '500',
    padding: '4px 0',
    lineHeight: '1.4'
  },
  sigPreviewBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--background)',
    padding: 10,
    borderRadius: 'var(--border-radius)'
  },
  sigText: {
    fontSize: 11,
    color: '#27AE60',
    fontWeight: '700',
    textAlign: 'left'
  },
  sigPreviewImg: {
    maxHeight: 40,
    maxWidth: 100,
    objectFit: 'contain'
  },
  visibilityBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    backgroundColor: 'var(--card-bg)',
    border: '1.5px solid var(--divider)',
    borderRadius: 'var(--border-radius)',
    padding: 16
  },
  visOption: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    cursor: 'pointer'
  },
  visTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'var(--text-primary)',
    display: 'block',
    marginBottom: 2
  },
  visSub: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    fontWeight: '500',
    display: 'block'
  }
};
