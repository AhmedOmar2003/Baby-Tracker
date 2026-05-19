import Image from 'next/image';
import ourJourneyImage1 from '../../assets/images/journey/1.jpg';
import ourJourneyImage2 from '../../assets/images/journey/2.jpg';
import ourJourneyImage3 from '../../assets/images/journey/3.jpg';
import ourJourneyImage4 from '../../assets/images/journey/4.jpg';
import './journey.css';

function Journey() {
  return (
    <section className="journey">
      <h2 className="pageHeader">Our Journey</h2>
      <div className="container">
        <div className="journeyBox radius-1">
          <div className="imageWrapper">
            <Image src={ourJourneyImage1} alt="Our Journey" fill />
          </div>
          <p>
            Start your journey to secure your children's health and remind you
            of the most important vaccinations on time.
          </p>
        </div>
        <div className="journeyBox radius-2">
          <div className="imageWrapper">
            <Image src={ourJourneyImage2} alt="Our Journey" fill />
          </div>
          <p>
            Start your journey to secure your children's health and remind you
            of the most important vaccinations on time.
          </p>
        </div>
        <div className="journeyBox radius-3">
          <div className="imageWrapper">
            <Image src={ourJourneyImage3} alt="Our Journey" fill />
          </div>
          <p>
            Start your journey to secure your children's health and remind you
            of the most important vaccinations on time.
          </p>
        </div>
        <div className="journeyBox radius-4">
          <div className="imageWrapper">
            <Image src={ourJourneyImage4} alt="Our Journey" fill />
          </div>
          <p>
            Start your journey to secure your children's health and remind you
            of the most important vaccinations on time.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Journey;
