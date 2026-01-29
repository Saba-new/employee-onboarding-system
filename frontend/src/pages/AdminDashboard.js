import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const statsRes = await api.get('/admin/dashboard/stats');
      setStats(statsRes.data.data);

      const endpoint = filter === 'pending' 
        ? '/admin/onboarding/pending' 
        : `/admin/onboarding?status=${filter}`;
      
      const { data } = await api.get(endpoint);
      setRequests(data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function getStatusBadge(status) {
    const classes = {
      pending: 'badge-pending',
      approved: 'badge-approved',
      rejected: 'badge-rejected'
    };
    return <span className={`badge ${classes[status]}`}>{status.toUpperCase()}</span>;
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="navbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <h1>Admin Dashboard</h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>Admin: {user.firstName}</span>
            <button onClick={logout} className="btn btn-secondary">Logout</button>
          </div>
        </div>
      </div>

      <div className="container">
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="card">
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>Total Requests</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.total}</p>
            </div>
            <div className="card">
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>Pending</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>{stats.pending}</p>
            </div>
            <div className="card">
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>Approved</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>{stats.approved}</p>
            </div>
            <div className="card">
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>Rejected</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>{stats.rejected}</p>
            </div>
          </div>
        )}

        <div className="card">
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setFilter('pending')}
              className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Pending ({stats?.pending || 0})
            </button>
            <button 
              onClick={() => setFilter('approved')}
              className={`btn ${filter === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Approved ({stats?.approved || 0})
            </button>
            <button 
              onClick={() => setFilter('rejected')}
              className={`btn ${filter === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Rejected ({stats?.rejected || 0})
            </button>
          </div>

          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No {filter} requests found.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request.id}>
                    <td>{request.first_name} {request.last_name}</td>
                    <td>{request.email}</td>
                    <td>{request.phone}</td>
                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>
                      <button 
                        onClick={() => navigate(`/admin/onboarding/${request.id}`)}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
