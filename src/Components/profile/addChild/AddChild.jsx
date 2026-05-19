import '../../../app/profile/[childId]/editForm/[id]/editForm.css';
import './addChild.css';
import { useState } from 'react';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { showToast } from '@/Components/Toast/Toast';
import PageTitle from '@/Components/PageTitle/PageTitle';
import { normalizeStoredUserIds } from '@/lib/userIdentity';
export default function AddChild() {
  const [first_name, setFirst_name] = useState('');
  const [last_name, setLast_name] = useState('');
  const [gender, setGender] = useState('');
  const [date_of_birth, setDate_of_birth] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const validateInputs = () => {
    // Check if inputs are numbers
    if (isNaN(weight) || isNaN(height)) {
      showToast('Please enter valid numbers for weight and height', 'warning');
      return false;
    }

    // Convert to numbers for validation
    const weightNum = Number(weight);
    const heightNum = Number(height);

    // Validate ranges
    if (
      weightNum <= 0 ||
      heightNum <= 0 ||
      weightNum > 200 ||
      heightNum > 250
    ) {
      showToast(
        'Please enter valid values: Weight (1-200 kg) and Height (1-250 cm)',
        'warning'
      );
      return false;
    }

    return true;
  };

  const handleAddChild = (e) => {
    e.preventDefault();

    if (
      !first_name ||
      !last_name ||
      !gender ||
      !date_of_birth ||
      !weight ||
      !height
    ) {
      showToast('Please complete child data', 'warning');
      return;
    }

    // Run validation layer
    if (!validateInputs()) {
      return;
    }

    const { appUserId } = normalizeStoredUserIds();
    const userId = appUserId || localStorage.getItem('Id');
    if (!userId) {
      showToast('User not authenticated properly. Please log in again.', 'error');
      return;
    }

    const params = {
      // Supabase stores the logged-in user id as a string UUID.
      // Converting it to Number turns it into NaN and breaks the API request.
      user_id: userId,
      first_name: first_name,
      last_name: last_name,
      gender:
        gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase(),
      date_of_birth: date_of_birth,
      weight: Number(weight),
      height: Number(height),
    };

    axios
      .post(`${host}/child/create`, params, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        showToast('Child added successfully', 'success');
        setFirst_name('');
        setLast_name('');
        setGender('');
        setDate_of_birth('');
        setWeight('');
        setHeight('');
      })
      .catch((error) => {
        showToast(
          error.response?.data?.msg ||
            error.response?.data?.message ||
            error.message ||
            'Something went wrong',
          'error'
        );
      });
  };

  return (
    <div>
      <div className="container">
        <div className="form">
          <div>
            <div>
              <PageTitle text="Add Child" />
            </div>
            <form>
              <div className="content addChildContent">
                <div>
                  <label>First Name</label>
                  <br />
                  <input
                    value={first_name}
                    type="text"
                    pattern="[A-Za-z]"
                    placeholder="First Name"
                    onChange={(e) => setFirst_name(e.target.value)}
                    required
                    onKeyPress={(e) => {
                      if (!/[a-zA-Z]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
                <div>
                  <label>Last Name</label>
                  <br />
                  <input
                    value={last_name}
                    type="text"
                    pattern="[A-Za-z]"
                    placeholder="Last Name"
                    onChange={(e) => setLast_name(e.target.value)}
                    required
                    onKeyPress={(e) => {
                      if (!/[a-zA-Z]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="content addChildContent">
                <div>
                  <label>Gender</label>
                  <br />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label>Date</label>
                  <br />
                  <input
                    value={date_of_birth}
                    type="date"
                    placeholder="Date, EX: 2025-04-19"
                    onChange={(e) => setDate_of_birth(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="content addChildContent">
                <div>
                  <label>Weight</label>
                  <br />
                  <input
                    value={weight}
                    type="number"
                    min="1"
                    max="200"
                    step="0.1"
                    placeholder="Weight (kg)"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setWeight(value);
                      }
                    }}
                    required
                  />
                </div>
                <div>
                  <label>Height</label>
                  <br />
                  <input
                    value={height}
                    type="number"
                    min="1"
                    max="250"
                    step="0.1"
                    placeholder="Height (cm)"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setHeight(value);
                      }
                    }}
                    required
                  />
                </div>
              </div>
              <div className="buttons">
                <input
                  type="submit"
                  value={'Add'}
                  onClick={handleAddChild}
                  className="add"
                  id="addBtn"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
