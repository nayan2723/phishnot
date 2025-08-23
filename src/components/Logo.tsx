import { Shield } from 'lucide-react';

const logoOriginal = '/lovable-uploads/5d176f06-bac6-4e57-ad95-5f3fc22bbdcc.png';

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
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    img.style.display = 'none';
    
    // Create fallback shield icon
    const fallback = document.createElement('div');
    fallback.className = `${sizeMap[size]} ${className} text-primary glow-primary inline-flex`;
    fallback.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
        <path d="M20 13c0 5-3.5 7.5-7.5 7.5-1.79 0-3.43-.73-4.61-1.9a.69.69 0 0 1-.22-.5v-.6a.69.69 0 0 1 .22-.5C8.57 16.73 10.21 16 12 16s3.43.73 4.39 1.4c.22.14.22.36 0 .5-.96.67-2.6 1.4-4.39 1.4-1.79 0-3.43-.73-4.39-1.4a.69.69 0 0 1 0-.5C8.57 16.73 10.21 16 12 16s3.43.73 4.39 1.4c.22.14.22.36 0 .5-.96.67-2.6 1.4-4.39 1.4"/>
        <path d="M9 12h.01"/>
        <path d="M15 12h.01"/>
        <path d="M20 4v5a9 9 0 1 1-18 0V4a9 9 0 0 1 18 0Z"/>
      </svg>
    `;
    
    if (img.parentNode) {
      img.parentNode.insertBefore(fallback, img.nextSibling);
    }
  };

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