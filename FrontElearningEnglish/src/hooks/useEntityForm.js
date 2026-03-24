import { useState, useCallback } from "react";

/**
 * A generic hook to manage form state, validation, and submission.
 * @param {Object} initialValues - Initial form data.
 * @param {Function} validate - A function that returns an errors object { field: message }.
 * @param {Function} onSubmit - Form submission handler.
 */
export const useEntityForm = (initialValues, validate, onSubmit) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    
    setFormData((prev) => ({ ...prev, [name]: val }));
    
    // Clear error on type if it was touched
    if (touched[name]) {
      const fieldErrors = validate({ ...formData, [name]: val });
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
    }
  }, [formData, touched, validate]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    const fieldErrors = validate(formData);
    setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
  }, [formData, validate]);

  const resetForm = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldValue = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    
    // Mark all as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } catch (err) {
        setErrors((prev) => ({ ...prev, submit: err.message || "An error occurred" }));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFormData,
    setFieldValue,
    setErrors,
    setTouched,
  };
};
