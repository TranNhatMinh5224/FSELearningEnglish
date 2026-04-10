import { useState, useEffect, useMemo, useCallback } from "react";
import { teacherService } from "../../../../Services/teacherService";
import { adminService } from "../../../../Services/adminService";
import { useEntityForm } from "../../../../hooks/useEntityForm";

export const useModuleForm = (show, lessonId, moduleData, isUpdateMode, isAdmin, onSuccess, onClose) => {
  const initialValues = useMemo(() => ({
    name: "",
    description: "",
    contentType: "",
  }), []);

  const validate = useCallback((values) => {
    const errors = {};
    if (!values.name?.trim()) {
      errors.name = "Tên module là bắt buộc";
    } else if (values.name.length > 200) {
      errors.name = "Tên module không được vượt quá 200 ký tự";
    }

    if (values.description?.length > 200) {
      errors.description = "Mô tả không được vượt quá 200 ký tự";
    }

    if (!isUpdateMode && !values.contentType) {
      errors.contentType = "Loại nội dung là bắt buộc";
    }
    return errors;
  }, [isUpdateMode]);

  const [imageTempKey, setImageTempKey] = useState(null);
  const [imageType, setImageType] = useState(null);

  const onSubmit = useCallback(async (values) => {
    let response;
    if (isUpdateMode && moduleData) {
      const moduleId = moduleData.moduleId || moduleData.ModuleId;
      const updateData = {
        name: values.name.trim(),
        description: values.description.trim() || null,
        contentType: values.contentType ? parseInt(values.contentType) : null,
        imageTempKey: imageTempKey || null,
        imageType: imageType || null,
      };
      response = isAdmin
        ? await adminService.updateModule(moduleId, updateData)
        : await teacherService.updateModule(moduleId, updateData);
    } else {
      const createData = {
        lessonId: parseInt(lessonId),
        name: values.name.trim(),
        description: values.description.trim() || null,
        contentType: parseInt(values.contentType),
        imageTempKey: imageTempKey || null,
        imageType: imageType || null,
        orderIndex: 0,
      };
      response = isAdmin
        ? await adminService.createModule(createData)
        : await teacherService.createModule(createData);
    }

    if (response.data?.success) {
      onSuccess?.();
      onClose();
    } else {
      throw new Error(response.data?.message || "Thao tác thất bại");
    }
  }, [isUpdateMode, moduleData, imageTempKey, imageType, isAdmin, lessonId, onSuccess, onClose]);

  const form = useEntityForm(initialValues, validate, onSubmit);
  const { setFormData, resetForm } = form;

  const [imageUrl, setImageUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Pre-fill or reset form when modal visibility or data changes
  useEffect(() => {
    if (!show) return;

    if (isUpdateMode && moduleData) {
      setFormData({
        name: moduleData.name || moduleData.Name || "",
        description: moduleData.description || moduleData.Description || "",
        contentType: (moduleData.contentType || moduleData.ContentType || "").toString(),
      });
      setImageUrl(moduleData.imageUrl || moduleData.ImageUrl || null);
    } else {
      resetForm();
      setImageUrl(null);
      setImageTempKey(null);
      setImageType(null);
    }
  }, [show, isUpdateMode, moduleData, setFormData, resetForm]);

  return {
    ...form,
    imageUrl, setImageUrl,
    imageTempKey, setImageTempKey,
    imageType, setImageType,
    uploadingImage, setUploadingImage,
  };
};
