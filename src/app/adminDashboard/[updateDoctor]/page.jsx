'use client';
import PageTitle from '@/Components/PageTitle/PageTitle';
import '../addDoctor/addDoctor.css';
import './updateDoctor.css';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';

export default function UpdateDoctor() {
  const [doctorData, setDoctorData] = useState({});
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const router = useRouter();
  const params = useParams();

  const backToAdmin = (e) => {
    e.preventDefault();
    router.push('/adminDashboard');
  };

  function getDoctorById() {
    axios
      .get(`${host}/doctor/${params.updateDoctor}`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      })
      .then((response) => {
        setDoctorData(response.data.data.rows[0]);
      })
      .catch((error) => {
        showToast(`${error.message}`, 'error');
      });
  }

  // function updateDoctorInfo() {
  //   const updateData = {
  //     first_name: fName,
  //     last_name: lName,
  //     email: email,
  //     phone_number: phone,
  //   };

  //   axios
  //     .put(`${host}/user/update/${params.updateDoctor}`, updateData, {
  //       headers: { 'Content-Type': 'application/json' },
  //       withCredentials: true,
  //     })
  //     .then(() => {
  //       showToast(`User info updated successfully`, 'success');
  //     })
  //     .catch((error) => {
  //       showToast(`${error.message}`, 'error');
  //     });
  // }

  // function updateLicenceAndSpecialization() {
  //   const updateData = {
  //     user_id: params.updateDoctor,
  //     specialization,
  //     license_number: licenseNumber,
  //   };

  //   axios
  //     .put(`${host}/doctor/update/${params.updateDoctor}`, updateData, {
  //       headers: { 'Content-Type': 'application/json' },
  //       withCredentials: true,
  //     })
  //     .then(() => {
  //       showToast(`Doctor info updated successfully`, 'success');
  //     })
  //     .catch((error) => {
  //       showToast(`${error.message}`, 'error');
  //     });
  // }
  const updateDoctor = async (e) => {
    e.preventDefault();
    const isUserDataChanged =
      fName !== (doctorData.first_name || '') ||
      lName !== (doctorData.last_name || '') ||
      email !== (doctorData.email || '') ||
      phone !== (doctorData.phone_number || '');
    const isDoctorDataChanged =
      specialization !== (doctorData.specialization || '') ||
      licenseNumber !== (doctorData.license_number || '') ||
      imageUrl !== (doctorData.image_url || '');
    if (!isUserDataChanged && !isDoctorDataChanged) {
      showToast('No changes detected.', 'warning');
      return;
    }
    let isUpdated = false;
    if (isUserDataChanged) {
      const updateUserData = {
        first_name: fName,
        last_name: lName,
        email: email,
        phone_number: phone,
      };
      try {
        await axios.put(
          `${host}/user/update/${params.updateDoctor}`,
          updateUserData,
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          }
        );
        isUpdated = true;
      } catch (error) {
        showToast(`Error updating user data: ${error.message}`, 'error');
      }
    }
    if (isDoctorDataChanged) {
      const updateDoctorData = {
        user_id: params.updateDoctor,
        specialization: specialization,
        license_number: licenseNumber,
        image_url: imageUrl,
      };

      try {
        await axios.put(
          `${host}/doctor/update/${params.updateDoctor}`,
          updateDoctorData,
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          }
        );
        isUpdated = true;
      } catch (error) {
        showToast(
          `Error updating specialization or license number: ${error.message}`,
          'error'
        );
      }
    }

    if (isUpdated) {
      showToast('Data updated successfully ✅', 'success');
    }
  };

  useEffect(() => {
    getDoctorById();
  }, []);

  useEffect(() => {
    if (doctorData) {
      setFName(doctorData.first_name || '');
      setLName(doctorData.last_name || '');
      setEmail(doctorData.email || '');
        setPhone(doctorData.phone_number || '');
        setSpecialization(doctorData.specialization || '');
        setLicenseNumber(doctorData.license_number || '');
        setImageUrl(doctorData.image_url || '');
      }
  }, [doctorData]);

  return (
    <div className="updateDoctor">
      <div className="container">
        <PageTitle text="Update Doctor" />
        <form>
          <div className="inputs">
            <div>
              <label>First Name</label>
              <input
                type="text"
                onChange={(e) => setFName(e.target.value)}
                value={fName}
              />
            </div>
            <div>
              <label>Last Name</label>
              <input
                type="text"
                onChange={(e) => setLName(e.target.value)}
                value={lName}
              />
            </div>
          </div>
          <div className="inputs">
            <div>
              <label>Email</label>
              <input
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
              />
            </div>
            <div>
              <label>Phone</label>
              <input
                type="number"
                onChange={(e) => setPhone(e.target.value)}
                value={phone}
              />
            </div>
          </div>
          <div className="inputs">
            <div>
              <label>Specialization</label>
              <input
                type="text"
                onChange={(e) => setSpecialization(e.target.value)}
                value={specialization}
              />
            </div>
            <div>
              <label>License Number</label>
              <input
                type="text"
                onChange={(e) => setLicenseNumber(e.target.value)}
                value={licenseNumber}
              />
            </div>
          </div>
          <div className="inputs">
            <div>
              <label>Image URL</label>
              <input
                type="url"
                onChange={(e) => setImageUrl(e.target.value)}
                value={imageUrl}
                placeholder="https://commons.wikimedia.org/wiki/Special:FilePath/..."
              />
            </div>
          </div>
          <div className="buttonsUpdateAndBack">
            <button className="back" onClick={backToAdmin}>
              Back
            </button>
            <button className="update" onClick={updateDoctor}>
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
