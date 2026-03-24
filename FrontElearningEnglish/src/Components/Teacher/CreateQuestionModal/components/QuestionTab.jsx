import React from "react";
import { Form, Button, Badge } from "react-bootstrap";
import { FaLayerGroup, FaTimes, FaQuestionCircle } from "react-icons/fa";
import QuestionHeader from "./QuestionHeader";
import QuestionContent from "./QuestionContent";
import MCQFields from "./QuestionFormatFields/MCQFields";
import MatchingFields from "./QuestionFormatFields/MatchingFields";
import OrderingFields from "./QuestionFormatFields/OrderingFields";
import FillBlankInfo from "./QuestionFormatFields/FillBlankInfo";
import PendingQuestionsList from "./BulkSections/PendingQuestionsList";
import CreatedQuestionsTable from "./BulkSections/CreatedQuestionsTable";
import { QUESTION_TYPES } from "../hooks/useQuestionForm";

const QuestionTab = ({
  // Context/State
  qFormData, setQFormData,
  qErrors, qTouched,
  qLoading, qUploadingMedia,
  internalGroupId, setInternalGroupId,
  groupInfo, sectionInfo,
  createdGroupName, setCreatedGroupName,
  setGroupInfo,
  questionToUpdate,
  
  // Handlers
  handleQTypeChange, handleQBlur, handlePointsChange,
  handleOptionChange, addOption, removeOption, moveOption,
  handlePairChange, addPair, removePair,
  handleQuestionSubmit, handleClose,
  
  // Media Props
  mediaProps,
  
  // Bulk Logic
  bulkQuestionsProps
}) => {
  
  const renderFormatFields = () => {
    if (!qFormData.type) {
      return (
        <div className="alert alert-warning d-flex align-items-center">
          <FaQuestionCircle className="me-2" size={20} />
          <div>
            <strong>Vui lòng chọn loại câu hỏi</strong>
            <br />
            <small>Chọn loại câu hỏi ở trên để hiển thị form xây dựng câu hỏi phù hợp.</small>
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
    <div className="p-3 border-top">
      {/* Group Info Alert */}
      <div className="mb-3">
        {internalGroupId ? (
          <div className="alert alert-info py-2 small border-0 shadow-sm">
            <div className="d-flex justify-content-between align-items-center w-100">
              <div>
                <FaLayerGroup className="me-2" />
                Đang thêm vào nhóm: <strong>{groupInfo?.title || groupInfo?.name || createdGroupName || `Group #${internalGroupId}`}</strong>
              </div>
              <div className="d-flex align-items-center gap-3">
                {groupInfo?.sumScore !== undefined && <Badge bg="secondary">Tổng điểm nhóm: {groupInfo.sumScore}</Badge>}
                {sectionInfo && <span className="text-muted fw-bold">| Section: {sectionInfo.title}</span>}
                <Button 
                  variant="link" size="sm" 
                  className="p-0 text-decoration-none ms-2 text-danger" 
                  onClick={() => { setInternalGroupId(null); setCreatedGroupName(""); setGroupInfo(null); }}
                >
                  <FaTimes className="me-1" />Thoát nhóm
                </Button>
              </div>
            </div>
          </div>
        ) : (
          sectionInfo && <div className="alert alert-light py-2 small border shadow-sm">
            <FaQuestionCircle className="me-2 text-primary" />
            Thêm câu hỏi lẻ vào Section: <strong>{sectionInfo.title}</strong>
          </div>
        )}
      </div>

      {qErrors.submit && <div className="alert alert-danger">{qErrors.submit}</div>}

      <Form>
        <QuestionHeader 
          qFormData={qFormData}
          handleQTypeChange={handleQTypeChange}
          handleQBlur={handleQBlur}
          handlePointsChange={handlePointsChange}
          qTouched={qTouched}
          qErrors={qErrors}
          questionToUpdate={questionToUpdate}
          QUESTION_TYPES={QUESTION_TYPES}
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
          {renderFormatFields()}
        </div>
      </Form>

      {/* Bulk Sections */}
      <PendingQuestionsList 
        {...bulkQuestionsProps}
        qLoading={qLoading}
        qUploadingMedia={qUploadingMedia}
        QUESTION_TYPES={QUESTION_TYPES}
      />
      
      <CreatedQuestionsTable 
        {...bulkQuestionsProps}
        QUESTION_TYPES={QUESTION_TYPES}
      />

      {/* Action Buttons */}
      <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
        <Button variant="link" className="text-muted text-decoration-none fw-bold" onClick={handleClose} disabled={qLoading || bulkQuestionsProps.bulkLoading}>Hủy bỏ</Button>
        {!questionToUpdate && (
          <Button
            variant="outline-success"
            onClick={() => handleQuestionSubmit(true)}
            disabled={qLoading || qUploadingMedia || bulkQuestionsProps.bulkLoading}
          >
            {qLoading ? "Đang lưu..." : "Lưu và Thêm câu hỏi khác"}
          </Button>
        )}
        <Button
          className="btn-primary-custom"
          onClick={() => handleQuestionSubmit(false)}
          disabled={qLoading || qUploadingMedia || bulkQuestionsProps.bulkLoading}
        >
          {qLoading ? "Đang xử lý..." : questionToUpdate ? "Lưu thay đổi" : "Tạo câu hỏi"}
        </Button>
      </div>
    </div>
  );
};

export default QuestionTab;
