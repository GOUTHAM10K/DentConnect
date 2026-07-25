import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function submitInquiry(payload) {
  return addDoc(collection(db, 'inquiries'), {
    ...payload,
    createdAt: new Date().toISOString(),
  });
}

export async function submitSupportTicket(ticket) {
  return addDoc(collection(db, 'supportTickets'), {
    ...ticket,
    timestamp: Date.now(),
  });
}

export async function getUserProfileData(uid) {
  if (!uid) return null;
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

export async function updateUserProfileData(uid, updateData) {
  if (!uid) return null;
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, updateData);
  return updateData;
}

export async function saveCaseDraft(uid, caseData) {
  if (!uid) throw new Error('Missing user id');
  const ref = doc(db, 'users', uid, 'drafts', caseData.caseId);
  await setDoc(ref, {
    ...caseData,
    timestamp: Date.now(),
  });
  return ref.id;
}

export async function finalizeCase(uid, caseData) {
  if (!uid) throw new Error('Missing user id');
  const caseRef = doc(db, 'users', uid, 'cases', caseData.caseId);
  await setDoc(caseRef, {
    ...caseData,
    timestamp: Date.now(),
  });
  try {
    await deleteDoc(doc(db, 'users', uid, 'drafts', caseData.caseId));
  } catch (error) {
    console.warn('Draft cleanup skipped:', error);
  }
  return caseRef.id;
}

export async function createCommunityPost(postData) {
  const postRef = doc(collection(db, 'posts'));
  await setDoc(postRef, {
    postId: postRef.id,
    ...postData,
    timestamp: Date.now(),
  });
  return postRef.id;
}

export async function getUserCases(uid) {
  if (!uid) return [];
  const casesRef = collection(db, 'users', uid, 'cases');
  const q = query(casesRef, orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
}

export async function getUserDrafts(uid) {
  if (!uid) return [];
  const draftsRef = collection(db, 'users', uid, 'drafts');
  const q = query(draftsRef, orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
}

export async function deleteCaseDocument(uid, collectionName, id) {
  if (!uid || !id) throw new Error('Missing id');
  await deleteDoc(doc(db, 'users', uid, collectionName, id));
}

export async function getCommunityPosts() {
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
}

export async function getDashboardSummary(uid) {
  if (!uid) return { cases: 0, shared: 0, recentCases: [] };

  const [casesData, postsData] = await Promise.all([
    getUserCases(uid),
    getCommunityPosts(),
  ]);

  const sharedCount = postsData.filter((post) => post.userId === uid).length;

  return {
    cases: casesData.length,
    shared: sharedCount,
    recentCases: casesData.slice(0, 3),
  };
}
