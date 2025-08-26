import { useEffect } from 'react';

export const useKeyboardNavigation = (isOpen, onClose, onSelect, itemCount) => {
  useEffect(() => {
    if (!isOpen) return;

    let currentIndex = -1;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          currentIndex = currentIndex < itemCount - 1 ? currentIndex + 1 : 0;
          focusItem(currentIndex);
          break;
        case 'ArrowUp':
          e.preventDefault();
          currentIndex = currentIndex > 0 ? currentIndex - 1 : itemCount - 1;
          focusItem(currentIndex);
          break;
        case 'Enter':
          e.preventDefault();
          if (currentIndex >= 0) {
            const focusedElement = document.querySelector('[role="option"]:focus');
            if (focusedElement) {
              focusedElement.click();
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Tab':
          // Let tab work naturally but close dropdown
          onClose();
          break;
        default:
          break;
      }
    };

    const focusItem = (index) => {
      const items = document.querySelectorAll('[role="option"]');
      if (items[index]) {
        items[index].focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, itemCount]);
};

export const useFocusTrap = (containerRef, isActive) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement.focus();

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [containerRef, isActive]);
};

export const useEscapeKey = (onEscape) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onEscape]);
};