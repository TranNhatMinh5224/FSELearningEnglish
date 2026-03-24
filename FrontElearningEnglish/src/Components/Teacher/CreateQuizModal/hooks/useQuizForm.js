import { useState, useEffect, useCallback } from "react";
import { quizService } from "../../../../Services/quizService";
import { useEnums } from "../../../../Context/EnumContext";
import { useEntityForm } from "../../../../hooks/useEntityForm";

export const useQuizForm = (show, assessmentId, assessment, quizToUpdate, isAdmin, onSuccess, onClose) => {
  const { getEnumOptions, loading: enumsLoading } = useEnums();
  const isUpdateMode = !!quizToUpdate;

  let maxDurationMinutes = null;
  if (assessment) {
    const timeLimitStr = assessment.timeLimit || assessment.TimeLimit || "00:00:00";
    const parts = timeLimitStr.split(':');
    if (parts.length === 3) {
      maxDurationMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
  }

  const initialValues = {
    title: "",
    description: "",
    instructions: "",
    type: 1,
    status: 1,
    totalQuestions: "",
    totalPossibleScore: "",
    passingScore: "",
    duration: "",
    availableFrom: null,
    showAnswersAfterSubmit: true,
    showScoreImmediately: true,
    shuffleQuestions: true,
    shuffleAnswers: true,
    maxAttempts: "",
  };

  const validate = (values) => {
    const errors = {};
    if (!values.title?.trim()) {
      errors.title = "Tiêu đề Quiz là bắt buộc";
    } else if (values.title.length > 200) {
      errors.title = "Tiêu đề không được vượt quá 200 ký tự";
    }

    if (!values.totalQuestions || isNaN(parseInt(values.totalQuestions))) {
      errors.totalQuestions = "Số câu hỏi là bắt buộc";
    }

    if (!values.totalPossibleScore || isNaN(parseFloat(values.totalPossibleScore))) {
      errors.totalPossibleScore = "Thang điểm tối đa là bắt buộc";
    }

    if (!values.duration || isNaN(parseInt(values.duration))) {
      errors.duration = "Thời gian làm bài là bắt buộc";
    } else if (maxDurationMinutes > 0 && parseInt(values.duration) > maxDurationMinutes) {
      errors.duration = `Vượt quá giới hạn (${maxDurationMinutes} phút của Assessment)`;
    }

    if (values.passingScore && parseFloat(values.passingScore) > parseFloat(values.totalPossibleScore)) {
      errors.passingScore = "Điểm đạt không được vượt quá thang điểm tối đa";
    }

    return errors;
  };

  const onSubmit = async (values) => {
    const submitData = {
      ...values,
      assessmentId: parseInt(assessmentId),
      type: parseInt(values.type),
      status: parseInt(values.status),
      totalQuestions: parseInt(values.totalQuestions),
      totalPossibleScore: parseFloat(values.totalPossibleScore),
      passingScore: values.passingScore ? parseFloat(values.passingScore) : null,
      duration: parseInt(values.duration),
      availableFrom: values.availableFrom ? values.availableFrom.toISOString() : null,
      maxAttempts: values.maxAttempts ? parseInt(values.maxAttempts) : null,
    };

    let response;
    if (isUpdateMode && quizToUpdate) {
      const quizId = quizToUpdate.quizId || quizToUpdate.QuizId;
      response = isAdmin
        ? await quizService.updateAdminQuiz(quizId, submitData)
        : await quizService.updateQuiz(quizId, submitData);
    } else {
      response = isAdmin
        ? await quizService.createAdminQuiz(submitData)
        : await quizService.createQuiz(submitData);
    }

    if (response.data?.success) {
      onSuccess?.();
      onClose();
    } else {
      throw new Error(response.data?.message || "Thao tác thất bại");
    }
  };

  const form = useEntityForm(initialValues, validate, onSubmit);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Load quiz data
  useEffect(() => {
    const loadQuizData = async () => {
      if (!show || !isUpdateMode || !quizToUpdate) return;
      
      setLoadingQuiz(true);
      try {
        const quizId = quizToUpdate.quizId || quizToUpdate.QuizId;
        const response = isAdmin
          ? await quizService.getAdminQuizById(quizId)
          : await quizService.getTeacherQuizById(quizId);

        if (response.data?.success && response.data?.data) {
          const quiz = response.data.data;
          form.setFormData({
            title: quiz.title || quiz.Title || "",
            description: quiz.description || quiz.Description || "",
            instructions: quiz.instructions || quiz.Instructions || "",
            type: quiz.type ?? quiz.Type ?? 1,
            status: quiz.status ?? quiz.Status ?? 1,
            totalQuestions: (quiz.totalQuestions ?? quiz.TotalQuestions ?? "").toString(),
            totalPossibleScore: (quiz.totalPossibleScore ?? quiz.TotalPossibleScore ?? "").toString(),
            passingScore: (quiz.passingScore ?? quiz.PassingScore ?? "").toString(),
            duration: (quiz.duration ?? quiz.Duration ?? "").toString(),
            availableFrom: quiz.availableFrom ? new Date(quiz.availableFrom) : null,
            showAnswersAfterSubmit: quiz.showAnswersAfterSubmit ?? quiz.ShowAnswersAfterSubmit ?? true,
            showScoreImmediately: quiz.showScoreImmediately ?? quiz.ShowScoreImmediately ?? true,
            shuffleQuestions: quiz.shuffleQuestions ?? quiz.ShuffleQuestions ?? true,
            shuffleAnswers: quiz.shuffleAnswers ?? quiz.ShuffleAnswers ?? true,
            maxAttempts: (quiz.maxAttempts ?? quiz.MaxAttempts ?? "").toString(),
          });
        }
      } catch (error) {
        console.error("Error loading quiz:", error);
      } finally {
        setLoadingQuiz(false);
      }
    };

    loadQuizData();
  }, [show, isUpdateMode, quizToUpdate]);

  return {
    ...form,
    loadingQuiz,
    enumsLoading,
    maxDurationMinutes,
    quizTypeOptions: getEnumOptions('QuizType'),
    quizStatusOptions: getEnumOptions('QuizStatus'),
  };
};
