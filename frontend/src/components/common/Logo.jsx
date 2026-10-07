import React from 'react';
import emblemImg from '../../assets/images/unibridal-emblem.png';
import emblemTransparentImg from '../../assets/images/unibridal-emblem-transparent.png';
import fullLogoImg from '../../assets/images/unibridal-logo-full.png';
import fullLogoTransparentImg from '../../assets/images/unibridal-logo-full-transparent.png';

/**
 * Reusable UniBridal Brand Logo Component
 * 
 * @param {'emblem' | 'emblem-transparent' | 'full' | 'full-transparent'} variant
 * @param {string} className - Optional Tailwind or CSS class names
 * @param {string | number} width - Optional width in px or CSS string
 * @param {string | number} height - Optional height in px or CSS string
 * @param {string} alt - Alt text
 */
export default function Logo({
  variant = 'emblem',
  className = '',
  width,
  height,
  alt = 'UniBridal Haute Couture',
  style = {},
  ...props
}) {
  const getImageSource = () => {
    switch (variant) {
      case 'full':
        return fullLogoImg;
      case 'full-transparent':
        return fullLogoTransparentImg;
      case 'emblem-transparent':
        return emblemTransparentImg;
      case 'emblem':
      default:
        return emblemImg;
    }
  };

  return (
    <img
      src={getImageSource()}
      alt={alt}
      className={`object-contain ${className}`}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        ...style,
      }}
      {...props}
    />
  );
}

export {
  emblemImg,
  emblemTransparentImg,
  fullLogoImg,
  fullLogoTransparentImg,
};
