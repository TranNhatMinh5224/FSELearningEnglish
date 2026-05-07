import { useEffect, useState } from "react";

/**
 * Custom hook to dynamically load third-party scripts with optional delay.
 * Useful for improving performance by delaying non-critical scripts like Google/FB SDKs.
 * 
 * @param {string} src - The script source URL
 * @param {object} options - { delay: number (ms), async: boolean }
 * @returns {string} status - 'loading', 'ready', or 'error'
 */
export const useScript = (src, { delay = 0, async = true } = {}) => {
  const [status, setStatus] = useState(src ? "loading" : "idle");

  useEffect(() => {
    if (!src) {
      setStatus("idle");
      return;
    }

    const loadScript = () => {
      // Check if script already exists
      let script = document.querySelector(`script[src="${src}"]`);

      if (!script) {
        script = document.createElement("script");
        script.src = src;
        script.async = async;
        script.setAttribute("data-status", "loading");
        document.body.appendChild(script);

        const setAttributeFromEvent = (event) => {
          script.setAttribute(
            "data-status",
            event.type === "load" ? "ready" : "error"
          );
        };

        script.addEventListener("load", setAttributeFromEvent);
        script.addEventListener("error", setAttributeFromEvent);
      } else {
        setStatus(script.getAttribute("data-status"));
      }

      const setStateFromEvent = (event) => {
        setStatus(event.type === "load" ? "ready" : "error");
      };

      script.addEventListener("load", setStateFromEvent);
      script.addEventListener("error", setStateFromEvent);

      return () => {
        if (script) {
          script.removeEventListener("load", setStateFromEvent);
          script.removeEventListener("error", setStateFromEvent);
        }
      };
    };

    let timeoutId;
    if (delay > 0) {
      timeoutId = setTimeout(loadScript, delay);
    } else {
      loadScript();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [src, delay, async]);

  return status;
};
