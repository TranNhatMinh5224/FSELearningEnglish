using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using LearningEnglish.API.Authorization;
using LearningEnglish.Application.Cofigurations;
using LearningEnglish.Application.Configurations;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.AdminManagement;
using LearningEnglish.Application.Interface.Auth;
using LearningEnglish.Application.Interface.Infrastructure;
using LearningEnglish.Application.Interface.Infrastructure.ChatBotAI;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Application.Interface.Services;
using LearningEnglish.Application.Interface.Services.Essay;
using Microsoft.SemanticKernel;
using LearningEnglish.Application.Interface.Services.FlashCard;
using LearningEnglish.Application.Interface.Services.Lecture;
using LearningEnglish.Application.Interface.Services.Lesson;
using LearningEnglish.Application.Interface.Services.Module;
using LearningEnglish.Application.Interface.Services.TeacherPackage;
using LearningEnglish.Application.Interface.Strategies;
using LearningEnglish.Application.Mappings;
using LearningEnglish.Application.Service;
using LearningEnglish.Application.Service.Auth;
using LearningEnglish.Application.Service.BackgroundJobs;
using LearningEnglish.Application.Service.EnumService;
using LearningEnglish.Application.Service.EssayGrading;
using LearningEnglish.Application.Service.EssayService;
using LearningEnglish.Application.Service.FlashCardService;
using LearningEnglish.Application.Service.LectureService;
using LearningEnglish.Application.Service.PaymentService;
using LearningEnglish.Application.Strategies.Payment;
using LearningEnglish.Application.Strategies.Scoring;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Infrastructure.MinioFileStorage;
using LearningEnglish.Infrastructure.Repositories;
using LearningEnglish.Infrastructure.Services;
using LearningEnglish.Infrastructure.Services.ExternalProviders.AzureSpeech;
using LearningEnglish.Infrastructure.Services.ExternalProviders.Facebook;
using LearningEnglish.Infrastructure.Services.ExternalProviders.Google;
using LearningEnglish.Infrastructure.Services.ExternalProviders.Gemini;
using LearningEnglish.Infrastructure.Services.ExternalProviders.PayOS;
using LearningEnglish.Infrastructure.Services.MediaService;
using LearningEnglish.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Minio;
using Pgvector;

