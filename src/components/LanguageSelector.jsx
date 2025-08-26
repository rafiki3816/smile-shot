import React, { useState, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { languages } from '../translations';
import { useKeyboardNavigation, useEscapeKey } from '../hooks/useKeyboardNavigation';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleClose = () => {
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  useKeyboardNavigation(isOpen, handleClose, handleLanguageChange, languages.length);
  useEscapeKey(() => isOpen && handleClose());

  return (
    <div className="language-selector">
      <button 
        ref={buttonRef}
        className="language-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('selectLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="language-flag">{currentLang?.flag}</span>
        <span className="language-code">{currentLang?.code.toUpperCase()}</span>
        <svg 
          className={`chevron ${isOpen ? 'open' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      {isOpen && (
        <div className="language-dropdown" role="listbox" aria-label={t('selectLanguage')}>
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`language-option ${currentLanguage === lang.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
              role="option"
              aria-selected={currentLanguage === lang.code}
              aria-label={t('switchToLanguage', { language: lang.name })}
            >
              <span className="language-flag">{lang.flag}</span>
              <span className="language-name">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;