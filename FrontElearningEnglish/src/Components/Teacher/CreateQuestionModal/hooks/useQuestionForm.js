import { useState, useRef, useCallback, useEffect } from "react";
import { fileService } from "../../../../Services/fileService";

export const QUESTION_TYPES = {
  MultipleChoice: 1,
  MultipleAnswers: 2,
  TrueFalse: 3,
  FillBlank: 4,
  Matching: 5,
  Ordering: 6,
};

const QUESTION_BUCKET = "questions";

export const useQuestionForm = (show, questionToUpdate) => {
  const [qFormData, setQFormData] = useState({
    stemText: "",
    explanation: "",
    points: 10,
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
    let defaultOptions = [];
    let defaultPairs = [];
    if (type === QUESTION_TYPES.MultipleChoice || type === QUESTION_TYPES.MultipleAnswers) {
      defaultOptions = [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false }
      ];
    } else if (type === QUESTION_TYPES.TrueFalse) {
      defaultOptions = [
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false }
      ];
    } else if (type === QUESTION_TYPES.Ordering) {
      defaultOptions = [
        { text: "", isCorrect: true },
        { text: "", isCorrect: true },
        { text: "", isCorrect: true }
      ];
    } else if (type === QUESTION_TYPES.Matching) {
      defaultPairs = [
        { key: "", value: "" },
        { key: "", value: "" }
      ];
    }

    setQFormData({
      stemText: "",
      explanation: "",
      points: 10,
      type: type,
      options: defaultOptions,
      matchingPairs: defaultPairs,
    });
    setQMediaPreview(null);
    setQMediaTempKey(null);
    setQMediaType(null);
    setQErrors({});
    setQTouched({});
  }, []);

  // Sync with questionToUpdate
  useEffect(() => {
    if (show && questionToUpdate) {
      let initialOptions = (questionToUpdate.options || questionToUpdate.Options || []).map(opt => ({
        ...opt,
        text: opt.text || opt.Text || "",
        isCorrect: opt.isCorrect !== undefined ? opt.isCorrect : (opt.IsCorrect || false)
      }));

      let initialPairs = [];
      if (questionToUpdate.type === QUESTION_TYPES.Matching && questionToUpdate.correctAnswersJson) {
        try {
          const parsed = typeof questionToUpdate.correctAnswersJson === 'string' 
            ? JSON.parse(questionToUpdate.correctAnswersJson) 
            : questionToUpdate.correctAnswersJson;
          if (Array.isArray(parsed)) initialPairs = parsed;
          else if (typeof parsed === 'object') initialPairs = Object.entries(parsed).map(([k, v]) => ({ key: k, value: v }));
        } catch (e) { initialPairs = [{ key: "", value: "" }]; }
      } else if (questionToUpdate.matchingPairs || questionToUpdate.MatchingPairs) {
        initialPairs = questionToUpdate.matchingPairs || questionToUpdate.MatchingPairs;
      }

      const qType = questionToUpdate.type !== undefined ? questionToUpdate.type : questionToUpdate.Type;
      const normalizedType = typeof qType === 'string' ? (QUESTION_TYPES[qType] || parseInt(qType)) : qType;

      setQFormData({
        stemText: questionToUpdate.stemText || questionToUpdate.StemText || "",
        explanation: questionToUpdate.explanation || questionToUpdate.Explanation || "",
        points: questionToUpdate.points !== undefined ? questionToUpdate.points : (questionToUpdate.Points || 10),
        type: normalizedType || QUESTION_TYPES.MultipleChoice,
        options: initialOptions,
        matchingPairs: initialPairs.length > 0 ? initialPairs : [{ key: "", value: "" }],
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
        // Reset when modal opens without update
        setQFormData({
            stemText: "",
            explanation: "",
            points: 10,
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
      ? (qFormData.points.trim() === '' ? 10 : parseFloat(qFormData.points))
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

    if (qFormData.type === QUESTION_TYPES.Matching) {
      const allFilled = qFormData.matchingPairs.every(p => (p.key || "").trim() && (p.value || "").trim());
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

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...qFormData.options];
    if (field === "isCorrect" && (qFormData.type === QUESTION_TYPES.MultipleChoice || qFormData.type === QUESTION_TYPES.TrueFalse)) {
      newOptions.forEach((opt, i) => { opt.isCorrect = i === index; });
    } else {
      newOptions[index][field] = value;
    }
    setQFormData({ ...qFormData, options: newOptions });
  };

  const addOption = () => setQFormData({ ...qFormData, options: [...qFormData.options, { text: "", isCorrect: qFormData.type === QUESTION_TYPES.Ordering }] });
  const removeOption = (index) => setQFormData({ ...qFormData, options: qFormData.options.filter((_, i) => i !== index) });
  
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
  const addPair = () => setQFormData({ ...qFormData, matchingPairs: [...qFormData.matchingPairs, { key: "", value: "" }] });
  const removePair = (index) => setQFormData({ ...qFormData, matchingPairs: qFormData.matchingPairs.filter((_, i) => i !== index) });

  const handleQMediaChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setQErrors(prev => ({ ...prev, media: "File quá lớn (giới hạn 100MB)." }));
      return;
    }
    setQUploadingMedia(true);
    setQErrors(prev => ({ ...prev, media: null }));
    try {
      const previewUrl = URL.createObjectURL(file);
      setQMediaPreview(previewUrl);
      let type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image';
      setQMediaType(type);
      const response = await fileService.uploadTempFile(file, QUESTION_BUCKET, "temp");
      if (response.data?.success && response.data?.data) {
        setQMediaTempKey(response.data.data.tempKey || response.data.data.TempKey);
        setQErrors(prev => ({ ...prev, media: null }));
      } else {
        setQErrors(prev => ({ ...prev, media: "Upload thất bại." }));
      }
    } catch (err) {
      setQErrors(prev => ({ ...prev, media: "Lỗi khi upload file." }));
    } finally {
      setQUploadingMedia(false);
    }
  };

  const handleRemoveQMedia = () => {
    setQMediaPreview(null);
    setQMediaTempKey(null);
    setQMediaType(null);
    if (qFileInputRef.current) qFileInputRef.current.value = "";
  };

  const buildQuestionPayload = useCallback((sectionId, internalGroupId) => {
    const pointsValue = typeof qFormData.points === 'string'
      ? (qFormData.points.trim() === '' ? 10 : parseFloat(qFormData.points))
      : qFormData.points;

    const payload = {
      stemText: qFormData.stemText.trim(),
      explanation: qFormData.explanation || "",
      points: pointsValue || 10,
      type: qFormData.type,
      quizSectionId: sectionId || null,
      quizGroupId: internalGroupId || null,
      mediaTempKey: qMediaTempKey || null,
      mediaType: qMediaType || null,
      options: []
    };

    if (qFormData.type === QUESTION_TYPES.Matching) {
      const correctMatchesMap = {};
      const leftTexts = []; const rightTexts = [];
      qFormData.matchingPairs.forEach(p => {
        const leftText = (p.key || "").trim();
        const rightText = (p.value || "").trim();
        if (leftText && rightText) {
          correctMatchesMap[leftText] = rightText;
          leftTexts.push(leftText); rightTexts.push(rightText);
        }
      });
      payload.correctAnswersJson = JSON.stringify(correctMatchesMap);
      payload.metadataJson = JSON.stringify({ left: leftTexts, right: rightTexts });
      payload.options = [
        ...leftTexts.map(t => ({ text: t, isCorrect: true })),
        ...rightTexts.map(t => ({ text: t, isCorrect: false }))
      ];
    } else if (qFormData.type === QUESTION_TYPES.FillBlank) {
      const matches = [...qFormData.stemText.matchAll(/\[(.*?)\]/g)];
      const extractedAnswers = matches.map(m => m[1].trim());
      payload.correctAnswersJson = JSON.stringify(extractedAnswers);
      payload.options = extractedAnswers.map(ans => ({ text: ans, isCorrect: true }));
    } else if (qFormData.type === QUESTION_TYPES.Ordering) {
      payload.options = qFormData.options.map((opt, index) => ({
        text: (opt.text || opt.Text || "").trim(),
        displayOrder: index,
        isCorrect: true
      }));
      payload.correctAnswersJson = JSON.stringify(payload.options.map(o => o.text));
    } else {
      payload.options = qFormData.options.map(opt => ({
        text: (opt.text || opt.Text || "").trim(),
        isCorrect: !!opt.isCorrect,
        feedback: opt.feedback || null
      }));
    }

    return payload;
  }, [qFormData, qMediaTempKey, qMediaType]);

  return {
    qFormData, setQFormData,
    qMediaPreview, setQMediaPreview,
    qMediaTempKey, setQMediaTempKey,
    qMediaType, setQMediaType,
    qUploadingMedia,
    qFileInputRef,
    qErrors, setQErrors,
    qTouched, setQTouched,
    resetQuestionForm,
    handleQTypeChange,
    handleQBlur,
    handleOptionChange,
    addOption, removeOption, moveOption,
    handlePairChange, addPair, removePair,
    handleQMediaChange, handleRemoveQMedia,
    validateQuestionForm,
    buildQuestionPayload
  };
};
