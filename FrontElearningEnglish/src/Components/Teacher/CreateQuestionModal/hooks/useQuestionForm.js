import { useState, useRef, useCallback, useEffect } from "react";
import { fileService } from "../../../../Services/fileService";

import { useEnums } from "../../../../Context/EnumContext";

export const useQuestionForm = (show, questionToUpdate) => {
  const { mappings } = useEnums();
  const QUESTION_TYPES = mappings.QuestionType || {};
  const QUESTION_BUCKET = "questions"; // For now keep it as string if not in enums
  const [qFormData, setQFormData] = useState({
    stemText: "",
    explanation: "",
    points: 1,
    type: null,
    options: [],
    matchingPairs: [],
  });

  const [qMediaPreview, setQMediaPreview] = useState(null);
  const [qMediaTempKey, setQMediaTempKey] = useState(null);
  const [qMediaType, setQMediaType] = useState(null);
  const [qUploadingMedia, setQUploadingMedia] = useState(false);
  const qFileInputRef = useRef(null);
  const [qErrors, setQErrors] = useState({});
  const [qTouched, setQTouched] = useState({});

  const resetQuestionForm = useCallback((type) => {
    // Fallback IDs if enums are not loaded yet
    const selectedType = Number(type);
    const MC_TYPE = Number(QUESTION_TYPES.MultipleChoice || 1);
    const MA_TYPE = Number(QUESTION_TYPES.MultipleAnswers || 2);
    const TF_TYPE = Number(QUESTION_TYPES.TrueFalse || 3);
    const MT_TYPE = Number(QUESTION_TYPES.Matching || 5);
    const OR_TYPE = Number(QUESTION_TYPES.Ordering || 6);
    
    let defaultOptions = [];
    let defaultPairs = [];

    if (selectedType === MC_TYPE || selectedType === MA_TYPE) {
      defaultOptions = [
        { tempId: `opt-${Date.now()}-1`, text: "", isCorrect: false },
        { tempId: `opt-${Date.now()}-2`, text: "", isCorrect: false },
        { tempId: `opt-${Date.now()}-3`, text: "", isCorrect: false },
        { tempId: `opt-${Date.now()}-4`, text: "", isCorrect: false }
      ];
    } else if (selectedType === TF_TYPE) {
      defaultOptions = [
        { tempId: 'tf-true', text: "True", isCorrect: true },
        { tempId: 'tf-false', text: "False", isCorrect: false }
      ];
    } else if (selectedType === OR_TYPE) {
      defaultOptions = [
        { tempId: `ord-${Date.now()}-1`, text: "", isCorrect: true },
        { tempId: `ord-${Date.now()}-2`, text: "", isCorrect: true },
        { tempId: `ord-${Date.now()}-3`, text: "", isCorrect: true }
      ];
    } else if (selectedType === MT_TYPE) {
      defaultPairs = [
        { tempId: `mt-${Date.now()}-1`, leftSide: "", rightSide: "" },
        { tempId: `mt-${Date.now()}-2`, leftSide: "", rightSide: "" }
      ];
    }

    setQFormData({
      stemText: "",
      explanation: "",
      points: 1,
      type: selectedType,
      options: defaultOptions,
      matchingPairs: defaultPairs,
    });
    setQMediaPreview(null);
    setQMediaTempKey(null);
    setQMediaType(null);
    setQErrors({});
    setQTouched({});
  }, [QUESTION_TYPES]);

  // Sync with questionToUpdate
  useEffect(() => {
    if (show && questionToUpdate) {
      let initialOptions = (questionToUpdate.options || questionToUpdate.Options || []).map(opt => ({
        ...opt,
        tempId: opt.id || opt.Id || Math.random().toString(36).substr(2, 9),
        text: opt.text || opt.Text || "",
        isCorrect: opt.isCorrect !== undefined ? opt.isCorrect : (opt.IsCorrect || false),
        mediaUrl: opt.mediaUrl || opt.MediaUrl || null,
        mediaType: opt.mediaType || opt.MediaType || null
      }));

      let initialPairs = [];
      if (questionToUpdate.type === QUESTION_TYPES.Matching && questionToUpdate.correctAnswersJson) {
        try {
          const parsed = typeof questionToUpdate.correctAnswersJson === 'string'
            ? JSON.parse(questionToUpdate.correctAnswersJson)
            : questionToUpdate.correctAnswersJson;
          
          if (Array.isArray(parsed)) {
            initialPairs = parsed.map(p => ({
              leftSide: p.leftSide || p.key || "",
              rightSide: p.rightSide || p.value || ""
            }));
          } else if (typeof parsed === 'object') {
            initialPairs = Object.entries(parsed).map(([k, v]) => ({
              leftSide: k,
              rightSide: v
            }));
          }
        } catch (e) { 
          console.error("Error parsing matching pairs:", e);
          initialPairs = [{ leftSide: "", rightSide: "" }]; 
        }
      } else if (questionToUpdate.matchingPairs || questionToUpdate.MatchingPairs) {
        initialPairs = questionToUpdate.matchingPairs || questionToUpdate.MatchingPairs;
      }

      const qType = questionToUpdate.type !== undefined ? questionToUpdate.type : questionToUpdate.Type;
      const normalizedType = typeof qType === 'string' ? (QUESTION_TYPES[qType] || parseInt(qType)) : qType;

      setQFormData({
        stemText: questionToUpdate.stemText || questionToUpdate.StemText || "",
        explanation: questionToUpdate.explanation || questionToUpdate.Explanation || "",
        points: questionToUpdate.points !== undefined ? questionToUpdate.points : (questionToUpdate.Points || 0),
        type: normalizedType || QUESTION_TYPES.MultipleChoice,
        options: initialOptions,
        matchingPairs: initialPairs.length > 0 ? initialPairs : [{ leftSide: "", rightSide: "" }],
      });

      const url = questionToUpdate.mediaUrl || questionToUpdate.MediaUrl || questionToUpdate.mediaPreview;
      if (url) {
        setQMediaPreview(url);
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.match(/\.(mp4|webm|mov)$/)) setQMediaType('video');
        else if (lowerUrl.match(/\.(mp3|wav|ogg)$/)) setQMediaType('audio');
        else setQMediaType('image');
      }
    } else if (show && !questionToUpdate) {
      setQFormData({
        stemText: "",
        explanation: "",
        points: 1,
        type: null,
        options: [],
        matchingPairs: [],
      });
      setQMediaPreview(null);
      setQMediaTempKey(null);
      setQMediaType(null);
      setQErrors({});
      setQTouched({});
    }
  }, [show, questionToUpdate]);

  const validateQuestionForm = useCallback(() => {
    const errors = {};

    if (!qFormData.stemText.trim()) {
      errors.stemText = "Vui lòng nhập nội dung câu hỏi";
    }

    if (!qFormData.type) {
      errors.type = "Vui lòng chọn loại câu hỏi";
    }

    const pointsValue = typeof qFormData.points === 'string'
      ? (qFormData.points.trim() === '' ? 0 : parseFloat(qFormData.points))
      : qFormData.points;

    if (isNaN(pointsValue) || pointsValue <= 0) {
      errors.points = "Điểm số phải lớn hơn 0";
    }

    if (qFormData.type === QUESTION_TYPES.MultipleChoice || qFormData.type === QUESTION_TYPES.MultipleAnswers) {
      const hasCorrect = qFormData.options.some(opt => opt.isCorrect);
      if (!hasCorrect) errors.options = "Phải chọn ít nhất một đáp án đúng";
      const allFilled = qFormData.options.every(opt => (opt.text || opt.Text || "").trim());
      if (!allFilled) errors.options = errors.options || "Vui lòng nhập đầy đủ nội dung đáp án";
    }

    if (qFormData.type === QUESTION_TYPES.TrueFalse) {
      const hasCorrect = qFormData.options.some(opt => opt.isCorrect);
      if (!hasCorrect) errors.options = "Vui lòng chọn đáp án Đúng hoặc Sai";
    }

    if (Number(qFormData.type) === QUESTION_TYPES.Matching) {
      const allFilled = qFormData.matchingPairs.every(p => (p.leftSide || "").trim() && (p.rightSide || "").trim());
      if (!allFilled) errors.matchingPairs = "Vui lòng nhập đầy đủ nội dung các cặp nối";
    }

    setQErrors(errors);
    return Object.keys(errors).length === 0;
  }, [qFormData]);

  const handleQTypeChange = (e) => {
    const value = e.target.value;
    if (!value || value === '') {
      setQFormData(prev => ({ ...prev, type: null, options: [], matchingPairs: [] }));
      return;
    }
    const selectedType = Number(value);
    resetQuestionForm(selectedType);
    setQTouched(prev => ({ ...prev, type: true }));
    setQErrors(prev => ({ ...prev, type: null }));
  };

  const handleQBlur = (field) => {
    setQTouched((prev) => ({ ...prev, [field]: true }));
    validateQuestionForm();
  };

  const handlePointsChange = (value) => {
    // Only allow positive numbers or empty string (for typing)
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setQFormData(prev => ({ ...prev, points: value }));
      setQErrors(prev => ({ ...prev, points: null }));
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...qFormData.options];
    if (field === "isCorrect" && (qFormData.type === QUESTION_TYPES.MultipleChoice || qFormData.type === QUESTION_TYPES.TrueFalse)) {
      newOptions.forEach((opt, i) => { opt.isCorrect = i === index; });
    } else {
      newOptions[index][field] = value;
    }
    setQFormData({ ...qFormData, options: newOptions });
  };

  const addOption = () => {
    const isOrdering = Number(qFormData.type) === Number(QUESTION_TYPES.Ordering || 6);
    const newOption = { 
      tempId: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
      text: "", 
      isCorrect: isOrdering 
    };
    setQFormData(prev => ({ ...prev, options: [...prev.options, newOption] }));
  };
  const removeOption = (index) => setQFormData({ ...qFormData, options: qFormData.options.filter((_, i) => i !== index) });

  const reorderOptions = (oldIndex, newIndex) => {
    if (oldIndex === newIndex) return;
    setQFormData(prev => {
      const newOptions = [...prev.options];
      const [movedItem] = newOptions.splice(oldIndex, 1);
      newOptions.splice(newIndex, 0, movedItem);
      return { ...prev, options: newOptions };
    });
  };

  const moveOption = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === qFormData.options.length - 1)) return;
    const newOptions = [...qFormData.options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]];
    setQFormData({ ...qFormData, options: newOptions });
  };

  const handlePairChange = (index, field, value) => {
    const newPairs = [...qFormData.matchingPairs];
    newPairs[index][field] = value;
    setQFormData({ ...qFormData, matchingPairs: newPairs });
  };

  const addPair = () => setQFormData({ ...qFormData, matchingPairs: [...qFormData.matchingPairs, { leftSide: "", rightSide: "" }] });
  const removePair = (index) => setQFormData({ ...qFormData, matchingPairs: qFormData.matchingPairs.filter((_, i) => i !== index) });

  const handleUploadSuccess = (tempKey, fileType, previewUrl) => {
    setQMediaTempKey(tempKey);
    setQMediaType(fileType.startsWith('video/') ? 'video' : fileType.startsWith('audio/') ? 'audio' : 'image');
    setQMediaPreview(previewUrl);
    setQErrors(prev => ({ ...prev, media: null }));
  };

  const handleRemoveMedia = () => {
    setQMediaPreview(null);
    setQMediaTempKey(null);
    setQMediaType(null);
    if (qFileInputRef.current) qFileInputRef.current.value = "";
  };

  const buildQuestionPayload = useCallback((sectionId, internalGroupId) => {
    const pointsValue = typeof qFormData.points === 'string'
      ? (qFormData.points.trim() === '' ? 0 : parseFloat(qFormData.points))
      : qFormData.points;

    // Use Dual-Casing (PascalCase + camelCase) to ensure binding success
    const payload = {
      // Basic Fields
      stemText: qFormData.stemText.trim(),
      StemText: qFormData.stemText.trim(),
      explanation: qFormData.explanation || "",
      Explanation: qFormData.explanation || "",
      points: pointsValue || 0,
      Points: pointsValue || 0,
      type: qFormData.type ? parseInt(qFormData.type) : 0,
      Type: qFormData.type ? parseInt(qFormData.type) : 0,

      // Relations
      quizSectionId: sectionId ? parseInt(sectionId) : null,
      QuizSectionId: sectionId ? parseInt(sectionId) : null,
      quizGroupId: internalGroupId ? parseInt(internalGroupId) : null,
      QuizGroupId: internalGroupId ? parseInt(internalGroupId) : null,

      // Media (CRITICAL)
      mediaTempKey: qMediaTempKey || null,
      MediaTempKey: qMediaTempKey || null,
      mediaType: qMediaType || null,
      MediaType: qMediaType || null,

      options: []
    };

    const checkType = (t, target) => {
      const strT = String(t || "").toLowerCase();
      const strTarget = String(target).toLowerCase();
      const typeNames = {
        "5": ["matching", "5", "nối"],
        "6": ["ordering", "6", "sắp xếp"],
        "4": ["fillblank", "4", "điền"],
        "3": ["truefalse", "3", "đúng sai"]
      };
      return strT === strTarget || (typeNames[strTarget] && typeNames[strTarget].includes(strT));
    };

    if (checkType(qFormData.type, QUESTION_TYPES.Matching)) {
      const correctMatchesMap = {};
      const leftTexts = [];
      const rightTexts = [];

      qFormData.matchingPairs.forEach(pair => {
        if (pair.leftSide && pair.rightSide) {
          correctMatchesMap[pair.leftSide] = pair.rightSide;
          leftTexts.push(pair.leftSide);
          rightTexts.push(pair.rightSide);
        }
      });
      const correctAnswersJson = JSON.stringify(correctMatchesMap);
      const metadataJson = JSON.stringify({ left: leftTexts, right: rightTexts });

      payload.correctAnswersJson = correctAnswersJson;
      payload.CorrectAnswersJson = correctAnswersJson;
      payload.metadataJson = metadataJson;
      payload.MetadataJson = metadataJson;

      const matchingOptions = [
        ...leftTexts.map(t => ({ text: t, Text: t, isCorrect: true, IsCorrect: true })),
        ...rightTexts.map(t => ({ text: t, Text: t, isCorrect: false, IsCorrect: false }))
      ];
      payload.options = matchingOptions;
      payload.Options = matchingOptions;
    } else if (checkType(qFormData.type, QUESTION_TYPES.FillBlank)) {
      const matches = [...qFormData.stemText.matchAll(/\[(.*?)\]|\{(.*?)\}|\((.*?)\)/g)];
      const extractedAnswers = matches.map(m => (m[1] || m[2] || m[3] || "").trim()).filter(Boolean);
      const correctAnswersJson = JSON.stringify(extractedAnswers);

      payload.correctAnswersJson = correctAnswersJson;
      payload.CorrectAnswersJson = correctAnswersJson;

      const fillBlankOptions = extractedAnswers.map(ans => ({ text: ans, Text: ans, isCorrect: true, IsCorrect: true }));
      payload.options = fillBlankOptions;
      payload.Options = fillBlankOptions;
    } else if (qFormData.type === QUESTION_TYPES.Ordering) {
      const orderingOptions = qFormData.options.map((opt) => ({
        text: (opt.text || opt.Text || "").trim(),
        Text: (opt.text || opt.Text || "").trim(),
        isCorrect: true,
        IsCorrect: true
      }));
      payload.options = orderingOptions;
      payload.Options = orderingOptions;
      const correctAnswersJson = JSON.stringify(orderingOptions.map(o => o.text));
      payload.correctAnswersJson = correctAnswersJson;
      payload.CorrectAnswersJson = correctAnswersJson;
    } else {
      const standardOptions = qFormData.options.map(opt => ({
        text: (opt.text || opt.Text || "").trim(),
        Text: (opt.text || opt.Text || "").trim(),
        isCorrect: !!opt.isCorrect,
        IsCorrect: !!opt.isCorrect,
        feedback: opt.feedback || null,
        Feedback: opt.feedback || null,
        mediaTempKey: opt.mediaTempKey || opt.MediaTempKey || null,
        MediaTempKey: opt.mediaTempKey || opt.MediaTempKey || null,
        mediaType: opt.mediaType || opt.MediaType || null,
        MediaType: opt.mediaType || opt.MediaType || null
      }));
      payload.options = standardOptions;
      payload.Options = standardOptions;
    }

    return payload;
  }, [qFormData, qMediaTempKey, qMediaType]);

  return {
    qFormData, setQFormData,
    qMediaPreview, setQMediaPreview,
    qMediaTempKey, setQMediaTempKey,
    qMediaType, setQMediaType,
    qUploadingMedia,
    setQUploadingMedia,
    qFileInputRef,
    qErrors, setQErrors,
    qTouched, setQTouched,
    resetQuestionForm,
    handleQTypeChange,
    handleQBlur,
    handleOptionChange,
    addOption, removeOption, moveOption,
    handlePairChange, addPair, removePair,
    handleUploadSuccess,
    handleRemoveMedia,
    handlePointsChange,
    validateQuestionForm,
    buildQuestionPayload,
    reorderOptions
  };
};
