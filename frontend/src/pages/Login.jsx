import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../features/api/apiSlice';
import { setCredentials } from '../features/auth/authSlice';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [login, { isLoading, isError, error }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials({ user: result.data?.user || null, token: result.token }));
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to log in:', err);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel login-card">
        <div className="login-brand">
          <span className="brand-icon">⏱</span>
          <h2 className="title">Welcome Back</h2>
        </div>
        <p className="subtitle">Sign in to your attendance portal</p>
        
        {isError && (
          <div className="error-message">
            {error?.data?.message || 'Login failed. Please try again.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@company.com"
              required 
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" className="btn-primary login-btn" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
