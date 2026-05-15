import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Spinner, Tabs, Tab, Badge, Col } from "react-bootstrap";
import { FaDownload, FaFileAlt, FaEye, FaExternalLinkAlt, FaUserGraduate, FaClipboardList, FaCheckCircle, FaPenNib, FaArrowRight, FaStar, FaPenFancy } from "react-icons/fa";
import { essaySubmissionService } from "../../../../Services/essaySubmissionService";
import SuccessModal from "../../../Common/SuccessModal/SuccessModal";
import NotificationModal from "../../../Common/NotificationModal/NotificationModal";
import PremiumCloseButton from "../../../Common/PremiumCloseButton/PremiumCloseButton";
import "./EssaySubmissionDetailModal.css";

export default function EssaySubmissionDetailModal({ show, onClose, submission, onGradeSuccess, isAdmin = false }) {
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [grading, setGrading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("view");
  const [notification, setNotification] = useState({ isOpen: false, type: "info", message: "" });

  useEffect(() => {
    if (submission) {
      const currentScore = submission.teacherScore !== undefined ? submission.teacherScore :
        (submission.TeacherScore !== undefined ? submission.TeacherScore :
          (submission.score !== undefined ? submission.score :
            (submission.Score !== undefined ? submission.Score : "")));
      const currentFeedback = submission.teacherFeedback || submission.TeacherFeedback ||
        (submission.feedback || submission.Feedback || "");
      setScore(currentScore !== null && currentScore !== undefined ? currentScore.toString() : "");
      setFeedback(currentFeedback);
      setActiveTab("view"); // Reset to view tab when opening new submission
    }
  }, [submission]);


  const handleSubmitGrade = async () => {
    if (!submission) return;

    // Validate score
    if (!score || isNaN(parseFloat(score))) {
      setError("Vui lòng nhập điểm hợp lệ");
      return;
    }

    try {
      setGrading(true);
      setError("");
      const submissionId = submission.submissionId || submission.SubmissionId;
      const gradeData = {
        score: parseFloat(score),
        // Send empty string when feedback is blank so backend that doesn't accept null still works
        feedback: (feedback?.trim() ?? ""),
      };

      const hasGrade = submission.teacherScore !== null && submission.teacherScore !== undefined;

      let response;
      if (isAdmin) {
        response = await essaySubmissionService.gradeAdminManually(submissionId, gradeData);
      } else {
        response = hasGrade
          ? await essaySubmissionService.updateGrade(submissionId, gradeData)
          : await essaySubmissionService.gradeManually(submissionId, gradeData);
      }

      if (response.data?.success) {
        setShowSuccessModal(true);
        if (onGradeSuccess) onGradeSuccess();
      } else {
        setError(response.data?.message || "Chấm bài thất bại");
      }
    } catch (err) {
      console.error("Error grading:", err);
      setError(err.response?.data?.message || "Có lỗi xảy ra khi chấm bài");
    } finally {
      setGrading(false);
    }
  };

  const handleDownload = async () => {
    if (!submission) return;
    try {
      const submissionId = submission.submissionId || submission.SubmissionId;
      const response = isAdmin
        ? await essaySubmissionService.downloadAdminSubmissionFile(submissionId)
        : await essaySubmissionService.downloadSubmissionFile(submissionId);

      // Get filename from Content-Disposition header or use attachmentType
      let fileName = `submission-${submissionId}`;
      const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/['"]/g, '');
        }
      }

      // If no filename from header, try to get from attachmentType
      if (fileName === `submission-${submissionId}`) {
        const attachmentType = submission.attachmentType || submission.AttachmentType;
        if (attachmentType) {
          // Map MIME type to extension
          const mimeToExt = {
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/docx': 'docx',
            'text/plain': 'txt',
            'application/docm': 'docm',
            'application/dotx': 'dotx',
            'application/dotm': 'dotm'
          };

          // Try to get extension from attachmentType
          let extension = 'pdf'; // default
          if (attachmentType.includes('word') || attachmentType.includes('docx')) {
            extension = 'docx';
          } else if (attachmentType.includes('doc') && !attachmentType.includes('docx')) {
            extension = 'doc';
          } else if (attachmentType.includes('pdf')) {
            extension = 'pdf';
          } else if (attachmentType.includes('txt') || attachmentType.includes('text/plain')) {
            extension = 'txt';
          } else {
            // Try to find in mimeToExt
            for (const [mime, ext] of Object.entries(mimeToExt)) {
              if (attachmentType.includes(mime.split('/')[1])) {
                extension = ext;
                break;
              }
            }
          }

          fileName = `submission-${submissionId}.${extension}`;
        }
      }

      // Get content type from response
      const contentType = response.headers['content-type'] || response.headers['Content-Type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading file:", err);
      setNotification({ isOpen: true, type: "error", message: "Không thể tải file" });
    }
  };

  if (!submission) return null;

  const userName = submission.userName || submission.UserName || "N/A";
  const userEmail = submission.userEmail || submission.UserEmail || "N/A";
  const textContent = submission.textContent || submission.TextContent || "";
  const attachmentUrl = submission.attachmentUrl || submission.AttachmentUrl;
  const hasAttachment = submission.hasAttachment || submission.HasAttachment || !!attachmentUrl || !!submission.attachmentKey || !!submission.AttachmentKey;
  const maxScore = submission.maxScore !== undefined ? submission.maxScore : (submission.MaxScore !== undefined ? submission.MaxScore : 100);
  const teacherScore = submission.teacherScore !== undefined ? submission.teacherScore : (submission.TeacherScore !== undefined ? submission.TeacherScore : null);

  return (
    <>
      <Modal
        show={show}
        onHide={onClose}
        centered
        className="essay-submission-detail-modal modal-modern"
        dialogClassName="essay-submission-detail-modal-dialog"
      >
        <Modal.Header className="modal-header-premium border-0 p-4">
          <div className="d-flex align-items-center gap-3">
            <FaPenFancy className="text-white fs-2 opacity-75" />
            <div>
              <Modal.Title className="fw-bold text-white mb-0">Chi tiết bài nộp</Modal.Title>
              <div className="text-white-50 extra-small">Quản lý và chấm điểm bài luận học sinh</div>
            </div>
          </div>
          <PremiumCloseButton onClick={onClose} lightVariant={true} />
        </Modal.Header>
        <Modal.Body className="p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="submission-tabs custom-tabs"
            fill
          >
            <Tab 
              eventKey="view" 
              title={
                <div className="d-flex align-items-center justify-content-center gap-2 py-2">
                  <FaEye /> Xem bài làm
                </div>
              }
            >
              <div className="tab-content-wrapper p-4">
                {error && <Alert variant="danger">{error}</Alert>}

                {/* Essay Prompt Section */}
                <div className="section-title-modern mb-3">
                  <Badge bg="primary" className="mb-2">Đề bài</Badge>
                  <h5 className="fw-bold text-dark">{submission.essayTitle || submission.EssayTitle || "Không rõ tiêu đề"}</h5>
                </div>
                
                <div className="essay-prompt-box-modern p-3 rounded-4 mb-4">
                  {submission.essayDescription || submission.EssayDescription ? (
                    <div className="plain-text-content small">
                      {submission.essayDescription || submission.EssayDescription}
                    </div>
                  ) : (
                    <div className="text-muted small fst-italic">Không có mô tả đề bài.</div>
                  )}
                </div>

                <hr className="my-4 opacity-10" />

                {/* Student Submission Section */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2 text-primary fw-bold">
                    <FaClipboardList />
                    <span>Bài làm của học sinh</span>
                  </div>
                  <Badge bg={hasAttachment ? "success" : "secondary"}>
                    {hasAttachment ? "Có file đính kèm" : "Chỉ nộp văn bản"}
                  </Badge>
                </div>

                {textContent ? (
                  <div className="submission-content-modern p-4 border rounded-4 bg-white shadow-sm mb-4">
                    <div className="plain-text-content">
                      {textContent}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 border border-dashed rounded-4 bg-light text-center text-muted mb-4">
                    <FaPenNib className="mb-2 opacity-25" size={24} />
                    <div>Học sinh không nộp nội dung văn bản.</div>
                  </div>
                )}

                {/* Attachments Section */}
                {hasAttachment && (
                  <div className="attachment-section-modern p-3 rounded-4 border bg-light mb-4">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="file-icon-square bg-white text-primary shadow-sm">
                          <FaFileAlt size={24} />
                        </div>
                        <div>
                          <div className="fw-bold text-truncate small" style={{maxWidth: '200px'}}>
                            {submission.attachmentKey ? submission.attachmentKey.split('/').pop() : "File đính kèm"}
                          </div>
                          <div className="text-muted extra-small">
                            {submission.attachmentType || "Unknown Type"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="d-flex gap-2">
                        {attachmentUrl && (
                          <Button 
                            variant="light" 
                            size="sm" 
                            className="rounded-pill border d-flex align-items-center gap-2"
                            onClick={() => window.open(attachmentUrl, '_blank')}
                          >
                            <FaExternalLinkAlt size={10} /> Xem
                          </Button>
                        )}
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={handleDownload} 
                          className="rounded-pill d-flex align-items-center gap-2"
                        >
                          <FaDownload size={10} /> Tải về
                        </Button>
                      </div>
                    </div>

                    {/* Image Preview */}
                    {attachmentUrl && (submission.attachmentType?.includes('image') || submission.attachmentKey?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && (
                      <div className="mt-3 text-center border-top pt-3">
                        <img 
                          src={attachmentUrl} 
                          alt="Preview" 
                          className="img-fluid rounded-3 border shadow-sm" 
                          style={{maxHeight: '250px', cursor: 'zoom-in'}}
                          onClick={() => window.open(attachmentUrl, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Grade Now Shortcut Button */}
                <div className="text-center mt-5 pt-3 border-top">
                  <Button 
                    variant="outline-primary" 
                    className="rounded-pill px-5 py-2 d-inline-flex align-items-center gap-2 fw-bold"
                    onClick={() => setActiveTab("grade")}
                  >
                    Chấm điểm bài này <FaArrowRight />
                  </Button>
                </div>
              </div>
            </Tab>

            <Tab 
              eventKey="grade" 
              title={
                <div className="d-flex align-items-center justify-content-center gap-2 py-2">
                  <FaPenNib /> Chấm điểm
                </div>
              }
            >
              <div className="tab-content-wrapper p-4">
                {error && <Alert variant="danger" className="rounded-4 border-0 shadow-sm mb-4">{error}</Alert>}
                
                <div className="grading-card-premium p-4 rounded-4 border-0 shadow-sm mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="user-avatar-premium shadow-sm">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-bold fs-5 text-dark">{userName}</div>
                        <div className="text-muted small d-flex align-items-center gap-1">
                          <FaUserGraduate size={12} /> {userEmail}
                        </div>
                      </div>
                    </div>
                    <Badge bg={teacherScore !== null ? "success" : "warning"} className="rounded-pill px-3 py-2 shadow-sm">
                      {teacherScore !== null ? "Đã chấm điểm" : "Đang chờ chấm"}
                    </Badge>
                  </div>

                  <Form>
                    <div className="row g-4">
                      <Col lg={5}>
                        <Form.Group className="mb-0">
                          <Form.Label className="fw-bold text-dark d-flex justify-content-between align-items-center mb-3">
                            <span>Điểm số (Tối đa {maxScore})</span>
                            {score && !isNaN(parseFloat(score)) && (
                              <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-25">
                                {((parseFloat(score) / maxScore) * 100).toFixed(0)}%
                              </Badge>
                            )}
                          </Form.Label>
                          <div className="score-input-wrapper shadow-sm rounded-4 overflow-hidden border-2 mb-3">
                            <Form.Control
                              type="text"
                              inputMode="decimal"
                              placeholder="0.0"
                              value={score}
                              onChange={(e) => {
                                const val = e.target.value.replace(/,/g, '.').replace(/[^\d.]/g, '');
                                if (val.split('.').length <= 2) {
                                  setScore(val);
                                }
                              }}
                              className="score-control border-0 text-center py-3 fs-3 fw-bold"
                            />
                            <div className="score-denominator py-2 text-center bg-light fw-bold text-muted border-top">
                              / {maxScore}
                            </div>
                          </div>
                          
                          {/* Quick Score Presets */}
                          <div className="d-flex gap-2 flex-wrap mb-2">
                            {[Math.round(maxScore*0.5), Math.round(maxScore*0.7), Math.round(maxScore*0.8), Math.round(maxScore*0.9), maxScore].map(p => (
                              <Button 
                                key={p}
                                variant="outline-primary" 
                                size="sm" 
                                className="rounded-pill px-3 py-1 extra-small fw-bold"
                                onClick={() => setScore(p.toString())}
                              >
                                {p}
                              </Button>
                            ))}
                          </div>
                        </Form.Group>
                      </Col>

                      <Col lg={7}>
                        <Form.Group className="mb-0">
                          <Form.Label className="fw-bold text-dark mb-3">Nhận xét chi tiết</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={8}
                            placeholder="Viết nhận xét của bạn tại đây để giúp học sinh tiến bộ hơn..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="feedback-control rounded-4 border-2 p-3 shadow-sm"
                          />
                        </Form.Group>
                      </Col>
                    </div>

                    <div className="d-grid mt-5">
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSubmitGrade}
                        disabled={grading}
                        className="grade-submit-btn rounded-pill py-3 fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2"
                      >
                        {grading ? (
                          <>
                            <Spinner size="sm" animation="border" />
                            Đang xử lý dữ liệu...
                          </>
                        ) : (
                          <>
                            <FaCheckCircle /> Hoàn tất và lưu kết quả
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </div>

                {teacherScore !== null && (
                  <div className="current-grade-banner p-3 rounded-4 d-flex align-items-center justify-content-between shadow-sm">
                    <div className="d-flex align-items-center gap-3">
                      <div className="grade-badge-circle">
                        <FaStar />
                      </div>
                      <div>
                        <div className="text-muted small">Kết quả hiện tại</div>
                        <div className="fw-bold text-dark fs-5">{teacherScore} / {maxScore} điểm</div>
                      </div>
                    </div>
                    <Button 
                      variant="link" 
                      className="text-decoration-none text-primary fw-bold small"
                      onClick={() => {
                        setScore(teacherScore.toString());
                        setFeedback(feedback || "");
                      }}
                    >
                      Sửa điểm cũ
                    </Button>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>

        <Modal.Footer className="border-0 p-3 bg-light bg-opacity-50">
          <Button variant="outline-secondary" onClick={onClose} className="rounded-pill px-4">
            Đóng
          </Button>
        </Modal.Footer>

        <NotificationModal
          isOpen={notification.isOpen}
          onClose={() => setNotification({ ...notification, isOpen: false })}
          type={notification.type}
          message={notification.message}
        />
      </Modal>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
        title="Thành công"
        message="Chấm bài thành công!"
        autoClose={true}
        autoCloseDelay={1500}
      />
    </>
  );
}

