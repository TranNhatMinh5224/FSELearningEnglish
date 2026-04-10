using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Interface.Services.TeacherPackage;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.Common.Constants;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure;
using LearningEnglish.Application.Interface.Infrastructure.ChatBotAI;

using LearningEnglish.Domain.Entities;
using AutoMapper;
using Microsoft.Extensions.Logging;


namespace LearningEnglish.Application.Service
{
    public class TeacherPackageService : ITeacherPackageService
    {
        private readonly ITeacherPackageRepository _teacherPackageRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<TeacherPackageService> _logger;
        private readonly IEmbeddingIngestionService _embeddingIngestionService;
        private readonly ICacheService _cache;

        public TeacherPackageService(
            ITeacherPackageRepository teacherPackageRepository,
            IMapper mapper,
            ILogger<TeacherPackageService> logger,
            IEmbeddingIngestionService embeddingIngestionService,
            ICacheService cache)
        {
            _teacherPackageRepository = teacherPackageRepository;
            _mapper = mapper;
            _logger = logger;
            _embeddingIngestionService = embeddingIngestionService;
            _cache = cache;
        }

        // Chỉ Admin mới có thể CRUD (đã có Permission check ở controller)
        public async Task<ServiceResponse<List<TeacherPackageDto>>> GetAllTeacherPackagesAsync()
        {
            var response = new ServiceResponse<List<TeacherPackageDto>>();
            try
            {
                // NOTE: Bỏ cache cho teacher packages để tránh dữ liệu cũ sau khi CRUD.
                var data = await _teacherPackageRepository.GetAllTeacherPackagesAsync();
                var packages = _mapper.Map<List<TeacherPackageDto>>(data);

                response.StatusCode = 200;
                response.Data = packages;
                response.Success = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all teacher packages.");
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Đã xảy ra lỗi khi lấy danh sách gói giáo viên";
            }
            return response;
        }
        // Lấy TeacherPackage theo ID 
        public async Task<ServiceResponse<TeacherPackageDto>> GetTeacherPackageByIdAsync(int id)
        {
            var response = new ServiceResponse<TeacherPackageDto>();
            try
            {
                var teacherPackage = await _teacherPackageRepository.GetTeacherPackageByIdAsync(id);
                if (teacherPackage != null)
                {
                    response.StatusCode = 200;
                    response.Data = _mapper.Map<TeacherPackageDto>(teacherPackage);
                    response.Success = true;
                }
                else
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy gói giáo viên";
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving teacher package with ID {id}.");
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Đã xảy ra lỗi khi lấy thông tin gói giáo viên";
            }
            return response;
        }
        // Tạo TeacherPackage mới 
        public async Task<ServiceResponse<TeacherPackageDto>> CreateTeacherPackageAsync(CreateTeacherPackageDto dto)
        {
            var response = new ServiceResponse<TeacherPackageDto>();
            try
            {
                // kiểm tra xem gói giáo viên đã tồn tại chưa
                var existingPackage = await _teacherPackageRepository.GetAllTeacherPackagesAsync();
                if (existingPackage.Any(p => p.PackageName == dto.PackageName))
                {
                    response.Success = false;
                    response.StatusCode = 400;
                    response.Message = "Gói giáo viên với tên này đã tồn tại";
                    return response;
                }

                var teacherPackage = _mapper.Map<TeacherPackage>(dto);
                await _teacherPackageRepository.AddTeacherPackageAsync(teacherPackage);
                // Invalidate list cache ngay sau khi CRUD để tránh cache giữ dữ liệu cũ
                _cache.RemoveByPrefix(CacheKeys.TeacherPackagesPrefix);

                // Embedding ingestion chỉ phục vụ chatbot/search, không nên làm fail CRUD.
                try
                {
                    await _embeddingIngestionService.UpsertTeacherPackageEmbeddingAsync(teacherPackage);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Teacher package {TeacherPackageId} created but embedding upsert failed",
                        teacherPackage.TeacherPackageId);
                    response.Message = "Tạo gói giáo viên thành công nhưng cập nhật embedding thất bại";
                }
                response.StatusCode = 201;
                response.Data = _mapper.Map<TeacherPackageDto>(teacherPackage);
                response.Success = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating teacher package.");
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Đã xảy ra lỗi khi tạo gói giáo viên";
            }
            return response;
        }
        // Cập nhật TeacherPackage theo ID
        public async Task<ServiceResponse<TeacherPackageDto>> UpdateTeacherPackageAsync(int id, UpdateTeacherPackageDto dto)
        {
            var response = new ServiceResponse<TeacherPackageDto>();
            try
            {
                var existingPackage = await _teacherPackageRepository.GetTeacherPackageByIdAsync(id);
                if (existingPackage == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy gói giáo viên";
                    return response;
                }

                // Check duplicate package name nếu có thay đổi tên
                if (!string.IsNullOrWhiteSpace(dto.PackageName) && dto.PackageName != existingPackage.PackageName)
                {
                    var allPackages = await _teacherPackageRepository.GetAllTeacherPackagesAsync();
                    if (allPackages.Any(p => p.PackageName == dto.PackageName && p.TeacherPackageId != id))
                    {
                        response.Success = false;
                        response.StatusCode = 400;
                        response.Message = "Gói giáo viên với tên này đã tồn tại";
                        return response;
                    }
                }

                // Partial update - chỉ cập nhật những trường không null
                if (!string.IsNullOrWhiteSpace(dto.PackageName))
                    existingPackage.PackageName = dto.PackageName;

                if (dto.Level.HasValue)
                    existingPackage.Level = dto.Level.Value;

                if (dto.Price.HasValue)
                    existingPackage.Price = dto.Price.Value;

                if (dto.MaxCourses.HasValue)
                    existingPackage.MaxCourses = dto.MaxCourses.Value;

                if (dto.MaxLessons.HasValue)
                    existingPackage.MaxLessons = dto.MaxLessons.Value;

                if (dto.MaxStudents.HasValue)
                    existingPackage.MaxStudents = dto.MaxStudents.Value;

                await _teacherPackageRepository.UpdateTeacherPackageAsync(existingPackage);
                _cache.RemoveByPrefix(CacheKeys.TeacherPackagesPrefix);

                try
                {
                    await _embeddingIngestionService.UpsertTeacherPackageEmbeddingAsync(existingPackage);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Teacher package {TeacherPackageId} updated but embedding upsert failed",
                        existingPackage.TeacherPackageId);
                    // Không fail update nếu embedding lỗi.
                }

                var result = _mapper.Map<TeacherPackageDto>(existingPackage);
                return new ServiceResponse<TeacherPackageDto>
                {
                    StatusCode = 200,
                    Data = result,
                    Success = true,
                    Message = "Cập nhật gói giáo viên thành công"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating teacher package.");
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Đã xảy ra lỗi khi cập nhật gói giáo viên";
            }
            return response;
        }
        // Xóa TeacherPackage theo ID
        public async Task<ServiceResponse<bool>> DeleteTeacherPackageAsync(int id)
        {
            var response = new ServiceResponse<bool>();
            try
            {
                // Kiểm tra xem gói giáo viên có tồn tại không
                var existingPackage = await _teacherPackageRepository.GetTeacherPackageByIdAsync(id);
                if (existingPackage == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy gói giáo viên";
                    response.Data = false;
                    return response;
                }

                // Kiểm tra xem package có đang được sử dụng bởi subscriptions không
                var hasSubscriptions = await _teacherPackageRepository.HasActiveSubscriptionsAsync(id);
                if (hasSubscriptions)
                {
                    _logger.LogWarning("Attempted to delete teacher package {PackageId} that has active subscriptions", id);
                    response.Success = false;
                    response.StatusCode = 400;
                    response.Data = false;
                    response.Message = "Không thể xóa gói giáo viên đang được sử dụng. Vui lòng xóa các subscription liên quan trước";
                    return response;
                }

                await _teacherPackageRepository.DeleteTeacherPackageAsync(id);
                _cache.RemoveByPrefix(CacheKeys.TeacherPackagesPrefix);

                try
                {
                    await _embeddingIngestionService.DeleteTeacherPackageEmbeddingsAsync(id);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Teacher package {TeacherPackageId} deleted but embedding cleanup failed",
                        id);
                    // Không fail delete nếu embedding cleanup lỗi.
                }
                response.StatusCode = 200;
                response.Data = true;
                response.Success = true;
                response.Message = "Xóa gói giáo viên thành công";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting teacher package with ID {id}.");
                response.Data = false;
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Đã xảy ra lỗi khi xóa gói giáo viên";
            }
            return response;
        }

    }
}
