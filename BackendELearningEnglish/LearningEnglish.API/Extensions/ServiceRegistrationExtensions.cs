using System.Text; // Thư viện dùng để xử lý văn bản, mã hóa (ví dụ: UTF8)
using FluentValidation; // Thư viện dùng để kiểm tra tính hợp lệ của dữ liệu đầu vào (Validation)
using FluentValidation.AspNetCore; // Tích hợp FluentValidation vào luồng xử lý của ASP.NET Core
using LearningEnglish.API.Authorization; // Namespace chứa các xử lý phân quyền (Authorization)
using LearningEnglish.Application.Configurations; // Namespace chứa các lớp cấu hình của Application (AzureSpeechOptions, v.v.)
using LearningEnglish.Application.Interface; // Namespace chứa các interface dùng chung
using LearningEnglish.Application.Interface.AdminManagement; // Interface cho quản lý admin
using LearningEnglish.Application.Interface.Auth; // Interface cho xác thực (Authentication)
using LearningEnglish.Application.Interface.Infrastructure; // Interface cho tầng hạ tầng (Infrastructure)
using LearningEnglish.Application.Interface.Infrastructure.MediaService; // Interface cho quản lý media
using LearningEnglish.Application.Interface.Services; // Interface cho các service nghiệp vụ chung
using LearningEnglish.Application.Interface.Services.AdminManagement;
using LearningEnglish.Application.Interface.Services.Essay; // Interface cho service bài luận (Essay)
using LearningEnglish.Application.Interface.Services.FlashCard; // Interface cho service flashcard
using LearningEnglish.Application.Interface.Services.Lecture; // Interface cho service bài giảng (Lecture)
using LearningEnglish.Application.Interface.Services.Lesson; // Interface cho service bài học (Lesson)
using LearningEnglish.Application.Interface.Services.Module; // Interface cho service chương học (Module)
using LearningEnglish.Application.Interface.Services.TeacherPackage; // Interface cho gói giảng viên
using LearningEnglish.Application.Interface.Services.AI;
using LearningEnglish.Application.Interface.Strategies; // Interface cho các chiến lược (Strategy pattern)
using LearningEnglish.Application.Mappings; // Namespace chứa cấu hình ánh xạ AutoMapper
using LearningEnglish.Infrastructure.Services.AI;
using Microsoft.SemanticKernel.Connectors.Google;
using LearningEnglish.Application.Interface.Repositories;
using LearningEnglish.Application.Interface.IKnowledgeSyncService;
using LearningEnglish.Application.Interface.Services.Markdown;
using LearningEnglish.Application.Service.KnowledgeSyncService;
using LearningEnglish.Application.Service.MarkdownService;
using LearningEnglish.Application.Service.AdminManagement;
using LearningEnglish.Application.Service; // Namespace chứa các lớp xử lý nghiệp vụ chính
using LearningEnglish.Application.Service.Auth; // Dịch vụ xử lý xác thực
using LearningEnglish.Application.Service.BackgroundJobs; // Các tiến trình chạy ngầm
using LearningEnglish.Application.Service.EnumService; // Dịch vụ xử lý liên quan đến Enum
using LearningEnglish.Application.Service.EssayGrading; // Dịch vụ chấm điểm bài luận
using LearningEnglish.Application.Service.EssayService; // Dịch vụ bài luận
using LearningEnglish.Application.Service.FlashCardService; // Dịch vụ flashcard
using LearningEnglish.Application.Service.LectureService; // Dịch vụ bài giảng
using LearningEnglish.Application.Service.PaymentService; // Dịch vụ thanh toán
using LearningEnglish.Application.Strategies.Payment; // Chiến lược xử lý thanh toán
using LearningEnglish.Application.Strategies.Scoring; // Chiến lược chấm điểm
using LearningEnglish.Domain.Entities; // Namespace chứa các thực thể (Entity) database
using LearningEnglish.Infrastructure.MinioFileStorage; // Namespace chứa xử lý lưu trữ file MinIO
using LearningEnglish.Infrastructure.Repositories; // Namespace chứa các Repository truy cập dữ liệu
using LearningEnglish.Infrastructure.Services; // Namespace chứa các dịch vụ của tầng hạ tầng
using LearningEnglish.Infrastructure.Services.ExternalProviders.AzureSpeech; // Dịch vụ Azure Speech (AI giọng nói)
using LearningEnglish.Infrastructure.Services.ExternalProviders.Facebook; // Dịch vụ login bằng Facebook
using LearningEnglish.Infrastructure.Services.ExternalProviders.Google; // Dịch vụ login bằng Google
using LearningEnglish.Infrastructure.Services.ExternalProviders.PayOS; // Dịch vụ thanh toán PayOS
using LearningEnglish.Infrastructure.Services.MediaService; // Dịch vụ xử lý media (video, ảnh)
using LearningEnglish.Infrastructure.Data; // Namespace chứa AppDbContext
using Microsoft.AspNetCore.Authentication.JwtBearer; // Thư viện xử lý xác thực qua JWT Token
using Microsoft.AspNetCore.Authorization; // Thư viện xử lý phân quyền
using Microsoft.EntityFrameworkCore; // ORM kết nối database
using Microsoft.Extensions.Options; // Thư viện hỗ trợ quản lý cấu hình (IOptions)
using Microsoft.IdentityModel.Tokens; // Thư viện xử lý Token bảo mật
using Microsoft.OpenApi.Models; // Thư viện hỗ trợ cấu hình Swagger (OpenAPI)
using Minio; // Thư viện kết nối MinIO
using Pgvector; // Thư viện hỗ trợ vector cho Postgres (cho AI/RAG)
using Microsoft.Extensions.Logging; // Thư viện hỗ trợ ghi Log
using Microsoft.SemanticKernel; // Thư viện hỗ trợ AI Gemini
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Embeddings; 


