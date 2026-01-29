import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function OnboardingDetails() {
  const [request, setRequest] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('resume');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchDetails() {
    try {
      const { data } = await api.get(`/onboarding/${id}/details`);
      setRequest(data.data);
      setDocuments(data.data.documents || []);
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e) {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('onboarding_request_id', id);
      formData.append('document_type', documentType);

      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFile(null);
      fetchDetails();
    } catch (error) {
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  }

  async function handleApprove() {
    if (!window.confirm('Are you sure you want to approve this request?')) return;
    
    try {
      setActionLoading(true);
      await api.put(`/admin/onboarding/${id}/approve`, {
        status: 'approved',
        remarks: remarks || 'Approved'
      });
      alert('Request approved successfully');
      navigate('/admin');
    } catch (error) {
      alert('Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!remarks) {
      alert('Please provide rejection remarks');
      return;
    }
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    
    try {
      setActionLoading(true);
      await api.put(`/admin/onboarding/${id}/reject`, {
        status: 'rejected',
        remarks
      });
      alert('Request rejected');
      navigate('/admin');
    } catch (error) {
      alert('Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownload(docId, fileName) {
    try {
      // Get the signed URL from the backend
      const { data } = await api.get(`/documents/${docId}/download`);
      
      // Use the signed URL to download the file
      const link = document.createElement('a');
      link.href = data.data.url;
      link.setAttribute('download', fileName);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
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

  if (loading) return <div className="loading">Loading...</div>;
  if (!request) return <div className="container">Request not found</div>;

  return (
    <div>
      <div className="navbar">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1>Onboarding Request Details</h1>
        </div>
      </div>

      <div className="container">
        <button 
          onClick={() => navigate(isAdmin ? '/admin' : '/employee')}
          className="btn btn-secondary"
          style={{ marginBottom: '16px' }}
        >
          ← Back to Dashboard
        </button>

        <div className="card">
          <h2 style={{ marginBottom: '16px' }}>
            {request.first_name} {request.last_name} {getStatusBadge(request.status)}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <p><strong>Email:</strong> {request.email}</p>
              <p><strong>Phone:</strong> {request.phone}</p>
              <p><strong>Date of Birth:</strong> {new Date(request.date_of_birth).toLocaleDateString()}</p>
            </div>
            <div>
              <p><strong>Address:</strong> {request.address}</p>
              <p><strong>Submitted:</strong> {new Date(request.created_at).toLocaleString()}</p>
              <p><strong>Status:</strong> {request.status}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Documents ({documents.length})</h3>
          
          {request.status === 'pending' && !isAdmin && (
            <form onSubmit={handleFileUpload} style={{ marginBottom: '16px', padding: '16px', background: '#f8f9fa', borderRadius: '4px' }}>
              <div className="form-group">
                <label>Document Type</label>
                <select 
                  className="form-control"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  <option value="resume">Resume</option>
                  <option value="id_proof">ID Proof</option>
                  <option value="address_proof">Address Proof</option>
                  <option value="education">Education Certificate</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Choose File</label>
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={!file || uploading}>
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          )}

          {documents.length === 0 ? (
            <p style={{ color: '#666' }}>No documents uploaded yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id}>
                    <td>{doc.file_name}</td>
                    <td>{doc.document_type}</td>
                    <td>{(doc.file_size / 1024).toFixed(2)} KB</td>
                    <td>{new Date(doc.uploaded_at).toLocaleString()}</td>
                    <td>
                      <button 
                        onClick={() => handleDownload(doc.id, doc.file_name)}
                        className="btn btn-primary btn-sm"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {isAdmin && request.status === 'pending' && (
          <div className="card">
            <h3>Admin Actions</h3>
            <div className="form-group">
              <label>Remarks (minimum 10 characters required)</label>
              <textarea
                className="form-control"
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks (at least 10 characters). Example: Looks good, approved"
              />
              <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                {remarks.length}/10 characters
              </small>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleApprove}
                className="btn btn-success"
                disabled={actionLoading}
              >
                Approve
              </button>
              <button 
                onClick={handleReject}
                className="btn btn-danger"
                disabled={actionLoading}
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingDetails;
