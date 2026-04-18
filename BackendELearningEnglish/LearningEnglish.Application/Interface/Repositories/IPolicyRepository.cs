using LearningEnglish.Domain.Entities;

namespace LearningEnglish.Application.Interface.Repositories
{
    public interface IPolicyRepository
    {
        Task<List<Policy>> GetAllPoliciesAsync();
        Task<Policy?> GetPolicyByIdAsync(int id);
        Task<Policy?> GetPolicyBySlugAsync(string slug);
        Task AddPolicyAsync(Policy policy);
        Task UpdatePolicyAsync(Policy policy);
        Task DeletePolicyAsync(int id);
    }
}
