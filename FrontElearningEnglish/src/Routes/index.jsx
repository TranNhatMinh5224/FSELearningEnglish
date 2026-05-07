import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ROUTE_PATHS } from "./Paths";

// Import pages
import Loading from "../Pages/Loading/Loading";
const Login = lazy(() => import("../Pages/Login/Login"));
const Register = lazy(() => import("../Pages/Register/Register"));
const Home = lazy(() => import("../Pages/Home/Home"));
const MyCourses = lazy(() => import("../Pages/MyCourses/MyCourses"));
const Profile = lazy(() => import("../Pages/Profile/Profile"));
const EditProfile = lazy(() => import("../Pages/Profile/EditProfile"));
const ChangePassword = lazy(() => import("../Pages/Profile/ChangePassword"));
const OTP = lazy(() => import("../Pages/OtpRegister/OTP"));
const ForgotPassword = lazy(() => import("../Pages/ForgotPassword/ForgotPassword"));
const OtpResetPassword = lazy(() => import("../Pages/OtpResetPassword/OtpResetPassword"));
const ResetPassword = lazy(() => import("../Pages/ResetPassword/ResetPassword"));
const Payment = lazy(() => import("../Pages/Payment/Payment"));
const PaymentSuccess = lazy(() => import("../Pages/Payment/PaymentSuccess"));
const PaymentFailed = lazy(() => import("../Pages/Payment/PaymentFailed"));
const TopUp = lazy(() => import("../Pages/Payment/TopUp"));
const PaymentHistory = lazy(() => import("../Pages/PaymentHistory/PaymentHistory"));
const QuizHistory = lazy(() => import("../Pages/QuizHistory/QuizHistory"));
const VocabularyReview = lazy(() => import("../Pages/VocabularyReview/VocabularyReview"));
const FlashCardReviewSession = lazy(() => import("../Pages/FlashCardReviewSession/FlashCardReviewSession"));
const VocabularyNotebook = lazy(() => import("../Pages/VocabularyNotebook/VocabularyNotebook"));
const SearchResults = lazy(() => import("../Pages/SearchResults/SearchResults"));
const GoogleCallback = lazy(() => import("../Pages/AuthCallback/GoogleCallback"));
const FacebookCallback = lazy(() => import("../Pages/AuthCallback/FacebookCallback"));
const CourseDetail = lazy(() => import("../Pages/CourseDetail/CourseDetail"));
const ListLesson = lazy(() => import("../Pages/ListLesson/ListLesson"));
const ListModule = lazy(() => import("../Pages/ListModule/ListModule"));
const LectureDetail = lazy(() => import("../Pages/LectureDetail/LectureDetail"));
const FlashCardDetail = lazy(() => import("../Pages/FlashCardDetail/FlashCardDetail"));
const AssignmentDetail = lazy(() => import("../Pages/AssignmentDetail/AssignmentDetail"));
const AssessmentDetail = lazy(() => import("../Pages/AssessmentDetail/AssessmentDetail"));
const QuizDetail = lazy(() => import("../Pages/QuizDetail/QuizDetail"));
const QuizResults = lazy(() => import("../Pages/QuizResults/QuizResults"));
const EssayDetail = lazy(() => import("../Pages/EssayDetail/EssayDetail"));
const PronunciationDetail = lazy(() => import("../Pages/PronunciationDetail/PronunciationDetail"));
const CourseManagement = lazy(() => import("../Pages/Teacher/TeacherCourseManagement/CourseManagement"));
const TeacherCourseDetail = lazy(() => import("../Pages/Teacher/TeacherCourseDetail/TeacherCourseDetail"));
const TeacherLessonDetail = lazy(() => import("../Pages/Teacher/TeacherLessonDetail/TeacherLessonDetail"));
const TeacherStudentManagement = lazy(() => import("../Pages/Teacher/TeacherStudentManagement/TeacherStudentManagement"));
const TeacherModuleLectureDetail = lazy(() => import("../Pages/Teacher/TeacherModuleLectureDetail/TeacherModuleLectureDetail"));
const EditLecture = lazy(() => import("../Pages/Teacher/TeacherModuleLectureDetail/EditLecture"));
const TeacherModuleFlashCardDetail = lazy(() => import("../Pages/Teacher/TeacherModuleFlashCardDetail/TeacherModuleFlashCardDetail"));
const TeacherQuizEssayManagement = lazy(() => import("../Pages/Teacher/TeacherQuizEssayManagement/TeacherQuizEssayManagement"));
const TeacherQuizSectionManagement = lazy(() => import("../Pages/Teacher/TeacherQuizSectionManagement/TeacherQuizSectionManagement"));
const TeacherQuestionManagement = lazy(() => import("../Pages/Teacher/TeacherQuestionManagement/TeacherQuestionManagement"));
const TeacherSubmissionManagement = lazy(() => import("../Pages/Teacher/TeacherSubmissionManagement/TeacherSubmissionManagement"));
const InfoPage = lazy(() => import("../Pages/InfoPage/InfoPage"));

