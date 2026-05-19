'use client';
import './editForm.css';
import { useParams } from 'next/navigation';
import childImage from '../../../../../assets/images/child/child.png';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';

import { host } from '@/Components/utils/Host';
import PageTitle from '@/Components/PageTitle/PageTitle';
import { showToast } from '@/Components/Toast/Toast';

export default function EditForm() {
  const [dataById, setDataById] = useState([]);
  const params = useParams();
  const [first_name, setFirst_name] = useState('');
  const [last_name, setLast_name] = useState('');
  const [gender, setGender] = useState('');
  const [date_of_birth, setDate_of_birth] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [initialData, setInitailData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    weight: '',
    height: '',
  });

  function getDataById() {
    axios
      .get(`${host}/child/childById/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        const data = response.data.data.rows[0];
        setFirst_name(data.first_name || '');
        setLast_name(data.last_name || '');
        setGender(data.gender || '');
        setDate_of_birth(data.date_of_birth || '');
        setWeight(data.weight || '');
        setHeight(data.height || '');
        setInitailData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          gender: data.gender || '',
          date_of_birth: data.date_of_birth || '',
          weight: data.weight || '',
          height: data.height || '',
        });
      })
      .catch((error) => {
        showToast(
          error.response?.data?.msg ||
            error.response?.data?.message ||
            `Connection error: ${error.message}`,
          'error'
        );
      });
  }

  const handleEdit = (e) => {
    e.preventDefault();
    const isChanged =
      first_name !== initialData.first_name ||
      last_name !== initialData.last_name ||
      gender !== initialData.gender ||
      date_of_birth !== initialData.date_of_birth ||
      weight !== initialData.weight ||
      height !== initialData.height;
    if (!isChanged) {
      showToast(`You didn't change anything`, 'warning');
      return;
    }
    if (!first_name || !last_name || !gender || !weight || !height) {
      showToast('All fields are required!', 'warning');
      return;
    }
    if (weight <= 0 || height <= 0 || isNaN(weight) || isNaN(height)) {
      showToast('Weight and height must be positive numbers!', 'warning');
      return;
    }
    const updatedData = {
      first_name,
      last_name,
      date_of_birth,
      gender,
      weight,
      height,
    };
    axios
      .put(`${host}/child/childById/${params.id}`, updatedData, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        showToast('Data updated successfully ✅', 'success');
      })
      .catch((error) => {
        showToast(
          error.response?.data?.msg ||
            error.response?.data?.message ||
            `Connection error: ${error.message}`,
          'error'
        );
      });
  };

  const preventNumbers = (e) => {
    if (/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    getDataById();
  }, []);

  const isChanged =
    first_name !== initialData.first_name ||
    last_name !== initialData.last_name ||
    gender !== initialData.gender ||
    date_of_birth !== initialData.date_of_birth ||
    weight !== initialData.weight ||
    height !== initialData.height;

  return (
    <div>
      <div className="container">
        <div className="form">
          <div>
            <PageTitle text="My Child" />
            <Image src={childImage} alt="Child Image" />
            <form>
              <div className="content">
                <div>
                  <label>First Name</label>
                  <br />
                  <input
                    type="text"
                    placeholder="First Name"
                    onChange={(e) => setFirst_name(e.target.value)}
                    value={first_name}
                    onKeyPress={preventNumbers} 
                  />
                </div>
                <div>
                  <label>Last Name</label>
                  <br />
                  <input
                    type="text"
                    placeholder="Last Name"
                    onChange={(e) => setLast_name(e.target.value)}
                    value={last_name}
                    onKeyPress={preventNumbers}
                  />
                </div>
              </div>
              <div className="content">
                <div>
                  <label>Gender</label>
                  <br />
                  <select
                    onChange={(e) => setGender(e.target.value)}
                    value={gender}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label>Date</label>
                  <br />
                  <input
                    type="text"
                    placeholder="Date"
                    onChange={(e) => setDate_of_birth(e.target.value)}
                    value={date_of_birth}
                  />
                </div>
              </div>
              <div className="content">
                <div>
                  <label>Weight</label>
                  <br />
                  <input
                    type="number"
                    placeholder="Weight"
                    onChange={(e) => setWeight(e.target.value)}
                    value={weight}
                  />
                </div>
                <div>
                  <label>Height</label>
                  <br />
                  <input
                    type="number"
                    placeholder="Height"
                    onChange={(e) => setHeight(e.target.value)}
                    value={height}
                  />
                </div>
              </div>
              <div className="buttons">
                <Link href={'/profile'}>Back</Link>
                {isChanged && <input type="submit" value={'Save'} onClick={handleEdit} />}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
