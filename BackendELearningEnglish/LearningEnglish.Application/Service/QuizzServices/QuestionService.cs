using LearningEnglish.Application.Interface;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.Common.Helpers;
using LearningEnglish.Application.Interface.Infrastructure.MediaService;
using LearningEnglish.Domain.Entities;
using AutoMapper;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Application.Service
{
    public class QuestionService : IQuestionService
    {
        private readonly IQuestionRepository _questionRepository;
        private readonly IQuizGroupRepository _quizGroupRepository;
        private readonly IQuizSectionRepository _quizSectionRepository;
        private readonly IQuizRepository _quizRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<QuestionService> _logger;
        private readonly IQuestionMediaService _questionMediaService;
        private readonly IQuizGroupMediaService _quizGroupMediaService;

        public QuestionService(
            IQuestionRepository questionRepository,
            IQuizGroupRepository quizGroupRepository,
            IQuizSectionRepository quizSectionRepository,
            IQuizRepository quizRepository,
            IMapper mapper,
            ILogger<QuestionService> logger,
            IQuestionMediaService questionMediaService,
            IQuizGroupMediaService quizGroupMediaService)
        {
            _questionRepository = questionRepository;
            _quizGroupRepository = quizGroupRepository;
            _quizSectionRepository = quizSectionRepository;
            _quizRepository = quizRepository;
            _mapper = mapper;
            _logger = logger;
            _questionMediaService = questionMediaService;
            _quizGroupMediaService = quizGroupMediaService;
        }

        private async Task<(string? mediaKey, List<(int index, string key)> optionKeys, bool success, string? errorMessage)> CommitAllMediaAsync(QuestionCreateDto dto)
        {
            string? committedQuestionMediaKey = null;
            var committedOptionMediaKeys = new List<(int index, string key)>();

            try
            {
                if (!string.IsNullOrWhiteSpace(dto.MediaTempKey))
                {
                    var result = await _questionMediaService.CommitMediaAsync(dto.MediaTempKey!);
                    if (!result.Success) return (null, null!, false, "Không thể lưu media câu hỏi");
                    committedQuestionMediaKey = result.Data.MediaKey;
                }

                if (dto.Options != null)
                {
                    for (int i = 0; i < dto.Options.Count; i++)
                    {
                        var tempKey = dto.Options[i].MediaTempKey;
                        if (!string.IsNullOrWhiteSpace(tempKey))
                        {
                            var result = await _questionMediaService.CommitMediaAsync(tempKey!);
                            if (!result.Success)
                            {
                                await RollbackCommittedMediaAsync(committedQuestionMediaKey, committedOptionMediaKeys);
                                return (null, null!, false, $"Không thể lưu media đáp án {i + 1}");
                            }
                            committedOptionMediaKeys.Add((i, result.Data.MediaKey));
                        }
                    }
                }

                return (committedQuestionMediaKey, committedOptionMediaKeys, true, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Critical error during media commitment");
                await RollbackCommittedMediaAsync(committedQuestionMediaKey, committedOptionMediaKeys);
                return (null, null!, false, "Lỗi hệ thống khi xử lý media");
            }
        }

        private async Task RollbackCommittedMediaAsync(string? questionMediaKey, List<(int index, string key)> optionKeys)
        {
            if (questionMediaKey != null) await _questionMediaService.DeleteMediaAsync(questionMediaKey);
            if (optionKeys != null)
            {
                foreach (var (_, key) in optionKeys) await _questionMediaService.DeleteMediaAsync(key);
            }
        }

        private void BuildQuestionMediaUrls(QuestionReadDto questionDto)
        {
            if (!string.IsNullOrWhiteSpace(questionDto.MediaUrl))
                questionDto.MediaUrl = _questionMediaService.BuildMediaUrl(questionDto.MediaUrl);

            foreach (var option in questionDto.Options)
            {
                if (!string.IsNullOrWhiteSpace(option.MediaUrl))
                    option.MediaUrl = _questionMediaService.BuildMediaUrl(option.MediaUrl);
            }
        }

        public async Task<ServiceResponse<QuestionReadDto>> GetQuestionByIdAsync(int questionId)
        {
            var response = new ServiceResponse<QuestionReadDto>();
            try
            {
                var question = await _questionRepository.GetQuestionByIdAsync(questionId);
                if (question == null)
                {
                    response.Success = false;
                    response.Message = "Không tìm thấy câu hỏi.";
                    response.StatusCode = 404;
                    return response;
                }
                var dto = _mapper.Map<QuestionReadDto>(question);
                BuildQuestionMediaUrls(dto);
                response.Data = dto;
                response.Success = true;
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Message = ex.Message;
                response.StatusCode = 500;
            }
            return response;
        }

        public async Task<ServiceResponse<List<QuestionReadDto>>> GetQuestionsByQuizGroupIdAsync(int quizGroupId)
        {
            var response = new ServiceResponse<List<QuestionReadDto>>();
            try
            {
                var questions = await _questionRepository.GetQuestionsByQuizGroupIdAsync(quizGroupId);
                var dtos = _mapper.Map<List<QuestionReadDto>>(questions);
                dtos.ForEach(BuildQuestionMediaUrls);
                response.Data = dtos;
                response.Success = true;
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Message = ex.Message;
                response.StatusCode = 500;
            }
            return response;
        }

        public async Task<ServiceResponse<List<QuestionReadDto>>> GetQuestionsByQuizSectionIdAsync(int quizSectionId)
        {
            var response = new ServiceResponse<List<QuestionReadDto>>();
            try
            {
                var questions = await _questionRepository.GetQuestionsByQuizSectionIdAsync(quizSectionId);
                var dtos = _mapper.Map<List<QuestionReadDto>>(questions);
                dtos.ForEach(BuildQuestionMediaUrls);
                response.Data = dtos;
                response.Success = true;
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Message = ex.Message;
                response.StatusCode = 500;
            }
            return response;
        }

        public async Task<ServiceResponse<QuestionReadDto>> AddQuestionAsync(QuestionCreateDto questionCreateDto)
        {
            var response = new ServiceResponse<QuestionReadDto>();
            try
            {
                int? quizId = null;
                if (questionCreateDto.QuizGroupId.HasValue)
                {
                    var quizGroup = await _quizGroupRepository.GetQuizGroupByIdAsync(questionCreateDto.QuizGroupId.Value);
                    if (quizGroup == null)
                    {
                        response.Success = false;
                        response.Message = "Quiz group không tồn tại.";
                        response.StatusCode = 404;
                        return response;
                    }
                    quizId = quizGroup.QuizSection?.QuizId;
                }

                var (mediaKey, optionKeys, success, error) = await CommitAllMediaAsync(questionCreateDto);
                if (!success)
                {
                    response.Success = false;
                    response.Message = error;
                    response.StatusCode = 400;
                    return response;
                }

                var question = _mapper.Map<Question>(questionCreateDto);
                question.MediaKey = mediaKey;
                question.MetadataJson = questionCreateDto.MetadataJson ?? "{}";
                foreach (var (idx, key) in optionKeys)
                {
                    if (question.Options.Count > idx) question.Options[idx].MediaKey = key;
                }

                await _questionRepository.AddQuestionAsync(question);
                if (quizId.HasValue) await UpdateQuizTotalScoreAsync(quizId.Value);

                var dto = _mapper.Map<QuestionReadDto>(question);
                BuildQuestionMediaUrls(dto);
                response.Data = dto;
                response.Success = true;
                response.StatusCode = 201;
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Message = ex.Message;
                response.StatusCode = 500;
            }
            return response;
        }

        public async Task<ServiceResponse<QuestionReadDto>> UpdateQuestionAsync(int questionId, QuestionUpdateDto updateDto)
        {
            var response = new ServiceResponse<QuestionReadDto>();
            try
            {
                var existing = await _questionRepository.GetQuestionByIdAsync(questionId);
                if (existing == null)
                {
                    response.Success = false;
                    response.Message = "Không tìm thấy.";
                    response.StatusCode = 404;
                    return response;
                }

                string? oldMedia = existing.MediaKey;
                var oldOptionKeys = existing.Options.Select(o => o.MediaKey).ToList();

                _mapper.Map(updateDto, existing);
                if (updateDto.MetadataJson != null) existing.MetadataJson = updateDto.MetadataJson;

                string? newMedia = null;
                var newOptionKeys = new List<(int idx, string key)>();

                try
                {
                    if (!string.IsNullOrWhiteSpace(updateDto.MediaTempKey))
                    {
                        var res = await _questionMediaService.CommitMediaAsync(updateDto.MediaTempKey!);
                        if (res.Success) existing.MediaKey = newMedia = res.Data.MediaKey;
                    }

                    for (int i = 0; i < updateDto.Options.Count && i < existing.Options.Count; i++)
                    {
                        if (!string.IsNullOrWhiteSpace(updateDto.Options[i].MediaTempKey))
                        {
                            var res = await _questionMediaService.CommitMediaAsync(updateDto.Options[i].MediaTempKey!);
                            if (res.Success)
                            {
                                newOptionKeys.Add((i, res.Data.MediaKey));
                                existing.Options[i].MediaKey = res.Data.MediaKey;
                            }
                        }
                    }

                    await _questionRepository.UpdateQuestionAsync(existing);
                    
                    // Cleanup old files
                    if (newMedia != null && oldMedia != null) await _questionMediaService.DeleteMediaAsync(oldMedia);
                    foreach (var (idx, _) in newOptionKeys)
                    {
                        if (oldOptionKeys.Count > idx && oldOptionKeys[idx] != null)
                            await _questionMediaService.DeleteMediaAsync(oldOptionKeys[idx]!);
                    }

                    var resultDto = _mapper.Map<QuestionReadDto>(existing);
                    BuildQuestionMediaUrls(resultDto);
                    response.Data = resultDto;
                    response.Success = true;
                }
                catch (Exception ex)
                {
                    if (newMedia != null) await _questionMediaService.DeleteMediaAsync(newMedia);
                    foreach (var (_, key) in newOptionKeys) await _questionMediaService.DeleteMediaAsync(key);
                    response.Success = false;
                    response.Message = ex.Message;
                    response.StatusCode = 400;
                }
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Message = ex.Message;
                response.StatusCode = 500;
            }
            return response;
        }

        public async Task<ServiceResponse<bool>> DeleteQuestionAsync(int questionId)
        {
            var response = new ServiceResponse<bool>();
            try
            {
                var question = await _questionRepository.GetQuestionByIdAsync(questionId);
                if (question == null)
                {
                    response.Success = false;
                    response.Message = "Không tìm thấy.";
                    response.StatusCode = 404;
                    return response;
                }

                if (question.MediaKey != null) await _questionMediaService.DeleteMediaAsync(question.MediaKey);
                foreach (var opt in question.Options)
                {
                    if (opt.MediaKey != null) await _questionMediaService.DeleteMediaAsync(opt.MediaKey);
                }

                await _questionRepository.DeleteQuestionAsync(questionId);
                response.Data = true;
                response.Success = true;
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Message = ex.Message;
                response.StatusCode = 500;
            }
            return response;
        }

        public async Task<ServiceResponse<QuestionBulkResponseDto>> AddBulkQuestionsAsync(QuestionBulkCreateDto bulkDto)
        {
            var response = new ServiceResponse<QuestionBulkResponseDto>();
            var allCommitted = new List<string>();
            try
            {
                if (bulkDto.Questions == null || bulkDto.Questions.Count == 0)
                {
                    response.Success = false;
                    response.Message = "Trống.";
                    response.StatusCode = 400;
                    return response;
                }

                var entities = new List<Question>();
                foreach (var qDto in bulkDto.Questions)
                {
                    var (mKey, oKeys, ok, err) = await CommitAllMediaAsync(qDto);
                    if (!ok)
                    {
                        foreach (var key in allCommitted) await _questionMediaService.DeleteMediaAsync(key);
                        response.Success = false;
                        response.Message = err;
                        response.StatusCode = 400;
                        return response;
                    }
                    if (mKey != null) allCommitted.Add(mKey);
                    foreach (var (_, k) in oKeys) allCommitted.Add(k);

                    var question = _mapper.Map<Question>(qDto);
                    question.MediaKey = mKey;
                    question.MetadataJson = qDto.MetadataJson ?? "{}";
                    foreach (var (idx, k) in oKeys)
                    {
                        if (question.Options.Count > idx) question.Options[idx].MediaKey = k;
                    }
                    entities.Add(question);
                }

                var ids = await _questionRepository.AddBulkQuestionsWithTransactionAsync(entities);
                response.Data = new QuestionBulkResponseDto { CreatedQuestionIds = ids };
                response.Success = true;
            }
            catch (Exception ex)
            {
                foreach (var key in allCommitted) await _questionMediaService.DeleteMediaAsync(key);
                response.Success = false;
                response.Message = ex.Message;
                response.StatusCode = 500;
            }
            return response;
        }

        public async Task<ServiceResponse<QuizSectionDto>> CreateQuizSectionBulkAsync(QuizSectionBulkCreateDto bulkDto)
        {
            var response = new ServiceResponse<QuizSectionDto>();
            var allCommitted = new List<string>();
            try
            {
                var quiz = await _quizRepository.GetQuizByIdAsync(bulkDto.QuizId);
                if (quiz == null)
                {
                    response.Success = false;
                    response.Message = "Quiz không tồn tại.";
                    response.StatusCode = 404;
                    return response;
                }

                // 1. Create Section
                var section = new QuizSection
                {
                    QuizId = bulkDto.QuizId,
                    Title = bulkDto.Title,
                    Description = bulkDto.Description,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _quizSectionRepository.AddQuizSectionAsync(section);
                await _quizSectionRepository.SaveChangesAsync();

                // 2. Process Groups
                if (bulkDto.QuizGroups != null)
                {
                    foreach (var gDto in bulkDto.QuizGroups)
                    {
                        var group = _mapper.Map<QuizGroup>(gDto);
                        group.QuizSectionId = section.QuizSectionId;

                        // Commit Group Media
                        if (!string.IsNullOrWhiteSpace(gDto.ImgTempKey))
                        {
                            var res = await _quizGroupMediaService.CommitImageAsync(gDto.ImgTempKey);
                            if (res.Success) { group.ImgKey = res.Data.ImageKey; allCommitted.Add(res.Data.ImageKey); }
                        }
                        if (!string.IsNullOrWhiteSpace(gDto.VideoTempKey))
                        {
                            var res = await _quizGroupMediaService.CommitVideoAsync(gDto.VideoTempKey);
                            if (res.Success) { group.VideoKey = res.Data.VideoKey; allCommitted.Add(res.Data.VideoKey); }
                        }
                        if (!string.IsNullOrWhiteSpace(gDto.AudioTempKey))
                        {
                            var res = await _quizGroupMediaService.CommitAudioAsync(gDto.AudioTempKey);
                            if (res.Success) { group.AudioKey = res.Data.AudioKey; allCommitted.Add(res.Data.AudioKey); }
                        }

                        await _quizGroupRepository.AddQuizGroupAsync(group);
                        await _quizGroupRepository.SaveChangesAsync();

                        // Process Group Questions
                        if (gDto.Questions != null)
                        {
                            foreach (var qDto in gDto.Questions)
                            {
                                var (mKey, oKeys, ok, err) = await CommitAllMediaAsync(qDto);
                                if (ok)
                                {
                                    if (mKey != null) allCommitted.Add(mKey);
                                    foreach (var (_, k) in oKeys) allCommitted.Add(k);

                                    var question = _mapper.Map<Question>(qDto);
                                    question.QuizSectionId = section.QuizSectionId;
                                    question.QuizGroupId = group.QuizGroupId;
                                    question.MediaKey = mKey;
                                    question.MetadataJson = qDto.MetadataJson ?? "{}";
                                    foreach (var (idx, k) in oKeys) { if (question.Options.Count > idx) question.Options[idx].MediaKey = k; }

                                    await _questionRepository.AddQuestionAsync(question);
                                }
                            }
                        }
                    }
                }

                // 3. Process Standalone Questions
                if (bulkDto.StandaloneQuestions != null)
                {
                    foreach (var qDto in bulkDto.StandaloneQuestions)
                    {
                        var (mKey, oKeys, ok, err) = await CommitAllMediaAsync(qDto);
                        if (ok)
                        {
                            if (mKey != null) allCommitted.Add(mKey);
                            foreach (var (_, k) in oKeys) allCommitted.Add(k);

                            var question = _mapper.Map<Question>(qDto);
                            question.QuizSectionId = section.QuizSectionId;
                            question.MediaKey = mKey;
                            question.MetadataJson = qDto.MetadataJson ?? "{}";
                            foreach (var (idx, k) in oKeys) { if (question.Options.Count > idx) question.Options[idx].MediaKey = k; }

                            await _questionRepository.AddQuestionAsync(question);
                        }
                    }
                }

                await UpdateQuizTotalScoreAsync(bulkDto.QuizId);

                var finalSection = await _quizSectionRepository.GetQuizSectionByIdAsync(section.QuizSectionId);
                response.Data = _mapper.Map<QuizSectionDto>(finalSection);
                response.Success = true;
                response.StatusCode = 201;
            }
            catch (Exception ex)
            {
                foreach (var key in allCommitted) await _questionMediaService.DeleteMediaAsync(key);
                response.Success = false;
                response.Message = ex.Message;
                response.StatusCode = 500;
            }
            return response;
        }

        private async Task UpdateQuizTotalScoreAsync(int quizId)
        {
            try
            {
                var quiz = await _quizRepository.GetFullQuizAsync(quizId);
                if (quiz == null) return;
                decimal total = 0;
                foreach (var section in quiz.QuizSections)
                {
                    foreach (var group in section.QuizGroups)
                        total += group.SumScore;
                    foreach (var q in section.Questions.Where(q => q.QuizGroupId == null))
                        total += q.Points;
                }
                var qToUpdate = await _quizRepository.GetQuizByIdAsync(quizId);
                if (qToUpdate != null)
                {
                    qToUpdate.TotalPossibleScore = total;
                    await _quizRepository.UpdateQuizAsync(qToUpdate);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating quiz score");
            }
        }
    }
}
