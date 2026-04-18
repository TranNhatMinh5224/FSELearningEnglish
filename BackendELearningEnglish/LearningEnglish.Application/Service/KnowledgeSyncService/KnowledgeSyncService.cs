using LearningEnglish.Application.Common;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.IKnowledgeSyncService;
using LearningEnglish.Application.Interface.Services.AI;
using LearningEnglish.Application.Interface.Repositories;
using LearningEnglish.Application.Interface.Services.Markdown;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;
using Pgvector;

namespace LearningEnglish.Application.Service.KnowledgeSyncService;

public class KnowledgeSyncService : IKnowledgeSyncService
{
    private readonly IMarkdownForWikiService _markdownForWikiService;
    private readonly IEmbeddingService _embeddingService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICourseRepository _courseRepository;
    private readonly ITeacherPackageRepository _packageRepository;
    private readonly IPolicyRepository _policyRepository;
    private readonly ICourseKnowledgeRepository _courseKnowledgeRepository;
    private readonly ITeacherPackageKnowledgeRepository _packageKnowledgeRepository;
    private readonly IPolicyKnowledgeRepository _policyKnowledgeRepository;

    public KnowledgeSyncService(
        IMarkdownForWikiService markdownForWikiService, 
        IEmbeddingService embeddingService, 
        IUnitOfWork unitOfWork,
        ICourseRepository courseRepository,
        ITeacherPackageRepository packageRepository,
        IPolicyRepository policyRepository,
        ICourseKnowledgeRepository courseKnowledgeRepository,
        ITeacherPackageKnowledgeRepository packageKnowledgeRepository,
        IPolicyKnowledgeRepository policyKnowledgeRepository)
    {
        _markdownForWikiService = markdownForWikiService;
        _embeddingService = embeddingService;
        _unitOfWork = unitOfWork;
        _courseRepository = courseRepository;
        _packageRepository = packageRepository;
        _policyRepository = policyRepository;
        _courseKnowledgeRepository = courseKnowledgeRepository;
        _packageKnowledgeRepository = packageKnowledgeRepository;
        _policyKnowledgeRepository = policyKnowledgeRepository;
    }

    public async Task<ServiceResponse<bool>> SyncCourseAsync(int courseId)
    { 
        var response = new ServiceResponse<bool>(); 
        try { 
            var course = await _courseRepository.GetCourseById(courseId);
            if (course == null)
            {
                response.Success = false; 
                response.Message = "Course not found";
                return response;
            }

            if (course.Type != CourseType.System)
            {
                // Nếu là khóa học giáo viên, đảm bảo xóa khỏi kiến thức AI (nếu có)
                await _courseKnowledgeRepository.DeleteAsync(courseId);
                response.Success = true;
                response.Message = "Skipped sync: Teacher courses are private and not indexed for public AI consultation.";
                return response;
            }

            var markdown = await _markdownForWikiService.GenCourseMarkdown(course); 
            var vector = await _embeddingService.GenerateEmbeddingAsync(markdown); 

            var knowledge = await _courseKnowledgeRepository.GetByCourseIdAsync(courseId);

            if (knowledge == null) {
                await _courseKnowledgeRepository.AddAsync(new CourseKnowledge {
                    CourseId = courseId,
                    MarkdownContent = markdown,
                    Embedding = new Vector(vector),
                    ContentHash = ""
                });
            } else {
                knowledge.MarkdownContent = markdown;
                knowledge.Embedding = new Vector(vector);
                await _courseKnowledgeRepository.UpdateAsync(knowledge);
            }

            response.Success = true;
            response.Data = true;
            response.Message = "Đồng bộ AI thành công";
        }
        catch (Exception ex)
        {
            response.Success = false;
            response.Message = ex.Message;
            response.Data = false;
        }
        return response;
    }

