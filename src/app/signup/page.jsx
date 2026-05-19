'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import './signup.css';
import Button from '@/Components/Button/Button';
import Input from '@/Components/Input/Input';
import Socials from '@/Components/Social/Socials';
import WelcomeOverlay from '@/Components/WelcomeOverlay/WelcomeOverlay';
import { MdLock, MdPhone, MdPerson, MdEmail } from 'react-icons/md';
import signUpImage from '../../assets/images/signup/signup.png';
import { useRouter } from 'next/navigation';
import { showToast } from '@/Components/Toast/Toast';
import { supabase } from '@/lib/supabase';
import { deriveAppUserId } from '@/lib/userIdentity';

function page() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [welcomeName, setWelcomeName] = useState(null);
  const pendingRedirect = useRef(null);

  const router = useRouter();

  const validate = () => {
    const newErrors = {};
    const reservedAdminEmail = 'admin@admin.com';
    const normalizedEmail = email.trim().toLowerCase();

    if (!firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required.';
    
    const phoneRegex = /^\+201\d{9}$/;
    if (!phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required.';
    } else if (!phoneRegex.test(phoneNumber)) {
      newErrors.phoneNumber = 'Must be a valid Egyptian number starting with +20';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (normalizedEmail === reservedAdminEmail) {
      newErrors.email = 'This email is reserved for the super admin.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (!passwordRegex.test(password)) {
      newErrors.password = 'Must be at least 8 chars, 1 uppercase, 1 lowercase, 1 number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber,
            role: 'user'
          }
        }
      });

      if (error) {
        showToast(error.message || 'Signup failed. Please try again.', 'error');
        return;
      }

      if (data?.user) {
        if (data.session) {
          localStorage.setItem('Token', data.session.access_token);
          localStorage.setItem('Role', data.user.user_metadata.role || 'user');
          localStorage.setItem('AuthId', data.user.id);
          localStorage.setItem('Id', deriveAppUserId(data.user.id));
          localStorage.setItem('Name', `${data.user.user_metadata.first_name || ''} ${data.user.user_metadata.last_name || ''}`.trim());
          localStorage.setItem('Email', data.user.email || '');
          localStorage.setItem('Phone', data.user.user_metadata.phone_number || '');
          document.cookie = `role=${data.user.user_metadata.role || 'user'};path=/`;
        }
        pendingRedirect.current = () => router.push('/');
        setWelcomeName(`${firstName} ${lastName}`.trim() || 'User');
      }
    } catch (error) {
      showToast(error.message || 'Something went wrong. Please try again.', 'error');
    }
  }

  return (
    <>
    {welcomeName && (
      <WelcomeOverlay
        name={welcomeName}
        isSignup={true}
        onDone={() => { setWelcomeName(null); pendingRedirect.current?.(); }}
      />
    )}
    <div className="signup">
      <div className="container">
        <form action="" onSubmit={handleSubmit}>
          <h2 className="formTitle">Create new account</h2>
          
          {/* ── First + Last Name side by side ── */}
          <div className="name-row">
            <div className="input-group">
              <Input
                label="First Name"
                id="firstName"
                placeholder="First name"
                type="text"
                icon={MdPerson}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {errors.firstName && <small className="error-text">{errors.firstName}</small>}
            </div>

            <div className="input-group">
              <Input
                label="Last Name"
                id="lastName"
                placeholder="Last name"
                type="text"
                icon={MdPerson}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              {errors.lastName && <small className="error-text">{errors.lastName}</small>}
            </div>
          </div>

          <div className="input-group">
            <Input
              label="Phone Number"
              id="phoneNumber"
              placeholder="+201xxxxxxxxx"
              type="text"
              icon={MdPhone}
              value={phoneNumber}
              onChange={(e) => {
                const val = e.target.value;
                if(val === '' || /^[+\d]*$/.test(val)) setPhoneNumber(val);
              }}
            />
            {errors.phoneNumber && <small className="error-text">{errors.phoneNumber}</small>}
          </div>

          <div className="input-group">
            <Input
              label="Email"
              id="email"
              placeholder="example@gmail.com"
              type="email"
              icon={MdEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <small className="error-text">{errors.email}</small>}
          </div>

          <div className="input-group">
            <Input
              label="Password"
              id="password"
              placeholder="Strong password"
              type="password"
              icon={MdLock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <small className="error-text">{errors.password}</small>}
          </div>

          <Button
            text="create an account"
            bgColor="--main-color"
            type="submit"
          />
          <p>Or register using</p>
          <Socials />
          <span className="auth-link">
            Already have an account?{' '}
            <Link href="/signin">Sign in</Link>
          </span>
        </form>
        <div className="image">
          <Image src={signUpImage} alt="loginImage" />
        </div>
      </div>
    </div>
    </>
  );
}


export default page;