namespace LearningEnglish.API.Extensions; // Namespace định nghĩa các extension method cho API

public static class ServiceRegistrationExtensions // Lớp static chứa các extension method đăng ký service
{
    // Phương thức đăng ký các thành phần cốt lõi của API (Swagger, CORS, Validation, Mapper, MediatR)
    public static IServiceCollection AddApiCore(this IServiceCollection services, IConfiguration configuration, string frontendUrl)
    {
        services.AddControllers(); // Đăng ký các Controller để xử lý request API
        services.AddEndpointsApiExplorer(); // Hỗ trợ hiển thị API lên Swagger

        services.AddSwaggerGen(c => // Cấu hình Swagger UI
        {
            // Định nghĩa thông tin cơ bản cho tài liệu API
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "FullStack English Learning API", Version = "v1" });

            // Cấu hình để Swagger hỗ trợ nhập JWT Token
            var bearerScheme = new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            };

            // Định nghĩa kiểu bảo mật là Bearer Token
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization", // Tên header chứa token
                Type = SecuritySchemeType.ApiKey, // Loại Key API
                Scheme = "Bearer", // Lược đồ xác thực
                BearerFormat = "JWT", // Định dạng token là JWT
                In = ParameterLocation.Header, // Token nằm trong Header
                Description = "Enter Bearer token" // Mô tả hướng dẫn nhập
            });

            // Áp dụng yêu cầu bảo mật này cho toàn bộ API
            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                { bearerScheme, new List<string>() }
            });
        });

        services.AddCors(options => // Cấu hình chính sách chia sẻ tài nguyên (CORS)
        {
            options.AddPolicy("AllowFrontend", p => // Chính sách cho Frontend chính của dự án
            {
                // Lấy cấu hình CORS từ section "Cors" (Strongly Typed)
                var corsOptions = configuration.GetSection("Cors").Get<CorsOptions>();
                var allowedOrigins = corsOptions?.AllowedOrigins ?? new[] { frontendUrl };

                p.WithOrigins(allowedOrigins) // Chỉ cho phép các origin này
                 .AllowAnyHeader() // Cho phép mọi header
                 .AllowAnyMethod() // Cho phép mọi phương thức (GET, POST, PUT, DELETE)
                 .AllowCredentials() // Cho phép gửi cookie/token định danh
                 .SetIsOriginAllowedToAllowWildcardSubdomains(); // Cho phép subdomain
            });

            options.AddPolicy("AllowAll", p => // Chính sách cho phép tất cả (Sử dụng cẩn thận)
                p.AllowAnyOrigin() // Cho phép bất kỳ origin nào
                 .AllowAnyHeader() // Cho phép mọi header
                 .AllowAnyMethod()); // Cho phép mọi phương thức
        });

        // Đăng ký tự động kiểm tra tính hợp lệ của dữ liệu dựa trên FluentValidation
        services.AddFluentValidationAutoValidation()
            .AddFluentValidationClientsideAdapters();
        // Quét và đăng ký tất cả các Validator có trong Assembly chứa MappingProfile
        services.AddValidatorsFromAssembly(typeof(MappingProfile).Assembly);

        services.AddAutoMapper(cfg => // Cấu hình AutoMapper để ánh xạ giữa các đối tượng (ví dụ Entity sang DTO)
        {
            cfg.AddProfile<MappingProfile>(); // Đăng ký Profile ánh xạ
        });
        // Đăng ký MediatR để xử lý các Command và Query (Pattern CQRS)
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(MappingProfile).Assembly));

        return services; // Trả về services để có thể gọi tiếp các method khác (Chaining)
    }

    // Phương thức đăng ký Database và các cấu hình bảo mật xác thực
    public static IServiceCollection AddDataAndSecurity(
        this IServiceCollection services,
        string connectionString, // Chuỗi kết nối database
        string jwtKey, // Khóa bí mật JWT
        string jwtIssuer, // Người phát hành token
        string jwtAudience) // Người nhận token
    {
        services.AddDbContext<AppDbContext>(opt => // Đăng ký Entity Framework Core với Postgres
            opt.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.EnableRetryOnFailure(0); // Cấu hình thử lại khi kết nối lỗi
                npgsql.UseVector(); // Hỗ trợ lưu trữ vector cho tìm kiếm AI (pgvector)
            }));

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme) // Cấu hình hệ thống xác thực mặc định là JWT
            .AddJwtBearer(options =>
            {
                options.Events = new JwtBearerEvents // Xử lý các sự kiện trong quá trình xác thực
                {
                    OnMessageReceived = context =>
                    {
                        // Kiểm tra token từ header tiêu chuẩn "Authorization: Bearer <token>"
                        // Nếu không có, thử lấy từ header dự phòng "X-Access-Token" (hữu ích khi qua proxy)
                        if (string.IsNullOrEmpty(context.Token) &&
                            context.Request.Headers.TryGetValue("X-Access-Token", out var tokenFromHeader))
                        {
                            var token = tokenFromHeader.ToString();
                            if (!string.IsNullOrWhiteSpace(token))
                            {
                                context.Token = token;
                            }
                        }

                        return Task.CompletedTask;
                    },
                    OnAuthenticationFailed = context => // Xử lý khi xác thực thất bại
                    {
                            // Ghi log lỗi xác thực thất bại nhưng không ghi kèm token để đảm bảo bảo mật
                            var logger = context.HttpContext.RequestServices
                            .GetRequiredService<ILoggerFactory>()
                            .CreateLogger("JwtBearer");

                        logger.LogWarning(context.Exception, "JWT authentication failed for {Path}", context.HttpContext.Request.Path);
                        return Task.CompletedTask;
                    }
                };

                options.TokenValidationParameters = new TokenValidationParameters // Các tiêu chí kiểm tra token
                {
                    ValidateIssuer = true, // Kiểm tra người phát hành
                    ValidateAudience = true, // Kiểm tra người nhận
                    ValidateLifetime = true, // Kiểm tra thời hạn hết hạn
                    ValidateIssuerSigningKey = true, // Kiểm tra chữ ký bảo mật
                    ValidIssuer = jwtIssuer, // Giá trị issuer hợp lệ
                    ValidAudience = jwtAudience, // Giá trị audience hợp lệ
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)), // Khóa giải mã
                    ClockSkew = TimeSpan.FromMinutes(2) // Độ lệch thời gian cho phép giữa client và server
                };
            });

        services.AddAuthorization(); // Kích hoạt chức năng phân quyền
        services.AddHttpContextAccessor(); // Cho phép truy cập thông tin HttpContext trong các service
        services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>(); // Cung cấp chính sách phân quyền động
        services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>(); // Xử lý logic kiểm tra quyền (Permission)
        services.AddScoped<IAuthorizationHandler, TeacherRoleAuthorizationHandler>(); // Xử lý logic kiểm tra vai trò Giáo viên (Teacher)

        return services;
    }

    // Phương thức tập trung đăng ký tất cả các Repository
    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        RegisterCoreRepositories(services); // Đăng ký repository cốt lõi
        RegisterLearningRepositories(services); // Đăng ký repository học tập
        RegisterAssessmentRepositories(services); // Đăng ký repository đánh giá/chấm điểm
        RegisterAuthAndAccessRepositories(services); // Đăng ký repository liên quan đến xác thực/vai trò
        RegisterQuizRepositories(services); // Đăng ký repository bài tập (Quiz) và thanh toán
        RegisterMediaRepositories(services); // Đăng ký repository tài sản (Asset)

        return services;
    }

    // Phương thức đăng ký các dịch vụ thuộc tầng hạ tầng (Caching, Repositories, External APIs)
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<CacheOptions>(configuration.GetSection("Cache")); // Cấu hình tùy chọn cho Caching
        services.AddMemoryCache(); // Đăng ký dịch vụ bộ nhớ đệm (In-memory cache)
        services.AddSingleton<ICacheService, MemoryCacheService>(); // Dịch vụ quản lý cache dùng chung
        
        services.AddRepositories(); // Gọi đăng ký tất cả Repositories
        services.AddExternalIntegrations(configuration); // Đăng ký tích hợp các dịch vụ bên ngoài (AI, Storage, Pay)

        return services;
    }

    // Nhóm repository cốt lõi của hệ thống
    private static void RegisterCoreRepositories(IServiceCollection services)
    {
        services.AddScoped<ICourseRepository, CourseRepository>(); // Quản lý khóa học
        services.AddScoped<IUserRepository, UserRepository>(); // Quản lý người dùng
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IUserStatisticsRepository, UserStatisticsRepository>(); // Quản lý thống kê người dùng
        services.AddScoped<IUnitOfWork, UnitOfWork>(); // Quản lý Unit of Work để đảm bảo tính toàn vẹn dữ liệu
    }

    // Nhóm repository liên quan đến nội dung và tiến trình học tập
    private static void RegisterLearningRepositories(IServiceCollection services)
    {
        services.AddScoped<ILessonRepository, LessonRepository>(); // Quản lý bài học
        services.AddScoped<IModuleRepository, ModuleRepository>(); // Quản lý chương học (Module)
        services.AddScoped<ILectureRepository, LectureRepository>(); // Quản lý bài giảng theo kiểu lecture
        services.AddScoped<IFlashCardRepository, FlashCardRepository>(); // Quản lý flashcard
        services.AddScoped<IFlashCardReviewRepository, FlashCardReviewRepository>(); // Quản lý ôn tập flashcard
        services.AddScoped<ICourseProgressRepository, CourseProgressRepository>(); // Theo dõi tiến độ khóa học
        services.AddScoped<ILessonCompletionRepository, LessonCompletionRepository>(); // Trạng thái hoàn thành bài học
        services.AddScoped<IModuleCompletionRepository, ModuleCompletionRepository>(); // Trạng thái hoàn thành module
    }

    // Nhóm repository liên quan đến đánh giá và viết bài luận
    private static void RegisterAssessmentRepositories(IServiceCollection services)
    {
        services.AddScoped<IAssessmentRepository, AssessmentRepository>(); // Quản lý bài đánh giá chung
        services.AddScoped<IEssayRepository, EssayRepository>(); // Quản lý đề bài luận
        services.AddScoped<IEssaySubmissionRepository, EssaySubmissionRepository>(); // Quản lý bài nộp luận của học viên
        services.AddScoped<IPronunciationProgressRepository, PronunciationProgressRepository>(); // Theo dõi tiến độ phát âm
    }

    // Nhóm repository quản lý bảo mật, xác thực và quyền hạn
    private static void RegisterAuthAndAccessRepositories(IServiceCollection services)
    {
        services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>(); // Token đặt lại mật khẩu
        services.AddScoped<IEmailVerificationTokenRepository, EmailVerificationTokenRepository>(); // Token xác minh email
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>(); // Quản lý Refresh Token
        services.AddScoped<IExternalLoginRepository, ExternalLoginRepository>(); // Thông tin đăng nhập mạng xã hội (Google, FB)
        services.AddScoped<IPermissionRepository, PermissionRepository>(); // Quản lý các quyền lẻ
        services.AddScoped<IRoleRepository, RoleRepository>(); // Quản lý vai trò (Role)
        services.AddScoped<IRolePermissionRepository, RolePermissionRepository>(); // Liên kết giữa Vai trò và Quyền
    }

    // Nhóm repository liên quan đến Bài tập (Quiz) và các giao dịch Thanh toán
    private static void RegisterQuizRepositories(IServiceCollection services)
    {
        services.AddScoped<IPaymentRepository, PaymentRepository>(); // Quản lý lịch sử thanh toán
        services.AddScoped<IPaymentStatisticsRepository, PaymentStatisticsRepository>(); // Thống kê doanh thu/thanh toán
        services.AddScoped<IPaymentWebhookQueueRepository, PaymentWebhookQueueRepository>(); // Hàng chờ xử lý Webhook thanh toán
        services.AddScoped<ITeacherPackageRepository, TeacherPackageRepository>(); // Quản lý các gói dịch vụ cho giáo viên
        services.AddScoped<ITeacherSubscriptionRepository, TeacherSubscriptionRepository>(); // Quản lý đăng ký gói của giáo viên
        services.AddScoped<IQuizSectionRepository, QuizSectionRepository>(); // Quản lý các phần trong bài tập
        services.AddScoped<IQuizGroupRepository, QuizGroupRepository>(); // Quản lý nhóm câu hỏi
        services.AddScoped<IQuizRepository, QuizRepository>(); // Quản lý bài tập (Quiz)
        services.AddScoped<IQuestionRepository, QuestionRepository>(); // Quản lý câu hỏi chi tiết
        services.AddScoped<IQuizAttemptRepository, QuizAttemptRepository>(); // Lượt làm bài tập của học viên
    }

    // Nhóm repository cho quản lý tài nguyên/hình ảnh
    private static void RegisterMediaRepositories(IServiceCollection services)
    {
        services.AddScoped<IAssetFrontendRepository, AssetFrontendRepository>(); // Quản lý tài sản hiển thị trên Frontend
        
        // --- AI Wiki Repositories ---
        services.AddScoped<ICourseKnowledgeRepository, CourseKnowledgeRepository>();
        services.AddScoped<ITeacherPackageKnowledgeRepository, TeacherPackageKnowledgeRepository>();
        services.AddScoped<IPolicyKnowledgeRepository, PolicyKnowledgeRepository>();
        services.AddScoped<IPolicyRepository, PolicyRepository>();
    }

    // Phương thức tập trung đăng ký tất cả các Service thuộc tầng Application (Logic nghiệp vụ)
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration? configuration = null)
    {
        RegisterCoreApplicationServices(services); // Dịch vụ nghiệp vụ chính
        RegisterAuthApplicationServices(services); // Dịch vụ xác thực và người dùng
        RegisterPaymentApplicationServices(services); // Dịch vụ xử lý thanh toán
        RegisterQuizApplicationServices(services); // Dịch vụ xử lý bài tập (Quiz)
        RegisterMediaApplicationServices(services); // Dịch vụ truyền thông và email
        RegisterAiApplicationServices(services); // Dịch vụ tích hợp AI và thông báo

        return services;
    }

    // Nhóm dịch vụ nghiệp vụ chính cho Admin, Giáo viên và Người dùng
    private static void RegisterCoreApplicationServices(IServiceCollection services)
    {
        services.AddScoped<ISortingService<Course>, CourseSortingService>(); // Dịch vụ sắp xếp khóa học
        services.AddScoped<ISortingService<User>, UserSortingService>(); // Dịch vụ sắp xếp người dùng

        services.AddScoped<IAdminCourseService, AdminCourseService>(); // Quản lý khóa học cho Admin
        services.AddScoped<IAdminStatisticsService, AdminStatisticsService>(); // Dịch vụ thống kê cho Admin
        services.AddScoped<ILessonService, LessonService>(); // Dịch vụ bài học chung
        services.AddScoped<IAdminLessonService, AdminLessonService>(); // Quản lý bài học cho Admin
        services.AddScoped<ITeacherLessonService, TeacherLessonService>(); // Quản lý bài học cho Giáo viên
        services.AddScoped<IAdminModuleService, AdminModuleService>(); // Quản lý module cho Admin
        services.AddScoped<ITeacherModuleService, TeacherModuleService>(); // Quản lý module cho Giáo viên
        services.AddScoped<IUserModuleService, UserModuleService>(); // Dịch vụ module cho Người dùng
        services.AddScoped<IModuleProgressService, ModuleProgressService>(); // Theo dõi tiến độ module
        services.AddScoped<IUserLectureService, UserLectureService>(); // Học bài giảng (cho Người dùng)
        services.AddScoped<IAdminLectureService, AdminLectureService>(); // Quản lý bài giảng cho Admin
        services.AddScoped<ITeacherLectureCommandService, TeacherLectureCommandService>(); // Thêm/Sửa/Xóa bài giảng cho GV
        services.AddScoped<ITeacherLectureQueryService, TeacherLectureQueryService>(); // Xem thông tin bài giảng cho GV
        services.AddScoped<IUserFlashCardService, UserFlashCardService>(); // Học Flashcard (cho Người dùng)
        services.AddScoped<IAdminFlashCardService, AdminFlashCardService>(); // Quản lý Flashcard cho Admin
        services.AddScoped<ITeacherFlashCardCommandService, TeacherFlashCardCommandService>(); // Quản lý lệnh Flashcard cho GV
        services.AddScoped<ITeacherFlashCardQueryService, TeacherFlashCardQueryService>(); // Truy vấn Flashcard cho GV
        services.AddScoped<IFlashCardReviewService, FlashCardReviewService>(); // Dịch vụ ôn tập Flashcard
        services.AddScoped<IStreakRepository, StreakRepository>(); // Lưu trữ thông tin chuỗi ngày học (Streak)
        services.AddScoped<IStreakService, StreakService>(); // Logic tính toán chuỗi ngày học

        services.AddScoped<IUserAssessmentService, UserAssessmentService>(); // Làm bài đánh giá (Người dùng)
        services.AddScoped<IAdminAssessmentService, AdminAssessmentService>(); // Quản lý bài đánh giá cho Admin
        services.AddScoped<ITeacherAssessmentService, TeacherAssessmentService>(); // Quản lý bài đánh giá cho GV

        services.AddScoped<IUserEssayService, UserEssayService>(); // Xem bài luận (Người dùng)
        services.AddScoped<IAdminEssayService, AdminEssayService>(); // Quản lý bài luận cho Admin
        services.AddScoped<ITeacherEssayService, TeacherEssayService>(); // Quản lý bài luận cho GV
        services.AddScoped<IUserEssaySubmissionService, UserEssaySubmissionService>(); // Nộp bài luận (Người dùng)
        services.AddScoped<IAdminEssaySubmissionService, AdminEssaySubmissionService>(); // Quản lý bài nộp cho Admin
        services.AddScoped<ITeacherEssaySubmissionService, TeacherEssaySubmissionService>(); // Chấm bài luận cho GV

        services.AddScoped<ITeacherCourseService, TeacherCourseService>(); // Giáo viên quản lý khóa học riêng
        services.AddScoped<ITeacherPackageService, TeacherPackageService>(); // Quản lý các gói cho Giáo viên
        services.AddScoped<ITeacherSubscriptionService, TeacherSubscriptionService>(); // Theo dõi đăng ký của Giáo viên
        services.AddScoped<IUserEnrollmentService, UserEnrollmentService>(); // Dịch vụ ghi danh vào khóa học
        services.AddScoped<IUserCourseService, UserCourseService>(); // Truy cập khóa học (Học viên)
        services.AddScoped<IManageUserInCourseService, ManageUserInCourseService>(); // Quản lý học viên trong khóa học

        services.AddScoped<IPermissionService, PermissionService>(); // Dịch vụ quản lý phân quyền
        services.AddScoped<IAdminManagementService, AdminManagementService>(); // Dịch vụ quản trị hệ thống cho Admin
        services.AddScoped<IInformationUserService, InformationUserService>(); // Quản lý thông tin cá nhân người dùng
        services.AddScoped<IEnumService, EnumService>(); // Dịch vụ cung cấp thông tin các danh mục Enum cho UI
        services.AddScoped<IAdminPolicyService, AdminPolicyService>(); // Quản lý chính sách cho Admin
    }

    // Nhóm dịch vụ xử lý Xác thực, Mật khẩu và Đăng nhập MXH
    private static void RegisterAuthApplicationServices(IServiceCollection services)
    {
        services.AddScoped<IPasswordService, PasswordService>(); // Mã hóa và kiểm tra mật khẩu
        services.AddScoped<IUserManagementService, UserManagementService>(); // Quản lý tài khoản người dùng
        services.AddScoped<IRegisterService, RegisterService>(); // Dịch vụ đăng ký tài khoản mới
        services.AddScoped<ILoginService, LoginService>(); // Dịch vụ đăng nhập tiêu chuẩn
        services.AddScoped<ILogoutService, LogoutService>(); // Dịch vụ đăng xuất
        services.AddScoped<ITokenService, TokenService>(); // Dịch vụ tạo và quản lý JWT Token

        services.AddScoped<IGoogleAuthProvider, GoogleAuthProvider>(); // Cung cấp thông tin xác thực Google
        services.AddScoped<IFacebookAuthProvider, FacebookAuthProvider>(); // Cung cấp thông tin xác thực Facebook
        services.AddScoped<IGoogleLoginService, GoogleLoginService>(); // Logic đăng nhập bằng Google
        services.AddScoped<IFacebookLoginService, FacebookLoginService>(); // Logic đăng nhập bằng Facebook
    }

    // Nhóm dịch vụ Xử lý thanh toán và các chiến lược liên quan
    private static void RegisterPaymentApplicationServices(IServiceCollection services)
    {
        services.AddScoped<IPaymentValidator, PaymentValidator>(); // Kiểm tra tính hợp lệ của giao dịch
        services.AddScoped<IPaymentService, PaymentService>(); // Logic xử lý thanh toán chung
        services.AddScoped<IPayOSService, PayOSService>(); // Tích hợp với cổng thanh toán PayOS
        services.AddScoped<IPaymentStrategy, CoursePaymentProcessor>(); // Chiến lược thanh toán mua khóa học
        services.AddScoped<IPaymentStrategy, TeacherPackagePaymentProcessor>(); // Chiến lược thanh toán gói giáo viên
    }

    // Nhóm dịch vụ xử lý logic làm Bài tập (Quiz) và Câu hỏi
    private static void RegisterQuizApplicationServices(IServiceCollection services)
    {
        services.AddScoped<IQuizSectionService, QuizSectionService>(); // Dịch vụ quản lý các phần quiz
        services.AddScoped<IQuizGroupService, QuizGroupService>(); // Dịch vụ quản lý nhóm câu hỏi
        services.AddScoped<IUserQuizService, UserQuizService>(); // Dịch vụ làm bài quiz (Người dùng)
        services.AddScoped<IAdminQuizService, AdminQuizService>(); // Quản lý bài quiz cho Admin
        services.AddScoped<ITeacherQuizService, TeacherQuizService>(); // Quản lý bài quiz cho Giáo viên
        services.AddScoped<IQuestionService, QuestionService>(); // Dịch vụ quản lý câu hỏi
        services.AddScoped<IQuizAttemptMapper, QuizAttemptMapperService>(); // Ánh xạ giữa kết quả làm bài và kết quả lưu trữ
        services.AddScoped<IQuizAttemptService, QuizAttemptService>(); // Dịch vụ quản lý lượt làm bài
        services.AddScoped<IQuizAttemptAdminService, QuizAttemptAdminService>(); // Quản lý lượt làm bài cho Admin
        services.AddScoped<IQuizAttemptTeacherService, QuizAttemptTeacherService>(); // Quản lý lượt làm bài cho GV
    }

    // Nhóm dịch vụ quản lý Phương tiện, Tài sản và Email
    private static void RegisterMediaApplicationServices(IServiceCollection services)
    {
        services.AddScoped<IAssetFrontendService, AssetFrontendService>(); // Quản lý tài sản tài nguyên cho Web/App
        services.AddScoped<IEmailSender, EmailSender>(); // Công cụ gửi email kỹ thuật cơ bản
        services.AddScoped<IEmailService, EmailService>(); // Dịch vụ gửi email chuyên dụng (OTP, v.v)
        services.AddScoped<IEmailTemplateService, EmailTemplateService>(); // Quản lý và xử lý mẫu (Template) email
        services.AddScoped<ITemplatePathResolver, TemplatePathResolver>(); // Giúp xác định đường dẫn mẫu email
    }

    // Nhóm dịch vụ liên quan đến AI (Tiếng anh), Thông báo và Chấm điểm nâng cao
    private static void RegisterAiApplicationServices(IServiceCollection services)
    {
        services.AddScoped<IPronunciationAssessmentService, PronunciationAssessmentService>(); // Dịch vụ đánh giá phát âm AI
        services.AddScoped<IDictionaryService, DictionaryService>(); // Dịch vụ tra cứu từ điển
        services.AddScoped<IAdminEssayGradingService, AdminEssayGradingService>(); // Chấm điểm bài luận nâng cao (Admin)
        services.AddScoped<ITeacherEssayGradingService, TeacherEssayGradingService>(); // Chấm điểm bài luận nâng cao (GV)
        services.AddScoped<SimpleNotificationService>(); // Dịch vụ thông báo đơn giản (nội bộ)
        services.AddScoped<INotificationService, NotificationService>(); // Dịch vụ quản lý thông báo cho người dùng
        
        // --- AI Wiki Synchronization ---
        services.AddScoped<IMarkdownForWikiService, MarkdownForWikiService>();
        services.AddScoped<IKnowledgeSyncService, KnowledgeSyncService>();
    }

    // Phương thức tổng hợp đăng ký các tích hợp bên ngoài (Cấu hình, HTTP Clients, Dịch vụ)
    public static IServiceCollection AddExternalIntegrations(this IServiceCollection services, IConfiguration configuration)
    {
        RegisterExternalOptions(services, configuration); // Đăng ký cấu hình các bên thứ 3
        RegisterExternalHttpClients(services); // Cấu hình các HTTP Client gọi API bên ngoài
        RegisterExternalServices(services); // Đăng ký các dịch vụ xử lý logic bên thứ 3

        return services;
    }

    // Ánh xạ các section trong appsettings.json/env vào các lớp Options (Strongly-typed)
    private static void RegisterExternalOptions(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AzureSpeechOptions>(configuration.GetSection("AzureSpeech")); // Cấu hình AI giọng nói Azure
        services.Configure<CorsOptions>(configuration.GetSection("Cors")); // Cấu hình CORS (Strongly Typed)
        services.Configure<SmtpOptions>(configuration.GetSection("Smtp")); // Cấu hình gửi mail SMTP
        services.Configure<OxfordDictionaryOptions>(configuration.GetSection("OxfordDictionary")); // Cấu hình từ điển Oxford
        services.Configure<UnsplashOptions>(configuration.GetSection("Unsplash")); // Cấu hình tìm ảnh từ Unsplash
        services.Configure<MinioOptions>(configuration.GetSection("MinIO")); // Cấu hình lưu trữ file MinIO
        services.Configure<GoogleAuthOptions>(configuration.GetSection("GoogleAuth")); // Cấu hình xác thực Google
        services.Configure<FacebookAuthOptions>(configuration.GetSection("FacebookAuth")); // Cấu hình xác thực Facebook
        services.Configure<PayOSOptions>(configuration.GetSection("PayOS")); // Cấu hình thanh toán PayOS
        services.Configure<GeminiOptions>(configuration.GetSection("Gemini")); // Cấu hình AI Gemini
    }

    // Đăng ký các HttpClient để gọi đến API của bên thứ 3 (Minh bạch hơn việc tạo new HttpClient)
    private static void RegisterExternalHttpClients(IServiceCollection services)
    {
        services.AddHttpClient(); // Đăng ký HttpClient factory mặc định

        services.AddHttpClient<IAzureSpeechService, AzureSpeechService>() // Đăng ký HttpClient có định danh cho Azure
            .SetHandlerLifetime(TimeSpan.FromMinutes(5)); // Cấu hình vòng đời của kết nối

        services.AddHttpClient("PayOS", client => // Cấu hình HttpClient riêng cho thanh toán PayOS
        {
            client.BaseAddress = new Uri("https://api-merchant.payos.vn"); // URL gốc của PayOS
            client.Timeout = TimeSpan.FromSeconds(30); // Thời gian chờ tối đa
        });
    }

    // Đăng ký các dịch vụ cầu nối hoặc xử lý dữ liệu từ bên thứ 3
    private static void RegisterExternalServices(IServiceCollection services)
    {    
        services.AddScoped<IAudioConverterService, AudioConverterService>(); // Dịch vụ chuyển đổi định dạng âm thanh 
        services.AddScoped<IMinioFileStorage, MinioFileStorageService>(); // Dịch vụ lõi lưu trữ/truy xuất file trên MinIO 

        services.AddScoped<ICourseImageService, CourseImageService>(); // Xử lý ảnh đại diện khóa học 
        services.AddScoped<ILessonImageService, LessonImageService>(); // Xử lý ảnh cho bài học 
        services.AddScoped<IModuleImageService, ModuleImageService>(); // Xử lý ảnh cho module 
        services.AddScoped<ILectureMediaService, LectureMediaService>(); // Xử lý tài liệu media cho bài giảng 
        services.AddScoped<IFlashCardMediaService, FlashCardMediaService>(); // Xử lý âm thanh/hình ảnh cho flashcard 
        services.AddScoped<IEssayMediaService, EssayMediaService>(); // Xử lý media liên quan đến bài luận
        services.AddScoped<IEssayAttachmentService, EssayAttachmentService>(); // Quản lý file đính kèm của bài luận
        services.AddScoped<IAvatarService, AvatarService>(); // Dịch vụ xử lý ảnh đại diện người dùng 
        services.AddScoped<IQuizGroupMediaService, QuizGroupMediaService>(); // Media cho nhóm câu hỏi
        services.AddScoped<IQuestionMediaService, QuestionMediaService>(); // Media cho từng câu hỏi cụ thể
        services.AddScoped<IAssetFrontendMediaService, AssetFrontendMediaService>(); // Media phục vụ giao diện Web
        services.AddScoped<IPronunciationMediaService, PronunciationMediaService>(); // Xử lý file ghi âm phát âm học viên

        services.AddSingleton<IStorageConfigProvider, StorageConfigProvider>(); // Cung cấp thông số cấu hình lưu trữ tập trung 

        services.AddSingleton<IMinioClient>(sp => // Khởi tạo MinIO Client trực tiếp từ cấu hình (Pattern Factory)
        {
            var options = sp.GetRequiredService<IOptions<MinioOptions>>().Value; // Lấy option đã đăng ký
            var client = new MinioClient()
                .WithEndpoint(options.Endpoint) // Địa chỉ máy chủ MinIO
                .WithCredentials(options.AccessKey, options.SecretKey); // Tài khoản truy cập

            if (options.UseSSL) // Kiểm tra có dùng giao thức bảo mật SSL không
                client.WithSSL();

            return client.Build(); // Xây dựng đối tượng Client
        }); 

        services.AddScoped<TempFileCleanupJob>(); // Đăng ký Job dọn dẹp file tạm để tiết kiệm bộ nhớ

        // LƯU Ý: IPaymentStrategy ĐÃ ĐƯỢC ĐĂNG KÝ TRONG RegisterPaymentApplicationServices
        
        services.AddScoped<IScoringStrategy, FillBlankScoringStrategy>(); // Chiến lược chấm điểm: Điền từ vào chỗ trống 
        services.AddScoped<IScoringStrategy, MultipleChoiceScoringStrategy>(); // Chiến lược chấm điểm: Trắc nghiệm 1 đáp án 
        services.AddScoped<IScoringStrategy, TrueFalseScoringStrategy>(); // Chiến lược chấm điểm: Đúng hoặc Sai 
        services.AddScoped<IScoringStrategy, MultipleAnswersScoringStrategy>(); // Chiến lược chấm điểm: Trắc nghiệm nhiều đáp án 
        services.AddScoped<IScoringStrategy, MatchingScoringStrategy>(); // Chiến lược chấm điểm: Nối các cặp tương ứng 
        services.AddScoped<IScoringStrategy, OrderingScoringStrategy>(); // Chiến lược chấm điểm: Sắp xếp theo thứ tự 
    
    
        services.AddKernel() ;
        services.AddSingleton<ITextEmbeddingGenerationService > (
            sp => {
                var options = sp.GetRequiredService<IOptions<GeminiOptions>>().Value; // : Nó tạo ra một đối tượng kết nối thực sự của Google và đưa cái Key vào
#pragma warning disable SKEXP0070
                return new GoogleAITextEmbeddingGenerationService("gemini-embedding-001", options.ApiKey);
            }
        );


        services.AddSingleton<IChatCompletionService>(
            sp => {
                var options = sp.GetRequiredService<IOptions<GeminiOptions>>().Value;
                return new GoogleAIGeminiChatCompletionService("gemini-2.5-flash", options.ApiKey);
#pragma warning restore SKEXP0070
            }
        );

        services.AddScoped<IEmbeddingService, EmbeddingService>();
        services.AddScoped<IAiChatService, AiChatService>();
    }
    
    // Phương thức đăng ký các tiến trình chạy nền (Background Services) - Chạy tự động theo chu kỳ
    public static IServiceCollection AddBackgroundServices(this IServiceCollection services)
    {
        services.AddHostedService<LearningEnglish.Application.Service.BackgroundJobs.QuizAutoSubmitService>(); // Tự động nộp bài khi hết giờ
        services.AddHostedService<TempFileCleanupHostedService>(); // Tự động dọn dẹp file rác định kỳ
        services.AddHostedService<OtpCleanupService>(); // Tự động xóa mã xác thực (OTP) đã hết hạn
        services.AddHostedService<PaymentCleanupService>(); // Tự động hủy các yêu cầu thanh toán không hoàn tất
        services.AddHostedService<WebhookRetryService>(); // Tự động thử lại việc gửi webhook nếu thất bại
        services.AddHostedService<VocabularyReminderService>(); // Tự động gửi thông báo nhắc nhở học từ vựng

        return services; // Trả về services hoàn tất việc đăng ký
    }
}

