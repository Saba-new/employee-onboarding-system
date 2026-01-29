import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function EmployeeDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canSubmit, setCanSubmit] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Get user's requests
      const { data } = await api.get('/onboarding/my-requests');
      setRequests(data.data);

      // Check if can submit
      const canSubmitRes = await api.get('/onboarding/can-submit');
      setCanSubmit(canSubmitRes.data.data.canSubmit);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

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
          <h1>Employee Dashboard</h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>Welcome, {user.firstName}!</span>
            <button onClick={logout} className="btn btn-secondary">Logout</button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2>My Onboarding Requests</h2>
            {canSubmit && (
              <button onClick={() => navigate('/employee/create')} className="btn btn-primary">
                Create New Request
              </button>
            )}
          </div>

          {!canSubmit && (
            <div className="alert alert-info">
              You have a pending request. Please wait for admin review before creating a new one.
            </div>
          )}

          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No onboarding requests yet.</p>
              {canSubmit && (
                <button onClick={() => navigate('/employee/create')} className="btn btn-primary">
                  Create Your First Request
                </button>
              )}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Created Date</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request.id}>
                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                    <td>{request.first_name} {request.last_name}</td>
                    <td>{request.email}</td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>
                      <button 
                        onClick={() => navigate(`/employee/onboarding/${request.id}`)}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        View Details
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

export default EmployeeDashboard;
