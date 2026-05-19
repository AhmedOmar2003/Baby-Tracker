'use client';
import PageTitle from '@/Components/PageTitle/PageTitle';
import '../addDoctor/addDoctor.css';
import { useState } from 'react';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import { useRouter } from 'next/navigation';
export default function AddVaccines() {
  const [vaccineName, setVaccineName] = useState('');
  const [description, setDescription] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [doses, setDoses] = useState('');
  const [mandatory, setMandatory] = useState('');
  const [image, setImage] = useState('');
  const router = useRouter();
  const submitForm = (e) => {
    e.preventDefault();
    if (
      !vaccineName ||
      !description ||
      !minAge ||
      !maxAge ||
      !doses ||
      !mandatory
    ) {
      showToast(`Please completed The Data`, 'warning');
      return;
    }
    const params = {
      vaccine_name: vaccineName,
      description: description,
      min_age: minAge,
      max_age: maxAge,
      doses_required: doses,
      is_mandatory: mandatory === 'true',
      image,
    };
    axios
      .post(`${host}/vaccine/create`, params, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      })
      .then((response) => {
        showToast(`Added Viccine Successfully`, 'success');
        router.push('/adminDashboard');
      })
      .catch((error) => {
        showToast(`${error.message}`, 'error');
      });
  };
  return (
    <div className="addVaccines">
      <div className="container">
        <PageTitle text="Add New Vaccine" />
        <form>
          <div className="inputs">
            <div>
              <label>Vaccine Name</label>
              <input
                type="text"
                required
                onChange={(e) => setVaccineName(e.target.value)}
              />
            </div>
            <div>
              <label>Description</label>
              <input
                type="text"
                required
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="inputs">
            <div>
              <label>Min Age</label>
              <input
                type="number"
                required
                onChange={(e) => setMinAge(e.target.value)}
              />
            </div>
            <div>
              <label>Max Age</label>
              <input
                type="number"
                required
                onChange={(e) => setMaxAge(e.target.value)}
              />
            </div>
          </div>
          <div className="inputs">
            <div>
              <label>Doses Required</label>
              <input
                type="number"
                required
                onChange={(e) => setDoses(e.target.value)}
              />
            </div>
            <div>
              <label>Is Mandatory</label>
              <select
                value={mandatory}
                onChange={(e) => setMandatory(e.target.value)}
              >
                <option value="" disabled>
                  Choose
                </option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>
          </div>
          <div className="inputs">
            <div className="input">
              <label>Image URL</label>
              <input
                type="url"
                required
                placeholder="https://commons.wikimedia.org/wiki/Special:FilePath/..."
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </div>
          </div>
          <button className="submit" onClick={submitForm}>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
