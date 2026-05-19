'use client';
import PageTitle from '@/Components/PageTitle/PageTitle';
import { useEffect, useState } from 'react';
import '../../addDoctor/addDoctor.css';
import './updateVaccine.css';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
export default function UpdateVaccine() {
  const [vaccineName, setVaccineName] = useState('');
  const [description, setDescription] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [doses, setDoses] = useState('');
  const [mandatory, setMandatory] = useState('');
  const [image, setImage] = useState('');
  const [data, setData] = useState([]);
  const router = useRouter();
  const paramsId = useParams();
  const backToAdminDashboard = (e) => {
    e.preventDefault();
    router.push('/adminDashboard');
  };
  useEffect(() => {
    // console.log(paramsId.updateVaccine);
    axios
      .get(`${host}/vaccine/vaccineById/${paramsId.updateVaccine}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      })
      .then((response) => {
        const fetchData = response.data.data.rows[0];
        // console.log(response.data.data.rows[0]);
        setData(fetchData);
        setVaccineName(fetchData.vaccine_name || '');
        setDescription(fetchData.description || '');
        setMinAge(fetchData.min_age ?? '');
        setMaxAge(fetchData.max_age ?? '');
        setDoses(fetchData.doses_required ?? '');
        setMandatory(
          fetchData.is_mandatory === true || fetchData.is_mandatory === false
            ? String(fetchData.is_mandatory)
            : ''
        );
        setImage(fetchData.image || '');
      });
  }, []);
  //Start Update data
  const updateData = (e) => {
    e.preventDefault();
    const mandatoryBoolean = mandatory === 'true';
    if (
      vaccineName === data.vaccine_name &&
      description === data.description &&
      String(minAge) === String(data.min_age ?? '') &&
      String(maxAge) === String(data.max_age ?? '') &&
      String(doses) === String(data.doses_required ?? '') &&
      String(mandatoryBoolean) === String(data.is_mandatory ?? '') &&
      image === (data.image || '')
    ) {
      showToast(`You didn't change anything.`, 'warning');
      return;
    }
    const newParamsData = {
      vaccine_name: vaccineName,
      description: description,
      min_age: minAge,
      max_age: maxAge,
      doses_required: doses,
      is_mandatory: mandatoryBoolean,
      image,
    };
    // console.log(newParamsData)
    axios
      .put(
        `${host}/vaccine/vaccineById/${paramsId.updateVaccine}`,
        newParamsData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      )
      .then((response) => {
        showToast(`Update Successfully`, 'success');
      })
      .catch((error) => {
        showToast(`${error.message}`, 'error');
      });
  };
  //End Update data
  return (
    <div className="updateVaccine">
      <div className="container">
        <PageTitle text="Update Vaccine" />
        <form>
          <div className="inputs">
            <div>
              <label>Vaccine Name</label>
              <input
                type="text"
                value={vaccineName}
                onChange={(e) => setVaccineName(e.target.value)}
              />
            </div>
            <div>
              <label>Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="inputs">
            <div>
              <label>Min Age</label>
              <input
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
              />
            </div>
            <div>
              <label>Max Age</label>
              <input
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
              />
            </div>
          </div>
          <div className="inputs">
            <div>
              <label>Doses Required</label>
              <input
                type="number"
                value={doses}
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
          <div className="buttonsUpdateVaccine">
            <button onClick={backToAdminDashboard}>Back</button>
            <button onClick={updateData}>Update</button>
          </div>
        </form>
      </div>
    </div>
  );
}
