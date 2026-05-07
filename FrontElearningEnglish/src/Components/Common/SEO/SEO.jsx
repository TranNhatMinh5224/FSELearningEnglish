import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for dynamic metadata management
 * @param {string} title - Page title
 * @param {string} description - Page description
 * @param {string} name - Site name (optional)
 * @param {string} type - Content type (article, website, etc.)
 */
export default function SEO({ title, description, name = "Catalunya English", type = "website" }) {
    const siteTitle = `${title} | ${name}`;
    const siteDescription = description || "Nền tảng học tiếng Anh trực tuyến thông minh với lộ trình cá nhân hóa, AI hỗ trợ và cộng đồng học tập sôi nổi.";
    const currentUrl = window.location.href;

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{siteTitle}</title>
            <meta name='description' content={siteDescription} />
            
            {/* Facebook Meta Tags (Open Graph) */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={siteDescription} />
            <meta property="og:url" content={currentUrl} />
            {/* <meta property="og:image" content="link-to-your-og-image.png" /> */}

            {/* Twitter Meta Tags */}
            <meta name="twitter:creator" content={name} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={siteDescription} />

            {/* Canonical Link */}
            <link rel="canonical" href={currentUrl} />
        </Helmet>
    );
}
