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
        private readonly IMapper _mapper;
        private readonly IQuizGroupMediaService _quizGroupMediaService;
        private readonly ILogger<QuizGroupService> _logger;

        public QuizGroupService(
            IQuizGroupRepository quizGroupRepository,
            IMapper mapper,
            IQuizGroupMediaService quizGroupMediaService,
            ILogger<QuizGroupService> logger)
        {
            _quizGroupRepository = quizGroupRepository;
            _mapper = mapper;
            _quizGroupMediaService = quizGroupMediaService;
            _logger = logger;
        }

        private void BuildMediaUrls(QuizGroupDto dto)
        {
            if (!string.IsNullOrWhiteSpace(dto.ImgUrl)) dto.ImgUrl = _quizGroupMediaService.BuildImageUrl(dto.ImgUrl);
            if (!string.IsNullOrWhiteSpace(dto.VideoUrl)) dto.VideoUrl = _quizGroupMediaService.BuildVideoUrl(dto.VideoUrl);
            if (!string.IsNullOrWhiteSpace(dto.AudioUrl)) dto.AudioUrl = _quizGroupMediaService.BuildAudioUrl(dto.AudioUrl);
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
                        if (res.Success) quizGroup.ImgKey = committedImg = res.Data.ImageKey;
                    }
                    if (!string.IsNullOrWhiteSpace(createDto.VideoTempKey))
                    {
                        var res = await _quizGroupMediaService.CommitVideoAsync(createDto.VideoTempKey);
                        if (res.Success) quizGroup.VideoKey = committedVideo = res.Data.VideoKey;
                    }
                    if (!string.IsNullOrWhiteSpace(createDto.AudioTempKey))
                    {
                        var res = await _quizGroupMediaService.CommitAudioAsync(createDto.AudioTempKey);
                        if (res.Success) quizGroup.AudioKey = committedAudio = res.Data.AudioKey;
                    }
                }
                catch (Exception ex)
                {
                    await RollbackMedia(committedImg, committedVideo, committedAudio);
                    response.Success = false;
                    response.Message = $"Lỗi lưu file: {ex.Message}";
                    return response;
                }

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
                        if (res.Success) existing.ImgKey = newImg = res.Data.ImageKey;
                    }
                    if (!string.IsNullOrWhiteSpace(updateDto.VideoTempKey))
                    {
                        var res = await _quizGroupMediaService.CommitVideoAsync(updateDto.VideoTempKey);
                        if (res.Success) existing.VideoKey = newVid = res.Data.VideoKey;
                    }
                    if (!string.IsNullOrWhiteSpace(updateDto.AudioTempKey))
                    {
                        var res = await _quizGroupMediaService.CommitAudioAsync(updateDto.AudioTempKey);
                        if (res.Success) existing.AudioKey = newAud = res.Data.AudioKey;
                    }

                    await _quizGroupRepository.UpdateQuizGroupAsync(existing);
                    
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

            if (quizGroup.Questions?.Any() == true)
            {
                response.Success = false;
                response.Message = "Nhóm đã có câu hỏi, không thể xóa.";
                response.StatusCode = 400;
                return response;
            }

            await RollbackMedia(quizGroup.ImgKey, quizGroup.VideoKey, quizGroup.AudioKey);
            await _quizGroupRepository.DeleteQuizGroupAsync(quizGroupId);
            
            response.Data = true;
            response.Success = true;
            response.Message = "Xóa thành công.";
            return response;
        }
    }
}
