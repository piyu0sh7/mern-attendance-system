import React, { useState, useRef, useCallback, useEffect } from 'react';
import { usePunchInMutation, usePunchOutMutation, useGetMyAttendanceQuery } from '../features/api/apiSlice';

const AttendanceAction = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [actionType, setActionType] = useState(null); // 'punchIn' or 'punchOut'
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [punchIn, { isLoading: isPunchingIn, error: punchInError }] = usePunchInMutation();
  const [punchOut, { isLoading: isPunchingOut, error: punchOutError }] = usePunchOutMutation();
  const { data: historyData, isLoading: isHistoryLoading } = useGetMyAttendanceQuery();

  const activeRecords = historyData?.data?.attendances?.filter(r => !r.punchOutTime) || [];

  // ---------- Geolocation ----------
  const captureLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setLocation(loc);
          setLocationError(null);
          resolve(loc);
        },
        (err) => {
          setLocationError('Location permission denied. Please enable it.');
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  // ---------- Camera ----------
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 480, height: 360 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setCapturedImage(null);
    } catch {
      alert('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const captureSelfie = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.7);
    setCapturedImage(base64);
    stopCamera();
    return base64;
  }, [stopCamera]);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  // ---------- Flow ----------
  const initiateAction = useCallback(async (type, recordId = null) => {
    setActionType(type);
    setSelectedRecordId(recordId);
    setSuccessMsg('');
    setCapturedImage(null);
    setLocation(null);
    setLocationError(null);
    await startCamera();
  }, [startCamera]);

  const cancelAction = useCallback(() => {
    stopCamera();
    setActionType(null);
    setSelectedRecordId(null);
    setCapturedImage(null);
    setLocation(null);
    setLocationError(null);
  }, [stopCamera]);

  const handleSubmit = useCallback(async () => {
    try {
      // 1. Get location
      const loc = location || await captureLocation();
      // 2. Use captured selfie
      if (!capturedImage) {
        alert('Please capture a selfie first.');
        return;
      }

      const payload = { latitude: loc.latitude, longitude: loc.longitude, selfie: capturedImage };

      if (actionType === 'punchIn') {
        await punchIn(payload).unwrap();
        setSuccessMsg('Punched in successfully!');
      } else if (actionType === 'punchOut' && selectedRecordId) {
        await punchOut({ id: selectedRecordId, ...payload }).unwrap();
        setSuccessMsg('Punched out successfully!');
      }
      setActionType(null);
      setSelectedRecordId(null);
      setCapturedImage(null);
      setLocation(null);
    } catch (err) {
      console.error('Punch action failed:', err);
    }
  }, [actionType, capturedImage, captureLocation, location, punchIn, punchOut, selectedRecordId]);

  const isSubmitting = isPunchingIn || isPunchingOut;
  const apiError = punchInError || punchOutError;

  return (
    <div className="attendance-action-section">
      <h2 className="section-title">Attendance</h2>

      {/* Success Toast */}
      {successMsg && <div className="success-message">{successMsg}</div>}

      {/* Error Toast */}
      {apiError && <div className="error-message">{apiError.data?.message || 'Something went wrong'}</div>}
      {locationError && <div className="error-message">{locationError}</div>}

      {/* Action Buttons (visible when camera is NOT active) */}
      {!actionType && (
        <div className="punch-buttons">
          <button className="btn-punch btn-punch-in" onClick={() => initiateAction('punchIn')}>
            <span className="btn-icon">🟢</span> Punch In
          </button>

          {activeRecords.length > 0 && (
            <div className="active-records">
              <p className="active-label">Active shifts — select one to punch out:</p>
              {activeRecords.map(record => (
                <button
                  key={record._id}
                  className="btn-punch btn-punch-out"
                  onClick={() => initiateAction('punchOut', record._id)}
                >
                  <span className="btn-icon">🔴</span> Punch Out — {new Date(record.punchInTime).toLocaleTimeString()}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Camera + Capture UI */}
      {actionType && (
        <div className="camera-section glass-panel">
          <h3>{actionType === 'punchIn' ? 'Punch In Selfie' : 'Punch Out Selfie'}</h3>

          {cameraActive && (
            <div className="video-wrapper">
              <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
              <button className="btn-capture" onClick={captureSelfie}>📸 Capture</button>
            </div>
          )}

          {capturedImage && (
            <div className="preview-wrapper">
              <img src={capturedImage} alt="Selfie preview" className="selfie-preview" />
              <div className="preview-actions">
                <button className="btn-secondary" onClick={() => { setCapturedImage(null); startCamera(); }}>Retake</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting…' : 'Confirm & Submit'}
                </button>
              </div>
            </div>
          )}

          <button className="btn-cancel" onClick={cancelAction}>Cancel</button>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}
    </div>
  );
};

export default AttendanceAction;
