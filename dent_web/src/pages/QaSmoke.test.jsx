import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Welcome from './Welcome';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

describe('QA smoke tests', () => {
  it('renders the app shell', () => {
    render(
      <MemoryRouter>
        <Welcome />
      </MemoryRouter>
    );
    expect(screen.getByText(/DentConnect/i)).toBeInTheDocument();
  });
});
