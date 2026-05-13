import React from "react";
import { Form } from "react-bootstrap";
import FileUpload from "../../../Common/FileUpload/FileUpload";

const QuestionMediaSection = ({ 
  qMediaPreview, 
  qMediaType,
  handleUploadSuccess,
  handleRemoveMedia,
  onUploadingChange,
  qErrors
}) => {
  return (
    <Form.Group className="mb-3">
      <Form.Label className="fw-bold text-muted small text-uppercase mb-2">Media đính kèm</Form.Label>
      <FileUpload
        bucket="questions"
        accept="image/*,audio/*,video/*"
        maxSize={100}
        existingUrl={qMediaPreview}
        initialFileType={qMediaType}
        onUploadSuccess={handleUploadSuccess}
        onRemove={handleRemoveMedia}
        onUploadingChange={onUploadingChange}
        label="Chọn Ảnh, Video hoặc Audio"
        hint="Kéo thả hoặc dán từ clipboard"
      />
      {qErrors.media && <div className="text-danger small mt-2">{qErrors.media}</div>}
    </Form.Group>
  );
};

export default QuestionMediaSection;
