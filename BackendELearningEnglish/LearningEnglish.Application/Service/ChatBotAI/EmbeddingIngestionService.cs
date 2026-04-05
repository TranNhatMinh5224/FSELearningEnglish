using System.Security.Cryptography;
using System.Text;
using LearningEnglish.Application.Cofigurations;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.ChatBotAI;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;
using Microsoft.Extensions.Options;

namespace LearningEnglish.Application.Service;

public class EmbeddingIngestionService : IEmbeddingIngestionService
{
    private readonly IEmbeddingService _embeddingService;
    private readonly ICourseEmbeddingRepository _courseEmbeddingRepository;
    private readonly ITeacherPackageEmbeddingRepository _teacherPackageEmbeddingRepository;
    private readonly ChatBotAIOptions _chatBotAiOptions;

    public EmbeddingIngestionService(
        IEmbeddingService embeddingService,
        ICourseEmbeddingRepository courseEmbeddingRepository,
        ITeacherPackageEmbeddingRepository teacherPackageEmbeddingRepository,
        IOptions<ChatBotAIOptions> chatBotAiOptions)
    {
        _embeddingService = embeddingService;
        _courseEmbeddingRepository = courseEmbeddingRepository;
        _teacherPackageEmbeddingRepository = teacherPackageEmbeddingRepository;
        _chatBotAiOptions = chatBotAiOptions.Value;
    }

    public async Task UpsertCourseEmbeddingAsync(Course course, CancellationToken cancellationToken = default)
    {
        // Chatbot scope: chỉ index khóa học hệ thống (public).
        if (course.Type != CourseType.System)
        {
            await _courseEmbeddingRepository.DeleteByCourseIdAsync(course.CourseId, cancellationToken);
            return;
        }

        var sourceText = BuildCourseSourceText(course);
        if (string.IsNullOrWhiteSpace(sourceText))
            return;

        var contentHash = ComputeSha256(sourceText);

        var alreadyExists = await _courseEmbeddingRepository.ExistsByContentHashAsync(
            course.CourseId,
            EmbeddingPartType.FullContent,
            contentHash,
            cancellationToken);

        if (alreadyExists) return;

        var embeddingVector = await _embeddingService.CreateEmbeddingAsync(sourceText);

        var embedding = new CourseEmbedding
        {
            CourseId = course.CourseId,
            Title = course.Title,
            EmbeddingModel = ResolveEmbeddingModelName(),
            EmbeddingDimension = embeddingVector.Length,
            PartType = EmbeddingPartType.FullContent,
            ContentHash = contentHash,
            EmbeddingVector = embeddingVector,
            LastUpdatedEmbeddingAt = DateTime.UtcNow
        };

        await _courseEmbeddingRepository.UpsertAsync(embedding, cancellationToken);
    }

    public async Task DeleteCourseEmbeddingsAsync(int courseId, CancellationToken cancellationToken = default)
    {
        await _courseEmbeddingRepository.DeleteByCourseIdAsync(courseId, cancellationToken);
    }

    public async Task UpsertTeacherPackageEmbeddingAsync(TeacherPackage teacherPackage, CancellationToken cancellationToken = default)
    {
        var sourceText = BuildTeacherPackageSourceText(teacherPackage);
        if (string.IsNullOrWhiteSpace(sourceText))
            return;

        var contentHash = ComputeSha256(sourceText);

        var alreadyExists = await _teacherPackageEmbeddingRepository.ExistsByContentHashAsync(
            teacherPackage.TeacherPackageId,
            EmbeddingPartType.FullContent,
            contentHash,
            cancellationToken);

        if (alreadyExists)
            return;

        var embeddingVector = await _embeddingService.CreateEmbeddingAsync(sourceText);

        var embedding = new TeacherPackageEmbedding
        {
            TeacherPackageId = teacherPackage.TeacherPackageId,
            PackageName = Normalize(teacherPackage.PackageName),
            EmbeddingModel = ResolveEmbeddingModelName(),
            EmbeddingDimension = embeddingVector.Length,
            PartType = EmbeddingPartType.FullContent,
            ContentHash = contentHash,
            SourceData = sourceText,
            EmbeddingVector = embeddingVector,
            LastUpdatedEmbeddingAt = DateTime.UtcNow
        };

        await _teacherPackageEmbeddingRepository.UpsertAsync(embedding, cancellationToken);
    }

    public async Task DeleteTeacherPackageEmbeddingsAsync(int teacherPackageId, CancellationToken cancellationToken = default)
    {
        await _teacherPackageEmbeddingRepository.DeleteByTeacherPackageIdAsync(teacherPackageId, cancellationToken);
    }

    private string ResolveEmbeddingModelName()
    {
        if (!string.IsNullOrWhiteSpace(_chatBotAiOptions.EmbeddingModel))
            return _chatBotAiOptions.EmbeddingModel;

        if (!string.IsNullOrWhiteSpace(_chatBotAiOptions.Model))
            return _chatBotAiOptions.Model;

        return "unknown-model";
    }

    private static string BuildCourseSourceText(Course course)
    {
        return string.Join('\n',
        [
            $"Title: {Normalize(course.Title)}",
            $"Description: {Normalize(course.DescriptionMarkdown)}",
            $"Type: {course.Type}",
            $"Status: {course.Status}",
            $"Price: {course.Price?.ToString() ?? "0"}"
        ]);
    }

    private static string BuildTeacherPackageSourceText(TeacherPackage teacherPackage)
    {
        return string.Join('\n',
        [
            $"PackageName: {Normalize(teacherPackage.PackageName)}",
            $"Level: {teacherPackage.Level}",
            $"Price: {teacherPackage.Price}",
            $"DurationMonths: {teacherPackage.DurationMonths}",
            $"MaxCourses: {teacherPackage.MaxCourses}",
            $"MaxLessons: {teacherPackage.MaxLessons}",
            $"MaxStudents: {teacherPackage.MaxStudents}"
        ]);
    }

    private static string Normalize(string? input)
        => string.IsNullOrWhiteSpace(input) ? string.Empty : input.Trim();

    private static string ComputeSha256(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        var hashBytes = SHA256.HashData(bytes);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}