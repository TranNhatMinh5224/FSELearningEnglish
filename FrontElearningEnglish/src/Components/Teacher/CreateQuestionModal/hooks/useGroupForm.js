import { useState, useRef, useCallback } from "react";
import { fileService } from "../../../../Services/fileService";
import { quizService } from "../../../../Services/quizService";

const QUIZ_GROUP_BUCKET = "quizgroups";

export const useGroupForm = (sectionId, isAdmin, onSuccess, setInternalGroupId, setCreatedGroupName, setGroupInfo, setActiveTab) => {
  const [gFormData, setGFormData] = useState({ name: "", title: "", description: "", sumScore: 0 });
  const [gMedia, setGMedia] = useState({ preview: null, tempKey: null, type: null, duration: null });
  const [gLoading, setGLoading] = useState(false);
  const [gErrors, setGErrors] = useState({});
  const [gTouched, setGTouched] = useState({});
  const gFileInputRef = useRef(null);

  const validateGroupForm = useCallback(() => {
    const errors = {};
    if (!gFormData.name.trim()) errors.name = "Tên nhóm là bắt buộc";
    else if (gFormData.name.length > 100) errors.name = "Tên nhóm không quá 100 ký tự";

    if (!gFormData.title.trim()) errors.title = "Tiêu đề nhóm là bắt buộc";
    else if (gFormData.title.length > 255) errors.title = "Tiêu đề không quá 255 ký tự";

    setGErrors(errors);
    return Object.keys(errors).length === 0;
  }, [gFormData]);

  const handleGBlur = (field) => {
    setGTouched(prev => ({ ...prev, [field]: true }));
    validateGroupForm();
  };

  const handleGMediaChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
    if (!type) {
      setGErrors(prev => ({ ...prev, media: "Chỉ hỗ trợ ảnh hoặc video cho Group" }));
      return;
    }
    setGLoading(true);
    setGErrors(prev => ({ ...prev, media: null }));
    try {
      const preview = URL.createObjectURL(file);
      let duration = null;
      if (type === 'video') {
        const vid = document.createElement('video');
        vid.src = preview;
        await new Promise(r => vid.onloadedmetadata = r);
        duration = Math.round(vid.duration);
      }
      const res = await fileService.uploadTempFile(file, QUIZ_GROUP_BUCKET, "temp");
      if (res.data?.success) {
        setGMedia({
          preview,
          tempKey: res.data.data.tempKey || res.data.data.TempKey,
          type,
          duration
        });
      } else {
        setGErrors(prev => ({ ...prev, media: "Upload thất bại" }));
      }
    } catch (err) {
      setGErrors(prev => ({ ...prev, media: "Lỗi upload media group" }));
    } finally {
      setGLoading(false);
    }
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
        sumScore: parseFloat(gFormData.sumScore),
        imageTempKey: gMedia.type === 'image' ? gMedia.tempKey : null,
        imageType: gMedia.type === 'image' ? gMedia.type : null,
        videoTempKey: gMedia.type === 'video' ? gMedia.tempKey : null,
        videoType: gMedia.type === 'video' ? gMedia.type : null,
        videoDuration: gMedia.duration
      };
      
      const res = isAdmin
        ? await quizService.createAdminQuizGroup(payload)
        : await quizService.createQuizGroup(payload);

      if (res.data?.success) {
        const newGroupId = res.data.data.id || res.data.data.quizGroupId;
        setInternalGroupId(newGroupId);
        setCreatedGroupName(res.data.data.title || res.data.data.name);
        setGroupInfo(res.data.data);
        setActiveTab("question");
        setGFormData({ name: "", title: "", description: "", sumScore: 0 });
        setGMedia({ preview: null, tempKey: null, type: null, duration: null });
        setGTouched({});
        setGErrors({});
      } else {
        setGErrors({ submit: res.data?.message || "Có lỗi xảy ra" });
      }
    } catch (err) {
      setGErrors({ submit: "Lỗi kết nối khi tạo group" });
    } finally {
      setGLoading(false);
    }
  };

  return {
    gFormData, setGFormData,
    gMedia, setGMedia,
    gLoading,
    gErrors, setGErrors,
    gTouched, setGTouched,
    gFileInputRef,
    handleGBlur,
    handleGMediaChange,
    handleGroupSubmit
  };
};
