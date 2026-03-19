import React from "react";
import "./ListLessonHeader.css";

export default function ListLessonHeader({ courseTitle }) {
    return (
        <div className="list-lesson-header">
            <h1>{courseTitle}</h1>
        </div>
    );
}

