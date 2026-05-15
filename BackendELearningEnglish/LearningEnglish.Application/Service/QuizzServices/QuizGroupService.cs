using AutoMapper;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Service
{
    public class QuizGroupService : IQuizGroupService
    {
        private readonly IQuizGroupRepository _quizGroupRepository;
        private readonly IQuizRepository _quizRepository;
        private readonly IMapper _mapper;
        private readonly IQuizGroupMediaService _quizGroupMediaService;
        private readonly IQuestionMediaService _questionMediaService; // Added
        private readonly ILogger<QuizGroupService> _logger;

        public QuizGroupService(
            IQuizGroupRepository quizGroupRepository,
            IQuizRepository quizRepository,
            IMapper mapper,
            IQuizGroupMediaService quizGroupMediaService,
            IQuestionMediaService questionMediaService, // Added
            ILogger<QuizGroupService> logger)
        {
            _quizGroupRepository = quizGroupRepository;
            _quizRepository = quizRepository;
            _mapper = mapper;
            _quizGroupMediaService = quizGroupMediaService;
            _questionMediaService = questionMediaService; // Added
            _logger = logger;
        }

        private void BuildMediaUrls(QuizGroupDto dto)
        {
            if (!string.IsNullOrWhiteSpace(dto.ImgKey)) dto.ImgKey = _quizGroupMediaService.BuildImageUrl(dto.ImgKey);
            if (!string.IsNullOrWhiteSpace(dto.VideoKey)) dto.VideoKey = _quizGroupMediaService.BuildVideoUrl(dto.VideoKey);
            if (!string.IsNullOrWhiteSpace(dto.AudioKey)) dto.AudioKey = _quizGroupMediaService.BuildAudioUrl(dto.AudioKey);

            // Xử lý media cho các câu hỏi bên trong group
            if (dto.Questions != null)
            {
                foreach (var q in dto.Questions)
                {
                    if (!string.IsNullOrWhiteSpace(q.MediaUrl))
                        q.MediaUrl = _questionMediaService.BuildMediaUrl(q.MediaUrl);
                    
                    if (q.Options != null)
                    {
                        foreach (var opt in q.Options)
                        {
                            if (!string.IsNullOrWhiteSpace(opt.MediaUrl))
                                opt.MediaUrl = _questionMediaService.BuildMediaUrl(opt.MediaUrl);
                        }
                    }
                }
            }
        }

        public async Task<ServiceResponse<QuizGroupDto>> CreateQuizGroupAsync(CreateQuizGroupDto createDto)
        {
            var response = new ServiceResponse<QuizGroupDto>();
            try
            {
                var quizSection = await _quizGroupRepository.GetQuizSectionByIdAsync(createDto.QuizSectionId);
                if (quizSection == null)
                {
                    response.Success = false;
                    response.Message = "Quiz section không tồn tại.";
                    response.StatusCode = 404;
                    return response;
                }

                var quizGroup = _mapper.Map<QuizGroup>(createDto);
                
                // Commit Media (Multi-media support)
                string? committedImg = null, committedVideo = null, committedAudio = null;
                try
                {
                    if (!string.IsNullOrWhiteSpace(createDto.ImgTempKey))
                    {
                        var res = await _quizGroupMediaService.CommitImageAsync(createDto.ImgTempKey);
                        if (res.Success) 
                        {
                            quizGroup.ImgKey = committedImg = res.Data.ImageKey;
                            _logger.LogInformation("Committed Group Image: {Key}", committedImg);
                        }
                    }
                    if (!string.IsNullOrWhiteSpace(createDto.VideoTempKey))
                    {
                        var res = await _quizGroupMediaService.CommitVideoAsync(createDto.VideoTempKey);
                        if (res.Success) 
                        {
                            quizGroup.VideoKey = committedVideo = res.Data.VideoKey;
                            _logger.LogInformation("Committed Group Video: {Key}", committedVideo);
                        }
                    }
                    if (!string.IsNullOrWhiteSpace(createDto.AudioTempKey))
                    {
                        var res = await _quizGroupMediaService.CommitAudioAsync(createDto.AudioTempKey);
                        if (res.Success) 
                        {
                            quizGroup.AudioKey = committedAudio = res.Data.AudioKey;
                            _logger.LogInformation("Committed Group Audio: {Key}", committedAudio);
                        }
                    }
                }
                catch (Exception ex)
                {
                    await RollbackMedia(committedImg, committedVideo, committedAudio);
                    response.Success = false;
                    response.Message = $"Lỗi lưu file: {ex.Message}";
                    return response;
                }

                _logger.LogInformation("Lưu QuizGroup vào DB. ImgKey chuẩn bị lưu: {Key}", quizGroup.ImgKey);
                try
                {
                    var result = await _quizGroupRepository.CreateQuizGroupAsync(quizGroup);
                    var dto = _mapper.Map<QuizGroupDto>(result);
                    BuildMediaUrls(dto);
                    
                    response.Data = dto;
                    response.Success = true;
                    response.Message = "Tạo nhóm câu hỏi thành công.";
                    response.StatusCode = 201;
                    return response;
                }
                catch (Exception dbEx)
                {
                    await RollbackMedia(committedImg, committedVideo, committedAudio);
                    response.Success = false;
                    response.Message = $"Lỗi database: {dbEx.Message}";
                    response.StatusCode = 500;
                    return response;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CreateQuizGroup error");
                response.Success = false;
                response.Message = ex.Message;
                response.StatusCode = 500;
                return response;
            }
        }

        public async Task<ServiceResponse<QuizGroupDto>> UpdateQuizGroupAsync(int quizGroupId, UpdateQuizGroupDto updateDto)
        {
            var response = new ServiceResponse<QuizGroupDto>();
            try
            {
                var existing = await _quizGroupRepository.GetQuizGroupByIdAsync(quizGroupId);
                if (existing == null)
                {
                    response.Success = false;
                    response.Message = "Không tìm thấy nhóm.";
                    response.StatusCode = 404;
                    return response;
                }

                string? oldImg = existing.ImgKey, oldVid = existing.VideoKey, oldAud = existing.AudioKey;
                string? newImg = null, newVid = null, newAud = null;

                // Map changes
                _mapper.Map(updateDto, existing);

                try
                {
                    if (!string.IsNullOrWhiteSpace(updateDto.ImgTempKey))
                    {
                        var res = await _quizGroupMediaService.CommitImageAsync(updateDto.ImgTempKey);
                        if (res.Success) 
                        {
                            existing.ImgKey = newImg = res.Data.ImageKey;
                            _logger.LogInformation("Updated Group Image: {Key}", newImg);
                        }
                    }
                    if (!string.IsNullOrWhiteSpace(updateDto.VideoTempKey))
                    {
                        var res = await _quizGroupMediaService.CommitVideoAsync(updateDto.VideoTempKey);
                        if (res.Success) 
                        {
                            existing.VideoKey = newVid = res.Data.VideoKey;
                            _logger.LogInformation("Updated Group Video: {Key}", newVid);
                        }
                    }
                    if (!string.IsNullOrWhiteSpace(updateDto.AudioTempKey))
                    {
                        var res = await _quizGroupMediaService.CommitAudioAsync(updateDto.AudioTempKey);
                        if (res.Success) 
                        {
                            existing.AudioKey = newAud = res.Data.AudioKey;
                            _logger.LogInformation("Updated Group Audio: {Key}", newAud);
                        }
                    }

                    await _quizGroupRepository.UpdateQuizGroupAsync(existing);
                    
                    // Synchronize Quiz Total Score
                    try
                    {
                        var section = await _quizGroupRepository.GetQuizSectionByIdAsync(existing.QuizSectionId);
                        if (section != null)
                        {
                            await UpdateQuizTotalScoreAsync(section.QuizId);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error synchronizing quiz score after group update");
                    }
                    
                    // Cleanup old files
                    if (newImg != null && !string.IsNullOrWhiteSpace(oldImg)) await _quizGroupMediaService.DeleteImageAsync(oldImg);
                    if (newVid != null && !string.IsNullOrWhiteSpace(oldVid)) await _quizGroupMediaService.DeleteVideoAsync(oldVid);
                    if (newAud != null && !string.IsNullOrWhiteSpace(oldAud)) await _quizGroupMediaService.DeleteAudioAsync(oldAud);

                    var dto = _mapper.Map<QuizGroupDto>(existing);
                    BuildMediaUrls(dto);
                    
                    response.Data = dto;
                    response.Success = true;
                    response.Message = "Cập nhật thành công.";
                    return response;
                }
                catch (Exception ex)
                {
                    await RollbackMedia(newImg, newVid, newAud);
                    response.Success = false;
                    response.Message = $"Lỗi xử lý: {ex.Message}";
                    return response;
                }
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Message = ex.Message;
                response.StatusCode = 500;
                return response;
            }
        }

        private async Task RollbackMedia(string? img, string? vid, string? aud)
        {
            if (img != null) await _quizGroupMediaService.DeleteImageAsync(img);
            if (vid != null) await _quizGroupMediaService.DeleteVideoAsync(vid);
            if (aud != null) await _quizGroupMediaService.DeleteAudioAsync(aud);
        }

        public async Task<ServiceResponse<QuizGroupDto>> GetQuizGroupByIdAsync(int quizGroupId)
        {
            var response = new ServiceResponse<QuizGroupDto>();
            var quizGroup = await _quizGroupRepository.GetQuizGroupByIdAsync(quizGroupId);
            if (quizGroup == null)
            {
                response.Success = false;
                response.Message = "Không tìm thấy.";
                response.StatusCode = 404;
                return response;
            }

            var dto = _mapper.Map<QuizGroupDto>(quizGroup);
            BuildMediaUrls(dto);
            
            response.Data = dto;
            response.Success = true;
            return response;
        }

        public async Task<ServiceResponse<List<QuizGroupDto>>> GetQuizGroupsByQuizSectionIdAsync(int quizSectionId)
        {
            var response = new ServiceResponse<List<QuizGroupDto>>();
            var groups = await _quizGroupRepository.GetQuizGroupsByQuizSectionIdAsync(quizSectionId);
            var dtos = _mapper.Map<List<QuizGroupDto>>(groups);
            dtos.ForEach(BuildMediaUrls);
            
            response.Data = dtos;
            response.Success = true;
            return response;
        }

        public async Task<ServiceResponse<bool>> DeleteQuizGroupAsync(int quizGroupId)
        {
            var response = new ServiceResponse<bool>();
            var quizGroup = await _quizGroupRepository.GetQuizGroupByIdAsync(quizGroupId);
            if (quizGroup == null)
            {
                response.Success = false;
                response.Message = "Không tìm thấy.";
                response.StatusCode = 404;
                return response;
            }

            int? quizIdToUpdate = quizGroup.QuizSection?.QuizId;

            // Xóa media của các câu hỏi bên trong nhóm trước
            if (quizGroup.Questions != null)
            {
                foreach (var q in quizGroup.Questions)
                {
                    if (!string.IsNullOrWhiteSpace(q.MediaKey))
                        await _questionMediaService.DeleteMediaAsync(q.MediaKey);
                    
                    if (q.Options != null)
                    {
                        foreach (var opt in q.Options)
                        {
                            if (!string.IsNullOrWhiteSpace(opt.MediaKey))
                                await _questionMediaService.DeleteMediaAsync(opt.MediaKey);
                        }
                    }
                }
            }

            // Xóa media của chính nhóm đó
            await RollbackMedia(quizGroup.ImgKey, quizGroup.VideoKey, quizGroup.AudioKey);
            
            // Thực hiện xóa nhóm (Repository nên xử lý việc xóa Questions/Options lồng nhau)
            await _quizGroupRepository.DeleteQuizGroupAsync(quizGroupId);
            
            // Cập nhật lại điểm tổng của Quiz
            if (quizIdToUpdate.HasValue)
            {
                await UpdateQuizTotalScoreAsync(quizIdToUpdate.Value);
            }

            response.Data = true;
            response.Success = true;
            response.Message = "Xóa thành công.";
            return response;
        }

        private async Task UpdateQuizTotalScoreAsync(int quizId)
        {
            try
            {
                var quiz = await _quizRepository.GetFullQuizAsync(quizId);
                if (quiz == null) return;
                
                decimal total = 0;
                bool hasChanges = false;

                foreach (var section in quiz.QuizSections)
                {
                    // [1] Update SumScore for Groups in this section
                    foreach (var group in section.QuizGroups)
                    {
                        decimal groupTotal = group.Questions.Sum(q => q.Points);
                        if (group.SumScore != groupTotal)
                        {
                            group.SumScore = groupTotal;
                            group.UpdatedAt = DateTime.UtcNow;
                            hasChanges = true;
                        }
                        total += groupTotal;
                    }

                    // [2] Add points from standalone questions
                    var standalonePoints = section.Questions
                        .Where(q => q.QuizGroupId == null)
                        .Sum(q => q.Points);
                    
                    total += standalonePoints;
                }

                if (quiz.TotalPossibleScore != total)
                {
                    quiz.TotalPossibleScore = total;
                    quiz.UpdatedAt = DateTime.UtcNow;
                    hasChanges = true;
                }

                if (hasChanges)
                {
                    await _quizRepository.UpdateQuizAsync(quiz);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating quiz score for Quiz {QuizId}", quizId);
            }
        }
    }
}
