import './Button.css';
function Button({ text, bgColor, type }) {
  return (
    <div className="button">
      <button type={type} style={{ background: `var(${bgColor})` }}>
        {text}
      </button>
    </div>
  );
}

export default Button;
