import React from "react";
import { Form, Button } from "react-bootstrap";
import { FaPlus, FaTimes } from "react-icons/fa";

const QuestionMediaSection = ({ 
  qMediaPreview, 
  qMediaType, 
  handleQMediaChange, 
  handleRemoveQMedia, 
  qUploadingMedia, 
  qFileInputRef,
  qErrors
}) => {
  return (
    <Form.Group className="mb-3">
      <Form.Label>Media đính kèm</Form.Label>
      <div className={`border p-2 rounded bg-light text-center ${qErrors.media ? 'border-danger' : ''}`} style={{ minHeight: '150px' }}>
        {!qMediaPreview ? (
          <div className="py-4 cursor-pointer" onClick={() => qFileInputRef.current?.click()}>
            <FaPlus size={20} className="text-muted mb-2 d-block mx-auto" />
            <span className="text-muted small">{qUploadingMedia ? "Đang tải..." : "Chọn Ảnh/Video/Audio"}</span>
          </div>
        ) : (
          <div className="position-relative">
            {qMediaType === 'image' && <img src={qMediaPreview} alt="Preview" className="img-fluid rounded" style={{ maxHeight: '180px' }} />}
            {qMediaType === 'video' && <video src={qMediaPreview} controls style={{ maxHeight: '180px', width: '100%' }} />}
            {qMediaType === 'audio' && <audio src={qMediaPreview} controls style={{ width: '100%' }} />}
            <Button variant="danger" size="sm" className="position-absolute top-0 end-0 m-1" onClick={handleRemoveQMedia}>
              <FaTimes />
            </Button>
          </div>
        )}
        <input 
          type="file" 
          ref={qFileInputRef} 
          onChange={handleQMediaChange} 
          style={{ display: 'none' }} 
          accept="image/*,video/*,audio/*" 
        />
      </div>
      {qErrors.media && <div className="text-danger small mt-1">{qErrors.media}</div>}
    </Form.Group>
  );
};

export default QuestionMediaSection;
