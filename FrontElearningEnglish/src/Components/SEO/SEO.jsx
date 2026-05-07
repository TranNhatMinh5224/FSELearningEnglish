import React from "react";
import { Helmet } from "react-helmet-async";

/**
 * SEO Component for managing page meta tags using react-helmet-async
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.keywords - Page keywords (comma-separated)
 * @param {string} props.image - Open Graph image URL
 * @param {string} props.url - Canonical URL
 * @param {string} props.type - Open Graph type (default: "website")
 * @param {Object} props.schema - JSON-LD Schema object
 */
export default function SEO({
  title = "Catalunya English - Học Tiếng Anh Online Hiệu Quả",
  description = "Nền tảng học tiếng Anh online với các khóa học chất lượng, bài học tương tác, và công cụ học tập hiện đại.",
  keywords = "học tiếng anh, học tiếng anh online, khóa học tiếng anh, luyện thi IELTS, từ vựng tiếng anh, phát âm tiếng anh, Catalunya English",
  image = "/og-image.png",
  url = typeof window !== "undefined" ? window.location.href : "",
  type = "website",
  schema = null,
}) {
  // If schema is an array, wrap it in @graph for better SEO
  const schemaData = schema ? (Array.isArray(schema) 
    ? { "@context": "https://schema.org", "@graph": schema }
    : { "@context": "https://schema.org", ...schema }) : null;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Schema.org JSON-LD */}
      {schemaData && (
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}
    </Helmet>
  );
}

