using LearningEnglish.Domain.Entities;

namespace LearningEnglish.Application.Interface.Repositories;

public interface ITeacherPackageKnowledgeRepository {
    Task<TeacherPackageKnowledge?> GetByPackageIdAsync(int packageId);
    Task AddAsync(TeacherPackageKnowledge teacherPackageKnowledge);
    Task UpdateAsync(TeacherPackageKnowledge teacherPackageKnowledge);
    Task<List<TeacherPackageKnowledge>> GetAllAsync();
    Task<List<TeacherPackageKnowledge>> GetByListPackageIdAsync(List<int> packageIds);
    Task DeleteAsync(int packageId); 
    Task<List<TeacherPackageKnowledge>> SearchSimilarAsync(float[] queryVector, int limit = 5);
}
