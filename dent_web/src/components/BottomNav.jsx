import React from 'react';
import { Home, FileText, Plus, Users, User } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange, onAddClick }) {
  return (
    <div style={styles.navBar}>
      <button 
        style={{ ...styles.navButton, color: activeTab === 'home' ? 'var(--primary)' : 'var(--text-secondary)' }}
        onClick={() => onTabChange('home')}
      >
        <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
        <span style={styles.navText}>Home</span>
      </button>

      <button 
        style={{ ...styles.navButton, color: activeTab === 'drafts' ? 'var(--primary)' : 'var(--text-secondary)' }}
        onClick={() => onTabChange('drafts')}
      >
        <FileText size={22} strokeWidth={activeTab === 'drafts' ? 2.5 : 2} />
        <span style={styles.navText}>Cases</span>
      </button>

      <div style={styles.fabContainer}>
        <button style={styles.fab} onClick={onAddClick} aria-label="Add New Case">
          <Plus size={28} color="white" strokeWidth={3} />
        </button>
      </div>

      <button 
        style={{ ...styles.navButton, color: activeTab === 'network' ? 'var(--primary)' : 'var(--text-secondary)' }}
        onClick={() => onTabChange('network')}
      >
        <Users size={22} strokeWidth={activeTab === 'network' ? 2.5 : 2} />
        <span style={styles.navText}>Network</span>
      </button>

      <button 
        style={{ ...styles.navButton, color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-secondary)' }}
        onClick={() => onTabChange('profile')}
      >
        <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
        <span style={styles.navText}>Profile</span>
      </button>
    </div>
  );
}

const styles = {
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: 'var(--card-bg)',
    borderTop: '1px solid var(--divider)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '0 10px',
    zIndex: 100,
    boxShadow: '0 -4px 15px rgba(0, 0, 0, 0.03)'
  },
  navButton: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    cursor: 'pointer',
    width: 60,
    height: '100%',
    padding: 0,
    fontFamily: 'inherit',
    transition: 'var(--transition)'
  },
  navText: {
    fontSize: '11px',
    fontWeight: '500'
  },
  fabContainer: {
    position: 'relative',
    width: 60,
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fab: {
    position: 'absolute',
    top: -24,
    width: 56,
    height: 56,
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    border: 'none',
    boxShadow: '0 6px 16px rgba(126, 112, 197, 0.35)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)',
    padding: 0
  }
};
