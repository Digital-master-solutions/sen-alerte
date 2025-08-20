// Performance optimization utilities

// Preload critical resources
export const preloadResource = (href: string, as: string, type?: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
};

// Defer non-critical CSS
export const loadCSS = (href: string) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.media = 'print';
  link.onload = () => {
    link.media = 'all';
  };
  document.head.appendChild(link);
};

// Image optimization helpers
export const getOptimizedImageSrc = (src: string, width?: number, quality = 85) => {
  if (src.includes('lovable-uploads')) {
    return src; // Keep Lovable uploads as-is
  }
  
  // For external images, you could add optimization parameters here
  return src;
};

// Lazy load images with Intersection Observer
export const lazyLoadImages = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
};

// Critical CSS inlining (to be used in build process)
export const inlineCriticalCSS = () => {
  // This would typically be handled by a build tool
  // But can be used to identify critical styles
  const criticalStyles = [
    '.container',
    '.btn',
    '.header',
    '.hero',
    '.grid'
  ];
  
  return criticalStyles;
};