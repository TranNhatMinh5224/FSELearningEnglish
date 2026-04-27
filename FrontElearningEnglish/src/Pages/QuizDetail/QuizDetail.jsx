import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";
import MainHeader from "../../Components/Header/MainHeader";
import Breadcrumb from "../../Components/Common/Breadcrumb/Breadcrumb";
import QuizTimer from "../../Components/Quiz/QuizTimer/QuizTimer";
import QuizNavigation from "../../Components/Quiz/QuizNavigation/QuizNavigation";
import QuestionCard from "../../Components/Quiz/QuestionCard/QuestionCard";
import ConfirmModal from "../../Components/Common/ConfirmModal/ConfirmModal";
import NotificationModal from "../../Components/Common/NotificationModal/NotificationModal";
import { quizAttemptService } from "../../Services/quizAttemptService";
import { courseService } from "../../Services/courseService";
import { lessonService } from "../../Services/lessonService";
import "./QuizDetail.css";

export default function QuizDetail() {
    const { courseId, lessonId, moduleId, quizId, attemptId } = useParams();
    const navigate = useNavigate();

    const [quizAttempt, setQuizAttempt] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: answer }
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [lesson, setLesson] = useState(null);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [notification, setNotification] = useState({ isOpen: false, type: "info", message: "" });
    const [showFocusPrompt, setShowFocusPrompt] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const timeSpentRef = useRef(0);
    const timerIntervalRef = useRef(null);
    const isFetchingRef = useRef(false);
    const fetchedKeyRef = useRef(null);
    const [remainingTime, setRemainingTime] = useState(null); // State để update timer real-time
    const endTimeRef = useRef(null); // Lưu endTime được tính từ startedAt + Duration
    const autoSubmitCalledRef = useRef(false); // Để tránh gọi auto-submit nhiều lần
    const saveAnswerTimeoutRef = useRef({}); // Debounce timers cho từng questionId
    const savingAnswersRef = useRef(new Set()); // Track các answer đang được save
    const pendingNavigationRef = useRef(null); // URL để navigate sau khi đóng notification

    // Get paged items (stand-alone questions or entire groups)
    const getPagedItems = () => {
        if (!quizAttempt) return [];

        const sections = quizAttempt.QuizSections || quizAttempt.quizSections || [];
        if (!sections || sections.length === 0) return [];

        const pagedItems = [];
        let globalNumber = 1;
        sections.forEach((section, sectionIdx) => {
            const sectionInfo = {
                sectionId: section.SectionId || section.sectionId || section.QuizSectionId,
                sectionTitle: section.Title || section.title,
                sectionDescription: section.Description || section.description,
                sectionIndex: sectionIdx + 1
            };

            const items = section.Items || section.items || [];

            if (items.length > 0) {
                items.forEach(item => {
                    const type = item.ItemType || item.itemType;
                    if (type === "Question") {
                        if (item.QuestionId || item.questionId) {
                            pagedItems.push({
                                ...item,
                                _itemType: "Question",
                                _sectionInfo: sectionInfo,
                                _startNumber: globalNumber,
                                _itemCount: 1
                            });
                            globalNumber++;
                        }
                    } else if (type === "Group") {
                        const questionsInGroup = item.Questions || item.questions || [];
                        pagedItems.push({
                            ...item,
                            _itemType: "Group",
                            _sectionInfo: sectionInfo,
                            questions: questionsInGroup,
                            _startNumber: globalNumber,
                            _itemCount: questionsInGroup.length,
                            groupInfo: {
                                groupName: item.Name || item.name,
                                groupTitle: item.Title || item.title,
                                groupDescription: item.Description || item.description,
                                groupImgUrl: item.ImgUrl || item.imgUrl,
                                groupVideoUrl: item.VideoUrl || item.videoUrl,
                                groupSumScore: item.SumScore || item.sumScore
                            }
                        });
                        globalNumber += questionsInGroup.length;
                    }
                });
            } else {
                // Fallback for legacy structure
                const qs = section.Questions || section.questions || [];
                const gs = section.QuizGroups || section.quizGroups || [];

                qs.forEach(q => {
                    pagedItems.push({
                        ...q,
                        _itemType: "Question",
                        _sectionInfo: sectionInfo,
                        _startNumber: globalNumber,
                        _itemCount: 1
                    });
                    globalNumber++;
                });

                gs.forEach(g => {
                    const questionsInGroup = g.Questions || g.questions || [];
                    pagedItems.push({
                        ...g,
                        _itemType: "Group",
                        _sectionInfo: sectionInfo,
                        questions: questionsInGroup,
                        _startNumber: globalNumber,
                        _itemCount: questionsInGroup.length,
                        groupInfo: {
                            groupName: g.Name || g.name,
                            groupTitle: g.Title || g.title,
                            groupDescription: g.Description || g.description,
                            groupImgUrl: g.ImgUrl || g.imgUrl,
                            groupVideoUrl: g.VideoUrl || g.videoUrl,
                            groupSumScore: g.SumScore || g.sumScore
                        }
                    });
                    globalNumber += questionsInGroup.length;
                });
            }
        });

        return pagedItems;
    };

    const pagedItems = getPagedItems();
    const currentPagedItem = pagedItems[currentQuestionIndex];

    // Derived flattened questions for count and sidebar
    const questions = (() => {
        const all = [];
        pagedItems.forEach(item => {
            if (item._itemType === "Group") {
                (item.questions || []).forEach(q => {
                    all.push({ ...q, _groupInfo: item.groupInfo, _sectionInfo: item._sectionInfo });
                });
            } else {
                all.push(item);
            }
        });
        return all;
    })();

    useEffect(() => {
        // Tạo key duy nhất cho quizId và attemptId hiện tại
        const currentKey = `${quizId || ''}-${attemptId || ''}`;

        // Nếu đã fetch cho key này rồi, không fetch lại
        if (fetchedKeyRef.current === currentKey) {
            return;
        }

        // Nếu đang fetch, không fetch lại (tránh infinite loop)
        if (isFetchingRef.current) {
            return;
        }

        // Phải có quizId hoặc attemptId
        if (!quizId && !attemptId) {
            setError("Thiếu thông tin quizId hoặc attemptId");
            setLoading(false);
            return;
        }

        // Mark as fetched và bắt đầu fetch
        fetchedKeyRef.current = currentKey;
        isFetchingRef.current = true;

        isFetchingRef.current = true;

        fetchQuizAttempt()
            .then(() => {
            })
            .catch((err) => {
                console.error("Fetch error:", err);
            })
            .finally(() => {
                isFetchingRef.current = false;
            });

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quizId, attemptId]);

    // Auto-save progress to localStorage whenever quizAttempt updates
    useEffect(() => {
        if (quizAttempt) {
            const status = quizAttempt.Status !== undefined ? quizAttempt.Status : quizAttempt.status;

            // Loose check for status 0 or 1, OR if status is missing (assume active)
            // Backend Enum: 0=Started, 1=InProgress
            if (status === 0 || status === 1 || status === undefined) {
                const aId = quizAttempt.attemptId || quizAttempt.AttemptId || attemptId;
                const qId = quizAttempt.quizId || quizAttempt.QuizId || quizId;

                if (aId && qId) {
                    const progressKey = `quiz_in_progress_${qId}`;
                    const progressData = {
                        quizId: qId,
                        attemptId: aId,
                        courseId,
                        lessonId,
                        moduleId,
                        startedAt: quizAttempt.StartedAt || quizAttempt.startedAt,
                        status: status ?? 1 // Default to 1 if missing
                    };


                    try {
                        localStorage.setItem(progressKey, JSON.stringify(progressData));
                    } catch (e) {
                        console.error("💾 [AutoSave] Write Failed:", e);
                    }
                } else {
                    const qId = quizAttempt.quizId || quizAttempt.QuizId || quizId;
                    if (qId) localStorage.removeItem(`quiz_in_progress_${qId}`);
                }
            }
        }
    }, [quizAttempt, quizId, courseId, lessonId, moduleId, attemptId]);

    // Cleanup: Clear all debounce timers khi component unmount
    useEffect(() => {
        const savingAnswers = savingAnswersRef.current;
        return () => {
            // Clear tất cả debounce timers
            Object.values(saveAnswerTimeoutRef.current).forEach(timeout => {
                if (timeout) clearTimeout(timeout);
            });
            saveAnswerTimeoutRef.current = {};
            savingAnswers.clear();
        };
    }, []);

    const fetchQuizAttempt = async () => {
        try {
            setLoading(true);
            setError("");

            let attempt = null;

            if (attemptId) {
                try {
                    const resumeResponse = await quizAttemptService.resume(attemptId);
                    if (resumeResponse.data?.success && resumeResponse.data?.data) {
                        attempt = resumeResponse.data.data;
                        const status = attempt.Status !== undefined ? attempt.Status : attempt.status;

                        if (status !== 0 && status !== 1) {
                            setNotification({
                                isOpen: true,
                                type: "info",
                                message: "Bài quiz này đã được nộp hoặc kết thúc.",
                                isTerminal: true
                            });
                            setLoading(false);
                            return;
                        }

                        const attemptIdToSave = attempt.attemptId || attempt.AttemptId;
                        const quizIdToSave = attempt.quizId || attempt.QuizId || quizId;
                        if (attemptIdToSave && quizIdToSave) {
                            const quizProgress = {
                                quizId: quizIdToSave,
                                attemptId: attemptIdToSave,
                                courseId,
                                lessonId,
                                moduleId,
                                startedAt: attempt.StartedAt || attempt.startedAt,
                                status: attempt.Status || attempt.status
                            };
                            localStorage.setItem(`quiz_in_progress_${quizIdToSave}`, JSON.stringify(quizProgress));
                        }
                    } else {
                        setError(resumeResponse.data?.message || "Không thể tải bài làm.");
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.error("Resume error:", err);
                    if (err.response?.status === 400) setError("Bài quiz đã được nộp.");
                    else if (err.response?.status === 404) setError("Không tìm thấy bài quiz.");
                    else setError("Lỗi kết nối.");
                    setLoading(false);
                    return;
                }
            } else {
                setNotification({
                    isOpen: true,
                    type: "error",
                    message: "Thiếu thông tin attemptId.",
                    isTerminal: true
                });
                setLoading(false);
                return;
            }

            if (!attempt) {
                setError("Không thể tải thông tin quiz.");
                setLoading(false);
                return;
            }

            const currentParamsAttemptId = attemptId;
            const newAttemptIdStr = attempt.attemptId || attempt.AttemptId;
            if (newAttemptIdStr && String(newAttemptIdStr) !== String(currentParamsAttemptId)) {
                fetchedKeyRef.current = null;
                navigate(`/course/${courseId}/lesson/${lessonId}/module/${moduleId}/quiz/${quizId}/attempt/${newAttemptIdStr}`, { replace: true });
                return;
            }

            const sections = attempt.QuizSections || attempt.quizSections || [];
            // Logic count questions + flatten items
            const allQuestions = [];

            sections.forEach(section => {
                const items = section.Items || section.items || [];
                if (items.length > 0) {
                    items.forEach(item => {
                        const type = item.ItemType || item.itemType;
                        if (type === "Question") {
                            if (item.QuestionId || item.questionId) allQuestions.push(item);
                        } else if (type === "Group") {
                            const gq = item.Questions || item.questions || [];
                            const gInfo = {
                                groupName: item.Name || item.name,
                                groupTitle: item.Title || item.title,
                                groupDescription: item.Description || item.description,
                                groupImgUrl: item.ImgUrl || item.imgUrl,
                                groupVideoUrl: item.VideoUrl || item.videoUrl
                            };
                            gq.forEach(q => allQuestions.push({ ...q, _groupInfo: gInfo }));
                        }
                    });
                } else {
                    // Legacy structure
                    const qs = section.Questions || section.questions || [];
                    const gs = section.QuizGroups || section.quizGroups || [];

                    if (qs.length > 0) allQuestions.push(...qs);

                    if (gs.length > 0) {
                        gs.forEach(g => {
                            const gq = g.Questions || g.questions || [];
                            const gInfo = {
                                groupName: g.Name || g.name,
                                groupTitle: g.Title || g.title,
                                groupDescription: g.Description || g.description,
                                groupImgUrl: g.ImgUrl || g.imgUrl,
                                groupVideoUrl: g.VideoUrl || g.videoUrl
                            };
                            gq.forEach(q => allQuestions.push({ ...q, _groupInfo: gInfo }));
                        });
                    }
                }
            });


            setQuizAttempt(attempt);

            const existingAnswers = {};

            allQuestions.forEach(q => {
                const qId = q.QuestionId || q.questionId;
                const ua = q.UserAnswer ?? q.userAnswer;
                if (ua !== null && ua !== undefined) existingAnswers[qId] = ua;
            });
            setAnswers(existingAnswers);

            const attemptDuration = attempt.Duration !== undefined ? attempt.Duration : attempt.duration;
            const attemptTitle = attempt.QuizTitle || attempt.quizTitle;
            const attemptQuizInfo = attempt.Quiz || attempt.quiz;

            if (attemptQuizInfo) {
                const qDuration = attemptQuizInfo.Duration !== undefined ? attemptQuizInfo.Duration : attemptQuizInfo.duration;
                setQuiz({
                    ...attemptQuizInfo,
                    Duration: qDuration != null ? qDuration : attemptDuration,
                    title: attemptQuizInfo.title || attemptQuizInfo.Title || attemptTitle
                });
            } else {
                setQuiz({
                    Duration: attemptDuration ?? null,
                    title: attemptTitle
                });
            }

            // Fetch course and lesson info for breadcrumbs
            try {
                const [courseRes, lessonRes] = await Promise.all([
                    courseService.getCourseById(courseId),
                    lessonService.getLessonById(lessonId)
                ]);
                if (courseRes.data?.success) setCourse(courseRes.data.data);
                if (lessonRes.data?.success) setLesson(lessonRes.data.data);
            } catch (err) {
                console.error("Error fetching course/lesson for breadcrumbs:", err);
            }

            setLoading(false);

            // Hiển thị prompt bật chế độ tập trung nếu là mới vào
            if (!isFocusMode) {
                setShowFocusPrompt(true);
            }

        } catch (err) {
            console.error("Fetch error:", err);
            setError("Không thể tải thông tin quiz.");
            setLoading(false);
        }
    };

    const handleSubmitAnswer = useCallback(async (questionId, answer) => {
        try {
            // Call API to submit answer - use attemptId from quizAttempt if available
            const currentAttemptId = quizAttempt?.attemptId || quizAttempt?.AttemptId || attemptId;
            if (currentAttemptId && questionId) {
                const response = await quizAttemptService.updateAnswer(currentAttemptId, {
                    questionId,
                    userAnswer: answer
                });

                if (response.data?.success) {
                    // Update local state after successful API call
                    setAnswers(prev => ({
                        ...prev,
                        [questionId]: answer
                    }));
                } else {
                    console.error("Error submitting answer:", response.data?.message);
                    setNotification({
                        isOpen: true,
                        type: "error",
                        message: response.data?.message || "Không thể lưu câu trả lời"
                    });
                }
            }
        } catch (err) {
            console.error("Error submitting answer:", err);
            setNotification({
                isOpen: true,
                type: "error",
                message: "Không thể lưu câu trả lời"
            });
        }
    }, [quizAttempt, attemptId]);

    const handleSubmitQuiz = useCallback(async () => {
        // Prevent multiple submissions
        if (submitting) {
            return;
        }

        try {
            setSubmitting(true);
            autoSubmitCalledRef.current = true; // Mark as submitting immediately to stop all other logic

            // Stop timer
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }

            // Clear tất cả debounce timers
            Object.values(saveAnswerTimeoutRef.current).forEach(timeout => {
                if (timeout) clearTimeout(timeout);
            });
            saveAnswerTimeoutRef.current = {};

            // Đợi tất cả các answer đang save hoàn thành
            const waitForSaving = async () => {
                let retries = 0;
                while (savingAnswersRef.current.size > 0 && retries < 20) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    retries++;
                }
            };
            await waitForSaving();

            // Submit answer của câu hiện tại trước khi nộp bài (nếu chưa được save)
            if (currentPagedItem) {
                if (currentPagedItem._itemType === "Group") {
                    const groupQuestions = currentPagedItem.questions || [];
                    for (const q of groupQuestions) {
                        const qId = q.questionId || q.QuestionId;
                        const currentAnswer = answers[qId];
                        // Nếu có đáp án và chưa được save, submit ngay
                        if (currentAnswer !== undefined && currentAnswer !== null && !savingAnswersRef.current.has(qId)) {
                            await handleSubmitAnswer(qId, currentAnswer);
                        }
                    }
                } else {
                    const questionId = currentPagedItem.questionId || currentPagedItem.QuestionId;
                    const currentAnswer = answers[questionId];

                    // Nếu có đáp án và chưa được save, submit ngay
                    if (currentAnswer !== undefined && currentAnswer !== null && !savingAnswersRef.current.has(questionId)) {
                        await handleSubmitAnswer(questionId, currentAnswer);
                    }
                }
            }

            const currentAttemptId = quizAttempt?.attemptId || quizAttempt?.AttemptId || attemptId;

            if (!currentAttemptId) {
                setNotification({
                    isOpen: true,
                    type: "error",
                    message: "Không tìm thấy attempt ID"
                });
                setSubmitting(false);
                return;
            }

            try {
                const response = await quizAttemptService.submit(currentAttemptId);

                if (response.data?.success) {
                    const resultData = response.data.data;
                    setIsSubmitted(true); // Stop timer and other logic

                    // Construct results URL using the helper or manually
                    const resultsUrl = `/course/${courseId}/lesson/${lessonId}/module/${moduleId}/quiz/${quizId}/attempt/${currentAttemptId}/results`;

                    setNotification({
                        isOpen: true,
                        type: "success",
                        message: "Nộp bài thành công! ✓",
                        autoClose: true,
                        redirectTo: resultsUrl // Custom property for clarity
                    });

                    // Store pending navigation
                    pendingNavigationRef.current = resultsUrl;

                    // Exit focus mode and clean up UI before closing
                    setSubmitting(false);
                    setIsFocusMode(false);
                    if (document.fullscreenElement) {
                        document.exitFullscreen().catch(err => console.warn("Exit fullscreen failed:", err));
                    }

                    // Save result to localStorage
                    localStorage.setItem(`quiz_result_${currentAttemptId}`, JSON.stringify(resultData));

                    // Xóa quiz progress khỏi localStorage vì đã nộp
                    const quizIdToRemove = quizAttempt?.quizId || quizAttempt?.QuizId || quizId;
                    if (quizIdToRemove) {
                        localStorage.removeItem(`quiz_in_progress_${quizIdToRemove}`);
                    }
                } else {
                    console.error("✗ Submit failed - Response not successful");
                    console.error("Response data:", response.data);
                    console.error("Status code:", response.status);

                    setNotification({
                        isOpen: true,
                        type: "error",
                        message: response.data?.message || "Không thể nộp bài"
                    });
                    setSubmitting(false);
                }
            } catch (apiErr) {
                console.error("✗ API Error submitting quiz:", apiErr);
                console.error("Error details:", {
                    message: apiErr.message,
                    response: apiErr.response,
                    status: apiErr.response?.status,
                    data: apiErr.response?.data,
                    config: apiErr.config
                });

                setNotification({
                    isOpen: true,
                    type: "error",
                    message: apiErr.response?.data?.message || apiErr.message || "Không thể nộp bài. Vui lòng kiểm tra console để xem chi tiết lỗi."
                });
                setSubmitting(false);
            }
        } catch (err) {
            console.error("✗ Unexpected error in handleSubmitQuiz:", err);
            console.error("Error stack:", err.stack);
            setNotification({
                isOpen: true,
                type: "error",
                message: err.message || "Có lỗi xảy ra khi nộp bài. Vui lòng thử lại."
            });
            setSubmitting(false);
        } finally {
            setShowSubmitModal(false);
        }
    }, [submitting, currentPagedItem, answers, handleSubmitAnswer, quizAttempt, attemptId, quizId, courseId, lessonId, moduleId, navigate]);

    const handleEnterFocusMode = () => {
        setIsFocusMode(true);
        setShowFocusPrompt(false);

        // Bật fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn("Fullscreen request failed:", err);
            });
        }
    };

    const handleSkipFocusMode = () => {
        setShowFocusPrompt(false);
    };

    // Theo dõi sự kiện thoát fullscreen để tắt focusMode nếu cần
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && isFocusMode) {
                // Nếu user chủ động thoát fullscreen (Esc), có thể giữ focusMode hoặc tắt tùy ý
                // Ở đây ta giữ focusMode để ẩn header cho đến khi nộp bài
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [isFocusMode]);

    const calculateAndUpdateRemainingTime = useCallback(() => {
        if (!endTimeRef.current || submitting || isSubmitted) {
            if (!endTimeRef.current) setRemainingTime(null);
            return;
        }

        try {
            const now = new Date();
            const endTime = endTimeRef.current;

            // Calculate remaining time in seconds (real-time)
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
            setRemainingTime(remaining);

            // Auto-submit if time is up (chỉ submit một lần)
            if (remaining <= 0 && !autoSubmitCalledRef.current && !submitting) {
                autoSubmitCalledRef.current = true; // Đánh dấu đã gọi để tránh gọi lại

                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                    timerIntervalRef.current = null;
                }

                // Call handleSubmitQuiz to auto-submit (chỉ gọi một lần)
                handleSubmitQuiz();
            }
        } catch (error) {
            console.error("❌ Error calculating remaining time:", error);
            setRemainingTime(null);
        }
    }, [submitting, handleSubmitQuiz]);

    const startTimer = useCallback(() => {
        // Clear existing timer if any
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }

        // Start timer to update remainingTime every second
        timerIntervalRef.current = setInterval(() => {
            timeSpentRef.current += 1;

            // Update remainingTime real-time
            calculateAndUpdateRemainingTime();
        }, 1000);
    }, [calculateAndUpdateRemainingTime]);

    // Function to calculate and set endTime from startedAt + Duration
    const calculateEndTime = useCallback(() => {

        if (!quizAttempt || !quiz) {
            endTimeRef.current = null;
            return;
        }

        // Get quiz duration (in minutes) - try all possible sources and cases
        const quizDuration =
            quiz?.Duration ||
            quiz?.duration ||
            quizAttempt?.Duration ||
            quizAttempt?.duration ||
            quizAttempt?.Quiz?.Duration ||
            quizAttempt?.Quiz?.duration ||
            quizAttempt?.quiz?.Duration ||
            quizAttempt?.quiz?.duration || 0;

        if (quizDuration === null || quizDuration === undefined || isNaN(Number(quizDuration)) || Number(quizDuration) <= 0) {
            endTimeRef.current = null; // No time limit
            // console.log("⏰ [Timer] No valid duration found, setting to unlimited");
            return;
        }

        // Get StartedAt from attempt - handle both camelCase and PascalCase
        const startedAtStr = quizAttempt.StartedAt || quizAttempt.startedAt;
        if (!startedAtStr) {
            endTimeRef.current = null;
            return;
        }

        try {
            const startedAt = new Date(startedAtStr);
            if (isNaN(startedAt.getTime())) {
                endTimeRef.current = null;
                return;
            }

            // Calculate endTime = startedAt + Duration (minutes)
            // Use exact duration from backend (no extra buffer)
            const durationMs = Number(quizDuration) * 60 * 1000;
            const endTime = new Date(startedAt.getTime() + durationMs);
            endTimeRef.current = endTime;


        } catch (err) {
            console.error("❌ Error calculating endTime:", err);
            endTimeRef.current = null;
        }
    }, [quizAttempt, quiz]);

    // Calculate endTime when quizAttempt or quiz changes
    useEffect(() => {
        if (quizAttempt && quiz && !submitting && !isSubmitted) {
            calculateEndTime();
            // Calculate remaining time immediately
            calculateAndUpdateRemainingTime();

            // Start timer if not already started
            if (!timerIntervalRef.current) {
                startTimer();
            }
        }

        // Cleanup timer on unmount
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [quizAttempt, quiz, calculateEndTime, calculateAndUpdateRemainingTime, startTimer]);

    const handleAnswerChange = (questionId, answer) => {
        // Cập nhật local state ngay lập tức để UI responsive
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));

        // Auto-save với debounce (500ms) - Backend sẽ chấm điểm ngay lập tức
        const currentAttemptId = quizAttempt?.attemptId || quizAttempt?.AttemptId || attemptId;
        if (!currentAttemptId || !questionId) {
            return;
        }

        // Clear timeout cũ nếu có
        if (saveAnswerTimeoutRef.current[questionId]) {
            clearTimeout(saveAnswerTimeoutRef.current[questionId]);
        }

        // Nếu đang save answer này, skip
        if (savingAnswersRef.current.has(questionId)) {
            return;
        }

        // Debounce: Đợi 500ms sau khi user ngừng thay đổi
        saveAnswerTimeoutRef.current[questionId] = setTimeout(async () => {
            try {
                savingAnswersRef.current.add(questionId);

                const response = await quizAttemptService.updateAnswer(currentAttemptId, {
                    questionId,
                    userAnswer: answer
                });

                if (response.data?.success) {
                    // Không cần update state vì đã update ở trên
                } else {
                    console.error("❌ [AutoSave] Error saving answer:", response.data?.message);
                    // Không hiển thị notification để tránh làm phiền user
                    // Chỉ log để debug
                }
            } catch (err) {
                console.error("❌ [AutoSave] Error saving answer:", err);
                // Không hiển thị notification để tránh làm phiền user
            } finally {
                savingAnswersRef.current.delete(questionId);
                delete saveAnswerTimeoutRef.current[questionId];
            }
        }, 500); // Debounce 500ms
    };

    const handleNext = async () => {
        // Clear debounce timer for current paged item questions
        if (currentPagedItem) {
            const itemQuestions = currentPagedItem._itemType === "Group" ? currentPagedItem.questions : [currentPagedItem];

            for (const q of itemQuestions) {
                const questionId = q.questionId || q.QuestionId;
                if (saveAnswerTimeoutRef.current[questionId]) {
                    clearTimeout(saveAnswerTimeoutRef.current[questionId]);
                    delete saveAnswerTimeoutRef.current[questionId];
                }
                const currentAnswer = answers[questionId];
                if (currentAnswer !== undefined && currentAnswer !== null) {
                    await handleSubmitAnswer(questionId, currentAnswer);
                }
            }
        }

        // Chuyển sang item tiếp theo
        if (currentQuestionIndex < pagedItems.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = async () => {
        if (currentPagedItem) {
            const itemQuestions = currentPagedItem._itemType === "Group" ? currentPagedItem.questions : [currentPagedItem];
            for (const q of itemQuestions) {
                const questionId = q.questionId || q.QuestionId;
                if (saveAnswerTimeoutRef.current[questionId]) {
                    clearTimeout(saveAnswerTimeoutRef.current[questionId]);
                    delete saveAnswerTimeoutRef.current[questionId];
                }
                const currentAnswer = answers[questionId];
                if (currentAnswer !== undefined && currentAnswer !== null) {
                    await handleSubmitAnswer(questionId, currentAnswer);
                }
            }
        }

        // Chuyển sang item trước
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleGoToQuestion = async (fullIndex) => {
        // fullIndex is 0 to (totalQuestions - 1)
        const qNumber = fullIndex + 1;
        const targetPagedIdx = pagedItems.findIndex(item =>
            qNumber >= item._startNumber &&
            qNumber < item._startNumber + item._itemCount
        );

        if (targetPagedIdx === -1) return;

        if (targetPagedIdx !== currentQuestionIndex && currentPagedItem) {
            const itemQuestions = currentPagedItem._itemType === "Group" ? currentPagedItem.questions : [currentPagedItem];
            for (const q of itemQuestions) {
                const questionId = q.questionId || q.QuestionId;
                if (saveAnswerTimeoutRef.current[questionId]) {
                    clearTimeout(saveAnswerTimeoutRef.current[questionId]);
                    delete saveAnswerTimeoutRef.current[questionId];
                }
                const currentAnswer = answers[questionId];
                if (currentAnswer !== undefined && currentAnswer !== null) {
                    await handleSubmitAnswer(questionId, currentAnswer);
                }
            }
        }

        setCurrentQuestionIndex(targetPagedIdx);
    };

    if (loading) {
        return (
            <>
                <MainHeader />
                <div className="quiz-detail-container">
                    <div className="loading-message">Đang tải...</div>
                </div>
            </>
        );
    }

    if (error && !quizAttempt) {
        return (
            <>
                <MainHeader />
                <div className="quiz-detail-container">
                    <div className="error-message">{error || "Không thể tải thông tin quiz"}</div>
                    {quizId && (
                        <div style={{ marginTop: "20px", textAlign: "center" }}>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    fetchedKeyRef.current = null;
                                    fetchQuizAttempt();
                                }}
                            >
                                Thử lại
                            </Button>
                        </div>
                    )}
                </div>
                <NotificationModal
                    isOpen={notification.isOpen}
                    onClose={() => {
                        setNotification(prev => ({ ...prev, isOpen: false }));
                        if (notification.isTerminal) navigate(-1);
                    }}
                    type={notification.type}
                    message={notification.message}
                    autoClose={false}
                />
            </>
        );
    }

    if (!quizAttempt) {
        return (
            <>
                <MainHeader />
                <div className="quiz-detail-container">
                    <div className="loading-message">Đang tải thông tin quiz...</div>
                </div>
            </>
        );
    }

    // Tính thời gian làm bài (Cần cực kỳ cẩn thận với kiểu dữ liệu)
    const rawDuration =
        quiz?.Duration ||
        quiz?.duration ||
        quizAttempt?.Duration ||
        quizAttempt?.duration ||
        quizAttempt?.Quiz?.Duration ||
        quizAttempt?.Quiz?.duration ||
        quizAttempt?.quiz?.Duration ||
        quizAttempt?.quiz?.duration || 0;

    const quizDuration = Number(rawDuration);
    const timeLimit = (!isNaN(quizDuration) && quizDuration > 0) ? (quizDuration * 60) : null;

    /* 
    if (quiz || quizAttempt) {
        console.log("🕒 [Timer Debug] rawDuration:", rawDuration, "timeLimit:", timeLimit);
    }
    // Debug logs
    console.log("=== Timer Debug ===");
    console.log("quiz:", quiz);
    console.log("quizAttempt:", quizAttempt);
    console.log("rawDuration:", rawDuration);
    console.log("timeLimit:", timeLimit);
    console.log("quizDuration:", quizDuration, "minutes");
    console.log("timeLimit:", timeLimit, "seconds");
    console.log("quizAttempt:", quizAttempt);
    console.log("remainingTime state:", remainingTime);
    console.log("===================");
    */

    return (
        <>
            {!isFocusMode && <MainHeader />}
            {submitting && (
                <div className="submitting-overlay">
                    <div className="submitting-spinner"></div>
                    <div className="submitting-text">Đang nộp bài...</div>
                </div>
            )}
            <div className={`quiz-detail-page ${isFocusMode ? "focus-mode-active" : ""}`}>
                {!isFocusMode && (
                    <Container>
                        <Breadcrumb
                            items={[
                                { label: "Khóa học của tôi", path: "/my-courses" },
                                { label: course?.title || "Khóa học", path: `/course/${courseId}` },
                                { label: "Lesson", path: `/course/${courseId}/learn` },
                                { label: lesson?.title || "Bài học", path: `/course/${courseId}/lesson/${lessonId}` },
                                { label: "Bài tập", path: `/course/${courseId}/lesson/${lessonId}/module/${moduleId}/assignment` },
                                { label: quizAttempt?.quiz?.title || quiz?.title || "Quiz", isCurrent: true }
                            ]}
                        />
                    </Container>
                )}
                <Container className="py-4">
                    <Row>
                        <Col lg={9}>
                            <div className="quiz-content">
                                <div className="quiz-header">
                                    <h2 className="quiz-title">{quiz?.title || "Quiz"}</h2>
                                    {quiz?.description && (
                                        <p className="quiz-description">{quiz.description}</p>
                                    )}
                                </div>

                                {questions.length === 0 ? (
                                    <div className="no-question-message">
                                        <p>Đang tải câu hỏi...</p>
                                        <p className="text-muted">Vui lòng đợi trong giây lát.</p>
                                    </div>
                                ) : currentPagedItem ? (
                                    <QuestionCard
                                        question={currentPagedItem}
                                        allAnswers={answers}
                                        answer={currentPagedItem._itemType === "Question" ? answers[currentPagedItem.questionId || currentPagedItem.QuestionId] : null}
                                        onChange={(qId, val) => handleAnswerChange(qId, val)}
                                        questionNumber={currentPagedItem._startNumber}
                                        totalQuestions={questions.length}
                                        attemptId={attemptId}
                                    />
                                ) : (
                                    <div className="no-question-message">
                                        Không có câu hỏi nào
                                    </div>
                                )}

                                <div className="quiz-navigation-buttons d-flex justify-content-between mt-4">
                                    <Button
                                        variant="outline-secondary"
                                        onClick={handlePrevious}
                                        disabled={currentQuestionIndex === 0}
                                    >
                                        <span className="me-2">←</span> Trang trước
                                    </Button>
                                    {currentQuestionIndex < pagedItems.length - 1 ? (
                                        <Button
                                            className="btn-next-question px-4"
                                            onClick={handleNext}
                                        >
                                            Trang tiếp theo <span className="ms-2">→</span>
                                        </Button>
                                    ) : (
                                        <Button
                                            className="btn-complete-quiz px-4"
                                            variant="success"
                                            onClick={() => setShowSubmitModal(true)}
                                        >
                                            Hoàn thành & Nộp bài
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Col>
                        <Col lg={3}>
                            <div className="quiz-sidebar d-flex flex-column">
                                <QuizTimer
                                    timeLimit={timeLimit}
                                    remainingTime={remainingTime}
                                    onTimeUp={() => {
                                        // Chỉ gọi một lần
                                        if (!autoSubmitCalledRef.current && !submitting) {
                                            autoSubmitCalledRef.current = true;
                                            setNotification({
                                                isOpen: true,
                                                type: "warning",
                                                message: "Hết thời gian làm bài!"
                                            });
                                            handleSubmitQuiz();
                                        }
                                    }}
                                />

                                <QuizNavigation
                                    questions={questions}
                                    currentPagedItem={currentPagedItem}
                                    answers={answers}
                                    onGoToQuestion={handleGoToQuestion}
                                />

                                <div className="quiz-submit-section">
                                    <Button
                                        size="lg"
                                        className="submit-quiz-btn"
                                        onClick={() => setShowSubmitModal(true)}
                                        disabled={submitting}
                                    >
                                        {submitting ? "Đang nộp..." : "Nộp bài"}
                                    </Button>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            <ConfirmModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={handleSubmitQuiz}
                title="Xác nhận nộp bài"
                message="Bạn có chắc chắn muốn nộp bài? Sau khi nộp, bạn không thể chỉnh sửa câu trả lời."
                confirmText="Nộp bài"
                cancelText="Hủy"
                type="warning"
            />

            <ConfirmModal
                isOpen={showFocusPrompt}
                onClose={handleSkipFocusMode}
                onConfirm={handleEnterFocusMode}
                title="Chế độ tập trung"
                message="Bạn có muốn bật chế độ tập trung? Hệ thống sẽ chuyển sang toàn màn hình và ẩn các chỉ dẫn không cần thiết để bạn làm bài tốt nhất."
                confirmText="Đồng ý"
                cancelText="Để sau"
                type="info"
            />

            <NotificationModal
                isOpen={notification.isOpen}
                onClose={() => {
                    const url = pendingNavigationRef.current;
                    setNotification(prev => ({ ...prev, isOpen: false }));
                    
                    if (notification.isTerminal) {
                        navigate(-1);
                    } else if (url) {
                        pendingNavigationRef.current = null;
                        navigate(url, { replace: true });
                    }
                }}
                type={notification.type}
                message={notification.message}
                autoClose={notification.type === "success" || notification.autoClose}
                autoCloseDelay={1500}
            />
        </>
    );
}