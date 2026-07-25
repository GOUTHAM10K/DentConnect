import { describe, it, expect } from 'vitest';
import { buildCommunityPostPayload } from '../services/communityPostUtils';

describe('buildCommunityPostPayload', () => {
  it('creates a valid community post payload with fallback values', () => {
    const payload = buildCommunityPostPayload({
      userId: 'u1',
      userName: 'Dr. Smith',
      userRole: 'Endodontist',
      caption: ' ',
      diagnosis: 'Cracked tooth',
      patientId: 'P-100',
      visibility: 'public',
      imageUrls: ['https://example.com/1.jpg'],
    });

    expect(payload.caption).toContain('Shared a clinical case update');
    expect(payload.caseTitle).toContain('P-100');
    expect(payload.imageUrls).toHaveLength(1);
    expect(payload.visibility).toBe('public');
  });
});
