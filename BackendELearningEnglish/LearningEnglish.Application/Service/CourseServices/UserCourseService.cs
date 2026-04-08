using AutoMapper;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.Common.Constants;
using LearningEnglish.Application.Common.Helpers;
using LearningEnglish.Application.Common.Pagination;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Service
{
   
    public class UserCourseService : IUserCourseService
    {
        private readonly ICourseRepository _courseRepository;
        private readonly ICourseProgressRepository _courseProgressRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<UserCourseService> _logger;
        private readonly ICourseImageService _courseImageService;
        private readonly ICacheService _cache;

        public UserCourseService(
            ICourseRepository courseRepository,
            ICourseProgressRepository courseProgressRepository,
            IMapper mapper,
            ILogger<UserCourseService> logger,
            ICourseImageService courseImageService,
            ICacheService cache)
        {
            _courseRepository = courseRepository;
            _courseProgressRepository = courseProgressRepository;
            _mapper = mapper;
            _logger = logger;
            _courseImageService = courseImageService;
            _cache = cache;
        }
        //  Lấy danh sách Khóa học System 
        
        public async Task<ServiceResponse<IEnumerable<SystemCoursesListResponseDto>>> GetSystemCoursesAsync(int? userId = null)
        {
            var response = new ServiceResponse<IEnumerable<SystemCoursesListResponseDto>>();

            try
            {
                // Cache chỉ phần dữ liệu không phụ thuộc vào user (cấu trúc course + URL ảnh)
                var cachedBase = await _cache.GetOrSetAsync(
                    CacheKeys.SystemCourseList,
                    async () =>
                    {
                        var courses = await _courseRepository.GetSystemCourses();
                        var dtos = _mapper.Map<IEnumerable<SystemCoursesListResponseDto>>(courses).ToList();
                        foreach (var dto in dtos)
                        {
                            if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
                                dto.ImageUrl = _courseImageService.BuildImageUrl(dto.ImageUrl);
                            dto.IsEnrolled = false;
                        }
                        return dtos;
                    },
                    TimeSpan.FromHours(24));

                // Tạo bản copy để tránh sửa đổi cache gốc, rồi bổ sung IsEnrolled theo user
                var courseDtos = cachedBase!.Select(c => c.ShallowCopy()).ToList();

                if (userId.HasValue)
                {
                    foreach (var courseDto in courseDtos)
                        courseDto.IsEnrolled = await _courseRepository.IsUserEnrolled(courseDto.CourseId, userId.Value);
                }

                response.StatusCode = 200;
                response.Data = courseDtos;
                response.Message = "Lấy danh sách khóa học hệ thống thành công";
                response.Success = true;

                _logger.LogInformation("User retrieved {Count} system courses", courseDtos.Count);
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.StatusCode = 500;
                response.Message = $"Lỗi khi lấy danh sách khóa học hệ thống: {ex.Message}";
                _logger.LogError(ex, "Error in GetSystemCoursesAsync");
            }

            return response;
        }

        // lấy Thông tin chi tiết 1 Course 
        public async Task<ServiceResponse<CourseDetailWithEnrollmentDto>> GetCourseByIdAsync(int courseId, int? userId = null)
        {
            var response = new ServiceResponse<CourseDetailWithEnrollmentDto>();

            try
            {
                // Cache phần cấu trúc course (không bao gồm dữ liệu cá nhân của user)
                var cachedCourse = await _cache.GetOrSetAsync(
                    CacheKeys.CourseDetail(courseId),
                    async () =>
                    {
                        var course = await _courseRepository.GetCourseById(courseId);
                        if (course == null) return null;
                        var dto = _mapper.Map<CourseDetailWithEnrollmentDto>(course);
                        if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
                            dto.ImageUrl = _courseImageService.BuildImageUrl(dto.ImageUrl);
                        dto.IsEnrolled = false;
                        return dto;
                    },
                    TimeSpan.FromMinutes(30));

                if (cachedCourse == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy khóa học";
                    return response;
                }

                // Tạo bản copy, bổ sung dữ liệu cá nhân theo user
                var courseDto = cachedCourse.ShallowCopy();

                if (userId.HasValue)
                {
                    courseDto.IsEnrolled = await _courseRepository.IsUserEnrolled(courseId, userId.Value);
                    if (courseDto.IsEnrolled)
                    {
                        var courseProgress = await _courseProgressRepository.GetByUserAndCourseAsync(userId.Value, courseId);
                        if (courseProgress != null)
                        {
                            courseDto.ProgressPercentage = courseProgress.ProgressPercentage;
                            courseDto.CompletedLessons = courseProgress.CompletedLessons;
                            courseDto.IsCompleted = courseProgress.IsCompleted;
                            courseDto.EnrolledAt = courseProgress.EnrolledAt;
                            courseDto.CompletedAt = courseProgress.CompletedAt;
                        }
                    }
                }

                response.StatusCode = 200;
                response.Data = courseDto;
                response.Message = "Lấy thông tin khóa học thành công";
                response.Success = true;

                _logger.LogInformation("Retrieved course {CourseId} details (cached), userId: {UserId}", courseId, userId);
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.StatusCode = 500;
                response.Message = $"Lỗi khi lấy thông tin khóa học: {ex.Message}";
                _logger.LogError(ex, "Error in GetCourseByIdAsync for course {CourseId}", courseId);
            }

            return response;
        }
        // Tìm kiếm khóa học
        public async Task<ServiceResponse<IEnumerable<SystemCoursesListResponseDto>>> SearchCoursesAsync(string keyword)
        {
            var response = new ServiceResponse<IEnumerable<SystemCoursesListResponseDto>>();

            try
            {
                var courses = await _courseRepository.SearchCourses(keyword);
                _logger.LogInformation("Search for '{Keyword}' found {Count} courses in repository", keyword, courses?.Count() ?? 0);

                var courseDtos = _mapper.Map<IEnumerable<SystemCoursesListResponseDto>>(courses).ToList();
                _logger.LogInformation("Mapped {Count} course DTOs for search results", courseDtos.Count);

                // Generate URL từ key cho tất cả courses
                foreach (var courseDto in courseDtos)
                {
                    if (!string.IsNullOrWhiteSpace(courseDto.ImageUrl))
                    {
                        courseDto.ImageUrl = _courseImageService.BuildImageUrl(courseDto.ImageUrl);
                    }
                }

                response.StatusCode = 200;
                response.Data = courseDtos;
                response.Message = "Tìm kiếm khóa học thành công";
                response.Success = true;

                _logger.LogInformation("Searched courses with keyword '{Keyword}', found {Count} results", keyword, courseDtos.Count);
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.StatusCode = 500;
                response.Message = $"Lỗi khi tìm kiếm khóa học: {ex.Message}";
                _logger.LogError(ex, "Error in SearchCoursesAsync with keyword '{Keyword}'", keyword);
            }

            return response;
        }






        // Lấy danh sách khóa học đã đăng ký của user với phân trang






        
         public async Task<ServiceResponse<PagedResult<EnrolledCourseWithProgressDto>>> GetMyEnrolledCoursesPagedAsync(int userId, PageRequest request)
        {
            var response = new ServiceResponse<PagedResult<EnrolledCourseWithProgressDto>>();

            try
            {
                var pagedCourses = await _courseRepository.GetEnrolledCoursesByUserPagedAsync(userId, request);

                if (pagedCourses.Items == null || !pagedCourses.Items.Any())
                {
                    response.Data = new PagedResult<EnrolledCourseWithProgressDto>
                    {
                        Items = new List<EnrolledCourseWithProgressDto>(),
                        TotalCount = 0,
                        PageNumber = request.PageNumber,
                        PageSize = request.PageSize
                    };
                    response.Message = "No enrolled courses found";
                    return response;
                }

                // Map to EnrolledCourseWithProgressDto and populate progress data
                var courseDtos = new List<EnrolledCourseWithProgressDto>();

                foreach (var course in pagedCourses.Items)
                {
                    var courseDto = _mapper.Map<EnrolledCourseWithProgressDto>(course);

                    // Get progress information for this course
                    var courseProgress = await _courseProgressRepository.GetByUserAndCourseAsync(userId, course.CourseId);

                    if (courseProgress != null)
                    {
                        courseDto.ProgressPercentage = courseProgress.ProgressPercentage;
                        courseDto.CompletedLessons = courseProgress.CompletedLessons;
                        courseDto.TotalLessons = courseProgress.TotalLessons;
                        courseDto.IsCompleted = courseProgress.IsCompleted;
                        courseDto.EnrolledAt = courseProgress.EnrolledAt;
                        courseDto.CompletedAt = courseProgress.CompletedAt;
                    }
                    else
                    {
                        // No progress yet, set default values
                        courseDto.ProgressPercentage = 0;
                        courseDto.CompletedLessons = 0;
                        courseDto.TotalLessons = course.Lessons?.Count ?? 0;
                        courseDto.IsCompleted = false;
                        courseDto.EnrolledAt = DateTime.UtcNow;
                        courseDto.CompletedAt = null;
                    }

                    // Generate image URL
                    if (!string.IsNullOrWhiteSpace(courseDto.ImageUrl))
                    {
                        courseDto.ImageUrl = _courseImageService.BuildImageUrl(courseDto.ImageUrl);
                    }

                    courseDtos.Add(courseDto);
                }

                response.Success = true;
                response.Data = new PagedResult<EnrolledCourseWithProgressDto>
                {
                    Items = courseDtos,
                    TotalCount = pagedCourses.TotalCount,
                    PageNumber = pagedCourses.PageNumber,
                    PageSize = pagedCourses.PageSize
                };
                response.Message = $"Retrieved {courseDtos.Count} of {pagedCourses.TotalCount} enrolled courses";

                _logger.LogInformation("User {UserId} has {Count}/{Total} enrolled courses on page {Page}", 
                    userId, courseDtos.Count, pagedCourses.TotalCount, request.PageNumber);
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.StatusCode = 500;
                response.Message = $"Error retrieving enrolled courses: {ex.Message}";
                _logger.LogError(ex, "Error in GetMyEnrolledCoursesPagedAsync for UserId: {UserId}", userId);
            }

            return response;
        }
    }
}

    

