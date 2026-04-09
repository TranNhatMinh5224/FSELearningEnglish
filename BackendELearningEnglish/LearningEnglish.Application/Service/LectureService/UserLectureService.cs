using AutoMapper;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.Common.Constants;
using LearningEnglish.Application.Common.Helpers;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Services.Lecture;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Application.Interface.Infrastructure;
using LearningEnglish.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Service
{
    
    public class UserLectureService : IUserLectureService
    {
        private readonly ILectureRepository _lectureRepository;
        private readonly IModuleRepository _moduleRepository;
        private readonly ICourseRepository _courseRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<UserLectureService> _logger;
        private readonly ILectureMediaService _lectureMediaService;
        private readonly ICacheService _cache;

        public UserLectureService(
            ILectureRepository lectureRepository,
            IModuleRepository moduleRepository,
            ICourseRepository courseRepository,
            IMapper mapper,
            ILogger<UserLectureService> logger,
            ILectureMediaService lectureMediaService,
            ICacheService cache)
        {
            _lectureRepository = lectureRepository;
            _moduleRepository = moduleRepository;
            _courseRepository = courseRepository;
            _mapper = mapper;
            _logger = logger;
            _lectureMediaService = lectureMediaService;
            _cache = cache;
        }

        // Lấy thông tin lecture với progress của user (chỉ xem được nếu đã đăng ký course)
        public async Task<ServiceResponse<LectureDto>> GetLectureByIdAsync(int lectureId, int userId)
        {
            var response = new ServiceResponse<LectureDto>();

            try
            {
                var cacheKey = CacheKeys.LectureDetail(lectureId);
                var cachedDto = await _cache.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        var lecture = await _lectureRepository.GetLectureWithModuleCourseAsync(lectureId);
                        if (lecture == null) return null;

                        var dto = _mapper.Map<LectureDto>(lecture);
                        if (!string.IsNullOrWhiteSpace(dto.MediaUrl))
                        {
                            dto.MediaUrl = _lectureMediaService.BuildMediaUrl(dto.MediaUrl);
                        }
                        return dto;
                    },
                    TimeSpan.FromHours(1)
                );

                if (cachedDto == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy lecture";
                    return response;
                }

                // Check enrollment: user phải đăng ký course mới được xem lecture
                // Note: Module navigation is required for enrollment check
                var isEnrolled = await _courseRepository.IsUserEnrolledByLectureId(lectureId, userId);
                if (!isEnrolled)
                {
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Bạn cần đăng ký khóa học để xem lecture này";
                    return response;
                }

                response.Success = true;
                response.StatusCode = 200;
                response.Data = cachedDto.ShallowCopy();
                response.Message = "Lấy thông tin lecture thành công";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy lecture với ID: {LectureId}", lectureId);
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Có lỗi xảy ra khi lấy thông tin lecture";
            }

            return response;
        }

        // Lấy danh sách lecture theo module với progress của user (chỉ xem được nếu đã đăng ký course)
        public async Task<ServiceResponse<List<ListLectureDto>>> GetLecturesByModuleIdAsync(int moduleId, int userId)
        {
            var response = new ServiceResponse<List<ListLectureDto>>();

            try
            {
                // Lấy module để check course
                var module = await _moduleRepository.GetModuleWithCourseAsync(moduleId);
                if (module == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy module";
                    return response;
                }

                // Check enrollment: user phải đăng ký course mới được xem lecture
                var courseId = module.Lesson?.CourseId;
                if (!courseId.HasValue)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy khóa học";
                    return response;
                }

                var isEnrolled = await _courseRepository.IsUserEnrolled(courseId.Value, userId);
                if (!isEnrolled)
                {
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Bạn cần đăng ký khóa học để xem lecture";
                    _logger.LogWarning("User {UserId} attempted to list lectures of module {ModuleId} without enrollment in course {CourseId}", 
                        userId, moduleId, courseId.Value);
                    return response;
                }

                var cacheKey = CacheKeys.LecturesByModule(moduleId);
                var cachedDtos = await _cache.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        var lectures = await _lectureRepository.GetByModuleIdWithDetailsAsync(moduleId);
                        var dtos = _mapper.Map<List<ListLectureDto>>(lectures);
                        foreach (var dto in dtos)
                        {
                            if (!string.IsNullOrWhiteSpace(dto.MediaUrl))
                            {
                                dto.MediaUrl = _lectureMediaService.BuildMediaUrl(dto.MediaUrl);
                            }
                        }
                        return dtos;
                    },
                    TimeSpan.FromHours(1)
                );

                response.Success = true;
                response.StatusCode = 200;
                response.Data = (cachedDtos ?? new List<ListLectureDto>()).Select(l => l.ShallowCopy()).ToList();
                response.Message = $"Lấy danh sách {cachedDtos?.Count ?? 0} lecture thành công";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách lecture theo ModuleId: {ModuleId}", moduleId);
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Có lỗi xảy ra khi lấy danh sách lecture";
            }

            return response;
        }

        // Lấy cấu trúc cây lecture theo module với progress của user (chỉ xem được nếu đã đăng ký course)
        public async Task<ServiceResponse<List<LectureTreeDto>>> GetLectureTreeByModuleIdAsync(int moduleId, int userId)
        {
            var response = new ServiceResponse<List<LectureTreeDto>>();

            try
            {
                // Lấy module để check course
                var module = await _moduleRepository.GetModuleWithCourseAsync(moduleId);
                if (module == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy module";
                    return response;
                }

                // Check enrollment: user phải đăng ký course mới được xem lecture
                var courseId = module.Lesson?.CourseId;
                if (!courseId.HasValue)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy khóa học";
                    return response;
                }

                var isEnrolled = await _courseRepository.IsUserEnrolled(courseId.Value, userId);
                if (!isEnrolled)
                {
                    response.Success = false;
                    response.StatusCode = 403;
                    response.Message = "Bạn cần đăng ký khóa học để xem lecture";
                    _logger.LogWarning("User {UserId} attempted to get lecture tree of module {ModuleId} without enrollment in course {CourseId}", 
                        userId, moduleId, courseId.Value);
                    return response;
                }

                var cacheKey = CacheKeys.LectureTreeByModule(moduleId);
                var cachedTree = await _cache.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        var allLectures = await _lectureRepository.GetTreeByModuleIdAsync(moduleId);
                        
                        // Ensure URLs are built for all nodes in the tree logic
                        var rootLectures = allLectures.Where(l => l.ParentLectureId == null).OrderBy(l => l.OrderIndex).ToList();
                        var tree = new List<LectureTreeDto>();

                        foreach (var root in rootLectures)
                        {
                            var treeDto = _mapper.Map<LectureTreeDto>(root);
                            if (!string.IsNullOrWhiteSpace(treeDto.MediaUrl))
                                treeDto.MediaUrl = _lectureMediaService.BuildMediaUrl(treeDto.MediaUrl);
                                
                            BuildLectureTree(treeDto, allLectures);
                            tree.Add(treeDto);
                        }
                        return tree;
                    },
                    TimeSpan.FromHours(1)
                );

                response.Success = true;
                response.StatusCode = 200;
                response.Data = cachedTree!.Select(t => t.ShallowCopy()).ToList();
                response.Message = "Lấy cấu trúc cây lecture thành công";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy cấu trúc cây lecture theo ModuleId: {ModuleId}", moduleId);
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Có lỗi xảy ra khi lấy cấu trúc cây lecture";
            }

            return response;
        }

        // Helper method - Xây dựng cấu trúc cây
        private void BuildLectureTree(LectureTreeDto parent, List<Lecture> allLectures)
        {
            var children = allLectures
                .Where(l => l.ParentLectureId == parent.LectureId)
                .OrderBy(l => l.OrderIndex)
                .ToList();

            foreach (var child in children)
            {
                var childDto = _mapper.Map<LectureTreeDto>(child);
                if (!string.IsNullOrWhiteSpace(childDto.MediaUrl))
                {
                    childDto.MediaUrl = _lectureMediaService.BuildMediaUrl(childDto.MediaUrl);
                }
                
                parent.Children.Add(childDto);
                BuildLectureTree(childDto, allLectures);
            }
        }
    }
}
