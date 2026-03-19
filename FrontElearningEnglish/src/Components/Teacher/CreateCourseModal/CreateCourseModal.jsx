import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { FaBook, FaGraduationCap, FaImage } from "react-icons/fa";
import { teacherService } from "../../../Services/teacherService";
import { teacherPackageService } from "../../../Services/teacherPackageService";
import { useAuth } from "../../../Context/AuthContext";
import FileUpload from "../../Common/FileUpload/FileUpload";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ConfirmModal from "../../Common/ConfirmModal/ConfirmModal";
import "./CreateCourseModal.css";

const COURSE_IMAGE_BUCKET = "courses"; // Bucket name for course images

export default function CreateCourseModal({ show, onClose, onSuccess, courseData, isUpdateMode = false }) {
  const { user } = useAuth();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type] = useState(2); // Mặc định type = 2 (khóa học của giáo viên)
  const [maxStudent, setMaxStudent] = useState(0); // Max students từ package

  // Image upload state - simplified with FileUpload
  const [imageUrl, setImageUrl] = useState(null);
  const [imageTempKey, setImageTempKey] = useState(null);
  const [imageType, setImageType] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [loadingPackage, setLoadingPackage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Confirm close modal state
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Check if form has been modified
  const hasFormData = () => {
    if (isUpdateMode && courseData) {
      // In update mode, check if data changed from original
      const originalTitle = courseData.title || courseData.Title || "";
      const originalDescription = courseData.description || courseData.Description || "";
      return title !== originalTitle || description !== originalDescription || !!imageTempKey;
    }
    // In create mode, check if any field has data
    return title.trim() !== "" || description.trim() !== "" || !!imageUrl;
  };

  // Handle close with confirmation
  const handleClose = () => {
    if (hasFormData() && !submitting) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  // Handle confirm close
  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  // Load maxStudent from teacher package
  useEffect(() => {
    const loadMaxStudent = async () => {
      if (!show) {
        console.log('⚠️ Modal not shown');
        return;
      }

      if (!user) {
        console.log('⚠️ No user');
        setMaxStudent(0);
        return;
      }

      console.log('👤 Full user object:', user);
      console.log('📦 TeacherSubscription:', user.teacherSubscription);

      if (!user?.teacherSubscription?.packageLevel) {
        console.log('⚠️ No package level. TeacherSubscription:', user?.teacherSubscription);
        setMaxStudent(0);
        return;
      }

      try {
        setLoadingPackage(true);
        console.log('🔄 Loading teacher packages...');
        const packageResponse = await teacherPackageService.getAll();
        console.log('📦 Full API Response:', packageResponse);
        console.log('📦 Response.data:', packageResponse.data);

        const userPackageLevel = user.teacherSubscription.packageLevel; // String: "Basic", "Standard", "Premium", "Professional"
        console.log('👤 User package level:', userPackageLevel, 'Type:', typeof userPackageLevel);

        if (packageResponse.data?.success && packageResponse.data?.data && userPackageLevel) {
          const packages = packageResponse.data.data;
          console.log('📋 All packages count:', packages.length);
          console.log('📋 First package structure:', packages[0]);

          // Backend returns: PackageName = "Basic Teacher Package", user has packageLevel = "Basic"
          // Match by checking if PackageName CONTAINS the packageLevel string
          const matchedPackage = packages.find(
            (pkg) => {
              const pkgName = pkg.packageName || pkg.PackageName || "";
              const pkgNameLower = pkgName.toLowerCase();
              const userLevelLower = userPackageLevel.toLowerCase().trim();

              // Check if package name contains the user's package level
              const matches = pkgNameLower.includes(userLevelLower);
              console.log(`🔍 Checking if "${pkgName}" contains "${userPackageLevel}": ${matches}`);

              return matches;
            }
          );

          if (matchedPackage) {
            console.log('✅ Matched package found:', matchedPackage);
            const maxStudents = matchedPackage.maxStudents || matchedPackage.MaxStudents || 0;
            setMaxStudent(maxStudents);
            console.log(`✅ Set maxStudent to: ${maxStudents}`);
          } else {
            console.error(`⚠️ No package found matching: "${userPackageLevel}"`);
            console.log('Available package names:', packages.map(p => p.packageName || p.PackageName));
            setMaxStudent(0);
          }
        } else {
          console.error('❌ Invalid response structure:', {
            success: packageResponse.data?.success,
            hasData: !!packageResponse.data?.data,
            userPackageLevel
          });
          setMaxStudent(0);
        }
      } catch (error) {
        console.error("❌ Error loading teacher package:", error);
        console.error("Error details:", error.response?.data || error.message);
        setMaxStudent(0);
      } finally {
        setLoadingPackage(false);
      }
    };

    if (show) {
      loadMaxStudent();
    }
  }, [show, user]);

  // Pre-fill form when in update mode
  useEffect(() => {
    if (show && isUpdateMode && courseData) {
      const courseTitle = courseData.title || courseData.Title || "";
      const courseDescription = courseData.description || courseData.Description || "";
      const courseImageUrl = courseData.imageUrl || courseData.ImageUrl || null;

      setTitle(courseTitle);
      setDescription(courseDescription);
      setExistingImageUrl(courseImageUrl);
      // Không set maxStudent từ course data - sẽ dùng giá trị từ package (được load ở useEffect khác)

      // Set imageUrl to existing image if available
      if (courseImageUrl) {
        setImageUrl(courseImageUrl);
      } else {
        setImageUrl(null);
      }

      // Reset new upload fields
      setImageTempKey(null);
      setImageType(null);
    }
  }, [show, isUpdateMode, courseData]);

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      setTitle("");
      setDescription("");
      setImageUrl(null);
      setImageTempKey(null);
      setImageType(null);
      setExistingImageUrl(null);
      setErrors({});
    }
  }, [show]);

  // FileUpload callbacks
  const handleImageUploadSuccess = (tempKey, fileType, previewUrl) => {
    setImageTempKey(tempKey);
    setImageType(fileType);
    setImageUrl(previewUrl);
    setErrors({ ...errors, image: null });
  };

  const handleImageRemove = () => {
    setImageUrl(null);
    setImageTempKey(null);
    setImageType(null);
    setExistingImageUrl(null);
  };

  const handleImageError = (errorMessage) => {
    setErrors({ ...errors, image: errorMessage });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = "Tiêu đề là bắt buộc";
    }

    if (!description.trim()) {
      newErrors.description = "Mô tả là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      let submitData;

      if (isUpdateMode && courseData) {
        // Update mode: gửi các trường có thể cập nhật
        submitData = {
          title: title.trim(),
          description: description.trim(),
        };

        // Thêm maxStudent nếu có giá trị (từ package đã được load)
        if (maxStudent > 0) {
          submitData.maxStudent = maxStudent;
        }

        // Chỉ thêm imageTempKey và imageType nếu có upload ảnh mới
        if (imageTempKey && imageType) {
          submitData.imageTempKey = imageTempKey;
          submitData.imageType = imageType;
        }

        const courseId = courseData.courseId || courseData.CourseId;
        if (!courseId) {
          throw new Error("Không tìm thấy ID khóa học");
        }
        const response = await teacherService.updateCourse(courseId, submitData);

        if (response.data?.success) {
          onSuccess?.();
          onClose();
        } else {
          throw new Error(response.data?.message || "Cập nhật khóa học thất bại");
        }
      } else {
        // Create mode: gửi đầy đủ thông tin
        submitData = {
          title: title.trim(),
          description: description.trim(),
          type: type,
          maxStudent: maxStudent || 0, // Từ gói giáo viên hiện tại, default 0 nếu không load được
        };

        // Chỉ thêm imageTempKey và imageType nếu có upload ảnh mới
        if (imageTempKey && imageType) {
          submitData.imageTempKey = imageTempKey;
          submitData.imageType = imageType;
        }

        const response = await teacherService.createCourse(submitData);

        if (response.data?.success) {
          onSuccess?.();
          onClose();
        } else {
          throw new Error(response.data?.message || "Tạo khóa học thất bại");
        }
      }

    } catch (error) {
      console.error(`Error ${isUpdateMode ? "updating" : "creating"} course:`, error);
      const errorMessage = error.response?.data?.message || error.message || (isUpdateMode ? "Có lỗi xảy ra khi cập nhật khóa học" : "Có lỗi xảy ra khi tạo khóa học");
      setErrors({ ...errors, submit: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = title.trim() && description.trim();

  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        centered
        className="create-course-modal modal-modern"
        dialogClassName="create-course-modal-dialog"
      >
        <Modal.Header>
          <Modal.Title>{isUpdateMode ? "Cập nhật lớp học" : "Tạo lớp học"}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="create-course-modal-body">
          <form onSubmit={handleSubmit}>
            {/* SECTION 1: CƠ BẢN */}
            <div className="form-section">
              <div className="section-title"><FaGraduationCap /> Thông tin chung</div>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label required">Tiêu đề</label>
                  <input
                    type="text"
                    className={`form-control ${errors.title ? "is-invalid" : ""}`}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setErrors({ ...errors, title: null });
                    }}
                    placeholder="Nhập tiêu đề khóa học..."
                  />
                  {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                </div>

                {/* Số học viên tối đa */}
                <div className="col-12">
                  <label className="form-label">Số học viên tối đa</label>
                  <input
                    type="number"
                    className="form-control"
                    value={maxStudent}
                    readOnly
                    disabled
                    style={{
                      backgroundColor: "#f5f5f5",
                      cursor: "not-allowed",
                    }}
                    placeholder={loadingPackage ? "Đang tải..." : "Tự động từ gói giáo viên"}
                  />
                  <div className="form-text text-muted small mt-1">
                    <i className="bi bi-info-circle me-1"></i>
                    Giá trị này được lấy từ gói giáo viên hiện tại của bạn.
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: MÔ TẢ */}
            <div className="form-section">
              <div className="section-title"><FaBook /> Mô tả chi tiết</div>
              <div className="markdown-editor-container">
                <div className="markdown-editor-left">
                  <textarea
                    className={`markdown-textarea ${errors.description ? "is-invalid" : ""}`}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setErrors({ ...errors, description: null });
                    }}
                    placeholder={`Viết mô tả khóa học bằng Markdown...`}
                  />
                </div>
                <div className="markdown-editor-right">
                  <div className="markdown-preview">
                    {description.trim() ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {description}
                      </ReactMarkdown>
                    ) : (
                      <div className="markdown-preview-empty">
                        <p>Xem trước mô tả sẽ hiển thị ở đây...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {errors.description && <div className="text-danger small mt-1">{errors.description}</div>}
            </div>

            {/* SECTION 3: ẢNH */}
            <div className="form-section">
              <div className="section-title"><FaImage /> Hình ảnh đại diện</div>
              <FileUpload
                bucket={COURSE_IMAGE_BUCKET}
                accept="image/*"
                maxSize={5}
                existingUrl={imageUrl || existingImageUrl}
                onUploadSuccess={handleImageUploadSuccess}
                onRemove={handleImageRemove}
                onError={handleImageError}
                onUploadingChange={setUploadingImage}
                label={isUpdateMode ? "Thay đổi ảnh hoặc kéo thả vào đây" : "Chọn ảnh hoặc kéo thả vào đây"}
                hint="Hỗ trợ: JPG, PNG, GIF (tối đa 5MB)"
              />
              {errors.image && <div className="text-danger small mt-1">{errors.image}</div>}
            </div>

            {/* Type (hidden) */}
            <input type="hidden" value={type} />

            {/* Submit error */}
            {errors.submit && (
              <div className="alert alert-danger mt-3">{errors.submit}</div>
            )}
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="link" className="text-muted text-decoration-none fw-bold" onClick={handleClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button
            className="btn-primary-custom"
            onClick={handleSubmit}
            disabled={submitting || uploadingImage}
          >
            {submitting ? (isUpdateMode ? "Đang cập nhật..." : "Đang tạo...") : (isUpdateMode ? "Cập nhật khóa học" : "Tạo khóa học")}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirm Close Modal */}
      <ConfirmModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={handleConfirmClose}
        title="Xác nhận đóng"
        message={`Bạn có dữ liệu chưa được lưu. Bạn có chắc chắn muốn ${isUpdateMode ? "hủy cập nhật" : "hủy tạo"} lớp học không?`}
        confirmText="Đóng"
        cancelText="Tiếp tục chỉnh sửa"
        type="warning"
      />
    </>
  );
}

