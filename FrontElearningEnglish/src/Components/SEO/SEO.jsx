import { useEffect } from "react";

/**
 * SEO Component for managing page meta tags
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.keywords - Page keywords (comma-separated)
 * @param {string} props.image - Open Graph image URL
 * @param {string} props.url - Canonical URL
 * @param {string} props.type - Open Graph type (default: "website")
 */
export default function SEO({
  title = "Catalunya English - Học Tiếng Anh Online Hiệu Quả",
  description = "Nền tảng học tiếng Anh online với các khóa học chất lượng, bài học tương tác, và công cụ học tập hiện đại.",
  keywords = "học tiếng anh, học tiếng anh online, khóa học tiếng anh, luyện thi IELTS, từ vựng tiếng anh, phát âm tiếng anh, Catalunya English",
  image = "/logo512.png",
  url = typeof window !== "undefined" ? window.location.href : "",
  type = "website",
  schema = null,
}) {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name, content, attribute = "name") => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Primary meta tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);
    updateMetaTag("title", title);

    // Open Graph tags
    updateMetaTag("og:title", title, "property");
    updateMetaTag("og:description", description, "property");
    updateMetaTag("og:image", image, "property");
    updateMetaTag("og:url", url, "property");
    updateMetaTag("og:type", type, "property");

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image", "property");
    updateMetaTag("twitter:title", title, "property");
    updateMetaTag("twitter:description", description, "property");
    updateMetaTag("twitter:image", image, "property");

    // Canonical URL
    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    // Schema.org JSON-LD
    let script = document.querySelector("script[type='application/ld+json']");
    if (schema) {
      if (!script) {
        script = document.createElement("script");
        script.setAttribute("type", "application/ld+json");
        document.head.appendChild(script);
      }
      
      // If schema is an array, wrap it in @graph for better SEO
      const schemaData = Array.isArray(schema) 
        ? { "@context": "https://schema.org", "@graph": schema }
        : schema;
        
      script.textContent = JSON.stringify(schemaData);
    } else if (script) {
      script.remove();
    }
  }, [title, description, keywords, image, url, type, schema]);

  return null;
}

