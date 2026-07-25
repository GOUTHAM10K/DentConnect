export function buildCommunityPostPayload({
  caseId,
  userId,
  userName,
  userRole,
  userPhoto,
  caption,
  diagnosis,
  patientId,
  visibility,
  imageUrls = [],
  timestamp = Date.now(),
}) {
  const normalizedCaption = caption?.trim() || `Shared a clinical case update from ${userName || 'a dentist'}.`;
  const normalizedUserName = userName?.trim() || 'Dr. User';
  const normalizedUserRole = userRole?.trim() || 'Dentist';
  const normalizedVisibility = visibility || 'public';

  return {
    caseId: caseId || `case_${timestamp}`,
    userId: userId || 'anonymous',
    userName: normalizedUserName,
    userRole: normalizedUserRole,
    userPhoto: userPhoto?.trim() || '',
    caption: normalizedCaption,
    caseTitle: `Case - Patient: ${patientId || 'Anonymous'}`,
    diagnosis: diagnosis || 'Clinical Case',
    imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
    timestamp,
    likesCount: 0,
    commentsCount: 0,
    likedBy: [],
    visibility: normalizedVisibility,
  };
}
