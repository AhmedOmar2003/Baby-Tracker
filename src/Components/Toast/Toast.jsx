'use client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function normalizeToastMessage(message, fallback = 'Something went wrong. Please try again.') {
  if (message instanceof Error) return message.message || fallback;
  if (typeof Event !== 'undefined' && message instanceof Event) return fallback;
  if (typeof message === 'string') {
    if (!message.trim() || message === 'undefined' || message === 'null' || message === '[object Event]' || message === '[object Object]') {
      return fallback;
    }
    return message;
  }
  if (message && typeof message === 'object') {
    return (
      message.message ||
      message.msg ||
      message.error_description ||
      message.detail ||
      fallback
    );
  }
  if (message == null) return fallback;
  return String(message);
}

export const showToast = (message, type = 'default', duration = 3000) => {
  toast(normalizeToastMessage(message), {
    type,
    autoClose: duration,
    position: 'top-right',
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: 'light',
  });
};

function ToastContainerWrapper() {
  return <ToastContainer />;
}

export default ToastContainerWrapper;
