import { useState } from 'react';
import { Shield } from 'lucide-react';

const logoOriginal = '/lovable-uploads/5d176f06-bac6-4e57-ad95-5f3fc22bbddc.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8', 
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    return (
      <div className={`${sizeMap[size]} ${className} text-primary glow-primary inline-flex items-center justify-center`}>
        <Shield className="w-full h-full" />
      </div>
    );
  }

  return (
    <img 
      src={logoOriginal} 
      alt="PhishNot Logo" 
      className={`${sizeMap[size]} ${className} object-contain`}
      onError={handleImageError}
      loading="lazy"
    />
  );
};