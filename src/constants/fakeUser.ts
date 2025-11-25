// src/fixtures/fakeUser.ts
// Realistic demo user (matches your screenshot)

export const fakeUser = {
  id: 'demo-ivan',
  fullName: 'Ivan Petrov',
  username: 'ivanpetrov',
  email: 'ivan.petrov@email.com',
  phoneNumber: '+998 90 123-45-67',
  birthDate: '15 March 1990',
  bio: 'Целеустремленный предприниматель, фокус на финансовой независимости',
  // created & updated dates (so "Member • 15.03.2024" style renders)
  createdAt: '2024-03-15T09:30:00.000Z',
  updatedAt: '2025-10-30T10:45:00.000Z',
  // optional stats the page reads
  stats: {
    activeDays: 142,
    bestStreak: 45,
    level: 12,
    xp: 3500,
    xpTarget: 4000,
  },
} as const;

// Simple feature flag if you ever want to force using mocks:
export const USE_MOCK_PROFILE = false;
