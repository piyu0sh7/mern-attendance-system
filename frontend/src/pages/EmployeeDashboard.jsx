import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import {
  useGetMyAttendanceQuery,
  useGetMyOvertimeRequestsQuery,
  useSubmitOvertimeMutation,
  useGetMyLeavesQuery,
  useSubmitLeaveMutation,
  useGetMyManualPunchesQuery,
  useSubmitManualPunchMutation,
} from '../features/api/apiSlice';
import AttendanceAction from '../components/AttendanceAction';

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [attPage, setAttPage] = useState(1);
  const { data: attendanceData, isLoading: attLoading } = useGetMyAttendanceQuery(attPage);
  const { data: overtimeData, isLoading: otLoading } = useGetMyOvertimeRequestsQuery();
  const { data: leaveData, isLoading: leaveLoading } = useGetMyLeavesQuery();
  const { data: manualData, isLoading: manualLoading } = useGetMyManualPunchesQuery();
  
  const [submitOvertime, { isLoading: submittingOT }] = useSubmitOvertimeMutation();
  const [submitLeave, { isLoading: submittingLeave }] = useSubmitLeaveMutation();
  const [submitManualPunch, { isLoading: submittingManual }] = useSubmitManualPunchMutation();

  const [otDate, setOtDate] = useState('');
  const [otHours, setOtHours] = useState('');
  const [otSuccess, setOtSuccess] = useState('');

  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSuccess, setLeaveSuccess] = useState('');

  const [mpDate, setMpDate] = useState('');
  const [mpInTime, setMpInTime] = useState('');
  const [mpOutTime, setMpOutTime] = useState('');
  const [mpReason, setMpReason] = useState('');
  const [mpSuccess, setMpSuccess] = useState('');

  const attendances = attendanceData?.data?.attendances || [];
  const overtimeRequests = overtimeData?.data?.requests || [];
  const leaveRequests = leaveData?.data?.leaves || [];
  const manualRequests = manualData?.data?.requests || [];

  const totalHoursThisMonth = attendances
    .filter(a => {
      const d = new Date(a.punchInTime);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, a) => sum + (a.totalWorkingHours || 0), 0);

  const handleOvertimeSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitOvertime({ date: otDate, requestedHours: Number(otHours) }).unwrap();
      setOtSuccess('Overtime request submitted!');
      setOtDate('');
      setOtHours('');
      setTimeout(() => setOtSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitLeave({ startDate: leaveStart, endDate: leaveEnd, reason: leaveReason }).unwrap();
      setLeaveSuccess('Leave request submitted!');
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
      setTimeout(() => setLeaveSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualPunchSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { date: mpDate, reason: mpReason };
      if (mpInTime) payload.punchInTime = new Date(`${mpDate}T${mpInTime}`);
      if (mpOutTime) payload.punchOutTime = new Date(`${mpDate}T${mpOutTime}`);
      
      await submitManualPunch(payload).unwrap();
      setMpSuccess('Manual punch request submitted!');
      setMpDate(''); setMpInTime(''); setMpOutTime(''); setMpReason('');
      setTimeout(() => setMpSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  const statusBadge = (status) => {
    const map = { Completed: 'badge-green', Incomplete: 'badge-amber', Pending: 'badge-blue', Approved: 'badge-green', Rejected: 'badge-red' };
    return <span className={`badge ${map[status] || 'badge-muted'}`}>{status}</span>;
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header glass-panel">
        <div>
          <h1 className="dashboard-title">Hi, {user?.name || 'Employee'} 👋</h1>
          <p className="header-role">Employee Dashboard</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary">Logout</button>
      </header>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card glass-panel">
          <span className="stat-value">{totalHoursThisMonth.toFixed(1)}</span>
          <span className="stat-label">Hours this month</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-value">{attendances.length}</span>
          <span className="stat-label">Total Shifts</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-value">{overtimeRequests.filter(r => r.status === 'Pending').length}</span>
          <span className="stat-label">Pending OT</span>
        </div>
      </div>

      {/* Punch In/Out */}
      <section className="dash-section glass-panel">
        <AttendanceAction />
      </section>

      {/* Attendance History */}
      <section className="dash-section glass-panel">
        <h2 className="section-title">Attendance History</h2>
        {attLoading ? <p className="muted-text">Loading...</p> : attendances.length === 0 ? <p className="muted-text">No records yet.</p> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Punch In</th><th>Punch Out</th><th>Hours</th><th>Status</th></tr>
              </thead>
              <tbody>
                {attendances.map(a => (
                  <tr key={a._id}>
                    <td>{new Date(a.punchInTime).toLocaleDateString()}</td>
                    <td>{new Date(a.punchInTime).toLocaleTimeString()}</td>
                    <td>{a.punchOutTime ? new Date(a.punchOutTime).toLocaleTimeString() : '—'}</td>
                    <td>{a.totalWorkingHours ? a.totalWorkingHours.toFixed(2) : '—'}</td>
                    <td>{statusBadge(a.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <button className="btn-secondary btn-sm" disabled={attPage === 1} onClick={() => setAttPage(p => p - 1)}>Previous</button>
              <span className="muted-text">Page {attendanceData?.page || 1} of {attendanceData?.totalPages || 1}</span>
              <button className="btn-secondary btn-sm" disabled={!attendanceData?.totalPages || attPage >= attendanceData.totalPages} onClick={() => setAttPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </section>

      {/* Overtime Request Form */}
      <section className="dash-section glass-panel">
        <h2 className="section-title">Submit Overtime Request</h2>
        {otSuccess && <div className="success-message">{otSuccess}</div>}
        <form onSubmit={handleOvertimeSubmit} className="ot-form">
          <div className="input-group">
            <label htmlFor="ot-date">Date</label>
            <input type="date" id="ot-date" value={otDate} onChange={e => setOtDate(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="ot-hours">Hours</label>
            <input type="number" id="ot-hours" value={otHours} onChange={e => setOtHours(e.target.value)} min="0.5" step="0.5" placeholder="e.g. 2" required />
          </div>
          <button type="submit" className="btn-primary" disabled={submittingOT}>{submittingOT ? 'Submitting…' : 'Submit Request'}</button>
        </form>

        {/* My OT requests */}
        <h3 className="section-subtitle">My Overtime Requests</h3>
        {otLoading ? <p className="muted-text">Loading...</p> : overtimeRequests.length === 0 ? <p className="muted-text">No overtime requests.</p> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Hours</th><th>Status</th><th>Remarks</th></tr>
              </thead>
              <tbody>
                {overtimeRequests.map(r => (
                  <tr key={r._id}>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>{r.requestedHours}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td>{r.managerRemarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Leave Request Form */}
      <section className="dash-section glass-panel">
        <h2 className="section-title">Submit Leave Request</h2>
        {leaveSuccess && <div className="success-message">{leaveSuccess}</div>}
        <form onSubmit={handleLeaveSubmit} className="ot-form" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="input-group">
              <label>Start Date</label>
              <input type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>End Date</label>
              <input type="date" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} required />
            </div>
          </div>
          <div className="input-group" style={{ marginTop: '1rem' }}>
            <label>Reason</label>
            <input type="text" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="e.g. Medical emergency" required />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={submittingLeave}>{submittingLeave ? 'Submitting…' : 'Submit Leave Request'}</button>
          </div>
        </form>

        {/* My Leave requests */}
        <h3 className="section-subtitle">My Leave Requests</h3>
        {leaveLoading ? <p className="muted-text">Loading...</p> : leaveRequests.length === 0 ? <p className="muted-text">No leave requests.</p> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Dates</th><th>Reason</th><th>Status</th><th>Remarks</th></tr>
              </thead>
              <tbody>
                {leaveRequests.map(r => (
                  <tr key={r._id}>
                    <td>{new Date(r.startDate).toLocaleDateString()} to {new Date(r.endDate).toLocaleDateString()}</td>
                    <td>{r.reason}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td>{r.managerRemarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Manual Punch Request Form */}
      <section className="dash-section glass-panel">
        <h2 className="section-title">Request Manual Attendance Adjustment</h2>
        {mpSuccess && <div className="success-message">{mpSuccess}</div>}
        <form onSubmit={handleManualPunchSubmit} className="ot-form" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="input-group">
              <label>Date of Missed Punch</label>
              <input type="date" value={mpDate} onChange={e => setMpDate(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Correct Punch In Time (optional)</label>
              <input type="time" value={mpInTime} onChange={e => setMpInTime(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Correct Punch Out Time (optional)</label>
              <input type="time" value={mpOutTime} onChange={e => setMpOutTime(e.target.value)} />
            </div>
          </div>
          <div className="input-group" style={{ marginTop: '1rem' }}>
            <label>Reason for Request</label>
            <input type="text" value={mpReason} onChange={e => setMpReason(e.target.value)} placeholder="e.g. Phone died, system crash" required />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={submittingManual}>{submittingManual ? 'Submitting…' : 'Submit Manual Request'}</button>
          </div>
        </form>

        {/* My Manual Punch requests */}
        <h3 className="section-subtitle">My Adjustment Requests</h3>
        {manualLoading ? <p className="muted-text">Loading...</p> : manualRequests.length === 0 ? <p className="muted-text">No requests.</p> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>In</th><th>Out</th><th>Reason</th><th>Status</th><th>Remarks</th></tr>
              </thead>
              <tbody>
                {manualRequests.map(r => (
                  <tr key={r._id}>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>{r.punchInTime ? new Date(r.punchInTime).toLocaleTimeString() : '—'}</td>
                    <td>{r.punchOutTime ? new Date(r.punchOutTime).toLocaleTimeString() : '—'}</td>
                    <td>{r.reason}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td>{r.managerRemarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default EmployeeDashboard;
