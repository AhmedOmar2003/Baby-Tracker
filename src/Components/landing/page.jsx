import Button from '@/Components/Button/Button';

import homeImage from '../../assets/images/home/Group 21.png';
import Image from 'next/image';

import './landing.css';
import RouteLink from '../RouteLink/RouteLink';

function Landing() {
  return (
    <div className="landing">
      <div className="container">
        <div className="text">
          <h2>
            Connect with the best doctors and get excellent{' '}
            <span className="text-gradient">health care</span>
          </h2>
          <p>
            To ensure the health and safety of your child, we are here to
            provide you with the necessary support and advice at every step of
            your vaccinations.
          </p>
          <div className="links">
            {' '}
            <RouteLink to="/signin" text="learn more" />
            <RouteLink
              to="/doctors"
              text="start tracking"
              bgColor="--main-color"
            />
          </div>
        </div>
        <div className="image">
          <Image src={homeImage} alt="ad" />
        </div>
      </div>
    </div>
  );
}

export default Landing;