// Admin Imports
const AdminLayout = lazy(() => import("../Layouts/AdminLayout/AdminLayout"));
const AdminDashboard = lazy(() => import("../Pages/Admin/Dashboard/AdminDashboard"));
const AdminCourseList = lazy(() => import("../Pages/Admin/CourseManagement/AdminCourseList"));
const AdminCourseDetail = lazy(() => import("../Pages/Admin/CourseManagement/AdminCourseDetail"));
const AdminStudentManagement = lazy(() => import("../Pages/Admin/CourseManagement/AdminStudentManagement"));
const AdminLessonDetail = lazy(() => import("../Pages/Admin/AdminLessonDetail/AdminLessonDetail"));
const AdminModuleLectureDetail = lazy(() => import("../Pages/Admin/AdminModuleLectureDetail/AdminModuleLectureDetail"));
const AdminModuleFlashCardDetail = lazy(() => import("../Pages/Admin/AdminModuleFlashCardDetail/AdminModuleFlashCardDetail"));
const AdminUserList = lazy(() => import("../Pages/Admin/UserManagement/AdminUserList"));
const AdminQuizEssayManagement = lazy(() => import("../Pages/Admin/AdminQuizEssayManagement/AdminQuizEssayManagement"));
const AdminQuizSectionManagement = lazy(() => import("../Pages/Admin/AdminQuizSectionManagement/AdminQuizSectionManagement"));
const AdminQuestionManagement = lazy(() => import("../Pages/Admin/AdminQuestionManagement/AdminQuestionManagement"));
const AdminSubmissionManagement = lazy(() => import("../Pages/Admin/AdminSubmissionManagement/AdminSubmissionManagement"));
const PackageManagement = lazy(() => import("../Pages/Admin/PackageManagement/PackageManagement"));
const AdminManagement = lazy(() => import("../Pages/Admin/AdminManagement/AdminManagement"));
const AssetManagement = lazy(() => import("../Pages/Admin/AssetManagement/AssetManagement"));
const PaymentMonitoring = lazy(() => import("../Pages/Admin/PaymentMonitoring/PaymentMonitoring"));
const PolicyManagement = lazy(() => import("../Pages/Admin/PolicyManagement/PolicyManagement"));

/**
 * Application Routes
 * Tất cả các routes được định nghĩa tại đây
 */
