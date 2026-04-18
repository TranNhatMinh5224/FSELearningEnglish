using LearningEnglish.Domain.Entities;

namespace LearningEnglish.Application.Interface.Repositories;

public interface IPolicyKnowledgeRepository {
    Task<PolicyKnowledge?> GetByPolicyIdAsync(int policyId);
    Task AddAsync(PolicyKnowledge policyKnowledge);
    Task UpdateAsync(PolicyKnowledge policyKnowledge);
    Task<List<PolicyKnowledge>> GetAllAsync();
    Task<List<PolicyKnowledge>> GetByListPolicyIdAsync(List<int> policyIds);
    Task DeleteAsync(int policyId); 
    Task<List<PolicyKnowledge>> SearchSimilarAsync(float[] queryVector, int limit = 5);
}
