'use client';
import { useState } from 'react';
import '../addDoctor/addDoctor.css';
import './addMedicine.css';
import PageTitle from '@/Components/PageTitle/PageTitle';
import { showToast } from '@/Components/Toast/Toast';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { useRouter } from 'next/navigation';
export default function AddMedicine() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dosage, setDoses] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [prescriptionRequired, setPrescriptionRequired] = useState('');
  const [sideEffects, setSideEffects] = useState('');
  const [image, setImage] = useState('');
  const router = useRouter();
  const handleSubmitData = (e) => {
    e.preventDefault();
    if (
      !name ||
      !description ||
      !dosage ||
      !manufacturer ||
      !price ||
      !category ||
      !prescriptionRequired ||
      !sideEffects ||
      !image
    ) {
      showToast(`Please Complete The Data`, 'warning');
      return;
    }

    const sideEffectsArray = sideEffects
      .split(/[,\n;\-–\\_]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const params = {
      name,
      description,
      dosage,
      manufacturer,
      price,
      category,
      prescriptionRequired: prescriptionRequired === 'true',
      sideEffects: sideEffectsArray,
      image,
    };
    axios
      .post(`${host}/medicine/create`, params, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      })
      .then((response) => {
        showToast(`Added Medicine Successfully`, 'success');
        router.push('/adminDashboard');
      })
      .catch((error) => {
        showToast(`${error.message}`, 'error');
      });
  };

  return (
    <div className="addMedicine">
      <div className="container">
        <PageTitle text="Add New Medicine" />
        <form>
          <div className="inputs">
            <div>
              <label>Medicine Name</label>
              <input
                type="text"
                required
                onChange={(e) => setName(e.target.value)}
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
              <label>Dosage</label>
              <input
                type="text"
                required
                onChange={(e) => setDoses(e.target.value)}
              />
            </div>
            <div>
              <label>Manufacturer</label>
              <input
                type="text"
                required
                onChange={(e) => setManufacturer(e.target.value)}
              />
            </div>
          </div>

          <div className="inputs">
            <div>
              <label>Price</label>
              <input
                type="number"
                required
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label>Category</label>
              <input
                type="text"
                required
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          <div className="inputs">
            <div className="input">
              <label>Image Url</label>
              <br />
              <input
                type="url"
                className="medicineImage"
                onChange={(e) => setImage(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '8px',
                  border: '1px solid #3640ce',
                }}
              />
            </div>
            <div>
              <label>Prescription Required</label>
              <select
                value={prescriptionRequired}
                required
                onChange={(e) => setPrescriptionRequired(e.target.value)}
              >
                <option value="" disabled>
                  Choose
                </option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>
          </div>

          <div className="textArea">
            <label>Side Effects</label>
            <br />
            <textarea
              required
              rows={3}
              placeholder="e.g. Nausea, Liver damage - Headache _ Dizziness\n(use commas, dashes, underscores or new lines)"
              onChange={(e) => setSideEffects(e.target.value)}
            ></textarea>
          </div>

          <button className="submit" onClick={handleSubmitData}>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
