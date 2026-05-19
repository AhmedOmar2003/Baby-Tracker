import './RouteLink.css';

import Link from 'next/link';

function RouteLink({ to, text, bgColor }) {
  return (
    <div className="routeLink">
      <Link href={to} style={{ background: `var(${bgColor})` }}>
        {text}
      </Link>
    </div>
  );
}

export default RouteLink;
