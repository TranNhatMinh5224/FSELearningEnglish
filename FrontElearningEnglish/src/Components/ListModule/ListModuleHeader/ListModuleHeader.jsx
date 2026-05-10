import React from "react";
import "./ListModuleHeader.css";

export default function ListModuleHeader({ title, description, onBackClick }) {
    return (
        <>
        <div className="list-module-header-banner">
            <h1>{title}</h1>
            {description && (
                <p className="banner-description">{description}</p>
            )}
        </div>
        </>
    );
}

