using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Services.Lesson;
using LearningEnglish.Application.Interface.Infrastructure;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.Common.Constants;
using AutoMapper;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Service
{
    
    public class LessonService : ILessonService
    {
        private readonly ILessonRepository _lessonRepository;
        private readonly IMapper _mapper;
        private readonly ICourseRepository _courseRepository;
        private readonly ILogger<LessonService> _logger;
        private readonly ILessonCompletionRepository _lessonCompletionRepository;
        private readonly ILessonImageService _lessonImageService;
        private readonly ICacheService _cache;

        public LessonService(
            ILessonRepository lessonRepository,
            IMapper mapper,
            ILogger<LessonService> logger,
            ICourseRepository courseRepository,
            ILessonCompletionRepository lessonCompletionRepository,
            ILessonImageService lessonImageService,
            ICacheService cache)
        {
            _lessonRepository = lessonRepository;
            _mapper = mapper;
            _logger = logger;
            _courseRepository = courseRepository;
            _lessonCompletionRepository = lessonCompletionRepository;
            _lessonImageService = lessonImageService;
            _cache = cache;
        }

        // Get lessons với progress 
        public async Task<ServiceResponse<List<LessonWithProgressDto>>> GetListLessonByCourseId(int courseId, int userId)
        {
            var response = new ServiceResponse<List<LessonWithProgressDto>>();
            try
            {
                var course = await _courseRepository.GetCourseById(courseId);
                if (course == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy khóa học";
                    return response;
                }

                // Cache phần cấu trúc lesson list
                var cachedLessons = await _cache.GetOrSetAsync(
                    CacheKeys.LessonsByCourse(courseId),
                    async () =>
                    {
                        var lessons = await _lessonRepository.GetListLessonByCourseId(courseId);
                        var dtos = lessons.Select(lesson =>
                        {
                            var dto = new LessonWithProgressDto
                            {
                                LessonId = lesson.LessonId,
                                Title = lesson.Title,
                                Description = lesson.Description,
                                OrderIndex = lesson.OrderIndex,
                                CourseId = lesson.CourseId,
                                ImageType = lesson.ImageType
                            };
                            if (!string.IsNullOrWhiteSpace(lesson.ImageKey))
                                dto.ImageUrl = _lessonImageService.BuildImageUrl(lesson.ImageKey);
                            return dto;
                        }).ToList();
                        return dtos;
                    },
                    TimeSpan.FromMinutes(30));

                // Clone các DTO từ cache và bổ sung progress cá nhân cho mỗi user
                var lessonDtos = cachedLessons!.Select(l => l.ShallowCopy()).ToList();

                foreach (var lessonDto in lessonDtos)
                {
                    var lessonCompletion = await _lessonCompletionRepository.GetByUserAndLessonAsync(userId, lessonDto.LessonId);
                    if (lessonCompletion != null)
                    {
                        lessonDto.CompletionPercentage = lessonCompletion.CompletionPercentage;
                        lessonDto.IsCompleted = lessonCompletion.IsCompleted;
                        lessonDto.CompletedModules = lessonCompletion.CompletedModules;
                        lessonDto.TotalModules = lessonCompletion.TotalModules;
                        lessonDto.VideoProgressPercentage = lessonCompletion.VideoProgressPercentage;
                        lessonDto.StartedAt = lessonCompletion.StartedAt;
                        lessonDto.CompletedAt = lessonCompletion.CompletedAt;
                    }
                }

                response.StatusCode = 200;
                response.Data = lessonDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting lessons");
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Đã xảy ra lỗi hệ thống";
            }
            return response;
        }
        
        // Get single lesson với progress (for User)
        public async Task<ServiceResponse<LessonWithProgressDto>> GetLessonById(int lessonId, int userId)
        {
            var response = new ServiceResponse<LessonWithProgressDto>();
            try
            {
                var lesson = await _lessonRepository.GetLessonById(lessonId);
                if (lesson == null)
                {
                    response.Success = false;
                    response.StatusCode = 404;
                    response.Message = "Không tìm thấy bài học";
                    return response;
                }

                var lessonDto = new LessonWithProgressDto
                {
                    LessonId = lesson.LessonId,
                    Title = lesson.Title,
                    Description = lesson.Description,
                    OrderIndex = lesson.OrderIndex,
                    CourseId = lesson.CourseId,
                    ImageType = lesson.ImageType
                };

                // Generate image URL
                if (!string.IsNullOrWhiteSpace(lesson.ImageKey))
                {
                    lessonDto.ImageUrl = _lessonImageService.BuildImageUrl(lesson.ImageKey);
                }

                // Load progress for logged-in user
                var lessonCompletion = await _lessonCompletionRepository.GetByUserAndLessonAsync(userId, lesson.LessonId);
                if (lessonCompletion != null)
                {
                    lessonDto.CompletionPercentage = lessonCompletion.CompletionPercentage;
                    lessonDto.IsCompleted = lessonCompletion.IsCompleted;
                    lessonDto.CompletedModules = lessonCompletion.CompletedModules;
                    lessonDto.TotalModules = lessonCompletion.TotalModules;
                    lessonDto.VideoProgressPercentage = lessonCompletion.VideoProgressPercentage;
                    lessonDto.StartedAt = lessonCompletion.StartedAt;
                    lessonDto.CompletedAt = lessonCompletion.CompletedAt;
                }

                response.StatusCode = 200;
                response.Data = lessonDto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting lesson");
                response.Success = false;
                response.StatusCode = 500;
                response.Message = "Đã xảy ra lỗi hệ thống";
            }
            return response;
        }
    }
}
