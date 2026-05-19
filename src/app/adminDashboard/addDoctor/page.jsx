'use client';
import { useEffect, useState } from 'react';
import './addDoctor.css';
import PageTitle from '@/Components/PageTitle/PageTitle';
import { showToast } from '@/Components/Toast/Toast';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { useRouter } from 'next/navigation';
export default function AddDoctor() {
  const router = useRouter();
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [verified, setVerified] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const handleCreateDoctor = (e) => {
    e.preventDefault();
    const params = {
      first_name: fName,
      last_name: lName,
      email: email,
      password: password,
      role: 'Doctor',
      phone_number: phone,
      specialization: specialization,
      license_number: licenseNumber,
      verified: verified,
      image_url: imageUrl,
    };
    if (
      !fName ||
      !lName ||
      !email ||
      !password ||
      !phone ||
      !specialization ||
      !licenseNumber ||
      !verified ||
      !imageUrl
    ) {
      showToast(`Please Completed The Data`, 'warning');
    } else {
      axios
        .post(`${host}/doctor/create`, params, {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        })
        .then((response) => {
          // console.log(response);
          showToast(`Doctor Added Completed`, 'success');
          router.push('/adminDashboard');
        })
        .catch((error) => {
          showToast(`${error.message}`, 'error');
        });
    }
  };
  return (
    <div className="addDoctor">
      <div className="container">
        <PageTitle text="Add New Doctor" />
        <form>
          <div className="inputs">
            <div>
              <label>First Name</label>
              <input
                type="text"
                onChange={(e) => setFName(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Last Name</label>
              <input
                type="text"
                onChange={(e) => setLName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="inputs">
            <div>
              <label>Email</label>
              <input
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password</label>
              <input
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="inputs">
            <div>
              <label>Phone</label>
              <input
                type="number"
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Specialization</label>
              <input
                type="text"
                onChange={(e) => setSpecialization(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="inputs">
            <div>
              <label>License Number</label>
              <input
                type="text"
                onChange={(e) => setLicenseNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Verified</label>
              <select
                defaultValue=""
                onChange={(e) => setVerified(e.target.value)}
                required
              >
                <option disabled value="">
                  Choose
                </option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>
          </div>
          <div className="inputs">
            <div>
              <label>Image URL</label>
              <input
                type="url"
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://commons.wikimedia.org/wiki/Special:FilePath/..."
                required
              />
            </div>
          </div>
          <button onClick={handleCreateDoctor} className='submit'>Submit</button>
        </form>
      </div>
    </div>
  );
}