    public async Task<ServiceResponse<bool>> SyncPackageAsync(int packageId)
    {
        var response = new ServiceResponse<bool>();
        try {
            var package = await _packageRepository.GetTeacherPackageByIdAsync(packageId);
            if (package == null) {
                response.Success = false;
                response.Message = "Package not found";
                return response;
            }

            var markdown = await _markdownForWikiService.GenTeacherPackageMarkdown(package);
            var vector = await _embeddingService.GenerateEmbeddingAsync(markdown);

            var knowledge = await _packageKnowledgeRepository.GetByPackageIdAsync(packageId);

            if (knowledge == null) {
                await _packageKnowledgeRepository.AddAsync(new TeacherPackageKnowledge {
                    TeacherPackageId = packageId,
                    MarkdownContent = markdown,
                    Embedding = new Vector(vector),
                    ContentHash = ""
                });
            } else {
                knowledge.MarkdownContent = markdown;
                knowledge.Embedding = new Vector(vector);
                await _packageKnowledgeRepository.UpdateAsync(knowledge);
            }

            response.Success = true;
            response.Data = true;
        } catch (Exception ex) {
            response.Success = false;
            response.Message = ex.Message;
        }
        return response;
    }

    public async Task<ServiceResponse<bool>> SyncPolicyAsync(int policyId)
    {
        var response = new ServiceResponse<bool>();
        try {
            var policy = await _policyRepository.GetPolicyByIdAsync(policyId);
            if (policy == null) {
                response.Success = false;
                response.Message = "Policy not found";
                return response;
            }

            var markdown = await _markdownForWikiService.GenPolicyMarkdown(policy);
            var vector = await _embeddingService.GenerateEmbeddingAsync(markdown);

            var knowledge = await _policyKnowledgeRepository.GetByPolicyIdAsync(policyId);

            if (knowledge == null) {
                await _policyKnowledgeRepository.AddAsync(new PolicyKnowledge {
                    PolicyId = policyId,
                    MarkdownContent = markdown,
                    Embedding = new Vector(vector),
                    ContentHash = ""
                });
            } else {
                knowledge.MarkdownContent = markdown;
                knowledge.Embedding = new Vector(vector);
                await _policyKnowledgeRepository.UpdateAsync(knowledge);
            }

            response.Success = true;
            response.Data = true;
        } catch (Exception ex) {
            response.Success = false;
            response.Message = ex.Message;
        }
        return response;
    }

    public async Task<ServiceResponse<bool>> RemoveCourseKnowledgeAsync(int courseId)
    {
        var response = new ServiceResponse<bool>();
        try
        {
            await _courseKnowledgeRepository.DeleteAsync(courseId);
            response.Success = true;
            response.Data = true;
            response.Message = "Đã xóa kiến thức khóa học khỏi AI";
        }
        catch (Exception ex)
        {
            response.Success = false;
            response.Message = "Lỗi khi xóa kiến thức AI: " + ex.Message;
        }
        return response;
    }

    public async Task<ServiceResponse<bool>> RemovePackageKnowledgeAsync(int packageId)
    {
        var response = new ServiceResponse<bool>();
        try
        {
            await _packageKnowledgeRepository.DeleteAsync(packageId);
            response.Success = true;
            response.Data = true;
            response.Message = "Đã xóa kiến thức gói giáo viên khỏi AI";
        }
        catch (Exception ex)
        {
            response.Success = false;
            response.Message = "Lỗi khi xóa kiến thức AI: " + ex.Message;
        }
        return response;
    }

    public async Task<ServiceResponse<bool>> RemovePolicyKnowledgeAsync(int policyId)
    {
        var response = new ServiceResponse<bool>();
        try
        {
            await _policyKnowledgeRepository.DeleteAsync(policyId);
            response.Success = true;
            response.Data = true;
            response.Message = "Đã xóa kiến thức chính sách khỏi AI";
        }
        catch (Exception ex)
        {
            response.Success = false;
            response.Message = "Lỗi khi xóa kiến thức AI: " + ex.Message;
        }
        return response;
    }
}
