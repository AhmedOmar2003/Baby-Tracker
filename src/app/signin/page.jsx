'use client';
import './signin.css';
import { MdEmail, MdLock } from 'react-icons/md';
import Input from '@/Components/Input/Input';
import signinImage from '../../assets/images/signin/signin.png';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/Components/Button/Button';
import Socials from '@/Components/Social/Socials';
import WelcomeOverlay from '@/Components/WelcomeOverlay/WelcomeOverlay';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/Components/Toast/Toast';
import { supabase } from '@/lib/supabase';
import { deriveAppUserId, normalizeRole, isAdminRole } from '@/lib/userIdentity';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const superAdminEmail = 'admin@admin.com';

function page() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [welcomeName, setWelcomeName] = useState(null);
  const pendingRedirect = useRef(null);
  const router = useRouter();

  const validate = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: 'POST',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showToast(
          data?.msg || data?.error_description || data?.message || 'Invalid login credentials.',
          'error'
        );
        return;
      }

      const session = data;
      const user = data?.user;

      if (session?.access_token && session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      }

      let role = 'user';
      const normalizedEmail = email.trim().toLowerCase();
      const isAdminLogin = isAdminRole(
        user?.user_metadata?.role || (normalizedEmail === superAdminEmail ? 'SuperAdmin' : 'user')
      );

      if (isAdminLogin) {
        await supabase.auth.signOut();
        showToast('Use the admin dashboard login page at /adminDashboard.', 'warning');
        return;
      }

      if (user) {
        localStorage.setItem('Token', session.access_token);
        role = normalizeRole(user.user_metadata?.role || 'user');
        localStorage.setItem('Role', role);
        localStorage.setItem('AuthId', user.id);
        localStorage.setItem('Id', deriveAppUserId(user.id));
        localStorage.setItem(
          'Name',
          `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim()
        );
        localStorage.setItem('Email', user.email || '');
        localStorage.setItem('Phone', user.user_metadata?.phone_number || '');
        document.cookie = `role=${role};path=/;SameSite=Lax`;
      }

      const displayName = `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || 'User';
      pendingRedirect.current = () => {
        if (isAdminRole(role)) router.replace('/adminDashboard');
        else router.replace('/');
      };
      setWelcomeName(displayName);
    } catch (error) {
      showToast(error.message || 'Something went wrong. Please try again.', 'error');
    }
  }

  return (
    <>
    {welcomeName && (
      <WelcomeOverlay
        name={welcomeName}
        isSignup={false}
        onDone={() => { setWelcomeName(null); pendingRedirect.current?.(); }}
      />
    )}
    <div className="signin">
      <div className="container">
        <form action="" onSubmit={handleSubmit}>
          <h2 className="formTitle">Sign in</h2>
          
          <div className="input-group">
            <Input
              label="Email"
              id="email"
              placeholder="Enter your email"
              type="text"
              icon={MdEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <small className="error-text" style={{ color: '#F44336', marginTop: '-10px', marginBottom: '10px', display: 'block', fontSize: '12px', fontWeight: '500' }}>{errors.email}</small>}
          </div>

          <div className="input-group">
            <Input
              label="Password"
              id="password"
              placeholder="Enter your password"
              type="password"
              icon={MdLock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <small className="error-text" style={{ color: '#F44336', marginTop: '-10px', marginBottom: '10px', display: 'block', fontSize: '12px', fontWeight: '500' }}>{errors.password}</small>}
          </div>

          <small>
            <Link href="/forgot-password">Forgot password?</Link>
          </small>
          <Button text="sign in" bgColor="--main-color" type="submit" />
          <p>Or log in using</p>
          <Socials />
          <span style={{ display: 'block', textAlign: 'center', marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--main-color)', fontWeight: 'bold' }}>Create a new account</Link>
          </span>
        </form>
        <div className="image">
          <Image src={signinImage} alt="loginImage" />
        </div>
      </div>
    </div>
    </>
  );
}

export default page;
