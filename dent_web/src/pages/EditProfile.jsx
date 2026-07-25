import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, User, MapPin, Briefcase, Landmark } from 'lucide-react';

export default function EditProfile({ userProfile, onBack, onSave }) {
  const [name, setName] = useState(userProfile?.name || '');
  const [specialization, setSpecialization] = useState(userProfile?.specialization || 'General Dentistry');
  const [location, setLocation] = useState(userProfile?.location || '');
  const [institution, setInstitution] = useState(userProfile?.institution || '');
  const [loading, setLoading] = useState(false);

  const specs = [
    "General Dentistry", 
    "Orthodontics", 
    "Endodontics", 
    "Periodontics", 
    "Oral Surgery", 
    "Prosthodontics"
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        name,
        specialization,
        location,
        institution
      });

      alert('Profile Updated Successfully!');
      onSave(); // Refreshes profile state in App.jsx and navigates back
    } catch (err) {
      console.error(err);
      alert('Error updating profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="fade-in">
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack} aria-label="Go Back">
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.title}>Edit Profile</h2>
      </div>

      <form onSubmit={handleSave} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Clinician Full Name *</label>
          <div style={styles.inputWrapper}>
            <User size={18} style={styles.icon} />
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Specialization *</label>
          <div style={styles.inputWrapper}>
            <Briefcase size={18} style={styles.icon} />
            <select 
              value={specialization} 
              onChange={(e) => setSpecialization(e.target.value)}
              style={styles.select}
            >
              {specs.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Institution / Clinic Name</label>
          <div style={styles.inputWrapper}>
            <Landmark size={18} style={styles.icon} />
            <input 
              type="text" 
              value={institution} 
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Dental Clinic / Hospital"
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Location / City</label>
          <div style={styles.inputWrapper}>
            <MapPin size={18} style={styles.icon} />
            <input 
              type="text" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bangalore, India"
              style={styles.input}
            />
          </div>
        </div>

        <button type="submit" style={styles.saveBtn} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
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
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: 'var(--card-bg)',
    border: '1.5px solid var(--divider)',
    color: 'var(--text-primary)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    padding: 0
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: 'var(--text-primary)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: 'var(--text-secondary)'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  icon: {
    position: 'absolute',
    left: 14,
    color: 'var(--text-secondary)',
    pointerEvents: 'none'
  },
  input: {
    paddingLeft: 44
  },
  select: {
    paddingLeft: 44,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%255D5E61' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    backgroundSize: '16px',
    paddingRight: 40
  },
  saveBtn: {
    marginTop: 10,
    boxShadow: '0 4px 15px rgba(126, 112, 197, 0.25)'
  }
};