namespace LearningEnglish.API.Extensions;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddApiCore(this IServiceCollection services, IConfiguration configuration, string frontendUrl)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();

        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "FullStack English Learning API", Version = "v1" });

            var bearerScheme = new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            };

            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter Bearer token"
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                { bearerScheme, new List<string>() }
            });
        });

        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", p =>
            {
                var allowedOrigins = configuration.GetSection("AllowedOrigins").Get<string[]>()
                    ?? new[] { frontendUrl };

                p.WithOrigins(allowedOrigins)
                 .AllowAnyHeader()
                 .AllowAnyMethod()
                 .AllowCredentials()
                 .SetIsOriginAllowedToAllowWildcardSubdomains();
            });

            options.AddPolicy("AllowAll", p =>
                p.AllowAnyOrigin()
                 .AllowAnyHeader()
                 .AllowAnyMethod());
        });

        services.AddFluentValidationAutoValidation()
            .AddFluentValidationClientsideAdapters();
        services.AddValidatorsFromAssembly(typeof(MappingProfile).Assembly);

        services.AddAutoMapper(cfg =>
        {
            cfg.AddProfile<MappingProfile>();
        });
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(MappingProfile).Assembly));

        return services;
    }

    public static IServiceCollection AddDataAndSecurity(
        this IServiceCollection services,
        string connectionString,
        string jwtKey,
        string jwtIssuer,
        string jwtAudience)
    {
        services.AddDbContext<AppDbContext>(opt =>
            opt.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.EnableRetryOnFailure(0);
                npgsql.UseVector();
            }));

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                    ClockSkew = TimeSpan.FromMinutes(2)
                };
            });

        services.AddAuthorization();
        services.AddHttpContextAccessor();
        services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
        services.AddScoped<IAuthorizationHandler, TeacherRoleAuthorizationHandler>();

        return services;
    }

    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        RegisterCoreRepositories(services);
        RegisterLearningRepositories(services);
        RegisterAssessmentRepositories(services);
        RegisterAuthAndAccessRepositories(services);
        RegisterQuizRepositories(services);
        RegisterMediaRepositories(services);

        return services;
    }

    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddMemoryCache();
        services.AddScoped<ICacheService, MemoryCacheService>();
        
        services.AddRepositories();
        services.AddExternalIntegrations(configuration);

        return services;
    }

    private static void RegisterCoreRepositories(IServiceCollection services)
    {
        services.AddScoped<ICourseRepository, CourseRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserStatisticsRepository, UserStatisticsRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
    }

    private static void RegisterLearningRepositories(IServiceCollection services)
    {
        services.AddScoped<ILessonRepository, LessonRepository>();
        services.AddScoped<IModuleRepository, ModuleRepository>();
        services.AddScoped<ILectureRepository, LectureRepository>();
        services.AddScoped<IFlashCardRepository, FlashCardRepository>();
        services.AddScoped<IFlashCardReviewRepository, FlashCardReviewRepository>();
        services.AddScoped<ICourseEmbeddingRepository, CourseEmbeddingRepository>();
        services.AddScoped<ITeacherPackageEmbeddingRepository, TeacherPackageEmbeddingRepository>();
        services.AddScoped<ICourseProgressRepository, CourseProgressRepository>();
        services.AddScoped<ILessonCompletionRepository, LessonCompletionRepository>();
        services.AddScoped<IModuleCompletionRepository, ModuleCompletionRepository>();
    }

    private static void RegisterAssessmentRepositories(IServiceCollection services)
    {
        services.AddScoped<IAssessmentRepository, AssessmentRepository>();
        services.AddScoped<IEssayRepository, EssayRepository>();
        services.AddScoped<IEssaySubmissionRepository, EssaySubmissionRepository>();
        services.AddScoped<IPronunciationProgressRepository, PronunciationProgressRepository>();
    }

    private static void RegisterAuthAndAccessRepositories(IServiceCollection services)
    {
        services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
        services.AddScoped<IEmailVerificationTokenRepository, EmailVerificationTokenRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IExternalLoginRepository, ExternalLoginRepository>();
        services.AddScoped<IPermissionRepository, PermissionRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IRolePermissionRepository, RolePermissionRepository>();
    }

    private static void RegisterQuizRepositories(IServiceCollection services)
    {
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IPaymentStatisticsRepository, PaymentStatisticsRepository>();
        services.AddScoped<IPaymentWebhookQueueRepository, PaymentWebhookQueueRepository>();
        services.AddScoped<ITeacherPackageRepository, TeacherPackageRepository>();
        services.AddScoped<ITeacherSubscriptionRepository, TeacherSubscriptionRepository>();
        services.AddScoped<IQuizSectionRepository, QuizSectionRepository>();
        services.AddScoped<IQuizGroupRepository, QuizGroupRepository>();
        services.AddScoped<IQuizRepository, QuizRepository>();
        services.AddScoped<IQuestionRepository, QuestionRepository>();
        services.AddScoped<IQuizAttemptRepository, QuizAttemptRepository>();
    }

    private static void RegisterMediaRepositories(IServiceCollection services)
    {
        services.AddScoped<IAssetFrontendRepository, AssetFrontendRepository>();
    }

    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration? configuration = null)
    {
        RegisterCoreApplicationServices(services);
        RegisterAuthApplicationServices(services);
        RegisterPaymentApplicationServices(services);
        RegisterQuizApplicationServices(services);
        RegisterMediaApplicationServices(services);
        RegisterAiApplicationServices(services);
        if (configuration != null)
            RegisterSemanticKernel(services, configuration);

        return services;
    }

    private static void RegisterCoreApplicationServices(IServiceCollection services)
    {
        services.AddScoped<ISortingService<Course>, CourseSortingService>();
        services.AddScoped<ISortingService<User>, UserSortingService>();

        services.AddScoped<IAdminCourseService, AdminCourseService>();
        services.AddScoped<IAdminStatisticsService, AdminStatisticsService>();
        services.AddScoped<ILessonService, LessonService>();
        services.AddScoped<IAdminLessonService, AdminLessonService>();
        services.AddScoped<ITeacherLessonService, TeacherLessonService>();
        services.AddScoped<IAdminModuleService, AdminModuleService>();
        services.AddScoped<ITeacherModuleService, TeacherModuleService>();
        services.AddScoped<IUserModuleService, UserModuleService>();
        services.AddScoped<IModuleProgressService, ModuleProgressService>();
        services.AddScoped<IUserLectureService, UserLectureService>();
        services.AddScoped<IAdminLectureService, AdminLectureService>();
        services.AddScoped<ITeacherLectureCommandService, TeacherLectureCommandService>();
        services.AddScoped<ITeacherLectureQueryService, TeacherLectureQueryService>();
        services.AddScoped<IUserFlashCardService, UserFlashCardService>();
        services.AddScoped<IAdminFlashCardService, AdminFlashCardService>();
        services.AddScoped<ITeacherFlashCardCommandService, TeacherFlashCardCommandService>();
        services.AddScoped<ITeacherFlashCardQueryService, TeacherFlashCardQueryService>();
        services.AddScoped<IFlashCardReviewService, FlashCardReviewService>();
        services.AddScoped<IStreakRepository, StreakRepository>();
        services.AddScoped<IStreakService, StreakService>();

        services.AddScoped<IUserAssessmentService, UserAssessmentService>();
        services.AddScoped<IAdminAssessmentService, AdminAssessmentService>();
        services.AddScoped<ITeacherAssessmentService, TeacherAssessmentService>();

        services.AddScoped<IUserEssayService, UserEssayService>();
        services.AddScoped<IAdminEssayService, AdminEssayService>();
        services.AddScoped<ITeacherEssayService, TeacherEssayService>();
        services.AddScoped<IUserEssaySubmissionService, UserEssaySubmissionService>();
        services.AddScoped<IAdminEssaySubmissionService, AdminEssaySubmissionService>();
        services.AddScoped<ITeacherEssaySubmissionService, TeacherEssaySubmissionService>();

        services.AddScoped<ITeacherCourseService, TeacherCourseService>();
        services.AddScoped<ITeacherPackageService, TeacherPackageService>();
        services.AddScoped<ITeacherSubscriptionService, TeacherSubscriptionService>();
        services.AddScoped<IUserEnrollmentService, UserEnrollmentService>();
        services.AddScoped<IUserCourseService, UserCourseService>();
        services.AddScoped<IManageUserInCourseService, ManageUserInCourseService>();

        services.AddScoped<IPermissionService, PermissionService>();
        services.AddScoped<IAdminManagementService, AdminManagementService>();
        services.AddScoped<IInformationUserService, InformationUserService>();
        services.AddScoped<IEnumService, EnumService>();
    }

    private static void RegisterAuthApplicationServices(IServiceCollection services)
    {
        services.AddScoped<IPasswordService, PasswordService>();
        services.AddScoped<IUserManagementService, UserManagementService>();
        services.AddScoped<IRegisterService, RegisterService>();
        services.AddScoped<ILoginService, LoginService>();
        services.AddScoped<ILogoutService, LogoutService>();
        services.AddScoped<ITokenService, TokenService>();

        services.AddScoped<IGoogleAuthProvider, GoogleAuthProvider>();
        services.AddScoped<IFacebookAuthProvider, FacebookAuthProvider>();
        services.AddScoped<IGoogleLoginService, GoogleLoginService>();
        services.AddScoped<IFacebookLoginService, FacebookLoginService>();
    }

    private static void RegisterPaymentApplicationServices(IServiceCollection services)
    {
        services.AddScoped<IPaymentValidator, PaymentValidator>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IPayOSService, PayOSService>();
        services.AddScoped<IPaymentStrategy, CoursePaymentProcessor>();
        services.AddScoped<IPaymentStrategy, TeacherPackagePaymentProcessor>();
    }

    private static void RegisterQuizApplicationServices(IServiceCollection services)
    {
        services.AddScoped<IQuizSectionService, QuizSectionService>();
        services.AddScoped<IQuizGroupService, QuizGroupService>();
        services.AddScoped<IUserQuizService, UserQuizService>();
        services.AddScoped<IAdminQuizService, AdminQuizService>();
        services.AddScoped<ITeacherQuizService, TeacherQuizService>();
        services.AddScoped<IQuestionService, QuestionService>();
        services.AddScoped<IQuizAttemptMapper, QuizAttemptMapperService>();
        services.AddScoped<IQuizAttemptService, QuizAttemptService>();
        services.AddScoped<IQuizAttemptAdminService, QuizAttemptAdminService>();
        services.AddScoped<IQuizAttemptTeacherService, QuizAttemptTeacherService>();
    }

    private static void RegisterMediaApplicationServices(IServiceCollection services)
    {
        services.AddScoped<IAssetFrontendService, AssetFrontendService>();
        services.AddScoped<IEmailSender, EmailSender>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IEmailTemplateService, EmailTemplateService>();
        services.AddScoped<ITemplatePathResolver, TemplatePathResolver>();
    }

    private static void RegisterAiApplicationServices(IServiceCollection services)
    {
        services.AddScoped<IEmbeddingIngestionService, EmbeddingIngestionService>();
        services.AddScoped<IChatBotAIService, ChatBotAIService>();
        services.AddScoped<IPronunciationAssessmentService, PronunciationAssessmentService>();
        services.AddScoped<IDictionaryService, DictionaryService>();
        services.AddScoped<IAdminEssayGradingService, AdminEssayGradingService>();
        services.AddScoped<ITeacherEssayGradingService, TeacherEssayGradingService>();
        services.AddScoped<SimpleNotificationService>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<INotificationService, NotificationService>();
    }

    private static void RegisterSemanticKernel(IServiceCollection services, IConfiguration configuration)
    {
        var apiKey = configuration["ChatBotAI:ApiKey"]
            ?? configuration["Gemini:ApiKey"]
            ?? string.Empty;

        var chatModel = configuration["ChatBotAI:ChatModel"]
            ?? configuration["Gemini:ChatModel"]
            ?? "gemini-2.0-flash";

        if (string.IsNullOrWhiteSpace(apiKey))
            return; // Skip SK registration if no key is configured; validation will catch this on startup

        var kernelBuilder = Kernel.CreateBuilder();
#pragma warning disable SKEXP0070 // Google AI Gemini connector is experimental (alpha package)
        kernelBuilder.AddGoogleAIGeminiChatCompletion(chatModel, apiKey);
#pragma warning restore SKEXP0070
        var kernel = kernelBuilder.Build();

        services.AddSingleton(kernel);
        services.AddScoped<ISemanticChatService, SemanticKernelChatService>();
    }


    public static IServiceCollection AddExternalIntegrations(this IServiceCollection services, IConfiguration configuration)
    {
        RegisterExternalOptions(services, configuration);
        RegisterExternalHttpClients(services);
        RegisterExternalServices(services);

        return services;
    }

    private static void RegisterExternalOptions(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AzureSpeechOptions>(configuration.GetSection("AzureSpeech"));
        services.Configure<SmtpOptions>(configuration.GetSection("Smtp"));
        services.Configure<OxfordDictionaryOptions>(configuration.GetSection("OxfordDictionary"));
        services.Configure<UnsplashOptions>(configuration.GetSection("Unsplash"));
        services.Configure<MinioOptions>(configuration.GetSection("MinIO"));
        services.Configure<GoogleAuthOptions>(configuration.GetSection("GoogleAuth"));
        services.Configure<FacebookAuthOptions>(configuration.GetSection("FacebookAuth"));
        services.Configure<PayOSOptions>(configuration.GetSection("PayOS"));
        RegisterChatBotAiOptions(services, configuration);
    }

    private static void RegisterChatBotAiOptions(IServiceCollection services, IConfiguration configuration)
    {
        var chatBotAiSection = configuration.GetSection("ChatBotAI");
        var sourceSection = chatBotAiSection.Exists()
            ? chatBotAiSection
            : configuration.GetSection("Gemini");

        services.AddOptions<ChatBotAIOptions>()
            .Bind(sourceSection)
            .Validate(o => !string.IsNullOrWhiteSpace(o.Provider),
                "ChatBotAI:Provider is required.")
            .Validate(o => !string.IsNullOrWhiteSpace(o.ApiKey),
                "ChatBotAI:ApiKey is required.")
            .Validate(o =>
                    !string.IsNullOrWhiteSpace(o.ChatModel) ||
                    !string.IsNullOrWhiteSpace(o.EmbeddingModel) ||
                    !string.IsNullOrWhiteSpace(o.Model),
                "ChatBotAI requires at least one model (ChatModel, EmbeddingModel, or Model).")
            .ValidateOnStart();

        // Backward compatibility for existing code paths that still resolve GeminiOptions.
        services.Configure<GeminiOptions>(sourceSection);
    }

    private static void RegisterExternalHttpClients(IServiceCollection services)
    {
        services.AddHttpClient();

        services.AddHttpClient<IAzureSpeechService, AzureSpeechService>()
            .SetHandlerLifetime(TimeSpan.FromMinutes(5));

        services.AddHttpClient<IEmbeddingService, GeminiEmbeddingService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        services.AddHttpClient("PayOS", client =>
        {
            client.BaseAddress = new Uri("https://api-merchant.payos.vn");
            client.Timeout = TimeSpan.FromSeconds(30);
        });
    }

    private static void RegisterExternalServices(IServiceCollection services)
    {
        services.AddScoped<IAudioConverterService, AudioConverterService>();
        services.AddScoped<IMinioFileStorage, MinioFileStorageService>();

        services.AddScoped<ICourseImageService, CourseImageService>();
        services.AddScoped<ILessonImageService, LessonImageService>();
        services.AddScoped<IModuleImageService, ModuleImageService>();
        services.AddScoped<ILectureMediaService, LectureMediaService>();
        services.AddScoped<IFlashCardMediaService, FlashCardMediaService>();
        services.AddScoped<IEssayMediaService, EssayMediaService>();
        services.AddScoped<IEssayAttachmentService, EssayAttachmentService>();
        services.AddScoped<IAvatarService, AvatarService>();
        services.AddScoped<IQuizGroupMediaService, QuizGroupMediaService>();
        services.AddScoped<IQuestionMediaService, QuestionMediaService>();
        services.AddScoped<IAssetFrontendMediaService, AssetFrontendMediaService>();
        services.AddScoped<IPronunciationMediaService, PronunciationMediaService>();

        services.AddSingleton<IStorageConfigProvider, StorageConfigProvider>();

        services.AddSingleton<IMinioClient>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<MinioOptions>>().Value;
            var client = new MinioClient()
                .WithEndpoint(options.Endpoint)
                .WithCredentials(options.AccessKey, options.SecretKey);

            if (options.UseSSL)
                client.WithSSL();

            return client.Build();
        });

        services.AddScoped<TempFileCleanupJob>();

        services.AddScoped<IPaymentStrategy, CoursePaymentProcessor>();
        services.AddScoped<IPaymentStrategy, TeacherPackagePaymentProcessor>();

        services.AddScoped<IScoringStrategy, FillBlankScoringStrategy>();
        services.AddScoped<IScoringStrategy, MultipleChoiceScoringStrategy>();
        services.AddScoped<IScoringStrategy, TrueFalseScoringStrategy>();
        services.AddScoped<IScoringStrategy, MultipleAnswersScoringStrategy>();
        services.AddScoped<IScoringStrategy, MatchingScoringStrategy>();
        services.AddScoped<IScoringStrategy, OrderingScoringStrategy>();
    }

    public static IServiceCollection AddBackgroundServices(this IServiceCollection services)
    {
        services.AddHostedService<LearningEnglish.Application.Service.BackgroundJobs.QuizAutoSubmitService>();
        services.AddHostedService<TempFileCleanupHostedService>();
        services.AddHostedService<OtpCleanupService>();
        services.AddHostedService<PaymentCleanupService>();
        services.AddHostedService<WebhookRetryService>();
        services.AddHostedService<VocabularyReminderService>();

        return services;
    }
}
