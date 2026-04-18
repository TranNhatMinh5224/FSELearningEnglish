using LearningEnglish.Application.Common;

namespace LearningEnglish.Application.Interface.IKnowledgeSyncService;
public interface IKnowledgeSyncService
{
    Task<ServiceResponse<bool>> SyncCourseAsync(int courseId);
    Task<ServiceResponse<bool>> SyncPackageAsync(int packageId);
    Task<ServiceResponse<bool>> SyncPolicyAsync(int policyId);
    Task<ServiceResponse<bool>> RemoveCourseKnowledgeAsync(int courseId);
    Task<ServiceResponse<bool>> RemovePackageKnowledgeAsync(int packageId);
    Task<ServiceResponse<bool>> RemovePolicyKnowledgeAsync(int policyId);
}