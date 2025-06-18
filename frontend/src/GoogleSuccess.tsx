import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GoogleSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');

    if (token && role) {
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      alert(`Logged in as ${role} via Google`);

      if (role === 'admin') {
        navigate('/adminhome');
      } else {
        navigate('/home');
      }
    } else {
      alert('Google login failed');
      navigate('/login');
    }
  }, []);

  return <p>Logging in via Google...</p>;
};

export default GoogleSuccess;
