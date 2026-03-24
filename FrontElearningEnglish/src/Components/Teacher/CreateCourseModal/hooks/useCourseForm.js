import { useState, useEffect, useRef, useCallback } from "react";
import { teacherService } from "../../../../Services/teacherService";
import { teacherPackageService } from "../../../../Services/teacherPackageService";
import { useAuth } from "../../../../Context/AuthContext";
import { useEntityForm } from "../../../../hooks/useEntityForm";

export const useCourseForm = (show, isUpdateMode, courseData, onSuccess, onClose) => {
  const { user } = useAuth();
  const [maxStudent, setMaxStudent] = useState(0);
  const [loadingPackage, setLoadingPackage] = useState(false);
  const [imageTempKey, setImageTempKey] = useState(null);
  const [imageType, setImageType] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const initialValues = {
    title: "",
    description: "",
  };

  const validate = (values) => {
    const errors = {};
    if (!values.title?.trim()) {
      errors.title = "Tiêu đề là bắt buộc";
    } else if (values.title.length > 200) {
      errors.title = "Tiêu đề không được vượt quá 200 ký tự";
    }

    if (!values.description?.trim()) {
      errors.description = "Mô tả là bắt buộc";
    } else if (values.description.length > 2000) {
      errors.description = "Mô tả không được vượt quá 2,000 ký tự";
    }
    return errors;
  };

  const onSubmit = async (values) => {
    let submitData = {
      title: values.title.trim(),
      description: values.description.trim(),
      maxStudent: maxStudent || 0,
    };

    if (imageTempKey && imageType) {
      submitData.imageTempKey = imageTempKey;
      submitData.imageType = imageType;
    }

    let response;
    if (isUpdateMode && courseData) {
      const courseId = courseData.courseId || courseData.CourseId;
      response = await teacherService.updateCourse(courseId, submitData);
    } else {
      submitData.type = 2; // Teacher course
      response = await teacherService.createCourse(submitData);
    }

    if (response.data?.success) {
      onSuccess?.();
      onClose();
    } else {
      throw new Error(response.data?.message || "Thao tác thất bại");
    }
  };

  const form = useEntityForm(initialValues, validate, onSubmit);

  const textAreaRef = useRef(null);

  const insertMarkdown = useCallback((tag) => {
    const area = textAreaRef.current;
    if (!area) return;

    const start = area.selectionStart;
    const end = area.selectionEnd;
    const currentText = form.formData.description || "";
    const selectedText = currentText.substring(start, end) || "văn bản";
    let inserted = "";

    switch (tag) {
        case 'bold': inserted = `**${selectedText}**`; break;
        case 'italic': inserted = `_${selectedText}_`; break;
        case 'heading': inserted = `### ${selectedText}`; break;
        case 'list': inserted = `\n- ${selectedText}`; break;
        case 'code': inserted = `\`${selectedText}\``; break;
        default: inserted = selectedText;
    }

    const newVal = currentText.substring(0, start) + inserted + currentText.substring(end);
    
    // Update the form's state securely
    form.handleChange({ target: { name: 'description', value: newVal } });

    // Refocus after rendering
    setTimeout(() => {
        area.focus();
        area.setSelectionRange(start + inserted.length, start + inserted.length);
    }, 0);
  }, [form]);

  // Pre-fill form
  useEffect(() => {
    if (show && isUpdateMode && courseData) {
      form.setFormData({
        title: courseData.title || courseData.Title || "",
        description: courseData.description || courseData.Description || "",
      });
      setImageUrl(courseData.imageUrl || courseData.ImageUrl || null);
    } else if (show && !isUpdateMode) {
      form.resetForm();
      setImageUrl(null);
      setImageTempKey(null);
    }
  }, [show, isUpdateMode, courseData]);

  // Load package
  useEffect(() => {
    const loadMaxStudent = async () => {
      if (!show || !user?.teacherSubscription?.packageLevel) {
        setMaxStudent(0);
        return;
      }

      try {
        setLoadingPackage(true);
        const packageResponse = await teacherPackageService.getAll();
        const userLevel = user.teacherSubscription.packageLevel.toLowerCase().trim();

        if (packageResponse.data?.success && packageResponse.data?.data) {
          const matchedPackage = packageResponse.data.data.find(pkg => 
            (pkg.packageName || pkg.PackageName || "").toLowerCase().includes(userLevel)
          );
          if (matchedPackage) {
            setMaxStudent(matchedPackage.maxStudents || matchedPackage.MaxStudents || 0);
          }
        }
      } catch (error) {
        console.error("Error loading teacher package:", error);
      } finally {
        setLoadingPackage(false);
      }
    };

    if (show) loadMaxStudent();
  }, [show, user]);

  return {
    ...form,
    textAreaRef,
    insertMarkdown,
    maxStudent,
    loadingPackage,
    imageUrl,
    setImageUrl,
    setImageTempKey,
    setImageType,
    uploadingImage,
    setUploadingImage,
  };
};
