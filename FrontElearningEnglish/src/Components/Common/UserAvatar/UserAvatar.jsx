import React, { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";

/**
 * Premium User Avatar Component
 * Handles images, fallback to centered initials with gradients, and error states.
 */
const UserAvatar = ({ 
    imageUrl, 
    displayName, 
    size = 40, 
    className = "", 
    style = {},
    borderWidth = 2,
    borderColor = "#fff"
}) => {
    const [imageError, setImageError] = useState(false);
    const finalImageUrl = (imageUrl || "").trim();

    // Reset error state when image URL changes
    useEffect(() => {
        setImageError(false);
    }, [finalImageUrl]);

    // Get initials (e.g., "Nam Nguyễn" -> "NN" or "N")
    const getInitials = (name) => {
        if (!name || name.toLowerCase() === 'guest') return null; // Return null for guest or no name
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase().substring(0, 2);
    };

    const showFallback = !finalImageUrl || finalImageUrl === "" || imageError;
    const initials = getInitials(displayName);

    if (showFallback) {
        // Deterministic solid colors based on name
        const colors = [
            "#4B7BF6", // Brand Blue
            "#6366f1", // Indigo
            "#8b5cf6", // Purple
            "#ec4899", // Pink
            "#ef4444", // Red
            "#f59e0b", // Amber
            "#10b981", // Emerald
            "#0ea5e9", // Sky
        ];
        
        const charCodeSum = (displayName || "User").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const bgColor = colors[charCodeSum % colors.length];

        return (
            <div 
                className={`user-avatar-initials rounded-circle d-flex align-items-center justify-content-center shadow-sm ${className}`}
                style={{ 
                    width: `${size}px`, 
                    height: `${size}px`, 
                    backgroundColor: bgColor, 
                    color: "#fff", 
                    fontWeight: "700", 
                    fontSize: `${Math.max(size / 2.8, 12)}px`,
                    flexShrink: 0,
                    letterSpacing: "0.5px",
                    border: `${borderWidth}px solid ${borderColor}`,
                    textShadow: "none",
                    ...style
                }}
            >
                {initials ? initials : <FaUser />}
            </div>
        );
    }

    return (
        <img 
            src={finalImageUrl} 
            className={`user-avatar-img rounded-circle shadow-sm ${className}`} 
            width={size} 
            height={size} 
            alt={displayName}
            style={{ 
                objectFit: 'cover', 
                flexShrink: 0, 
                backgroundColor: '#f8f9fa',
                border: `${borderWidth}px solid ${borderColor}`,
                ...style
            }}
            onError={() => setImageError(true)}
        />
    );
};

export default UserAvatar;
