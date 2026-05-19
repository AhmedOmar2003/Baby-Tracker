import './PageTitle.css';

function PageTitle({ text, subtext }) {
  return (
    <div className="page-header-wrapper">
      <h2 className="pageTitle">{text}</h2>
      {subtext && <p className="pageSubtitle">{subtext}</p>}
    </div>
  );
}

export default PageTitle;
