import { useState, useRef, useCallback } from "react";
import { quizService } from "../../../../Services/quizService";

export const useGroupForm = (sectionId, isAdmin, onSuccess, setInternalGroupId, setCreatedGroupName, setGroupInfo, setActiveTab) => {
  const [gFormData, setGFormData] = useState({ name: "", title: "", description: "", sumScore: 0 });
  
  // Support multiple media types
  const [gMedia, setGMedia] = useState({
    image: { tempKey: null, preview: null },
    video: { tempKey: null, preview: null, duration: null },
    audio: { tempKey: null, preview: null, duration: null }
  });

  const [gLoading, setGLoading] = useState(false);
  const [gErrors, setGErrors] = useState({});
  const [gTouched, setGTouched] = useState({});

  const validateGroupForm = useCallback(() => {
    const errors = {};
    if (!gFormData.name.trim()) errors.name = "Tên nhóm là bắt buộc";
    if (!gFormData.title.trim()) errors.title = "Tiêu đề nhóm là bắt buộc";
    
    setGErrors(errors);
    return Object.keys(errors).length === 0;
  }, [gFormData]);

  const handleGBlur = (field) => {
    setGTouched(prev => ({ ...prev, [field]: true }));
    validateGroupForm();
  };

  const handleRemoveMedia = (type) => {
    setGMedia(prev => {
      const updated = { ...prev };
      if (updated[type].preview?.startsWith("blob:")) {
        URL.revokeObjectURL(updated[type].preview);
      }
      updated[type] = { tempKey: null, preview: null, duration: null };
      return updated;
    });
  };

  const handleGMediaChange = (tempKey, fileType, previewUrl, fileSize, duration) => {
    let targetType = 'image';
    if (fileType.startsWith('video/')) targetType = 'video';
    else if (fileType.startsWith('audio/')) targetType = 'audio';

    setGMedia(prev => ({
      ...prev,
      [targetType]: { tempKey, preview: previewUrl, duration }
    }));
  };

  const handleGroupSubmit = async () => {
    if (!validateGroupForm()) {
      setGTouched({ name: true, title: true });
      return;
    }
    setGLoading(true);
    setGErrors({});

    try {
      const payload = {
        quizSectionId: parseInt(sectionId),
        name: gFormData.name.trim(),
        title: gFormData.title.trim(),
        description: gFormData.description,
        sumScore: parseFloat(gFormData.sumScore) || 0,
        // Multi-media temp keys
        imageTempKey: gMedia.image.tempKey,
        videoTempKey: gMedia.video.tempKey,
        audioTempKey: gMedia.audio.tempKey,
        videoDuration: gMedia.video.duration
      };

      const res = isAdmin
        ? await quizService.createAdminQuizGroup(payload)
        : await quizService.createQuizGroup(payload);

      if (res.data?.success) {
        const newGroup = res.data.data;
        setInternalGroupId(newGroup.quizGroupId || newGroup.id);
        setCreatedGroupName(newGroup.title || newGroup.name);
        setGroupInfo(newGroup);
        setActiveTab("question");
        
        // Reset form
        setGFormData({ name: "", title: "", description: "", sumScore: 0 });
        setGMedia({
            image: { tempKey: null, preview: null },
            video: { tempKey: null, preview: null, duration: null },
            audio: { tempKey: null, preview: null, duration: null }
        });
        setGTouched({});
      } else {
        setGErrors({ submit: res.data?.message || "Có lỗi xảy ra khi tạo nhóm." });
      }
    } catch (err) {
      console.error("Group submission error:", err);
      setGErrors({ submit: err.message || "Lỗi khi tạo nhóm." });
    } finally {
      setGLoading(false);
    }
  };

  return {
    gFormData, setGFormData,
    gMedia,
    gLoading,
    gErrors,
    gTouched,
    handleGBlur,
    handleRemoveMedia,
    handleGMediaChange,
    handleGroupSubmit
  };
};
