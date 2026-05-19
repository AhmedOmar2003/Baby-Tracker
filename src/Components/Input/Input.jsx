'use client';
import { useState } from 'react';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import './Input.css';

function Input({ icon: Icon, label, id, type, ...props }) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="input">
      {label && <label htmlFor={id}>{label}</label>}
      <div>
        {Icon && <Icon />}
        <input id={id} type={isPassword && showPwd ? 'text' : type} {...props} />
        {isPassword && (
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPwd((v) => !v)}
            tabIndex={-1}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? <MdVisibilityOff /> : <MdVisibility />}
          </button>
        )}
      </div>
    </div>
  );
}

export default Input;
