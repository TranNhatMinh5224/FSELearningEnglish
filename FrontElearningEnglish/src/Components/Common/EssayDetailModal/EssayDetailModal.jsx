import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import { FaImage, FaVolumeUp, FaInfoCircle, FaStar } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { essayService } from "../../../Services/essayService";
import PremiumCloseButton from "../PremiumCloseButton/PremiumCloseButton";
import { PiBookOpenDuotone } from "react-icons/pi";
import "./EssayDetailModal.css";

export default function EssayDetailModal({ show, onClose, essayId, isAdmin = false }) {
  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchEssayDetail = useCallback(async () => {
    if (!essayId) return;

    setLoading(true);
    setError("");
    try {
      const response = isAdmin
        ? await essayService.getAdminEssayById(essayId)
        : await essayService.getTeacherEssayById(essayId);

      if (response.data?.success && response.data?.data) {
        setEssay(response.data.data);
      } else {
        setError("Không thể tải thông tin chi tiết bài Essay.");
      }
    } catch (err) {
      console.error("Error fetching essay detail:", err);
      setError("Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [essayId, isAdmin]);

  useEffect(() => {
    if (show && essayId) {
      fetchEssayDetail();
    } else if (!show) {
      setEssay(null);
    }
  }, [show, essayId, fetchEssayDetail]);

  const playAudio = (url) => {
    if (!url) return;
    new Audio(url).play();
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="xl"
      className={`essay-detail-modal modal-modern modal-essay-size ${isAdmin ? "admin-modal" : "teacher-modal"}`}
    >
      <Modal.Header closeButton={false} className="border-0 px-4 py-3">
        <Modal.Title className="fw-bold modal-title-centered text-white d-flex align-items-center gap-3">
          <PiBookOpenDuotone size={32} />
          <span>Chi tiết bài Essay</span>
        </Modal.Title>
        <PremiumCloseButton onClick={onClose} />
      </Modal.Header>

      <Modal.Body className="pt-2">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-2 text-muted">Đang tải nội dung bài viết...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger mx-3">{error}</div>
        ) : essay ? (
          <div className="essay-detail-content px-2">
            <div className="essay-header-info mb-4 p-3 rounded-4 bg-light shadow-sm">
              <h3 className="essay-title mb-2 text-primary fw-bold">
                {essay.title || essay.Title}
              </h3>
              <div className="d-flex flex-wrap gap-3 align-items-center">
                <Badge bg="primary" className="points-badge px-3 py-2 rounded-pill d-flex align-items-center gap-2">
                  <FaStar />
                  {essay.totalPoints || essay.TotalPoints || 0} Điểm tối đa
                </Badge>
                <div className="text-muted small d-flex align-items-center gap-2">
                  <FaInfoCircle />
                  Loại bài tập: Tự luận
                </div>
              </div>
            </div>

            <div className="essay-section mb-4">
              <h5 className="section-title mb-3 d-flex align-items-center gap-2">
                <span className="section-dot"></span>
                Yêu cầu & Mô tả bài viết
              </h5>
              <div className="essay-description-box p-4 rounded-4 border bg-white shadow-sm">
                {essay.description || essay.Description ? (
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {essay.description || essay.Description}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <span className="text-muted fst-italic">Không có mô tả chi tiết.</span>
                )}
              </div>
            </div>

            <div className="row g-4 mb-2">
              {/* Media Attachments */}
              {(essay.imageUrl || essay.ImageUrl || essay.audioUrl || essay.AudioUrl) && (
                <div className="col-12">
                  <h5 className="section-title mb-3 d-flex align-items-center gap-2">
                    <span className="section-dot"></span>
                    Tài liệu đính kèm
                  </h5>
                  <div className="row g-3">
                    {/* Image Attachment */}
                    {(essay.imageUrl || essay.ImageUrl) && (
                      <div className={essay.audioUrl || essay.AudioUrl ? "col-md-6" : "col-12"}>
                        <div className="media-card p-2 rounded-4 border bg-white h-100 shadow-sm">
                          <div className="media-label mb-2 px-2 d-flex align-items-center gap-2 small fw-bold text-muted">
                            <FaImage /> Hình ảnh minh họa
                          </div>
                          <img
                            src={essay.imageUrl || essay.ImageUrl}
                            alt="Essay attachment"
                            className="img-fluid rounded-3 w-100 object-fit-cover"
                            style={{ maxHeight: "300px" }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Audio Attachment */}
                    {(essay.audioUrl || essay.AudioUrl) && (
                      <div className={essay.imageUrl || essay.ImageUrl ? "col-md-6" : "col-12"}>
                        <div className="media-card p-3 rounded-4 border bg-white h-100 shadow-sm d-flex flex-column justify-content-center">
                          <div className="media-label mb-3 d-flex align-items-center gap-2 small fw-bold text-muted">
                            <FaVolumeUp /> Âm thanh đính kèm
                          </div>
                          <div className="audio-player-container text-center">
                            <audio controls src={essay.audioUrl || essay.AudioUrl} className="w-100 mb-2">
                              Your browser does not support the audio element.
                            </audio>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="rounded-pill px-4"
                              onClick={() => playAudio(essay.audioUrl || essay.AudioUrl)}
                            >
                              <FaVolumeUp className="me-2" /> Nghe lại
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-5">Không tìm thấy dữ liệu.</div>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-light border-0 px-4 py-3">
        <Button 
          variant="secondary" 
          onClick={onClose}
          className="rounded-pill px-5 fw-bold shadow-sm"
        >
          Đóng cửa sổ
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
