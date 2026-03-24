import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Auth.css';

function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(emailOrUsername, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="logo-text">Instagram</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="text" 
            placeholder="Phone number, username, or email" 
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-btn">Log in</button>
        </form>
        {error && <p className="auth-error">{error}</p>}
        <div className="divider">
          <span>OR</span>
        </div>
        <p className="forgot-password">Forgot password?</p>
      </div>

      <div className="auth-box sub-box">
        <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
      </div>
    </div>
  );
}

export default Login;
