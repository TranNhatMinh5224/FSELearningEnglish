import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { teacherPackageService } from "../../../Services/teacherPackageService";
import { toast } from "react-toastify";
import "./PackageFormModal.css";

export default function PackageFormModal({ show, onClose, onSuccess, packageToEdit }) {
    const [formData, setFormData] = useState({
        packageName: "",
        level: 1,  // Basic = 1 in backend enum
        price: "",
        maxCourses: "",
        maxLessons: "",
        maxStudents: ""
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    useEffect(() => {
        if (packageToEdit) {
            setFormData({
                packageName: packageToEdit.packageName || packageToEdit.PackageName || "",
                level: packageToEdit.level || packageToEdit.Level || 1,
                price: (packageToEdit.price || packageToEdit.Price || 0).toString(),
                maxCourses: (packageToEdit.maxCourses || packageToEdit.MaxCourses || 5).toString(),
                maxLessons: (packageToEdit.maxLessons || packageToEdit.MaxLessons || 50).toString(),
                maxStudents: (packageToEdit.maxStudents || packageToEdit.MaxStudents || 100).toString()
            });
        } else {
            setFormData({
                packageName: "",
                level: 1,
                price: "",
                maxCourses: "",
                maxLessons: "",
                maxStudents: ""
            });
        }
        setErrors({});
        setTouched({});
    }, [packageToEdit, show]);

    const validateField = (name, value) => {
        if (name === "packageName") {
            if (!value.trim()) return "Ten goi la bat buoc";
            if (value.trim().length > 100) return "Ten goi khong duoc vuot qua 100 ky tu";
        }
        if (name === "price") {
            if (value === "") return "";
            const v = parseInt(value.toString().replace(/[^\d]/g, ''), 10);
            if (isNaN(v) || v < 0) return "Gia phai la so hop le va khong duoc am";
            if (v > 100000000) return "Gia khong duoc vuot qua 100,000,000 VND";
        }
        if (name === "maxCourses") {
            const v = parseInt(value, 10);
            if (value === "") return "Max khoa hoc la bat buoc";
            if (isNaN(v) || v < 1 || v > 100) return "Max khoa hoc phai tu 1 den 100";
        }
        if (name === "maxLessons") {
            const v = parseInt(value, 10);
            if (value === "") return "Max bai hoc la bat buoc";
            if (isNaN(v) || v < 1 || v > 1000) return "Max bai hoc phai tu 1 den 1,000";
        }
        if (name === "maxStudents") {
            const v = parseInt(value, 10);
            if (value === "") return "Max hoc vien la bat buoc";
            if (isNaN(v) || v < 1 || v > 10000) return "Max hoc vien phai tu 1 den 10,000";
        }
        return "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const allTouched = { packageName: true, price: true, maxCourses: true, maxLessons: true, maxStudents: true };
        const newErrors = {
            packageName: validateField("packageName", formData.packageName),
            price: validateField("price", formData.price === "" ? "" : formData.price),
            maxCourses: validateField("maxCourses", formData.maxCourses),
            maxLessons: validateField("maxLessons", formData.maxLessons),
            maxStudents: validateField("maxStudents", formData.maxStudents),
        };
        setTouched(allTouched);
        setErrors(newErrors);
        if (Object.values(newErrors).some(err => err)) return;

        const price = formData.price === "" ? 0 : parseInt(formData.price.toString().replace(/[^\d]/g, ''), 10);
        const maxCourses = parseInt(formData.maxCourses, 10);
        const maxLessons = parseInt(formData.maxLessons, 10);
        const maxStudents = parseInt(formData.maxStudents, 10);
        
        setLoading(true);
        setErrors({});
        
        try {
            // Prepare data matching backend DTO exactly
            const dataToSend = {
                packageName: formData.packageName.trim(),
                level: Number(formData.level),
                price: price,
                maxCourses: maxCourses,
                maxLessons: maxLessons,
                maxStudents: maxStudents
            };

            console.log("Data being sent to API:", dataToSend);

            let response;
            if (packageToEdit) {
                const id = packageToEdit.teacherPackageId || packageToEdit.TeacherPackageId;
                response = await teacherPackageService.update(id, dataToSend);
            } else {
                response = await teacherPackageService.create(dataToSend);
            }

            console.log("API Response:", response);

            if (response.data?.success) {
                const message = packageToEdit ? "Cập nhật gói thành công!" : "Tạo gói mới thành công!";
                onClose();
                onSuccess(message);
            } else {
                toast.error(response.data?.message || "Có lỗi xảy ra.");
            }
        } catch (error) {
            console.error("Error saving package:", error);
            console.error("Error details:", error.response?.data);
            toast.error(error.response?.data?.message || error.response?.data?.title || "Lỗi kết nối.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal 
            show={show} 
            onHide={onClose} 
            centered 
            className="modal-modern package-form-modal"
            dialogClassName="package-form-modal-dialog"
        >
            <Modal.Header closeButton>
                <Modal.Title>{packageToEdit ? "Cập nhật Gói" : "Tạo Teacher Package"}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Tên gói <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    name="packageName"
                                    value={formData.packageName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="VD: Basic Plan"
                                    isInvalid={!!errors.packageName}
                                    maxLength={100}
                                />
                                {errors.packageName && (
                                    <Form.Control.Feedback type="invalid">{errors.packageName}</Form.Control.Feedback>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Cấp độ (Level)</Form.Label>
                                <Form.Select
                                    name="level"
                                    value={formData.level}
                                    onChange={handleChange}
                                >
                                    <option value={1}>Basic</option>
                                    <option value={2}>Standard</option>
                                    <option value={3}>Premium</option>
                                    <option value={4}>Professional</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Giá (VND) <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="VD: 1000000"
                                    min="0"
                                    max="100000000"
                                    step="1000"
                                    isInvalid={!!errors.price}
                                />
                                {errors.price && (
                                    <Form.Control.Feedback type="invalid">
                                        {errors.price}
                                    </Form.Control.Feedback>
                                )}
                                <Form.Text className="text-muted">
                                    Nhập giá từ 0 đến 100,000,000 VND
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>
                    <h6 className="mt-4 mb-3 text-primary border-bottom pb-2">Giới hạn tài nguyên</h6>
                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Max Khóa học</Form.Label>
                                <Form.Control
                                        type="number"
                                        name="maxCourses"
                                        value={formData.maxCourses}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        min="1"
                                        max="100"
                                        isInvalid={!!errors.maxCourses}
                                    />
                                {errors.maxCourses && (
                                    <Form.Control.Feedback type="invalid">
                                        {errors.maxCourses}
                                    </Form.Control.Feedback>
                                )}
                                <Form.Text className="text-muted">
                                    Từ 1 đến 100
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Max Bài học</Form.Label>
                                <Form.Control
                                        type="number"
                                        name="maxLessons"
                                        value={formData.maxLessons}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        min="1"
                                        max="1000"
                                        isInvalid={!!errors.maxLessons}
                                    />
                                {errors.maxLessons && (
                                    <Form.Control.Feedback type="invalid">
                                        {errors.maxLessons}
                                    </Form.Control.Feedback>
                                )}
                                <Form.Text className="text-muted">
                                    Từ 1 đến 1,000
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Max Học viên</Form.Label>
                                <Form.Control
                                        type="number"
                                        name="maxStudents"
                                        value={formData.maxStudents}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        min="1"
                                        max="10000"
                                        isInvalid={!!errors.maxStudents}
                                    />
                                {errors.maxStudents && (
                                    <Form.Control.Feedback type="invalid">
                                        {errors.maxStudents}
                                    </Form.Control.Feedback>
                                )}
                                <Form.Text className="text-muted">
                                    Từ 1 đến 10,000
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Hủy
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? "Đang lưu..." : "Lưu"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
