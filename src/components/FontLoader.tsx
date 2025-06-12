import React from 'react';

export const FontLoader = () => {
  React.useEffect(() => {
    // Load Lexend font with all weights
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap';
    link.rel = 'stylesheet';
    link.setAttribute('data-font', 'Lexend');
    link.setAttribute('font-display', 'swap');
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return null;
}; 