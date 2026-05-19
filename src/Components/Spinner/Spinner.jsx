import { BeatLoader } from 'react-spinners';

import './Spinner.css';

function Spinner() {
  return (
    <div className="spinner">
      <BeatLoader color="var(--main-color)" />
    </div>
  );
}

export default Spinner;
