import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import {
  useGetAllUsersQuery,
  useGetDailyReportQuery,
  useValidateAttendanceMutation,
  useGetPendingOvertimeQuery,
  useUpdateOvertimeStatusMutation,
  useGetPendingLeavesQuery,
  useUpdateLeaveStatusMutation,
  useCreateUserMutation,
  useGetPendingManualPunchesQuery,
  useUpdateManualPunchStatusMutation,
} from '../features/api/apiSlice';
import LocationPicker from '../components/LocationPicker';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [usersPage, setUsersPage] = useState(1);
  const { data: usersData, isLoading: usersLoading } = useGetAllUsersQuery(usersPage);
  const { data: reportData, isLoading: reportLoading } = useGetDailyReportQuery(reportDate);
  const { data: otData, isLoading: otLoading } = useGetPendingOvertimeQuery();
  const { data: leaveData, isLoading: leaveLoading } = useGetPendingLeavesQuery();
  const { data: manualData, isLoading: manualLoading } = useGetPendingManualPunchesQuery();
  const [updateOTStatus, { isLoading: otUpdating }] = useUpdateOvertimeStatusMutation();
  const [updateLeaveStatus, { isLoading: leaveUpdating }] = useUpdateLeaveStatusMutation();
  const [updateManualStatus, { isLoading: manualUpdating }] = useUpdateManualPunchStatusMutation();
  const [createUser, { isLoading: creatingUser }] = useCreateUserMutation();
  const [validateAttendance, { isLoading: validating }] = useValidateAttendanceMutation();

  const allUsers = usersData?.data?.users || [];
  const report = reportData?.data?.report || [];
  const pendingOT = otData?.data?.requests || [];
  const pendingLeaves = leaveData?.data?.leaves || [];
  const pendingManual = manualData?.data?.requests || [];

  // Validation modal state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [valRemarks, setValRemarks] = useState('');
  const [otRemarks, setOtRemarks] = useState({});
  const [leaveRemarks, setLeaveRemarks] = useState({});
  const [manualRemarks, setManualRemarks] = useState({});

  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPass, setEmpPass] = useState('');
  const [empLat, setEmpLat] = useState('');
  const [empLon, setEmpLon] = useState('');
  const [empRadius, setEmpRadius] = useState(500);
  const [empSuccess, setEmpSuccess] = useState('');

  const handleValidate = async (status) => {
    if (!selectedRecord) return;
    try {
      await validateAttendance({ id: selectedRecord.attendanceId, status, remarks: valRemarks }).unwrap();
      setSelectedRecord(null);
      setValRemarks('');
    } catch (err) { console.error(err); }
  };

  const handleOTAction = async (id, status) => {
    try {
      await updateOTStatus({ id, status, managerRemarks: otRemarks[id] || '' }).unwrap();
    } catch (err) { console.error(err); }
  };

  const handleLeaveAction = async (id, status) => {
    try {
      await updateLeaveStatus({ id, status, managerRemarks: leaveRemarks[id] || '' }).unwrap();
    } catch (err) { console.error(err); }
  };

  const handleManualAction = async (id, status) => {
    try {
      await updateManualStatus({ id, status, managerRemarks: manualRemarks[id] || '' }).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await createUser({
        name: empName, email: empEmail, password: empPass, role: 'Employee',
        worksiteLat: empLat ? parseFloat(empLat) : null,
        worksiteLon: empLon ? parseFloat(empLon) : null,
        worksiteRadius: empRadius ? parseInt(empRadius) : 500
      }).unwrap();
      setEmpSuccess('Employee created successfully!');
      setEmpName(''); setEmpEmail(''); setEmpPass(''); setEmpLat(''); setEmpLon('');
      setTimeout(() => setEmpSuccess(''), 3000);
    } catch (err) { alert(err.data?.message || 'Error creating user'); }
  };

  const handleExportCSV = () => {
    if (!report || report.length === 0) return;
    const headers = ['Name', 'Punch In', 'Punch Out', 'Hours', 'Status', 'Validation'];
    const csvRows = [headers.join(',')];
    report.forEach(r => {
      const inTime = new Date(r.punchInTime).toLocaleString();
      const outTime = r.punchOutTime ? new Date(r.punchOutTime).toLocaleString() : '—';
      const hours = r.totalWorkingHours || '—';
      csvRows.push(`"${r.name}","${inTime}","${outTime}","${hours}","${r.status}","${r.adminValidationStatus}"`);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${reportDate}.csv`;
    a.click();
  };

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  const roleBadge = (role) => {
    const map = { Admin: 'badge-purple', Manager: 'badge-blue', Employee: 'badge-muted' };
    return <span className={`badge ${map[role] || 'badge-muted'}`}>{role}</span>;
  };
  const statusBadge = (status) => {
    const map = { Completed: 'badge-green', Incomplete: 'badge-amber', Pending: 'badge-blue', Valid: 'badge-green', Invalid: 'badge-red' };
    return <span className={`badge ${map[status] || 'badge-muted'}`}>{status}</span>;
  };

  return (
    <div className="dashboard-container admin-dash">
      <header className="dashboard-header glass-panel">
        <div>
          <h1 className="dashboard-title">Admin Console</h1>
          <p className="header-role">Welcome, {user?.name || 'Admin'}</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary">Logout</button>
      </header>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card glass-panel"><span className="stat-value">{allUsers.length}</span><span className="stat-label">Total Users</span></div>
        <div className="stat-card glass-panel"><span className="stat-value">{report.length}</span><span className="stat-label">Today's Records</span></div>
        <div className="stat-card glass-panel"><span className="stat-value">{pendingOT.length}</span><span className="stat-label">Pending OT</span></div>
      </div>

      {/* Users List */}
      <section className="dash-section glass-panel">
        <h2 className="section-title">All Users</h2>
        {usersLoading ? <p className="muted-text">Loading...</p> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
              <tbody>
                {allUsers.map(u => (
                  <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{roleBadge(u.role)}</td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <button className="btn-secondary btn-sm" disabled={usersPage === 1} onClick={() => setUsersPage(p => p - 1)}>Previous</button>
              <span className="muted-text">Page {usersData?.page || 1} of {usersData?.totalPages || 1}</span>
              <button className="btn-secondary btn-sm" disabled={!usersData?.totalPages || usersPage >= usersData.totalPages} onClick={() => setUsersPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </section>

      {/* System-wide Attendance */}
      <section className="dash-section glass-panel">
        <div className="section-head">
          <h2 className="section-title">Attendance Records</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn-secondary btn-sm" onClick={handleExportCSV}>Export CSV</button>
            <input type="date" className="date-picker" value={reportDate} onChange={e => setReportDate(e.target.value)} />
          </div>
        </div>
        {reportLoading ? <p className="muted-text">Loading...</p> : report.length === 0 ? <p className="muted-text">No records.</p> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Name</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th><th>Validation</th><th>Action</th></tr></thead>
              <tbody>
                {report.map(r => (
                  <tr key={r.attendanceId}>
                    <td>{r.name}</td>
                    <td>{new Date(r.punchInTime).toLocaleTimeString()}</td>
                    <td>{r.punchOutTime ? new Date(r.punchOutTime).toLocaleTimeString() : '—'}</td>
                    <td>{r.totalWorkingHours ? r.totalWorkingHours.toFixed(2) : '—'}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td>{statusBadge(r.adminValidationStatus)}</td>
                    <td>
                      <button className="btn-sm btn-primary" onClick={() => { setSelectedRecord(r); setValRemarks(''); }}>Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Validation Modal */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal glass-panel" onClick={e => e.stopPropagation()}>
            <h2 className="section-title">Validate — {selectedRecord.name}</h2>
            <p className="muted-text">{new Date(selectedRecord.punchInTime).toLocaleString()}</p>

            <div className="selfie-grid">
              <div className="selfie-item">
                <p className="selfie-label">Punch-in Selfie</p>
                {selectedRecord.punchInSelfie ? (
                  <img src={selectedRecord.punchInSelfie} alt="Punch-in selfie" className="selfie-img" />
                ) : <p className="muted-text">No selfie</p>}
              </div>
              <div className="selfie-item">
                <p className="selfie-label">Punch-out Selfie</p>
                {selectedRecord.punchOutSelfie ? (
                  <img src={selectedRecord.punchOutSelfie} alt="Punch-out selfie" className="selfie-img" />
                ) : <p className="muted-text">No selfie</p>}
              </div>
            </div>

            <div className="modal-details">
              <p><strong>Working Hours:</strong> {selectedRecord.totalWorkingHours?.toFixed(2) || '—'}</p>
              <p><strong>Status:</strong> {selectedRecord.status}</p>
              <p><strong>Current Validation:</strong> {selectedRecord.adminValidationStatus}</p>
            </div>

            <div className="input-group">
              <label>Remarks</label>
              <input
                type="text"
                value={valRemarks}
                onChange={e => setValRemarks(e.target.value)}
                placeholder="Add validation remarks..."
              />
            </div>

            <div className="modal-actions">
              <button className="btn-approve" onClick={() => handleValidate('Valid')} disabled={validating}>✓ Mark Valid</button>
              <button className="btn-reject" onClick={() => handleValidate('Invalid')} disabled={validating}>✗ Mark Invalid</button>
              <button className="btn-secondary" onClick={() => setSelectedRecord(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Overtime */}
      <section className="dash-section glass-panel">
        <h2 className="section-title">Pending Overtime Requests</h2>
        {otLoading ? <p className="muted-text">Loading...</p> : pendingOT.length === 0 ? <p className="muted-text">No pending requests.</p> : (
          <div className="ot-cards">
            {pendingOT.map(req => (
              <div key={req._id} className="ot-card glass-panel">
                <div className="ot-card-header">
                  <strong>{req.user?.name || 'Employee'}</strong>
                  <span className="muted-text">{new Date(req.date).toLocaleDateString()}</span>
                </div>
                <p className="ot-hours">{req.requestedHours} hours requested</p>
                <div className="input-group">
                  <input type="text" placeholder="Remarks (optional)" value={otRemarks[req._id] || ''}
                    onChange={e => setOtRemarks(prev => ({ ...prev, [req._id]: e.target.value }))} />
                </div>
                <div className="ot-actions">
                  <button className="btn-approve" onClick={() => handleOTAction(req._id, 'Approved')} disabled={otUpdating}>✓ Approve</button>
                  <button className="btn-reject" onClick={() => handleOTAction(req._id, 'Rejected')} disabled={otUpdating}>✗ Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Leaves */}
      <section className="dash-section glass-panel">
        <h2 className="section-title">Pending Leave Requests</h2>
        {leaveLoading ? <p className="muted-text">Loading...</p> : pendingLeaves.length === 0 ? <p className="muted-text">No pending leaves.</p> : (
          <div className="ot-cards">
            {pendingLeaves.map(req => (
              <div key={req._id} className="ot-card glass-panel">
                <div className="ot-card-header">
                  <strong>{req.user?.name || 'Employee'}</strong>
                  <span className="muted-text">{new Date(req.startDate).toLocaleDateString()}</span>
                </div>
                <p className="ot-hours" style={{ fontSize: '0.95rem' }}>{req.reason}</p>
                <p className="muted-text">Until: {new Date(req.endDate).toLocaleDateString()}</p>
                <div className="input-group" style={{ marginTop: '0.75rem' }}>
                  <input type="text" placeholder="Remarks (optional)" value={leaveRemarks[req._id] || ''}
                    onChange={e => setLeaveRemarks(prev => ({ ...prev, [req._id]: e.target.value }))} />
                </div>
                <div className="ot-actions">
                  <button className="btn-approve" onClick={() => handleLeaveAction(req._id, 'Approved')} disabled={leaveUpdating}>✓ Approve</button>
                  <button className="btn-reject" onClick={() => handleLeaveAction(req._id, 'Rejected')} disabled={leaveUpdating}>✗ Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Manual Punches */}
      <section className="dash-section glass-panel">
        <h2 className="section-title">Pending Manual Punches</h2>
        {manualLoading ? <p className="muted-text">Loading...</p> : pendingManual.length === 0 ? <p className="muted-text">No pending manual punches.</p> : (
          <div className="ot-cards">
            {pendingManual.map(req => (
              <div key={req._id} className="ot-card glass-panel">
                <div className="ot-card-header">
                  <strong>{req.user?.name || 'Employee'}</strong>
                  <span className="muted-text">{new Date(req.date).toLocaleDateString()}</span>
                </div>
                <p className="ot-hours" style={{ fontSize: '0.95rem' }}>{req.reason}</p>
                <div style={{ margin: '0.5rem 0', fontSize: '0.85rem' }}>
                  <p><strong>In:</strong> {req.punchInTime ? new Date(req.punchInTime).toLocaleTimeString() : 'N/A'}</p>
                  <p><strong>Out:</strong> {req.punchOutTime ? new Date(req.punchOutTime).toLocaleTimeString() : 'N/A'}</p>
                </div>
                <div className="input-group" style={{ marginTop: '0.75rem' }}>
                  <input type="text" placeholder="Remarks (optional)" value={manualRemarks[req._id] || ''}
                    onChange={e => setManualRemarks(prev => ({ ...prev, [req._id]: e.target.value }))} />
                </div>
                <div className="ot-actions">
                  <button className="btn-approve" onClick={() => handleManualAction(req._id, 'Approved')} disabled={manualUpdating}>✓ Approve</button>
                  <button className="btn-reject" onClick={() => handleManualAction(req._id, 'Rejected')} disabled={manualUpdating}>✗ Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Employee */}
      <section className="dash-section glass-panel">
        <h2 className="section-title">Add New Employee</h2>
        {empSuccess && <div className="success-message">{empSuccess}</div>}
        <form onSubmit={handleCreateEmployee} className="ot-form" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="input-group">
              <label>Name</label>
              <input type="text" value={empName} onChange={e => setEmpName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input type="email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="text" value={empPass} onChange={e => setEmpPass(e.target.value)} required />
            </div>
          </div>
          
          <h3 className="section-subtitle" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Geofencing (Drop a Pin on Map)</h3>
          
          <LocationPicker 
            lat={empLat} 
            lon={empLon} 
            radius={empRadius}
            onLocationSelect={(lat, lon) => { setEmpLat(lat); setEmpLon(lon); }} 
          />

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="input-group">
              <label>Selected Latitude</label>
              <input type="text" value={empLat} readOnly className="muted-input" />
            </div>
            <div className="input-group">
              <label>Selected Longitude</label>
              <input type="text" value={empLon} readOnly className="muted-input" />
            </div>
            <div className="input-group">
              <label>Radius (meters)</label>
              <input type="number" value={empRadius} onChange={e => setEmpRadius(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn-primary" disabled={creatingUser}>
              {creatingUser ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default AdminDashboard;
