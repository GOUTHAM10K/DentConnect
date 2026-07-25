import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, FileText, Trash2, Calendar, Clipboard, User } from 'lucide-react';

export default function Drafts({ onBack, onSelectDraft }) {
  const [activeTab, setActiveTab] = useState('drafts'); // 'drafts' or 'cases'
  const [drafts, setDrafts] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);

    try {
      if (activeTab === 'drafts') {
        const draftsRef = collection(db, 'users', user.uid, 'drafts');
        const q = query(draftsRef, orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setDrafts(list);
      } else {
        const casesRef = collection(db, 'users', user.uid, 'cases');
        const q = query(casesRef, orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setCases(list);
      }
    } catch (err) {
      console.error('Error fetching list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Stop click card action
    if (!window.confirm('Are you sure you want to delete this?')) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      const collectionName = activeTab === 'drafts' ? 'drafts' : 'cases';
      await deleteDoc(doc(db, 'users', user.uid, collectionName, id));
      fetchData(); // Refresh list
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={styles.container} className="fade-in">
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack} aria-label="Go Back">
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.title}>Cases Directory</h2>
      </div>

      {/* Tabs */}
      <div style={styles.tabsRow}>
        <button 
          style={{ ...styles.tab, borderBottomColor: activeTab === 'drafts' ? 'var(--primary)' : 'transparent', color: activeTab === 'drafts' ? 'var(--primary)' : 'var(--text-secondary)' }}
          onClick={() => setActiveTab('drafts')}
        >
          Drafts ({drafts.length})
        </button>
        <button 
          style={{ ...styles.tab, borderBottomColor: activeTab === 'cases' ? 'var(--primary)' : 'transparent', color: activeTab === 'cases' ? 'var(--primary)' : 'var(--text-secondary)' }}
          onClick={() => setActiveTab('cases')}
        >
          All Cases ({cases.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
        </div>
      ) : activeTab === 'drafts' ? (
        drafts.length === 0 ? (
          <div style={styles.emptyState}>
            <FileText size={48} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: 12 }} />
            <p style={styles.emptyText}>No drafts found.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {drafts.map((d) => (
              <div 
                key={d.id} 
                style={styles.card} 
                onClick={() => onSelectDraft(d)}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitle}>Patient: {d.patientId}</span>
                  <button 
                    style={styles.deleteBtn} 
                    onClick={(e) => handleDelete(d.id, e)}
                    aria-label="Delete Draft"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div style={styles.cardDetail}>
                  <User size={14} color="var(--text-secondary)" />
                  <span style={styles.detailText}>{d.ageGender || 'Age/Gender not specified'}</span>
                </div>

                <div style={styles.cardDetail}>
                  <Clipboard size={14} color="var(--text-secondary)" />
                  <span style={styles.detailText}>{d.complaint || 'No chief complaint'}</span>
                </div>

                <div style={styles.cardFooter}>
                  <Calendar size={13} color="var(--text-secondary)" />
                  <span style={styles.footerDate}>{formatDate(d.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        cases.length === 0 ? (
          <div style={styles.emptyState}>
            <FileText size={48} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: 12 }} />
            <p style={styles.emptyText}>No finalized cases found.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {cases.map((c) => (
              <div 
                key={c.id} 
                style={{ ...styles.card, borderLeft: '4px solid var(--primary)' }}
                onClick={() => onSelectDraft({ ...c, isFinal: true })} // Opens finalized case in summary
              >
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitle}>Patient: {c.patientId}</span>
                  <button 
                    style={styles.deleteBtn} 
                    onClick={(e) => handleDelete(c.id, e)}
                    aria-label="Delete Case"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={styles.cardDetail}>
                  <User size={14} color="var(--text-secondary)" />
                  <span style={styles.detailText}>{c.age} Yrs / {c.gender}</span>
                </div>

                <div style={styles.cardDetail}>
                  <Clipboard size={14} color="var(--text-secondary)" />
                  <span style={styles.detailText}>{c.complaint}</span>
                </div>

                <div style={styles.cardFooter}>
                  <Calendar size={13} color="var(--text-secondary)" />
                  <span style={styles.footerDate}>{formatDate(c.timestamp)}</span>
                  <span style={styles.statusBadge}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        )
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
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20
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
  tabsRow: {
    display: 'flex',
    borderBottom: '1.5px solid var(--divider)',
    marginBottom: 20
  },
  tab: {
    flex: 1,
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '12px 0',
    fontSize: 14,
    fontWeight: '700',
    cursor: 'pointer',
    borderRadius: 0,
    transition: 'var(--transition)'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px 0'
  },
  spinner: {
    width: 28,
    height: 28,
    border: '3px solid var(--divider)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: 'var(--card-bg)',
    borderRadius: 'var(--border-radius)',
    border: '1.5px dashed var(--divider)'
  },
  emptyText: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    fontWeight: '500'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  card: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: 'var(--border-radius)',
    padding: 16,
    boxShadow: 'var(--box-shadow)',
    border: '1.5px solid var(--divider)',
    cursor: 'pointer',
    transition: 'var(--transition)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: '#FFEAEA',
    color: '#EB5757',
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    padding: 0
  },
  cardDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  detailText: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontWeight: '500'
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid var(--divider)'
  },
  footerDate: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    fontWeight: '500',
    flex: 1
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: 'var(--blue-bg)',
    color: '#2F80ED',
    padding: '3px 8px',
    borderRadius: 12,
    textTransform: 'uppercase'
  }
};
