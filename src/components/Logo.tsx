import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { removeBackground, loadImageFromUrl } from '@/utils/backgroundRemoval';
const logoOriginal = '/lovable-uploads/4d08b3f4-ef6b-4b31-9a6d-802709842b9d.png';

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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const processLogo = async () => {
      try {
        setIsProcessing(true);
        const img = await loadImageFromUrl(logoOriginal);
        const blob = await removeBackground(img);
        const url = URL.createObjectURL(blob);
        setLogoUrl(url);
      } catch (err) {
        console.error('Failed to process logo:', err);
        setError(true);
      } finally {
        setIsProcessing(false);
      }
    };

    processLogo();

    // Cleanup
    return () => {
      if (logoUrl) {
        URL.revokeObjectURL(logoUrl);
      }
    };
  }, []);

  if (isProcessing) {
    return (
      <div className={`${sizeMap[size]} ${className} animate-pulse bg-muted rounded`} />
    );
  }

  if (error || !logoUrl) {
    return (
      <Shield className={`${sizeMap[size]} ${className} text-primary glow-primary`} />
    );
  }

  return (
    <img 
      src={logoUrl} 
      alt="PhishNot Logo" 
      className={`${sizeMap[size]} ${className} object-contain`}
    />
  );
};