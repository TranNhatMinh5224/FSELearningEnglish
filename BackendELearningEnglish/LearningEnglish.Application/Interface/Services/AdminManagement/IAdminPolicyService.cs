using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs.Admin;

namespace LearningEnglish.Application.Interface.Services.AdminManagement;

public interface IAdminPolicyService
{
    Task<ServiceResponse<List<AdminPolicyResponseDto>>> GetAllPoliciesAsync();
    Task<ServiceResponse<AdminPolicyResponseDto>> GetPolicyByIdAsync(int id);
    Task<ServiceResponse<AdminPolicyResponseDto>> CreatePolicyAsync(AdminCreatePolicyRequestDto request);
    Task<ServiceResponse<AdminPolicyResponseDto>> UpdatePolicyAsync(int id, AdminUpdatePolicyRequestDto request);
    Task<ServiceResponse<bool>> DeletePolicyAsync(int id);
}
