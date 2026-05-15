import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Button, Tab, Tabs } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useQuestionForm } from './hooks/useQuestionForm';
import QuestionTab from './components/QuestionTab';
import GroupTab from "./components/GroupTab";
import { FaLayerGroup, FaQuestionCircle, FaEdit, FaPlusCircle } from "react-icons/fa";
import { useGroupForm } from "./hooks/useGroupForm";
import useBulkQuestions from './hooks/useBulkQuestions';
import { useAuth } from "../../../Context/AuthContext";
import { useEnums } from "../../../Context/EnumContext";
import { quizService } from "../../../Services/quizService";
import { questionService } from "../../../Services/questionService";
import './CreateQuestionModal.css';

export default function CreateQuestionModal({
  show,
  onClose,
  onSuccess,
  sectionId,
  groupId,
  questionToUpdate,
  isAdmin: propIsAdmin = false
}) {
  const { roles } = useAuth();
  const { questionTypes: backendQuestionTypes } = useEnums();

  // Role detection
  const isAdmin = propIsAdmin || (roles && roles.some(role => {
    const roleName = typeof role === 'string' ? role : (role?.name || '');
    return ["SuperAdmin", "ContentAdmin", "FinanceAdmin", "Admin"].includes(roleName);
  }));

  const [activeTab, setActiveTab] = useState("question");
  const [internalGroupId, setInternalGroupId] = useState(groupId);
  const [groupInfo, setGroupInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const bulkQuestionsProps = useBulkQuestions(isAdmin, onSuccess);
  const qForm = useQuestionForm(show, questionToUpdate);
  const groupForm = useGroupForm(
    sectionId,
    isAdmin,
    onSuccess,
    setInternalGroupId,
    () => { },
    setGroupInfo,
    setActiveTab
  );

  const handleSubmit = useCallback(async (isAddMore = false) => {
    if (!qForm.validateQuestionForm()) {
      toast.error("Vui lòng kiểm tra lại các trường thông tin bắt buộc.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = qForm.buildQuestionPayload(sectionId, internalGroupId);

      let response;
      if (questionToUpdate && (questionToUpdate.questionId || questionToUpdate.id)) {
        const id = questionToUpdate.questionId || questionToUpdate.id;
        response = isAdmin
          ? await questionService.updateAdminQuestion(id, payload)
          : await questionService.updateQuestion(id, payload);
      } else {
        response = isAdmin
          ? await questionService.createAdminQuestion(payload)
          : await questionService.createQuestion(payload);
      }

      if (response.data?.success) {
        toast.success(questionToUpdate ? "Cập nhật câu hỏi thành công!" : "Tạo câu hỏi thành công!");
        if (isAddMore) {
          qForm.resetQuestionForm(qForm.qFormData.type);
        } else {
          onSuccess && onSuccess(response.data.data);
          onClose();
        }
      } else {
        throw new Error(response.data?.message || "Lỗi khi lưu câu hỏi.");
      }
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error(error.message || "Đã có lỗi xảy ra khi gửi câu hỏi.");
    } finally {
      setIsSubmitting(false);
    }
  }, [qForm, sectionId, internalGroupId, questionToUpdate, isAdmin, onSuccess, onClose]);

  const mediaProps = {
    qMediaPreview: qForm.qMediaPreview,
    qMediaType: qForm.qMediaType,
    handleUploadSuccess: qForm.handleUploadSuccess,
    handleRemoveMedia: qForm.handleRemoveMedia,
    onUploadingChange: qForm.setQUploadingMedia,
  };

  useEffect(() => {
    if (show) {
      const targetGId = questionToUpdate ? (questionToUpdate.quizGroupId || questionToUpdate.QuizGroupId) : groupId;
      setInternalGroupId(targetGId);
      setActiveTab("question");

      if (targetGId) {
        (async () => {
          try {
            const res = isAdmin
              ? await quizService.getAdminQuizGroupById(targetGId)
              : await quizService.getQuizGroupById(targetGId);
            if (res.data?.success) setGroupInfo(res.data.data);
          } catch (e) { console.error(e); }
        })();
      } else {
        setGroupInfo(null);
      }
    }
  }, [show, groupId, questionToUpdate, isAdmin]);

  if (!show) return null;

  return (
    <Modal
      show={show}
      onHide={onClose}
      backdrop="static"
      keyboard={false}
      className={`create-question-modal ${isAdmin ? 'admin-modal' : 'teacher-modal'}`}
      dialogClassName="create-question-modal-xl"
      style={{ zoom: 0.8 }}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {questionToUpdate ? (
            <><FaEdit className="text-primary" /> Cập nhật câu hỏi</>
          ) : (
            <><FaPlusCircle className="text-primary" /> Tạo câu hỏi mới</>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} id="question-modal-tabs">
          <Tab eventKey="question" title={<><FaQuestionCircle className="me-2" />Câu hỏi</>}>
            <QuestionTab
              {...qForm}
              handlePointsChange={qForm.handlePointsChange}
              mediaProps={mediaProps}
              internalGroupId={internalGroupId}
              setInternalGroupId={setInternalGroupId}
              groupInfo={groupInfo}
              sectionId={sectionId}
              sectionInfo={sectionId ? { title: "Section", id: sectionId } : null}
              questionToUpdate={questionToUpdate}
              handleQuestionSubmit={handleSubmit}
              handleClose={onClose}
              qLoading={isSubmitting}
              bulkQuestionsProps={bulkQuestionsProps}
              backendQuestionTypes={backendQuestionTypes}
            />
          </Tab>
          {!questionToUpdate && (
            <Tab eventKey="group" title={<><FaLayerGroup className="me-2" />Nhóm câu hỏi</>}>
              <GroupTab
                {...groupForm}
                groupInfo={groupInfo}
                sectionId={sectionId}
                internalGroupId={internalGroupId}
                setInternalGroupId={setInternalGroupId}
                handleClose={onClose}
                bulkQuestionsProps={bulkQuestionsProps}
              />
            </Tab>
          )}
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting || qForm.qUploadingMedia || groupForm.gLoading}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
