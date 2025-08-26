import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import './PWAInstallPrompt.css';

const PWAInstallPrompt = () => {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after 30 seconds or 3 page views
      const installPromptShown = localStorage.getItem('installPromptShown');
      const pageViews = parseInt(localStorage.getItem('pageViews') || '0');
      
      if (!installPromptShown && pageViews >= 3) {
        setTimeout(() => setShowPrompt(true), 30000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Increment page views
    const views = parseInt(localStorage.getItem('pageViews') || '0');
    localStorage.setItem('pageViews', (views + 1).toString());

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem('installPromptShown', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptShown', 'true');
  };

  if (!showPrompt) return null;

  if (isIOS) {
    return (
      <div className="pwa-install-prompt ios">
        <div className="prompt-content">
          <h3>{t('installApp') || 'Install Smile Shot'}</h3>
          <p>{t('iosInstallInstructions') || 'Tap the share button and then "Add to Home Screen"'}</p>
          <button onClick={handleDismiss} className="dismiss-btn">
            {t('gotIt') || 'Got it'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pwa-install-prompt">
      <div className="prompt-content">
        <div className="app-icon">😊</div>
        <h3>{t('installApp') || 'Install Smile Shot'}</h3>
        <p>{t('installDescription') || 'Install our app for the best experience'}</p>
        <div className="prompt-actions">
          <button onClick={handleInstall} className="install-btn">
            {t('install') || 'Install'}
          </button>
          <button onClick={handleDismiss} className="dismiss-btn">
            {t('notNow') || 'Not now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;