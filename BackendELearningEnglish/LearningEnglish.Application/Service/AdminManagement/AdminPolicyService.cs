using AutoMapper;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs.Admin;
using LearningEnglish.Application.Interface.Repositories;
using LearningEnglish.Application.Interface.Services.AdminManagement;
using LearningEnglish.Application.Interface.IKnowledgeSyncService;
using LearningEnglish.Domain.Entities;

namespace LearningEnglish.Application.Service.AdminManagement;

public class AdminPolicyService : IAdminPolicyService
{
    private readonly IPolicyRepository _policyRepository;
    private readonly IMapper _mapper;
    private readonly IKnowledgeSyncService _knowledgeSyncService;

    public AdminPolicyService(
        IPolicyRepository policyRepository, 
        IMapper mapper,
        IKnowledgeSyncService knowledgeSyncService)
    {
        _policyRepository = policyRepository;
        _mapper = mapper;
        _knowledgeSyncService = knowledgeSyncService;
    }

    public async Task<ServiceResponse<List<AdminPolicyResponseDto>>> GetAllPoliciesAsync()
    {
        var response = new ServiceResponse<List<AdminPolicyResponseDto>>();
        var policies = await _policyRepository.GetAllPoliciesAsync();
        response.Data = _mapper.Map<List<AdminPolicyResponseDto>>(policies);
        response.Success = true;
        return response;
    }

    public async Task<ServiceResponse<AdminPolicyResponseDto>> GetPolicyByIdAsync(int id)
    {
        var response = new ServiceResponse<AdminPolicyResponseDto>();
        var policy = await _policyRepository.GetPolicyByIdAsync(id);
        if (policy == null)
        {
            response.Success = false;
            response.StatusCode = 404;
            response.Message = "Policy not found";
            return response;
        }

        response.Data = _mapper.Map<AdminPolicyResponseDto>(policy);
        response.Success = true;
        return response;
    }

    public async Task<ServiceResponse<AdminPolicyResponseDto>> CreatePolicyAsync(AdminCreatePolicyRequestDto request)
    {
        var response = new ServiceResponse<AdminPolicyResponseDto>();
        try
        {
            var policy = _mapper.Map<Policy>(request);
            await _policyRepository.AddPolicyAsync(policy);

            // Tự động đồng bộ lên AI Wiki (RAG)
            await _knowledgeSyncService.SyncPolicyAsync(policy.Id);

            response.Data = _mapper.Map<AdminPolicyResponseDto>(policy);
            response.Success = true;
            response.StatusCode = 201;
            response.Message = "Policy created and synced to AI successfully";
        }
        catch (Exception ex)
        {
            response.Success = false;
            response.StatusCode = 400;
            response.Message = "Error creating policy: " + ex.Message;
        }
        return response;
    }

    public async Task<ServiceResponse<AdminPolicyResponseDto>> UpdatePolicyAsync(int id, AdminUpdatePolicyRequestDto request)
    {
        var response = new ServiceResponse<AdminPolicyResponseDto>();
        try
        {
            var policy = await _policyRepository.GetPolicyByIdAsync(id);
            if (policy == null)
            {
                response.Success = false;
                response.StatusCode = 404;
                response.Message = "Policy not found";
                return response;
            }

            _mapper.Map(request, policy);
            policy.UpdatedAt = DateTime.UtcNow;
            await _policyRepository.UpdatePolicyAsync(policy);

            // Cập nhật lại kiến thức cho AI (RAG)
            await _knowledgeSyncService.SyncPolicyAsync(id);

            response.Data = _mapper.Map<AdminPolicyResponseDto>(policy);
            response.Success = true;
            response.Message = "Policy updated and AI knowledge refreshed";
        }
        catch (Exception ex)
        {
            response.Success = false;
            response.StatusCode = 400;
            response.Message = "Error updating policy: " + ex.Message;
        }
        return response;
    }

    public async Task<ServiceResponse<bool>> DeletePolicyAsync(int id)
    {
        var response = new ServiceResponse<bool>();
        try
        {
            await _policyRepository.DeletePolicyAsync(id);
            
            // Tự động xóa kiến thức khỏi AI (RAG)
            await _knowledgeSyncService.RemovePolicyKnowledgeAsync(id);
            
            response.Data = true;
            response.Success = true;
            response.Message = "Policy deleted and removed from AI knowledge";
        }
        catch (Exception ex)
        {
            response.Success = false;
            response.StatusCode = 400;
            response.Message = ex.Message;
            response.Data = false;
        }
        return response;
    }
}
