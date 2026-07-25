import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize profile data from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
        return docSnap.data();
      } else {
        // Fallback profile
        const basicProfile = {
          uid,
          name: auth.currentUser?.displayName || 'Dr. Dentist',
          email: auth.currentUser?.email || '',
          specialization: 'General Dentistry',
          institution: '',
          location: '',
          phone: '',
          photoUrl: auth.currentUser?.photoURL || '',
          role: 'doctor',
          bio: '',
          education: [],
          experience: [],
          certifications: [],
          achievements: [],
          notificationSettings: {
            likes: true,
            comments: true,
            connections: true,
            chat: true,
            email: true,
            push: true
          },
          privacySettings: {
            profileVisibility: 'public',
            showEmail: false,
            showCasesToPublic: true
          }
        };
        await setDoc(docRef, basicProfile);
        setUserProfile(basicProfile);
        return basicProfile;
      }
    } catch (e) {
      console.error('Error fetching user profile:', e);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (name, email, password, specialization = 'General Dentistry', institution = '', location = '') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    // Update display name in Firebase Auth
    await updateProfile(newUser, { displayName: name });

    const newProfile = {
      uid: newUser.uid,
      name,
      email,
      phone: '',
      specialization,
      institution,
      location,
      photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', // Default professional avatar
      role: 'doctor',
      bio: `Dr. ${name} is a dental professional specializing in ${specialization}.`,
      education: institution ? [{ degree: 'BDS / DDS', school: institution, year: new Date().getFullYear().toString() }] : [],
      experience: institution ? [{ role: 'Dentist', company: institution, duration: 'Present' }] : [],
      certifications: [],
      achievements: [],
      notificationSettings: {
        likes: true,
        comments: true,
        connections: true,
        chat: true,
        email: true,
        push: true
      },
      privacySettings: {
        profileVisibility: 'public',
        showEmail: false,
        showCasesToPublic: true
      }
    };

    // Save profile to Firestore
    await setDoc(doc(db, 'users', newUser.uid), newProfile);
    setUserProfile(newProfile);
    return userCredential;
  };

  const logout = () => {
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const updateProfileData = async (updatedFields) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    await updateDoc(docRef, updatedFields);
    setUserProfile(prev => ({ ...prev, ...updatedFields }));
  };

  const refreshProfile = async () => {
    if (user) {
      return await fetchUserProfile(user.uid);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    updateProfileData,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
