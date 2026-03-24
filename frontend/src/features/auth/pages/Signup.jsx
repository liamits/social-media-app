import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Auth.css';

function Signup() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await signup(username, email, password, fullName);
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
        <p className="signup-text">Sign up to see photos and videos from your friends.</p>
        <button className="facebook-btn">Log in with Facebook</button>
        <div className="divider">
          <span>OR</span>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="text" 
            placeholder="Full Name" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-btn">Sign up</button>
        </form>
        {error && <p className="auth-error">{error}</p>}
      </div>

      <div className="auth-box sub-box">
        <p>Have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}

export default Signup;