export default function AppRoutes() {
  const location = useLocation();

  return (
    <Suspense fallback={<Loading />}>
      <Routes key={location.pathname}>
        {/* Public routes */}
        <Route path={ROUTE_PATHS.ROOT} element={<Loading />} />
        <Route path={ROUTE_PATHS.LOGIN} element={<Login />} />
        <Route path={ROUTE_PATHS.REGISTER} element={<Register />} />
        <Route path={ROUTE_PATHS.OTP} element={<OTP />} />
        <Route path={ROUTE_PATHS.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTE_PATHS.RESET_OTP} element={<OtpResetPassword />} />
        <Route path={ROUTE_PATHS.RESET_PASSWORD} element={<ResetPassword />} />

        {/* Auth callback routes */}
        <Route path={ROUTE_PATHS.GOOGLE_CALLBACK} element={<GoogleCallback />} />
        <Route path={ROUTE_PATHS.FACEBOOK_CALLBACK} element={<FacebookCallback />} />

        {/* Protected routes */}
        <Route path={ROUTE_PATHS.HOME} element={<Home />} />
        <Route path={ROUTE_PATHS.MY_COURSES} element={<MyCourses />} />
        <Route path={ROUTE_PATHS.PROFILE} element={<Profile />} />
        <Route path={ROUTE_PATHS.PROFILE_EDIT} element={<EditProfile />} />
        <Route path={ROUTE_PATHS.PROFILE_CHANGE_PASSWORD} element={<ChangePassword />} />
        <Route path={ROUTE_PATHS.TOPUP} element={<TopUp />} />
        <Route path={ROUTE_PATHS.PAYMENT} element={<Payment />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />
        <Route path={ROUTE_PATHS.PAYMENT_HISTORY} element={<PaymentHistory />} />
        <Route path={ROUTE_PATHS.QUIZ_HISTORY} element={<QuizHistory />} />
        <Route path={ROUTE_PATHS.VOCABULARY_REVIEW} element={<VocabularyReview />} />
        <Route path="/vocabulary-review/session" element={<FlashCardReviewSession />} />
        <Route path={ROUTE_PATHS.VOCABULARY_NOTEBOOK} element={<VocabularyNotebook />} />
        <Route path={ROUTE_PATHS.SEARCH} element={<SearchResults />} />

        {/* Course routes - specific routes first */}
        <Route path="/course/:courseId/lesson/:lessonId/module/:moduleId/lecture/:lectureId" element={<LectureDetail />} />
        <Route path="/course/:courseId/lesson/:lessonId/module/:moduleId/flashcards" element={<FlashCardDetail />} />
        <Route path="/course/:courseId/lesson/:lessonId/module/:moduleId/pronunciation" element={<PronunciationDetail />} />
        <Route path="/course/:courseId/lesson/:lessonId/module/:moduleId/assignment/:assessmentId" element={<AssessmentDetail />} />
        <Route path="/course/:courseId/lesson/:lessonId/module/:moduleId/assignment" element={<AssignmentDetail />} />
        <Route path="/course/:courseId/lesson/:lessonId/module/:moduleId/quiz/:quizId/attempt/:attemptId/results" element={<QuizResults />} />
        <Route path="/course/:courseId/lesson/:lessonId/module/:moduleId/quiz/:quizId/attempt/:attemptId" element={<QuizDetail />} />
        <Route path="/course/:courseId/lesson/:lessonId/module/:moduleId/essay/:essayId" element={<EssayDetail />} />
        <Route path="/course/:courseId/lesson/:lessonId/module/:moduleId" element={<LectureDetail />} />

        {/* General course routes */}
        <Route path="/course/:courseId" element={<CourseDetail />} />
        <Route path="/course/:courseId/learn" element={<ListLesson />} />
        <Route path="/course/:courseId/lesson/:lessonId" element={<ListModule />} />

        {/* Teacher routes */}
        <Route path="/teacher" element={<CourseManagement />} />
        <Route path="/teacher/account-management" element={<CourseManagement />} />
        <Route path="/teacher/submission-management" element={<TeacherSubmissionManagement />} />
        <Route path="/teacher/course-management" element={<CourseManagement />} />
        <Route path="/teacher/course/:courseId/students" element={<TeacherStudentManagement />} />
        <Route path="/teacher/course/:courseId/lesson/:lessonId" element={<TeacherLessonDetail />} />
        <Route path="/teacher/course/:courseId/lesson/:lessonId/module/:moduleId/create-lecture" element={<TeacherModuleLectureDetail />} />
        <Route path="/teacher/course/:courseId/lesson/:lessonId/module/:moduleId/lecture/:lectureId/edit" element={<EditLecture />} />
        <Route path="/teacher/course/:courseId/lesson/:lessonId/module/:moduleId/create-flashcard" element={<TeacherModuleFlashCardDetail />} />
        <Route path="/teacher/course/:courseId/lesson/:lessonId/module/:moduleId/edit-flashcard/:flashcardId" element={<TeacherModuleFlashCardDetail />} />
        <Route path="/teacher/course/:courseId/lesson/:lessonId/module/:moduleId/assessment/:assessmentId/manage" element={<TeacherQuizEssayManagement />} />
        <Route path="/teacher/course/:courseId/lesson/:lessonId/module/:moduleId/assessment/:assessmentId/quiz/:quizId/sections" element={<TeacherQuizSectionManagement />} />
        <Route path="/teacher/course/:courseId/lesson/:lessonId/module/:moduleId/assessment/:assessmentId/quiz/:quizId/section/:sectionId/questions" element={<TeacherQuestionManagement />} />
        <Route path="/teacher/course/:courseId/lesson/:lessonId/module/:moduleId/assessment/:assessmentId/quiz/:quizId/group/:groupId/questions" element={<TeacherQuestionManagement />} />
        <Route path="/teacher/course/:courseId" element={<TeacherCourseDetail />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="courses" element={<AdminCourseList />} />
          <Route path="courses/:courseId" element={<AdminCourseDetail />} />
          <Route path="courses/:courseId/students" element={<AdminStudentManagement />} />
          <Route path="courses/:courseId/lesson/:lessonId" element={<AdminLessonDetail />} />
          <Route path="courses/:courseId/lesson/:lessonId/module/:moduleId/lecture/create" element={<AdminModuleLectureDetail />} />
          <Route path="courses/:courseId/lesson/:lessonId/module/:moduleId/flashcard/create" element={<AdminModuleFlashCardDetail />} />
          <Route path="courses/:courseId/lesson/:lessonId/module/:moduleId/assessment/:assessmentId" element={<AdminQuizEssayManagement />} />
          <Route path="courses/:courseId/lesson/:lessonId/module/:moduleId/assessment/:assessmentId/quiz/:quizId/sections" element={<AdminQuizSectionManagement />} />
          <Route path="courses/:courseId/lesson/:lessonId/module/:moduleId/assessment/:assessmentId/quiz/:quizId/section/:sectionId/questions" element={<AdminQuestionManagement />} />
          <Route path="users" element={<AdminUserList />} />
          <Route path="packages" element={<PackageManagement />} />
          <Route path="admin-management" element={<AdminManagement />} />
          <Route path="asset-management" element={<AssetManagement />} />
          <Route path="finance" element={<AdminDashboard />} />
          <Route path="submission-management" element={<AdminSubmissionManagement />} />
          <Route path="payment-monitoring" element={<PaymentMonitoring />} />
          <Route path="policy" element={<PolicyManagement />} />
        </Route>

        {/* Info, Guide, Policy routes */}
        <Route path={ROUTE_PATHS.ABOUT} element={<InfoPage />} />
        <Route path={ROUTE_PATHS.FEATURES} element={<InfoPage />} />
        <Route path={ROUTE_PATHS.GUIDE_BUY_COURSE} element={<InfoPage />} />
        <Route path={ROUTE_PATHS.GUIDE_UPGRADE_TEACHER} element={<InfoPage />} />
        <Route path={ROUTE_PATHS.GUIDE_USER_MANUAL} element={<InfoPage />} />
        <Route path={ROUTE_PATHS.POLICY_PRIVACY} element={<InfoPage />} />
        <Route path={ROUTE_PATHS.POLICY_REFUND} element={<InfoPage />} />
        <Route path={ROUTE_PATHS.POLICY_PAYMENT} element={<InfoPage />} />
        <Route path={ROUTE_PATHS.POLICY_TERMS} element={<InfoPage />} />
      </Routes>
    </Suspense>
  );
}

