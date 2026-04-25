import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Row, Col, Form } from "react-bootstrap";
import { FaImage, FaMusic, FaSearch, FaMagic, FaTimes, FaBook, FaTags, FaFileAlt, FaVolumeUp, FaCheck, FaInfoCircle } from "react-icons/fa";
import PremiumCloseButton from "../../Common/PremiumCloseButton/PremiumCloseButton";
import { flashcardService } from "../../../Services/flashcardService";
import { fileService } from "../../../Services/fileService";
import GenerateFlashcardModal from "../GenerateFlashcardModal/GenerateFlashcardModal";
import LookupWordModal from "../LookupWordModal/LookupWordModal";
import ConfirmModal from "../../Common/ConfirmModal/ConfirmModal";
import "./CreateFlashCardModal.css";

const FLASHCARD_IMAGE_BUCKET = "flashcards";
const FLASHCARD_AUDIO_BUCKET = "flashcard-audio";

export default function CreateFlashCardModal({ show, onClose, onSuccess, moduleId, flashcardToUpdate, isAdmin = false }) {
  const isEditMode = !!flashcardToUpdate;

  // Form state
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [example, setExample] = useState("");
  const [exampleTranslation, setExampleTranslation] = useState("");
  const [synonyms, setSynonyms] = useState("");
  const [antonyms, setAntonyms] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [generateNotice, setGenerateNotice] = useState("");

  // Modals state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Media state
  const [imagePreview, setImagePreview] = useState(null);
  const [imageTempKey, setImageTempKey] = useState(null);
  const [imageType, setImageType] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  const [audioPreview, setAudioPreview] = useState(null);
  const [audioTempKey, setAudioTempKey] = useState(null);
  const [audioType, setAudioType] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const audioInputRef = useRef(null);

  // Refs for auto-resize textareas
  const exampleTextareaRef = useRef(null);
  const exampleTranslationTextareaRef = useRef(null);

  // Auto-resize textarea function
  const autoResizeTextarea = (textareaRef) => {
    if (textareaRef?.current) {
      textareaRef.current.style.height = 'auto';
      const maxHeight = 120; // Limit max height to 120px
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  // Auto-resize when example or exampleTranslation changes
  useEffect(() => {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      autoResizeTextarea(exampleTextareaRef);
    }, 0);
  }, [example]);

  useEffect(() => {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      autoResizeTextarea(exampleTranslationTextareaRef);
    }, 0);
  }, [exampleTranslation]);

  useEffect(() => {
    if (show) {
      if (flashcardToUpdate) {
        setWord(flashcardToUpdate.word || flashcardToUpdate.Word || "");
        setMeaning(flashcardToUpdate.meaning || flashcardToUpdate.Meaning || "");
        setPronunciation(flashcardToUpdate.pronunciation || flashcardToUpdate.Pronunciation || "");
        setPartOfSpeech(flashcardToUpdate.partOfSpeech || flashcardToUpdate.PartOfSpeech || "");
        setExample(flashcardToUpdate.example || flashcardToUpdate.Example || "");
        setExampleTranslation(flashcardToUpdate.exampleTranslation || flashcardToUpdate.ExampleTranslation || "");
        setSynonyms(flashcardToUpdate.synonyms || flashcardToUpdate.Synonyms || "");
        setAntonyms(flashcardToUpdate.antonyms || flashcardToUpdate.Antonyms || "");

        setImagePreview(flashcardToUpdate.imageUrl || flashcardToUpdate.ImageUrl || null);
        setAudioPreview(flashcardToUpdate.audioUrl || flashcardToUpdate.AudioUrl || null);
        setImageTempKey(null);
        setAudioTempKey(null);
      } else {
        resetForm();
      }
      setErrors({});
      setGenerateNotice("");
    }
  }, [show, flashcardToUpdate]);

  // Reset textarea height when modal closes
  useEffect(() => {
    if (!show) {
      if (exampleTextareaRef.current) {
        exampleTextareaRef.current.style.height = 'auto';
      }
      if (exampleTranslationTextareaRef.current) {
        exampleTranslationTextareaRef.current.style.height = 'auto';
      }
    }
  }, [show]);

  const resetForm = () => {
    setWord("");
    setMeaning("");
    setPronunciation("");
    setPartOfSpeech("");
    setExample("");
    setExampleTranslation("");
    setSynonyms("");
    setAntonyms("");
    setImagePreview(null);
    setAudioPreview(null);
    setImageTempKey(null);
    setAudioTempKey(null);
    setTouched({});
    setShowConfirmClose(false);
    setGenerateNotice("");
  };

  // Check if form has data
  const hasFormData = () => {
    return (
      word.trim() !== "" ||
      meaning.trim() !== "" ||
      pronunciation.trim() !== "" ||
      partOfSpeech.trim() !== "" ||
      example.trim() !== "" ||
      imagePreview !== null ||
      audioPreview !== null
    );
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

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, image: "Kích thước ảnh tối đa 5MB" });
      return;
    }

    setUploadingImage(true);
    try {
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);

      const res = await fileService.uploadTempFile(file, FLASHCARD_IMAGE_BUCKET, "temp");
      if (res.data?.success) {
        setImageTempKey(res.data.data.TempKey || res.data.data.tempKey);
        setImageType(res.data.data.ImageType || res.data.data.imageType || file.type);
        setTouched(prev => ({ ...prev, image: true }));
        setErrors(prev => ({ ...prev, image: null }));
      } else {
        setErrors({ ...errors, image: "Upload thất bại" });
      }
    } catch (err) {
      console.error(err);
      setErrors({ ...errors, image: "Lỗi upload ảnh" });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleAudioChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, audio: "Kích thước audio tối đa 10MB" });
      return;
    }

    setUploadingAudio(true);
    try {
      const preview = URL.createObjectURL(file);
      setAudioPreview(preview);

      const res = await fileService.uploadTempFile(file, FLASHCARD_AUDIO_BUCKET, "temp");
      if (res.data?.success) {
        setAudioTempKey(res.data.data.TempKey || res.data.data.tempKey);
        setAudioType(res.data.data.AudioType || res.data.data.audioType || file.type);
        setTouched(prev => ({ ...prev, audio: true }));
        setErrors(prev => ({ ...prev, audio: null }));
      } else {
        setErrors({ ...errors, audio: "Upload thất bại" });
      }
    } catch (err) {
      console.error(err);
      setErrors({ ...errors, audio: "Lỗi upload audio" });
    } finally {
      setUploadingAudio(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const handleGenerateSuccess = (data) => {
    // Clear errors and touched states immediately to prevent stale UI during update
    setErrors({});
    setTouched({});

    if (data.word) setWord(data.word);
    if (data.meaning) setMeaning(data.meaning);
    if (data.pronunciation) setPronunciation(data.pronunciation);
    if (data.partOfSpeech) setPartOfSpeech(data.partOfSpeech);
    if (data.example) setExample(data.example);
    if (data.exampleTranslation) setExampleTranslation(data.exampleTranslation);

    if (data.synonyms) setSynonyms(data.synonyms);
    if (data.antonyms) setAntonyms(data.antonyms);

    const resolvedImageUrl = data.imageUrl || data.ImageUrl || null;
    const resolvedImageTempKey = data.imageTempKey || data.ImageTempKey || null;
    const resolvedImageType = data.imageType || data.ImageType || null;
    const resolvedAudioUrl = data.audioUrl || data.AudioUrl || null;
    const resolvedAudioTempKey = data.audioTempKey || data.AudioTempKey || null;
    const resolvedAudioType = data.audioType || data.AudioType || null;

    if (resolvedImageUrl || resolvedImageTempKey) {
      setImagePreview(resolvedImageUrl);
      setImageTempKey(resolvedImageTempKey);
      setImageType(resolvedImageType);
    }
    if (resolvedAudioUrl || resolvedAudioTempKey) {
      setAudioPreview(resolvedAudioUrl);
      setAudioTempKey(resolvedAudioTempKey);
      setAudioType(resolvedAudioType);
      setGenerateNotice("");
    } else {
      setGenerateNotice("Không có audio từ dịch vụ gen. Bạn có thể tải audio thủ công nếu cần.");
    }

    const newData = {
      word: data.word || "",
      meaning: data.meaning || "",
      pronunciation: data.pronunciation || "",
      partOfSpeech: data.partOfSpeech || "",
      imagePreview: resolvedImageUrl || imagePreview,
      imageTempKey: resolvedImageTempKey || imageTempKey,
      audioPreview: resolvedAudioUrl || audioPreview,
      audioTempKey: resolvedAudioTempKey || audioTempKey
    };

    setTouched({
      word: true,
      meaning: true,
      pronunciation: true,
      partOfSpeech: true,
      example: true,
      exampleTranslation: true,
      image: true,
      audio: true,
    });
    
    validateForm(newData);
  };

  const handleSelectWord = (data) => {
    if (data.word) setWord(data.word);
    if (data.pronunciation) setPronunciation(data.pronunciation);
    if (data.partOfSpeech) setPartOfSpeech(data.partOfSpeech);
    if (data.definition) setMeaning(data.definition);
    if (data.example) setExample(data.example);

    const resolvedAudioUrl = data.audioUrl || data.AudioUrl || null;

    if (resolvedAudioUrl) {
      setAudioPreview(resolvedAudioUrl);
      setAudioTempKey(null); // It's an external URL, not a temp key
    }

    const newData = {
      word: data.word || word,
      pronunciation: data.pronunciation || pronunciation,
      partOfSpeech: data.partOfSpeech || partOfSpeech,
      meaning: data.definition || meaning,
      imagePreview,
      imageTempKey,
      audioPreview: resolvedAudioUrl || audioPreview,
      audioTempKey: resolvedAudioUrl ? null : audioTempKey
    };

    setTouched(prev => ({
      ...prev,
      word: !!data.word,
      pronunciation: !!data.pronunciation,
      partOfSpeech: !!data.partOfSpeech,
      meaning: !!data.definition,
    }));

    validateForm(newData);
    setShowLookupModal(false);
  };

  const validateForm = (values = null) => {
    const newErrors = {};
    const dWord = (values?.word || word).trim();
    const dMeaning = (values?.meaning || meaning).trim();
    const dPronunciation = (values?.pronunciation || pronunciation).trim();
    const dPartOfSpeech = (values?.partOfSpeech || partOfSpeech).trim();
    const dImage = values ? (values.imagePreview || values.imageTempKey) : (imagePreview || imageTempKey);
    const dAudio = values ? (values.audioPreview || values.audioTempKey) : (audioPreview || audioTempKey);

    if (!dWord) {
      newErrors.word = "Từ vựng là bắt buộc";
    }
    if (!dMeaning) {
      newErrors.meaning = "Nghĩa là bắt buộc";
    }
    if (!dPronunciation) {
      newErrors.pronunciation = "Phiên âm là bắt buộc";
    }
    if (!dPartOfSpeech) {
      newErrors.partOfSpeech = "Từ loại là bắt buộc";
    }
    if (!dImage) {
      newErrors.image = "Ảnh là bắt buộc";
    }
    if (!dAudio) {
      newErrors.audio = "Âm thanh là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setTouched({
        word: true,
        meaning: true,
        pronunciation: true,
        partOfSpeech: true,
        image: true,
        audio: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        word: word.trim(),
        meaning: meaning.trim(),
        pronunciation: pronunciation.trim(),
        partOfSpeech: partOfSpeech.trim(),
        example: example.trim() || null,
        exampleTranslation: exampleTranslation.trim() || null,
        synonyms: synonyms.trim() || null,
        antonyms: antonyms.trim() || null,
        imageTempKey: imageTempKey,
        audioTempKey: audioTempKey,
        imageType: imageType,
        audioType: audioType
      };

      let res;
      if (isEditMode) {
        const flashcardId = flashcardToUpdate.flashCardId || 
                           flashcardToUpdate.FlashCardId || 
                           flashcardToUpdate.flashcardId || 
                           flashcardToUpdate.FlashcardId;
        res = isAdmin
          ? await flashcardService.updateAdminFlashcard(flashcardId, payload)
          : await flashcardService.updateFlashcard(flashcardId, payload);
      } else {
        payload.moduleId = parseInt(moduleId);
        res = isAdmin
          ? await flashcardService.createAdminFlashcard(payload)
          : await flashcardService.createFlashcard(payload);
      }

      if (res.data?.success) {
        onSuccess(res.data.data);
        onClose();
      } else {
        throw new Error(res.data?.message || "Lỗi thao tác");
      }
    } catch (err) {
      console.error(err);
      setErrors({ submit: err.response?.data?.message || "Có lỗi xảy ra" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayAudio = () => {
    if (audioPreview) {
      const audio = new Audio(audioPreview);
      audio.play().catch(e => console.error("Audio playback failed", e));
    }
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="xl" className="create-flashcard-modal modal-modern" dialogClassName="create-flashcard-modal-dialog">
        <Modal.Header closeButton={false}>
          <Modal.Title className="modal-title-custom">
            {isEditMode ? "Cập nhật Flashcard" : "Tạo Flashcard mới"}
          </Modal.Title>
          <PremiumCloseButton onClick={handleClose} />
        </Modal.Header>
        <Modal.Body>
          {!isEditMode && (
            <div className="d-flex justify-content-end mb-3 gap-2">
              <Button variant="outline-info" size="sm" onClick={() => setShowLookupModal(true)}><FaSearch className="me-1" /> Tra từ</Button>
              <Button variant="outline-primary" size="sm" onClick={() => { setShowGenerateModal(true); setErrors({}); setTouched({}); }}><FaMagic className="me-1" /> AI Gen</Button>
            </div>
          )}
          <Form onSubmit={handleSubmit}>
            {/* MODERIZED FORM LAYOUT */}
            <div className="flashcard-modern-container">
              
              {/* Left Column: English Context */}
              <div className="flashcard-modern-column">
                <div className="premium-card context-section">
                  <div className="card-header-premium">
                    <FaBook className="icon-blue" />
                    <span>Bối cảnh Tiếng Anh</span>
                  </div>
                  
                  <div className="card-body-premium">
                    <Form.Group className="mb-4">
                      <Form.Label className="premium-label required">Từ vựng</Form.Label>
                      <Form.Control
                        type="text"
                        className="premium-input word-input"
                        value={word}
                        onChange={e => {
                          setWord(e.target.value);
                          if (touched.word) setErrors(prev => ({ ...prev, word: null }));
                        }}
                        onBlur={() => handleBlur("word")}
                        placeholder="VD: Innovation"
                        isInvalid={touched.word && !!errors.word}
                      />
                      {touched.word && errors.word && <Form.Control.Feedback type="invalid">{errors.word}</Form.Control.Feedback>}
                    </Form.Group>

                    <Row className="mb-4">
                      <Col md={8}>
                        <Form.Label className="premium-label required">Phiên âm</Form.Label>
                        <Form.Control
                          type="text"
                          className="premium-input"
                          value={pronunciation}
                          onChange={e => {
                            setPronunciation(e.target.value);
                            if (touched.pronunciation) setErrors(prev => ({ ...prev, pronunciation: null }));
                          }}
                          onBlur={() => handleBlur("pronunciation")}
                          placeholder="/ˌɪn.əˈveɪ.ʃən/"
                          isInvalid={touched.pronunciation && !!errors.pronunciation}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="premium-label required">Audio</Form.Label>
                        <div className="premium-audio-trigger-wrapper">
                          {audioPreview ? (
                            <div className="audio-actions-row">
                              <button type="button" className="premium-audio-btn pulse-btn" onClick={handlePlayAudio} title="Nghe thử">
                                <FaVolumeUp />
                              </button>
                              <button type="button" className="btn-remove-media small" onClick={(e) => { e.stopPropagation(); setAudioPreview(null); setAudioTempKey(null); }} title="Xóa audio">
                                <FaTimes />
                              </button>
                            </div>
                          ) : (
                            <button type="button" className="premium-audio-btn empty" onClick={() => audioInputRef.current?.click()}>
                              <FaMusic />
                            </button>
                          )}
                          <input type="file" ref={audioInputRef} onChange={handleAudioChange} style={{ display: 'none' }} accept="audio/*" />
                        </div>
                      </Col>
                    </Row>

                    <Form.Group>
                      <Form.Label className="premium-label">Câu ví dụ (English)</Form.Label>
                      <Form.Control
                        as="textarea"
                        className="premium-input textarea-modern"
                        ref={exampleTextareaRef}
                        rows={2}
                        value={example}
                        onChange={e => {
                          setExample(e.target.value);
                          autoResizeTextarea(exampleTextareaRef);
                        }}
                        placeholder="The company is known for its innovation..."
                      />
                    </Form.Group>
                  </div>
                </div>
              </div>

              {/* Right Column: Meaning & Visuals */}
              <div className="flashcard-modern-column">
                <div className="premium-card meaning-section">
                  <div className="card-header-premium">
                    <FaCheck className="icon-green" />
                    <span>Nghĩa & Hình ảnh</span>
                  </div>

                  <div className="card-body-premium">
                    <Form.Group className="mb-4">
                      <Form.Label className="premium-label required">Nghĩa (Tiếng Việt)</Form.Label>
                      <div className="meaning-input-wrapper">
                        <Form.Control
                          type="text"
                          className="premium-input translation-input"
                          value={meaning}
                          onChange={e => {
                            setMeaning(e.target.value);
                            if (touched.meaning) setErrors(prev => ({ ...prev, meaning: null }));
                          }}
                          onBlur={() => handleBlur("meaning")}
                          placeholder="Nhập nghĩa ngắn (VD: Sự đổi mới)"
                          isInvalid={touched.meaning && !!errors.meaning}
                        />
                        <div className="meaning-hint">
                          <FaInfoCircle /> Nên dùng 1-2 từ ngắn gọn
                        </div>
                      </div>
                      {touched.meaning && errors.meaning && <Form.Control.Feedback type="invalid">{errors.meaning}</Form.Control.Feedback>}
                    </Form.Group>

                    <Row className="mb-4">
                      <Col md={12}>
                        <Form.Label className="premium-label required">Từ loại</Form.Label>
                        <Form.Control
                          type="text"
                          className="premium-input pos-input"
                          value={partOfSpeech}
                          onChange={e => {
                            setPartOfSpeech(e.target.value);
                            if (touched.partOfSpeech) setErrors(prev => ({ ...prev, partOfSpeech: null }));
                          }}
                          onBlur={() => handleBlur("partOfSpeech")}
                          placeholder="Noun, Verb, Adjective..."
                          isInvalid={touched.partOfSpeech && !!errors.partOfSpeech}
                        />
                      </Col>
                    </Row>

                    <Form.Group>
                      <Form.Label className="premium-label required">Ảnh minh họa</Form.Label>
                      <div className="premium-image-uploader" onClick={() => !imagePreview && imageInputRef.current?.click()}>
                        {imagePreview ? (
                          <div className="premium-image-preview-container">
                            <img src={imagePreview} alt="Preview" />
                            <button type="button" className="btn-remove-media overlay" onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageTempKey(null); }}>
                              <FaTimes />
                            </button>
                          </div>
                        ) : (
                          <div className="preview-placeholder">
                            <FaImage size={32} />
                            <span>{uploadingImage ? "Đang tải..." : "Chọn ảnh từ máy"}</span>
                          </div>
                        )}
                        <input type="file" ref={imageInputRef} onChange={handleImageChange} style={{ display: 'none' }} accept="image/*" />
                      </div>
                    </Form.Group>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Extras */}
            <div className="flashcard-extra-row">
              <div className="premium-card extra-section">
                <div className="card-header-premium">
                  <FaTags className="icon-purple" />
                  <span>Dịch câu & Thông tin thêm</span>
                </div>
                <div className="card-body-premium">
                  <Row className="g-4">
                    <Col md={12}>
                      <Form.Label className="premium-label">Bản dịch ví dụ</Form.Label>
                      <Form.Control
                        as="textarea"
                        className="premium-input textarea-modern"
                        ref={exampleTranslationTextareaRef}
                        rows={1}
                        value={exampleTranslation}
                        onChange={e => {
                          setExampleTranslation(e.target.value);
                          autoResizeTextarea(exampleTranslationTextareaRef);
                        }}
                        placeholder="Công ty nổi tiếng với sự đổi mới..."
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Label className="premium-label">Từ đồng nghĩa</Form.Label>
                      <Form.Control
                        type="text"
                        className="premium-input"
                        value={synonyms}
                        onChange={e => setSynonyms(e.target.value)}
                        placeholder="pretty, gorgeous"
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Label className="premium-label">Từ trái nghĩa</Form.Label>
                      <Form.Control
                        type="text"
                        className="premium-input"
                        value={antonyms}
                        onChange={e => setAntonyms(e.target.value)}
                        placeholder="ugly, unattractive"
                      />
                    </Col>
                  </Row>
                </div>
              </div>
            </div>

            {errors.submit && <div className="alert alert-danger mt-3">{errors.submit}</div>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="link" className="text-muted text-decoration-none fw-bold" onClick={handleClose} disabled={submitting}>Hủy bỏ</Button>
          <Button className="btn-primary-custom" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Đang lưu..." : (isEditMode ? "Cập nhật Flashcard" : "Tạo Flashcard")}
          </Button>
        </Modal.Footer>

        <GenerateFlashcardModal show={showGenerateModal} onClose={() => setShowGenerateModal(false)} onGenerate={handleGenerateSuccess} />
        <LookupWordModal show={showLookupModal} onClose={() => setShowLookupModal(false)} onSelect={handleSelectWord} />
      </Modal>

      {/* Confirm Close Modal */}
      <ConfirmModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={handleConfirmClose}
        title="Xác nhận đóng"
        message={`Bạn có dữ liệu chưa được lưu. Bạn có chắc chắn muốn ${isEditMode ? "hủy cập nhật" : "hủy tạo"} Flashcard không?`}
        confirmText="Đóng"
        cancelText="Tiếp tục"
        type="warning"
      />
    </>
  );
}