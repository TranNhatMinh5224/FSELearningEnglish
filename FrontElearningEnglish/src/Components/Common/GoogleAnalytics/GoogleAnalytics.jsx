import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useScript } from "../../../hooks/useScript";

const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
    const location = useLocation();

    // 1. Lazy load GA Script with 3s delay to protect Lighthouse performance
    const status = useScript(
        GA_MEASUREMENT_ID ? `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}` : null,
        { delay: 3000 }
    );

    useEffect(() => {
        if (status === "ready" && GA_MEASUREMENT_ID && window.gtag) {
            // Initialize GA if not already done
            if (!window.dataLayer) {
                window.dataLayer = window.dataLayer || [];
                window.gtag = function() { window.dataLayer.push(arguments); }
                window.gtag('js', new Date());
                window.gtag('config', GA_MEASUREMENT_ID, {
                    page_path: location.pathname + location.search
                });
            } else {
                // Track page view on route change
                window.gtag('config', GA_MEASUREMENT_ID, {
                    page_path: location.pathname + location.search
                });
            }
        } else if (status === "ready" && GA_MEASUREMENT_ID && !window.gtag) {
            // Setup gtag function if script is loaded but window.gtag is missing
            window.dataLayer = window.dataLayer || [];
            function gtag() { window.dataLayer.push(arguments); }
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', GA_MEASUREMENT_ID, {
                page_path: location.pathname + location.search
            });
        }
    }, [status, location, GA_MEASUREMENT_ID]);

    return null; // This component doesn't render anything UI-wise
}
