import './Socials.css';
import Image from 'next/image';
import Link from 'next/link';
import facebookImage from '../../assets/images/socials/facebook.png';
import appleImage from '../../assets/images/socials/apple.png';
import googleImage from '../../assets/images/socials/google.png';
const socials = [
  {
    name: 'Facebook',
    image: facebookImage,
    href: 'https://www.facebook.com/mohamed.bdawod.5',
  },
  {
    name: 'Apple',
    image: appleImage,
    href: 'https://www.linkedin.com/in/mohamed-basyouni-dawood/',
  },
  { name: 'Google', image: googleImage, href: 'https://x.com/MooDawood' },
];
function Socials() {
  return (
    <div className="socials">
      {socials.map((social, index) => (
        <Link key={index} href={social.href}>
          <div className="imageContainer">
            <Image
              src={social.image}
              alt={`${social.name} login`}
              width={40}
              height={40}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}

export default Socials;
