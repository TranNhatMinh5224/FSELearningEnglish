import React, { useState, useEffect, useCallback } from "react";
import { Modal, Tab, Tabs } from "react-bootstrap";
import { FaLayerGroup, FaQuestionCircle } from "react-icons/fa";

import { quizService } from "../../../Services/quizService";
import { questionService } from "../../../Services/questionService";
import ConfirmModal from "../../Common/ConfirmModal/ConfirmModal";
import SuccessModal from "../../Common/SuccessModal/SuccessModal";
import { useAuth } from "../../../Context/AuthContext";

import { useQuestionForm, QUESTION_TYPES } from "./hooks/useQuestionForm";
import { useGroupForm } from "./hooks/useGroupForm";
import { useBulkQuestions } from "./hooks/useBulkQuestions";

import QuestionTab from "./components/QuestionTab";
import GroupTab from "./components/GroupTab";

import "./CreateQuestionModal.css";

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

  // Auto-detect admin role from AuthContext
  const isAdmin = propIsAdmin || (roles && roles.some(role => {
    const roleName = typeof role === 'string' ? role : (role?.name || '');
    return ["SuperAdmin", "ContentAdmin", "FinanceAdmin"].includes(roleName);
  }));

  const [activeTab, setActiveTab] = useState("question");
  const [internalGroupId, setInternalGroupId] = useState(groupId);
  const [groupInfo, setGroupInfo] = useState(null);
  const [sectionInfo, setSectionInfo] = useState(null);
  const [createdGroupName, setCreatedGroupName] = useState("");
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [qLoading, setQLoading] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showBulkSuccess, setShowBulkSuccess] = useState(false);
  const [bulkSuccessCount, setBulkSuccessCount] = useState(0);

  // --- hooks ---
  const qForm = useQuestionForm(show, questionToUpdate);
  
  const bulkQuestions = useBulkQuestions(isAdmin, onSuccess);

  const groupForm = useGroupForm(
    sectionId, 
    isAdmin, 
    onSuccess, 
    setInternalGroupId, 
    setCreatedGroupName, 
    setGroupInfo, 
    setActiveTab
  );

  // --- Fetching Context ---
  const fetchGroupDetails = useCallback(async (id) => {
    try {
      const res = isAdmin
        ? await quizService.getAdminQuizGroupById(id)
        : await quizService.getQuizGroupById(id);
      if (res.data?.success) setGroupInfo(res.data.data);
    } catch (e) { console.error(e); }
  }, [isAdmin]);

  const fetchSectionDetails = useCallback(async (id) => {
    try {
      const res = isAdmin
        ? await quizService.getAdminQuizSectionById(id)
        : await quizService.getQuizSectionById(id);
      if (res.data?.success) setSectionInfo(res.data.data);
    } catch (e) { console.error(e); }
  }, [isAdmin]);

  useEffect(() => {
    if (show) {
      const targetGId = questionToUpdate ? (questionToUpdate.quizGroupId || questionToUpdate.QuizGroupId) : groupId;
      setInternalGroupId(targetGId);
      setActiveTab("question");
      if (targetGId) fetchGroupDetails(targetGId);
      if (sectionId) fetchSectionDetails(sectionId);
    }
  }, [show, groupId, sectionId, questionToUpdate, fetchGroupDetails, fetchSectionDetails]);

  // --- Handlers ---
  const hasFormData = () => {
    return (
      qForm.qFormData.stemText.trim() !== "" ||
      qForm.qFormData.explanation.trim() !== "" ||
      qForm.qMediaPreview !== null ||
      groupForm.gFormData.name.trim() !== "" ||
      bulkQuestions.pendingQuestions.length > 0
    );
  };

  const handleClose = () => {
    if (qLoading || groupForm.gLoading || bulkQuestions.bulkLoading) return;
    if (hasFormData()) {
      setShowConfirmClose(true);
    } else {
      bulkQuestions.setPendingQuestions([]);
      bulkQuestions.setCreatedQuestions([]);
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    bulkQuestions.setPendingQuestions([]);
    bulkQuestions.setCreatedQuestions([]);
    onClose();
  };

  const handleQuestionSubmit = async (isAddMore = false) => {
    if (!qForm.validateQuestionForm()) {
      qForm.setQTouched({ stemText: true, type: true, points: true });
      return;
    }

    if (isAddMore && !questionToUpdate) {
      bulkQuestions.addToPendingList(
        qForm.qFormData, 
        qForm.qMediaTempKey, 
        qForm.qMediaType, 
        () => qForm.buildQuestionPayload(sectionId, internalGroupId)
      );
      qForm.resetQuestionForm(qForm.qFormData.type);
      return;
    }

    setQLoading(true);
    qForm.setQErrors({});
    try {
      const payload = qForm.buildQuestionPayload(sectionId, internalGroupId);
      if (questionToUpdate) payload.questionId = questionToUpdate.questionId;

      let response = questionToUpdate
        ? (isAdmin ? await questionService.updateAdminQuestion(questionToUpdate.questionId, payload) : await questionService.updateQuestion(questionToUpdate.questionId, payload))
        : (isAdmin ? await questionService.createAdminQuestion(payload) : await questionService.createQuestion(payload));

      if (response.data?.success) {
        onSuccess(response.data.data);
        if (isAddMore) {
          qForm.resetQuestionForm(qForm.qFormData.type);
        } else {
          onClose();
        }
      } else {
        qForm.setQErrors({ submit: response.data?.message || "Có lỗi xảy ra" });
      }
    } catch (err) {
      qForm.setQErrors({ submit: err.response?.data?.message || "Lỗi kết nối" });
    } finally {
      setQLoading(false);
    }
  };
  
  const handleConfirmBulkCreate = async () => {
    const count = bulkQuestions.pendingQuestions.length;
    const result = await bulkQuestions.handleBulkCreate(sectionId, internalGroupId);
    if (result.success) {
      setBulkSuccessCount(count);
      setShowBulkConfirm(false);
      setShowBulkSuccess(true);
      // Clear history of created questions too if the user wants it "clean"
      bulkQuestions.setCreatedQuestions([]);
    } else if (result.message) {
      qForm.setQErrors({ submit: result.message });
      setShowBulkConfirm(false);
    }
  };
  const handlePointsChange = (val) => {
    qForm.setQFormData(prev => ({ ...prev, points: val }));
    if (qForm.qTouched.points) qForm.setQErrors(prev => ({ ...prev, points: null }));
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered className="modal-modern" dialogClassName="create-question-modal-xl">
        <Modal.Header closeButton>
          <Modal.Title>{questionToUpdate ? "Cập nhật câu hỏi" : "Tạo mới nội dung"}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="px-3 pt-2 border-bottom-0 custom-tabs">
            <Tab eventKey="question" title={<span><FaQuestionCircle className="me-2" />Câu hỏi</span>}>
              <QuestionTab 
                {...qForm}
                qLoading={qLoading}
                internalGroupId={internalGroupId}
                setInternalGroupId={setInternalGroupId}
                groupInfo={groupInfo}
                setGroupInfo={setGroupInfo}
                sectionInfo={sectionInfo}
                createdGroupName={createdGroupName}
                setCreatedGroupName={setCreatedGroupName}
                questionToUpdate={questionToUpdate}
                handleQuestionSubmit={handleQuestionSubmit}
                handleClose={handleClose}
                handlePointsChange={handlePointsChange}
                mediaProps={{
                  qMediaPreview: qForm.qMediaPreview,
                  qMediaType: qForm.qMediaType,
                  handleQMediaChange: qForm.handleQMediaChange,
                  handleRemoveQMedia: qForm.handleRemoveQMedia,
                  qUploadingMedia: qForm.qUploadingMedia,
                  qFileInputRef: qForm.qFileInputRef
                }}
                bulkQuestionsProps={{
                  pendingQuestions: bulkQuestions.pendingQuestions,
                  createdQuestions: bulkQuestions.createdQuestions,
                  bulkLoading: bulkQuestions.bulkLoading,
                  removeFromPendingList: bulkQuestions.removeFromPendingList,
                  handleBulkCreate: () => setShowBulkConfirm(true),
                  removeFromCreatedList: bulkQuestions.removeFromCreatedList,
                  editCreatedQuestion: (q) => {
                    // Logic to load back into qForm
                    qForm.setQFormData({
                      stemText: q.preview.stemText,
                      explanation: q.payload.explanation || "",
                      points: q.preview.points,
                      type: q.preview.type,
                      options: q.payload.options || [],
                      matchingPairs: q.payload.matchingPairs || []
                    });
                    bulkQuestions.removeFromCreatedList(q.id);
                  }
                }}
              />
            </Tab>
            {sectionId && !groupId && !questionToUpdate && (
              <Tab eventKey="group" title={<span><FaLayerGroup className="me-2" />Tạo nhóm câu hỏi</span>}>
                <GroupTab 
                  {...groupForm}
                  handleClose={handleClose}
                />
              </Tab>
            )}
          </Tabs>
        </Modal.Body>
      </Modal>

      <ConfirmModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={handleConfirmClose}
        title="Xác nhận đóng"
        message="Bạn có dữ liệu chưa lưu. Bạn có chắc chắn muốn đóng không?"
        confirmText="Đóng"
        cancelText="Tiếp tục chỉnh sửa"
        type="warning"
      />

      {/* Bulk Confirm Modal */}
      <ConfirmModal
        isOpen={showBulkConfirm}
        onClose={() => setShowBulkConfirm(false)}
        onConfirm={handleConfirmBulkCreate}
        title="Xác nhận tạo hàng loạt"
        message={`Bạn có chắc chắn muốn tạo ${bulkQuestions.pendingQuestions.length} câu hỏi này không?`}
        confirmText="Tạo ngay"
        cancelText="Hủy"
        type="primary"
        loading={bulkQuestions.bulkLoading}
      />

      {/* Bulk Success Modal */}
      <SuccessModal
        isOpen={showBulkSuccess}
        onClose={() => setShowBulkSuccess(false)}
        title="Thành công"
        message={`Đã tạo thành công ${bulkSuccessCount} câu hỏi hàng loạt!`}
        autoClose={true}
        autoCloseDelay={2000}
      />
    </>
  );
}
