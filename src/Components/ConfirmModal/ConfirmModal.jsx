'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdWarning, MdHelpOutline } from 'react-icons/md';
import './ConfirmModal.css';

export default function ConfirmModal({
  isOpen, title, message,
  onConfirm, onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-icon-wrap ${isDanger ? 'modal-icon-danger' : 'modal-icon-info'}`}>
          {isDanger ? <MdWarning /> : <MdHelpOutline />}
        </div>
        <h3 className={isDanger ? 'danger-title' : ''}>{title}</h3>
        <p>{message}</p>
        <div className="modal-buttons">
          <button className="modal-cancel" onClick={onCancel}>{cancelText}</button>
          <button className={`modal-confirm ${isDanger ? 'danger-btn' : ''}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
