using LearningEnglish.Domain.Entities;

namespace LearningEnglish.Application.Interface.Services.Markdown;

public interface IMarkdownForWikiService
{
    
    Task<string> GenCourseMarkdown(Course course);
    Task<string> GenTeacherPackageMarkdown(LearningEnglish.Domain.Entities.TeacherPackage teacherPackage);
    Task<string> GenPolicyMarkdown(Policy policy);
}
