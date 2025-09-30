import { useEffect } from 'react';
import { KeyboardShortcut } from '../types';

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Allow Escape key to work in input fields
        if (event.key !== 'Escape') {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const metaKeyMatch = shortcut.metaKey ? event.metaKey : !event.metaKey;
        const ctrlKeyMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const shiftKeyMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altKeyMatch = shortcut.altKey ? event.altKey : !event.altKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          metaKeyMatch &&
          ctrlKeyMatch &&
          shiftKeyMatch &&
          altKeyMatch
        ) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export default useKeyboardShortcuts;