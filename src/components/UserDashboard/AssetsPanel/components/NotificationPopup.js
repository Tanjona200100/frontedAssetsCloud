// src/components/UserDashboard/components/NotificationPopup.jsx

import React from 'react';
import { MdCheckCircle, MdCancel, MdWarning } from 'react-icons/md';

export default function NotificationPopup({ notification, onClose }) {
  if (!notification.show) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <MdCheckCircle className="notif-icon success" />;
      case 'error':
        return <MdCancel className="notif-icon error" />;
      case 'warning':
        return <MdWarning className="notif-icon warning" />;
      default:
        return null;
    }
  };

  const getClassName = () => {
    return `notif-popup ${notification.type}`;
  };

  return (
    <div className="notif-overlay" onClick={onClose}>
      <div className={getClassName()} onClick={(e) => e.stopPropagation()}>
        <div className="notif-content">
          <div className="notif-icon-wrapper">
            {getIcon()}
          </div>
          <h4 className="notif-title">{notification.title}</h4>
          <p className="notif-message">{notification.message}</p>
          <button className="notif-close" onClick={onClose}>×</button>
          <div className="notif-progress" style={{ animationDuration: `${notification.duration || 4000}ms` }} />
        </div>
      </div>
    </div>
  );
}