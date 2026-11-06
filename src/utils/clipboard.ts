/**
 * Safe clipboard copy utility with automatic fallback.
 * Works seamlessly in sandboxed iframes and environments where
 * navigator.clipboard.writeText may throw "Permission denied" / NotAllowedError.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try navigator.clipboard.writeText if available and permitted
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied in iframe or insecure context - continue to execCommand fallback
    }
  }

  // 2. Fallback to document.execCommand('copy') via temporary textarea
  try {
    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      textarea.style.opacity = '0';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    }
  } catch {
    // Both methods failed, silently return false without throwing
  }

  return false;
}

export default copyToClipboard;
