namespace LearningEnglish.Application.Common.Constants;

/// <summary>
/// Centralized cache key constants to avoid magic strings across services.
/// </summary>
public static class CacheKeys
{
    // ── Course ────────────────────────────────────────────────────────────
    public const string SystemCourseList = "courses:system:list";
    public static string CourseDetail(int courseId) => $"courses:detail:{courseId}";

    // ── Lesson ────────────────────────────────────────────────────────────
    public static string LessonsByCourse(int courseId) => $"lessons:course:{courseId}";

    // ── Module ────────────────────────────────────────────────────────────
    public static string ModulesByLesson(int lessonId) => $"modules:lesson:{lessonId}";

    // ── Teacher Package ───────────────────────────────────────────────────
    public const string TeacherPackageList = "teacher-packages:list";

    // ── Statistics ────────────────────────────────────────────────────────
    public const string StatisticsOverview = "stats:overview";
    public const string StatisticsUser = "stats:user";
    public const string StatisticsRevenue = "stats:revenue";
    public static string StatisticsRevenueChart(int days) => $"stats:revenue:chart:{days}";

    // ── Landing Page & Assets ─────────────────────────────────────────────
    public const string LandingPageAssets = "landing:assets";

    // ── Chatbot ───────────────────────────────────────────────────────────
    public const string ChatBotPrefix = "chatbot:";
    public static string ChatBotConsult(string promptHash) => $"chatbot:consult:{promptHash}";

    // ── Assessments & Quizzes ───────────────────────────────────────────
    public const string AssessmentsPrefix = "assessments:";
    public const string QuizzesPrefix = "quizzes:";
    public static string AssessmentList(int moduleId) => $"assessments:list:{moduleId}";
    public static string AssessmentDetail(int assessmentId) => $"assessments:detail:{assessmentId}";
    public static string QuizDetail(int quizId) => $"quizzes:detail:{quizId}";

    // ── Flashcards ────────────────────────────────────────────────────────
    public const string FlashCardsPrefix = "flashcards:";
    public static string FlashCardDetail(int flashCardId) => $"flashcards:detail:{flashCardId}";
    public static string FlashCardsByModule(int moduleId) => $"flashcards:module:{moduleId}";

    // ── Lectures ──────────────────────────────────────────────────────────
    public const string LecturesPrefix = "lectures:";
    public static string LectureDetail(int lectureId) => $"lectures:detail:{lectureId}";
    public static string LecturesByModule(int moduleId) => $"lectures:module:{moduleId}";
    public static string LectureTreeByModule(int moduleId) => $"lectures:tree:{moduleId}";

    // ── Prefix helpers (used for RemoveByPrefix) ──────────────────────────
    public const string CoursesPrefix = "courses:";
    public const string LessonsPrefix = "lessons:";
    public const string ModulesPrefix = "modules:";
    public const string TeacherPackagesPrefix = "teacher-packages:";
    public const string StatisticsPrefix = "stats:";
    public const string LandingPrefix = "landing:";
}
