import React from "react";
import { Form, Button, Badge, Row, Col } from "react-bootstrap";
import { FaLayerGroup, FaTimes, FaQuestionCircle, FaSave, FaPlusCircle, FaCheckCircle, FaStar, FaClock } from "react-icons/fa";
import QuestionHeader from "./QuestionHeader";
import QuestionContent from "./QuestionContent";
import MCQFields from "./QuestionFormatFields/MCQFields";
import MatchingFields from "./QuestionFormatFields/MatchingFields";
import OrderingFields from "./QuestionFormatFields/OrderingFields";
import FillBlankInfo from "./QuestionFormatFields/FillBlankInfo";
import PendingQuestionsList from "./BulkSections/PendingQuestionsList";
import CreatedQuestionsTable from "./BulkSections/CreatedQuestionsTable";
import { useEnums } from "../../../../Context/EnumContext";

const QuestionTab = ({
  // Context/State
  qFormData, setQFormData,
  qErrors = {}, qTouched = {},
  qLoading, qUploadingMedia,
  internalGroupId, setInternalGroupId,
  groupInfo, sectionInfo,
  createdGroupName, setCreatedGroupName,
  setGroupInfo,
  questionToUpdate,

  // Handlers from useQuestionForm
  handleQTypeChange, handleQBlur, handlePointsChange,
  handleOptionChange, addOption, removeOption, moveOption,
  handlePairChange, addPair, removePair,
  handleQuestionSubmit, handleClose,
  validateQuestionForm, buildQuestionPayload, resetQuestionForm,
  qMediaTempKey, qMediaType,
  setQMediaTempKey, setQMediaType, setQMediaPreview,

  // Media Props
  mediaProps,

  // Bulk Logic
  bulkQuestionsProps,
  backendQuestionTypes
}) => {
  const { mappings } = useEnums();
  const QUESTION_TYPES = mappings.QuestionType || {};

  const {
    pendingQuestions,
    createdQuestions,
    bulkLoading,
    addToPendingList,
    editPendingQuestion,
    removeFromPendingList,
    handleBulkCreate,
    removeFromCreatedList
  } = bulkQuestionsProps;

  const handleEditPendingQuestion = (id) => {
    const originalData = editPendingQuestion(id);
    if (originalData) {
      setQFormData(originalData.qFormData);
      setQMediaTempKey(originalData.qMediaTempKey);
      setQMediaType(originalData.qMediaType);
      
      // Restore media preview
      if (originalData.qMediaPreview) {
         setQMediaPreview(originalData.qMediaPreview);
      } else if (originalData.qFormData.mediaUrl || originalData.qFormData.mediaPreview) {
         setQMediaPreview(originalData.qFormData.mediaUrl || originalData.qFormData.mediaPreview);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderFormatFields = () => {
    if (!qFormData.type) {
      return (
        <div className="alert alert-warning d-flex align-items-center rounded-4 border-0 shadow-sm p-4">
          <div className="icon-circle bg-warning text-white me-3">
            <FaQuestionCircle size={24} />
          </div>
          <div>
            <strong className="d-block">Chưa chọn loại câu hỏi</strong>
            <small className="text-muted">Vui lòng chọn loại câu hỏi ở phần cấu hình phía trên để bắt đầu soạn thảo nội dung.</small>
          </div>
        </div>
      );
    }

    const type = Number(qFormData.type);
    switch (type) {
      case QUESTION_TYPES.MultipleChoice:
      case QUESTION_TYPES.MultipleAnswers:
      case QUESTION_TYPES.TrueFalse:
        return (
          <MCQFields
            qFormData={qFormData}
            handleOptionChange={handleOptionChange}
            removeOption={removeOption}
            addOption={addOption}
            QUESTION_TYPES={QUESTION_TYPES}
          />
        );
      case QUESTION_TYPES.Matching:
        return (
          <MatchingFields
            matchingPairs={qFormData.matchingPairs}
            handlePairChange={handlePairChange}
            removePair={removePair}
            addPair={addPair}
          />
        );
      case QUESTION_TYPES.Ordering:
        return (
          <OrderingFields
            options={qFormData.options}
            handleOptionChange={handleOptionChange}
            moveOption={moveOption}
            removeOption={removeOption}
            addOption={addOption}
          />
        );
      case QUESTION_TYPES.FillBlank:
        return <FillBlankInfo />;
      default:
        return <div className="alert alert-danger">Loại câu hỏi không được hỗ trợ: {qFormData.type}</div>;
    }
  };

  return (
    <div className="p-1 question-tab-container">
      {/* Dynamic Header Status */}
      <div className="mb-4">
        {internalGroupId ? (
          <div className="alert alert-info py-3 px-4 rounded-4 border-0 shadow-sm d-flex justify-content-between align-items-center group-active-banner">
            <div className="d-flex align-items-center">
              <div className="icon-circle bg-info text-white me-3">
                <FaLayerGroup />
              </div>
              <div>
                <div className="small text-info-emphasis fw-bold text-uppercase">Đang thêm vào nhóm</div>
                <strong className="text-dark">{groupInfo?.title || groupInfo?.name || createdGroupName || `Group #${internalGroupId}`}</strong>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              {groupInfo?.sumScore !== undefined && (
                <div className="px-3 py-1 bg-white rounded-pill text-info fw-bold border">
                  {groupInfo.sumScore} Điểm
                </div>
              )}
              <Button
                variant="link"
                className="text-danger text-decoration-none hover-scale"
                onClick={() => { setInternalGroupId(null); setCreatedGroupName(""); setGroupInfo(null); }}
              >
                <FaTimes className="me-1" /> Thoát nhóm
              </Button>
            </div>
          </div>
        ) : (
          sectionInfo && (
            <div className="alert alert-light py-3 px-4 rounded-4 border shadow-sm d-flex align-items-center">
              <div className="icon-circle bg-light text-primary border me-3">
                <FaQuestionCircle />
              </div>
              <div>
                <div className="small text-muted fw-bold text-uppercase">Phân mục hiện tại</div>
                <strong className="text-dark">{sectionInfo.title}</strong>
              </div>
            </div>
          )
        )}
      </div>

      {qErrors.submit && <div className="alert alert-danger rounded-3 shadow-sm">{qErrors.submit}</div>}

      <Form className="h-100">
        <Row className="g-4 h-100">
          <Col lg={9} className="question-main-content">
            {/* Main Question Builder Flow */}
            <QuestionHeader
              qFormData={qFormData}
              handleQTypeChange={handleQTypeChange}
              handleQBlur={handleQBlur}
              handlePointsChange={handlePointsChange}
              qTouched={qTouched}
              qErrors={qErrors}
              questionToUpdate={questionToUpdate}
              QUESTION_TYPES={QUESTION_TYPES}
              backendQuestionTypes={backendQuestionTypes}
              internalGroupId={internalGroupId}
              groupInfo={groupInfo}
            />

            <QuestionContent
              qFormData={qFormData}
              setQFormData={setQFormData}
              qTouched={qTouched}
              qErrors={qErrors}
              handleQBlur={handleQBlur}
              QUESTION_TYPES={QUESTION_TYPES}
              mediaProps={mediaProps}
            />

            <div className="mt-4">
              {qErrors.options && <div className="alert alert-danger py-2 mb-3 small">{qErrors.options}</div>}
              {qErrors.matchingPairs && <div className="alert alert-danger py-2 mb-3 small">{qErrors.matchingPairs}</div>}
              <div className="question-format-fields-wrapper">
                {renderFormatFields()}
              </div>
            </div>

            {/* Pending List - Moved here for better UX */}
            <div className="mt-5">
              <PendingQuestionsList
                pendingQuestions={pendingQuestions}
                removeFromPendingList={removeFromPendingList}
                onEdit={handleEditPendingQuestion}
                handleBulkCreate={handleBulkCreate}
                bulkLoading={bulkLoading}
                qLoading={qLoading}
                qUploadingMedia={qUploadingMedia}
                QUESTION_TYPES={QUESTION_TYPES}
              />
            </div>

            {/* Success Lists */}
            <div className="mt-4">
              <CreatedQuestionsTable
                {...bulkQuestionsProps}
                QUESTION_TYPES={QUESTION_TYPES}
              />
            </div>
          </Col>

          <Col lg={3} className="question-sidebar-content">
            <div className="sticky-top" style={{ top: '0' }}>
              <div className="form-section-card shadow-lg border-0 overflow-hidden action-card-raised">
                <div className="p-4 text-center">
                  <div className="action-icon-circle bg-primary text-white mx-auto mb-3 shadow">
                    <FaSave />
                  </div>
                  <h5 className="fw-bold mb-2">{questionToUpdate ? "Cập nhật câu hỏi" : "Lưu câu hỏi"}</h5>
                  <p className="text-muted small mb-4">
                    Kiểm tra kỹ nội dung trước khi lưu. Bạn có thể soạn nhanh bằng cách thêm vào danh sách chờ bên trái.
                  </p>

                  <div className="d-grid gap-3">
                    <Button
                      className="btn-primary-custom fw-bold rounded-pill shadow-primary hover-lift"
                      onClick={() => handleQuestionSubmit(false)}
                      disabled={qLoading || qUploadingMedia || bulkLoading}
                    >
                      {qLoading ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span> Đang lưu...</>
                      ) : (
                        <><FaCheckCircle className="me-2" /> {questionToUpdate ? "Lưu thay đổi" : "Hoàn tất & Lưu"}</>
                      )}
                    </Button>

                    {!questionToUpdate && (
                      <Button
                        variant="outline-primary"
                        className="fw-bold rounded-pill border-2 hover-lift"
                        onClick={() => {
                          if (validateQuestionForm()) {
                            addToPendingList(
                              qFormData,
                              qMediaTempKey,
                              qMediaType,
                              mediaProps.qMediaPreview,
                              () => buildQuestionPayload(null, internalGroupId)
                            );
                            resetQuestionForm(qFormData.type);
                          }
                        }}
                        disabled={qLoading || qUploadingMedia || bulkLoading}
                      >
                        <FaPlusCircle className="me-2" /> Thêm vào danh sách chờ
                      </Button>
                    )}

                    <Button
                      variant="outline-secondary"
                      className="rounded-pill border-0 text-muted btn-sm"
                      onClick={handleClose}
                      disabled={qLoading}
                    >
                      Hủy bỏ
                    </Button>
                  </div>
                </div>

                {/* Session Statistics - Minimalist Style */}
                <div className="bg-light bg-opacity-50 p-4 border-top">
                  <div className="d-flex align-items-center gap-2 mb-4">
                    <div className="badge-dot bg-primary"></div>
                    <span className="small fw-bold text-muted text-uppercase tracking-wider">Thông tin phiên làm việc</span>
                  </div>

                  <div className="session-stats">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <FaQuestionCircle className="text-primary opacity-75" size={14} />
                        <span className="small text-secondary">Tổng câu trong phân mục</span>
                      </div>
                      <span className="fw-bold text-dark small">{sectionInfo?.totalQuestions || 0}</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <FaClock className="text-warning opacity-75" size={14} />
                        <span className="small text-secondary">Đang trong hàng đợi</span>
                      </div>
                      <span className="fw-bold text-warning small">{pendingQuestions.length} câu</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <FaCheckCircle className="text-success opacity-75" size={14} />
                        <span className="small text-secondary">Đã tạo thành công</span>
                      </div>
                      <span className="fw-bold text-success small">{createdQuestions.length} câu</span>
                    </div>

                    {pendingQuestions.length > 0 && (
                      <div className="mt-4 pt-3 border-top border-dashed">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: '10px' }}>Tổng điểm hàng đợi</span>
                          <span className="fw-bold text-danger fs-5">
                            {pendingQuestions.reduce((sum, q) => sum + (Number(q.preview.points) || 0), 0)}đ
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default QuestionTab;
