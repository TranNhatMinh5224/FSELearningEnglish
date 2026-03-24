import { useState, useCallback } from "react";
import { questionService } from "../../../../Services/questionService";
import { QUESTION_TYPES } from "./useQuestionForm";

export const useBulkQuestions = (isAdmin, onSuccess) => {
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [createdQuestions, setCreatedQuestions] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const addToPendingList = useCallback((qFormData, qMediaTempKey, qMediaType, buildPayload) => {
    const pointsValue = typeof qFormData.points === 'string'
      ? (qFormData.points.trim() === '' ? 10 : parseFloat(qFormData.points))
      : qFormData.points;

    const payload = buildPayload();

    const questionPreview = {
      id: Date.now(),
      payload: payload,
      preview: {
        stemText: qFormData.stemText.trim(),
        type: qFormData.type,
        points: pointsValue,
        optionsCount: qFormData.options.length,
        hasMedia: !!qMediaTempKey,
        matchingPairsCount: qFormData.matchingPairs?.length || 0
      }
    };

    setPendingQuestions(prev => [...prev, questionPreview]);
  }, []);

  const removeFromPendingList = useCallback((id) => {
    setPendingQuestions(prev => prev.filter(q => q.id !== id));
  }, []);

  const handleBulkCreate = useCallback(async (sectionId, internalGroupId) => {
    if (pendingQuestions.length === 0) return { success: false, message: "Danh sách câu hỏi trống" };

    setBulkLoading(true);
    try {
      const bulkPayload = {
        questions: pendingQuestions.map(q => ({
          ...q.payload,
          quizSectionId: sectionId || null,
          quizGroupId: internalGroupId || null
        }))
      };

      const response = isAdmin
        ? await questionService.bulkCreateAdminQuestions(bulkPayload)
        : await questionService.bulkCreateQuestions(bulkPayload);

      if (response.data?.success) {
        const createdIds = response.data.data?.createdQuestionIds || [];
        const newCreatedQuestions = pendingQuestions.map((q, idx) => ({
          ...q,
          questionId: createdIds[idx] || null,
          createdAt: new Date().toISOString()
        }));

        setCreatedQuestions(prev => [...prev, ...newCreatedQuestions]);
        setPendingQuestions([]);
        if (onSuccess) onSuccess(response.data.data);
        return { success: true };
      } else {
        return { success: false, message: response.data?.message || "Có lỗi xảy ra khi tạo hàng loạt" };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Lỗi kết nối khi tạo hàng loạt" };
    } finally {
      setBulkLoading(false);
    }
  }, [pendingQuestions, isAdmin, onSuccess]);

  const removeFromCreatedList = useCallback((id) => {
    setCreatedQuestions(prev => prev.filter(q => q.id !== id));
  }, []);

  return {
    pendingQuestions, setPendingQuestions,
    createdQuestions, setCreatedQuestions,
    bulkLoading,
    addToPendingList,
    removeFromPendingList,
    handleBulkCreate,
    removeFromCreatedList
  };
};
