import React from "react";
import "./ListModuleHeader.css";

export default function ListModuleHeader({ title, description, onBackClick }) {
    return (
        <>
            <div className="list-module-header-banner">
                <h1>{title}</h1>
            </div>
            {description && (
                <p className="lesson-description">{description}</p>
            )}
        </>
    );
}

