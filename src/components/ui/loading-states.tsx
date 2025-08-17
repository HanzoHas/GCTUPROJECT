import React from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

// Optimized loading component with better performance
export const LoadingSpinner = ({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg', className?: string }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeClasses[size], className)} />
  );
};

// Lazy loading wrapper with intersection observer
export const LazyLoadWrapper = ({ 
  children, 
  fallback, 
  className,
  rootMargin = '50px'
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  rootMargin?: string;
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (fallback || <Skeleton className="h-20 w-full" />)}
    </div>
  );
};

// Optimized image component with lazy loading
export const OptimizedImage = ({
  src,
  alt,
  className,
  fallback,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: React.ReactNode;
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className={cn("relative", className)}>
      {!isLoaded && !hasError && (
        <Skeleton className="absolute inset-0" />
      )}
      {hasError ? (
        fallback || <div className="flex items-center justify-center bg-muted text-muted-foreground">Failed to load</div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn("transition-opacity duration-200", isLoaded ? "opacity-100" : "opacity-0")}
          {...props}
        />
      )}
    </div>
  );
};
