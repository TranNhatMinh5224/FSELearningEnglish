import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { lectureService } from "../../../../Services/lectureService";
import { useEntityForm } from "../../../../hooks/useEntityForm";

export const useLectureForm = (show, moduleId, lectureToUpdate, isAdmin, onSuccess, onClose) => {
  const isEditMode = !!lectureToUpdate && !lectureToUpdate._isChildCreation;
  const textAreaRef = useRef(null);

  const initialValues = useMemo(() => ({
    title: "",
    lectureType: 1,
    markdownContent: "",
    parentLectureId: null,
  }), []);

  const validate = useCallback((values) => {
    const errors = {};
    if (!values.title?.trim()) {
      errors.title = "Tiêu đề là bắt buộc";
    }
    if (values.lectureType === 1 && !values.markdownContent?.trim()) {
      errors.markdownContent = "Nội dung là bắt buộc cho bài giảng văn bản";
    }
    return errors;
  }, []);

  const [mediaTempKey, setMediaTempKey] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaSize, setMediaSize] = useState(null);
  const [duration, setDuration] = useState(null);

  const onSubmit = useCallback(async (values) => {
    const lectureData = {
      moduleId: parseInt(moduleId),
      title: values.title.trim(),
      type: parseInt(values.lectureType),
      markdownContent: values.markdownContent.trim() || null,
      parentLectureId: values.parentLectureId || null,
      mediaTempKey: mediaTempKey || null,
      mediaType: mediaType ? mediaType.substring(0, 50) : null,
      mediaSize: mediaSize || null,
      duration: duration || null,
    };

    let response;
    if (isEditMode) {
      const lectureId = lectureToUpdate.lectureId || lectureToUpdate.LectureId;
      response = isAdmin
        ? await lectureService.updateAdminLecture(lectureId, lectureData)
        : await lectureService.updateLecture(lectureId, lectureData);
    } else {
      response = isAdmin
        ? await lectureService.createAdminLecture(lectureData)
        : await lectureService.createLecture(lectureData);
    }

    if (response.data?.success) {
      onClose();
      onSuccess?.(response.data.data);
    } else {
      throw new Error(response.data?.message || "Thao tác thất bại");
    }
  }, [moduleId, mediaTempKey, mediaType, mediaSize, duration, isEditMode, lectureToUpdate, isAdmin, onSuccess, onClose]);

  const form = useEntityForm(initialValues, validate, onSubmit);
  const { setFormData, setFieldValue, resetForm, setErrors, setTouched } = form;
  
  const [parentLectures, setParentLectures] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Media states
  const [existingMediaUrl, setExistingMediaUrl] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Load Parent Lectures
  useEffect(() => {
    if (show && moduleId) {
      const fetchParents = async () => {
        try {
          const response = isAdmin 
            ? await lectureService.getAdminLecturesByModule(moduleId)
            : await lectureService.getTeacherLecturesByModule(moduleId);
          if (response.data?.success) {
            setParentLectures(response.data.data);
          }
        } catch (err) { console.error(err); }
      };
      fetchParents();
    }
  }, [show, moduleId, isAdmin]);

  // Load Detail for Edit or Reset for Create
  useEffect(() => {
    if (!show) return;

    if (isEditMode && lectureToUpdate) {
      const fetchDetail = async () => {
        const lectureId = lectureToUpdate.lectureId || lectureToUpdate.LectureId;
        
        setLoadingDetail(true);
        try {
          const response = isAdmin
            ? await lectureService.getAdminLectureById(lectureId)
            : await lectureService.getTeacherLectureById(lectureId);
          
          if (response.data?.success) {
            const data = response.data.data;
            setFormData({
              title: data.title || data.Title || "",
              lectureType: data.type || data.Type || 1,
              markdownContent: data.markdownContent || data.MarkdownContent || "",
              parentLectureId: data.parentLectureId || data.ParentLectureId || null,
            });
            setExistingMediaUrl(data.mediaUrl || data.MediaUrl || null);
            setDuration(data.duration || data.Duration || null);
          }
        } catch (err) { console.error(err); }
        finally { setLoadingDetail(false); }
      };
      fetchDetail();
    } else {
      // It's Create Mode - Reset form fully
      setFormData({
        title: "",
        lectureType: 1,
        markdownContent: "",
        parentLectureId: lectureToUpdate?._isChildCreation ? (lectureToUpdate.parentLectureId) : null,
      });
      setErrors({});
      setTouched({});
      setMediaTempKey(null);
      setMediaType(null);
      setMediaSize(null);
      setDuration(null);
      setExistingMediaUrl(null);
      setUploadingMedia(false);
    }
  }, [show, isEditMode, lectureToUpdate, isAdmin, setFormData, setErrors, setTouched]);


  // Markdown Toolbar logic
  const insertMarkdown = useCallback((tag) => {
    const area = textAreaRef.current;
    if (!area) return;

    const start = area.selectionStart;
    const end = area.selectionEnd;
    const text = area.value;
    const selected = text.substring(start, end) || "văn bản";
    let inserted = "";

    switch (tag) {
      case 'bold': inserted = `**${selected}**`; break;
      case 'italic': inserted = `_${selected}_`; break;
      case 'heading': inserted = `### ${selected}`; break;
      case 'list': inserted = `\n- ${selected}`; break;
      case 'code': inserted = `\`${selected}\``; break;
      default: inserted = selected;
    }

    const newVal = text.substring(0, start) + inserted + text.substring(end);
    setFieldValue("markdownContent", newVal);
    setTimeout(() => {
      area.focus();
      area.setSelectionRange(start + inserted.length, start + inserted.length);
    }, 0);
  }, [setFieldValue]);

  return {
    ...form,
    isEditMode,
    textAreaRef,
    insertMarkdown,
    parentLectures,
    loadingDetail,
    mediaTempKey, setMediaTempKey,
    mediaType, setMediaType,
    mediaSize, setMediaSize,
    duration, setDuration,
    existingMediaUrl, setExistingMediaUrl,
    uploadingMedia, setUploadingMedia,
  };
};
