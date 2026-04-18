using LearningEnglish.Domain.Entities;

namespace LearningEnglish.Application.Interface.Repositories {
    public interface ICourseKnowledgeRepository{ 
        Task<CourseKnowledge?> GetByCourseIdAsync(int courseId);
        Task AddAsync(CourseKnowledge courseKnowledge);
        Task UpdateAsync(CourseKnowledge courseKnowledge);
        Task<List<CourseKnowledge>> GetAllAsync();
        Task<List<CourseKnowledge>> GetByListCourseIdAsync(List<int> courseIds);
        Task DeleteAsync(int courseId); 
        Task<List<CourseKnowledge>> SearchSimilarAsync(float[] queryVector, int limit = 5);
        
    }
}