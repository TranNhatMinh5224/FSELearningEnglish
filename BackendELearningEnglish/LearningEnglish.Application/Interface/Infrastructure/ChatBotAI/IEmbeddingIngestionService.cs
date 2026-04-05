using LearningEnglish.Domain.Entities;

namespace LearningEnglish.Application.Interface.Infrastructure.ChatBotAI;

public interface IEmbeddingIngestionService
{
    Task UpsertCourseEmbeddingAsync(Course course, CancellationToken cancellationToken = default);
    Task DeleteCourseEmbeddingsAsync(int courseId, CancellationToken cancellationToken = default);

    Task UpsertTeacherPackageEmbeddingAsync(TeacherPackage teacherPackage, CancellationToken cancellationToken = default);
    Task DeleteTeacherPackageEmbeddingsAsync(int teacherPackageId, CancellationToken cancellationToken = default);
}