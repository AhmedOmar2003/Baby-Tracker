import Link from 'next/link';
import Image from 'next/image';

const ArticleCard = ({ title, imageSrc, link }) => {
  return (
    <Link href={link} className="ds-card" style={{ textDecoration: 'none', display: 'block' }}>
      <div className="ds-card-img-wrapper" style={{ height: '200px', position: 'relative', width: '100%', overflow: 'hidden' }}>
        <Image src={imageSrc} alt={title} fill style={{ objectFit: 'cover' }} />
      </div>
      <div className="ds-card-body" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
        <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--section-head-color)' }}>{title}</h4>
      </div>
    </Link>
  );
};

export default ArticleCard;
