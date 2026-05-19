import './addInfoBtn.css';
export default function AddInfoBtn({text}) {
  return (
    <>
      <button className="addInfo">
        <span>+</span>
        <span>{text}</span>
      </button>
    </>
  );
}
