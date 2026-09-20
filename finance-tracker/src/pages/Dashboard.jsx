import { useEffect, useState, useCallback, useMemo } from 'react';
import { getDebtsWithInstallments } from '../services/debtApi';
import DebtCard from '../components/DebtCard';
import AddDebtForm from '../components/AddDebtForm';
import DueBeforeFifthWidget from '../components/DueBeforeFifthWidget';
import DueScheduleChart from '../components/DueScheduleChart';
import FinanceProgressWidgets from '../components/FinanceProgressWidgets';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../utils/formatters';
import PaymentCalendar from '../components/PaymentCalendar';
import DebtAnalytics from '../components/DebtAnalytics';
import PaymentReminders from '../components/PaymentReminders';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [credentialMessage, setCredentialMessage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('szfinance-avatar') || '');
  const [avatarZoom, setAvatarZoom] = useState(() => localStorage.getItem('szfinance-avatar-zoom') || '1');
  const [avatarPosition, setAvatarPosition] = useState(() => localStorage.getItem('szfinance-avatar-position') || '50%');
  const [searchTerm, setSearchTerm] = useState('');
  const [debtFilter, setDebtFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setUserEmail(user.email || '');
      try {
        const debtData = await getDebtsWithInstallments(user.id);
        setDebts(debtData || []);
      } catch (err) {
        console.error('Error fetching data:', err.message);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleCredentialUpdate = async (e) => {
    e.preventDefault();
    const changes = {};
    if (newEmail.trim() && newEmail.trim() !== userEmail) changes.email = newEmail.trim();
    if (newPassword) changes.password = newPassword;
    if (!Object.keys(changes).length) return setCredentialMessage('Enter a new email or password first.');
    const { error } = await supabase.auth.updateUser(changes);
    if (error) return setCredentialMessage(error.message);
    if (changes.email) setUserEmail(changes.email);
    setNewEmail(''); setNewPassword(''); setCredentialMessage('Credentials updated successfully.');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 512;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        setAvatarUrl(compressed);
        localStorage.setItem('szfinance-avatar', compressed);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  const updateAvatarZoom = (value) => { setAvatarZoom(value); localStorage.setItem('szfinance-avatar-zoom', value); };
  const updateAvatarPosition = (value) => { setAvatarPosition(value); localStorage.setItem('szfinance-avatar-position', value); };
  const removeAvatar = () => { setAvatarUrl(''); localStorage.removeItem('szfinance-avatar'); setAvatarZoom('1'); setAvatarPosition('50%'); localStorage.removeItem('szfinance-avatar-zoom'); localStorage.removeItem('szfinance-avatar-position'); };
  const avatarStyle = { objectPosition: `50% ${avatarPosition}`, transform: `scale(${avatarZoom})` };

  const totalDebt = debts.reduce((acc, d) => acc + Number(d.total_amount), 0);
  const totalRemaining = debts.reduce((acc, d) => acc + Number(d.remaining_balance), 0);
  const installmentsCount = debts.filter((d) => d.type === 'installment').length;
  const clearedCount = debts.filter((d) => Number(d.remaining_balance) <= 0).length;
  const visibleDebts = debts.filter((debt) => {
    const matchesSearch = debt.title.toLowerCase().includes(searchTerm.toLowerCase());
    const overdue = Number(debt.due_day || 32) < new Date().getDate() && Number(debt.remaining_balance) > 0;
    return matchesSearch && (debtFilter === 'all' || (debtFilter === 'completed' && Number(debt.remaining_balance) <= 0) || (debtFilter === 'active' && Number(debt.remaining_balance) > 0) || (debtFilter === 'overdue' && overdue));
  });

  const allActivities = useMemo(() => {
    const list = [];
    debts.forEach((debt) => {
      if (debt.installments && debt.installments.length > 0) {
        debt.installments.forEach((item) => {
          list.push({
            ...item,
            debtTitle: debt.title,
            type: debt.type || 'debt',
          });
        });
      }
    });
    return list.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
  }, [debts]);

  return (
    <div className="dashboard-wrapper">
      <video className="bg-video" autoPlay loop muted playsInline aria-hidden="true">
        <source src="/bg.mp4" type="video/mp4" />
      </video>
      <div className="bg-overlay" aria-hidden="true" />
      {/* Main Glass Window */}
      <div className="dashboard-layout">
        {/* Left Sidebar */}
        <aside className="sidebar">
          <div>
            <div className="brand-logo">
              <div className="brand-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span>SZFinance</span>
            </div>

            <ul className="nav-list">
              <li
                className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('Dashboard')}
              >
                <svg viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
                <span>Dashboard</span>
              </li>

              <li
                className={`nav-item ${activeTab === 'Obligations' ? 'active' : ''}`}
                onClick={() => setActiveTab('Obligations')}
              >
                <svg viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                <span>Obligations</span>
              </li>

              <li
                className={`nav-item ${activeTab === 'Activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('Activity')}
              >
                <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                <span>Activity</span>
              </li>

              <li
                className={`nav-item ${activeTab === 'Preferences' ? 'active' : ''}`}
                onClick={() => setActiveTab('Preferences')}
              >
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                <span>Preferences</span>
              </li>
            </ul>
          </div>

          <div className="nav-item logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
            <span>Logout</span>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="main-area">
          <header className="top-header">
            <div>
              <h1 className="welcome-title">Hi, {userEmail ? userEmail.split('@')[0] : 'Member'}!</h1>
            </div>

            <div className="header-actions">
              <button className="create-btn-pill" onClick={() => setActiveTab('Obligations')}>
                <span>+ Create</span>
              </button>
              <div className="user-avatar-pill">
                {avatarUrl ? <img src={avatarUrl} alt="Profile" style={avatarStyle} /> : (userEmail ? userEmail.charAt(0).toUpperCase() : 'U')}
              </div>
            </div>
          </header>

          {/* Animated View Container */}
          <div key={activeTab} className="page-transition-view">
{/* TAB 1: DASHBOARD */}
          {activeTab === 'Dashboard' && (
            <div>
              {/* 3-Card Row: Overall Info + Due Before 5th Widget + Progress Widgets */}
              <div className="top-widgets-row">
                {/* 1. Overall Information Card */}
                <div className="dark-stat-card">
                  <div className="dark-stat-header">
                    <span>Overall Information</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </div>
                  <div className="dark-stat-body">
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>
                      {formatCurrency(totalRemaining)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                      Active liabilities balance
                    </div>
                  </div>
                  <div className="stat-pill-row">
                    <div className="stat-inner-pill">
                      <div className="num">{debts.length}</div>
                      <div className="lbl">Total</div>
                    </div>
                    <div className="stat-inner-pill">
                      <div className="num">{installmentsCount}</div>
                      <div className="lbl">Installments</div>
                    </div>
                    <div className="stat-inner-pill">
                      <div className="num">{clearedCount}</div>
                      <div className="lbl">Cleared</div>
                    </div>
                  </div>
                </div>

                {/* 2. Due By 5th Breakdown Widget */}
                <DueBeforeFifthWidget debts={debts} />

                {/* 3. Progress Widgets */}
                <FinanceProgressWidgets debts={debts} />
              </div>

              {/* Due Date Schedule Chart */}
              <DueScheduleChart debts={debts} />
              <PaymentCalendar debts={debts} />
              <PaymentReminders debts={debts} />
              <DebtAnalytics debts={debts} />

              {/* Recent Commitments List */}
              <h3 style={{ margin: '30px 0 16px', fontSize: '16px', fontWeight: 700 }}>
                Recent Commitments ({debts.length})
              </h3>

                {loading && debts.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '13px' }}>Loading commitments...</p>
                ) : debts.length === 0 ? (
                  <div className="glass-panel" style={{ textAlign: 'center', color: '#6b7280', padding: '30px' }}>
                    No active debts or installments found.
                  </div>
                ) : (
                  <div className="card-grid">
                    {visibleDebts.slice(0, 3).map((debt) => (
                      <DebtCard key={debt.id} debt={debt} refreshData={loadData} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: OBLIGATIONS */}
            {activeTab === 'Obligations' && (
              <div>
                <AddDebtForm onDebtAdded={loadData} />

                <div className="debt-toolbar">
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search debts..." />
                  <select value={debtFilter} onChange={(e) => setDebtFilter(e.target.value)}>
                    <option value="all">All debts</option><option value="active">Active</option><option value="overdue">Due day passed</option><option value="completed">Completed</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>All Commitments</h3>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['all', 'debt', 'installment'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                      >
                        {cat === 'all' ? 'All' : cat === 'debt' ? 'Debts' : 'Installments'}
                      </button>
                    ))}
                  </div>
                </div>

                {debts.length === 0 ? (
                  <div className="glass-panel" style={{ textAlign: 'center', color: '#6b7280', padding: '30px' }}>
                    No records found.
                  </div>
                ) : (
                  <div className="card-grid">
                    {visibleDebts
                      .filter((d) => categoryFilter === 'all' || (d.type || 'debt') === categoryFilter)
                      .map((debt) => (
                        <DebtCard key={debt.id} debt={debt} refreshData={loadData} />
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ACTIVITY */}
            {activeTab === 'Activity' && (
              <div className="glass-panel">
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Transaction Log</h3>
                {allActivities.length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', margin: '20px 0' }}>No activity logged yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {allActivities.map((act) => (
                      <div
                        key={act.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '14px 18px',
                          background: '#f9fafb',
                          borderRadius: '16px',
                          border: '1px solid #f3f4f6',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{act.debtTitle}</span>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', background: '#e5e7eb', color: '#4b5563' }}>
                              {act.type}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            Paid on {formatDate(act.payment_date)}
                          </div>
                        </div>
                        <div style={{ color: '#111827', fontWeight: '800', fontSize: '15px' }}>
                          +{formatCurrency(act.amount_paid)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: PREFERENCES */}
            {activeTab === 'Preferences' && (
              <div className="glass-panel preferences-panel">
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Preferences</h3>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                    Account Email
                  </label>
                  <input type="text" value={userEmail} disabled style={{ width: '100%' }} />
                </div>
                <div className="profile-photo-section">
                  <div className="profile-photo-preview">
                    {avatarUrl ? <img src={avatarUrl} alt="Profile preview" style={avatarStyle} /> : (userEmail ? userEmail.charAt(0).toUpperCase() : 'U')}
                  </div>
                  <div><strong>Profile photo</strong><small>JPG, PNG or GIF</small><div className="photo-actions"><label className="upload-photo-button">Change photo<input type="file" accept="image/*" onChange={handleAvatarUpload} /></label>{avatarUrl && <button type="button" className="remove-photo-button" onClick={removeAvatar}>Remove</button>}</div></div>
                </div>
                {avatarUrl && <div className="photo-adjustments">
                  <label>Zoom <input type="range" min="1" max="2" step="0.05" value={avatarZoom} onChange={(e) => updateAvatarZoom(e.target.value)} /></label>
                  <label>Vertical position <input type="range" min="0" max="100" value={parseInt(avatarPosition, 10)} onChange={(e) => updateAvatarPosition(`${e.target.value}%`)} /></label>
                </div>}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                    Active Currency
                  </label>
                  <input type="text" value="MYR (Malaysian Ringgit)" disabled style={{ width: '100%' }} />
                </div>
                <form className="credential-form" onSubmit={handleCredentialUpdate}>
                  <h4>Change credentials</h4>
                  <input type="email" placeholder="New email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  <input type="password" placeholder="New password" minLength="6" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button type="submit">Save Changes</button>
                  {credentialMessage && <small>{credentialMessage}</small>}
                </form>
                <button onClick={handleLogout} style={{ width: '100%', background: '#ef4444' }}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
