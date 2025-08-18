/**
 * Input sanitization utilities to prevent XSS attacks
 */

/**
 * Sanitize HTML content by removing potentially dangerous elements and attributes
 */
export function sanitizeHtml(html: string): string {
  // Create a temporary DOM element to parse the HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Remove script tags and their content
  const scripts = temp.getElementsByTagName('script');
  for (let i = scripts.length - 1; i >= 0; i--) {
    scripts[i].remove();
  }
  
  // Remove potentially dangerous attributes
  const allElements = temp.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    
    // Remove dangerous attributes
    const dangerousAttrs = ['onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur', 'onchange', 'onsubmit'];
    dangerousAttrs.forEach(attr => {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr);
      }
    });
    
    // Remove javascript: links
    if (element.hasAttribute('href')) {
      const href = element.getAttribute('href');
      if (href && href.toLowerCase().startsWith('javascript:')) {
        element.removeAttribute('href');
      }
    }
    
    if (element.hasAttribute('src')) {
      const src = element.getAttribute('src');
      if (src && src.toLowerCase().startsWith('javascript:')) {
        element.removeAttribute('src');
      }
    }
  }
  
  return temp.innerHTML;
}

/**
 * Sanitize text input by encoding HTML entities
 */
export function sanitizeText(text: string): string {
  const temp = document.createElement('div');
  temp.textContent = text;
  return temp.innerHTML;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
  return phoneRegex.test(phone);
}

/**
 * Remove potentially dangerous characters from filenames
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Validate URL format and ensure it's safe
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}