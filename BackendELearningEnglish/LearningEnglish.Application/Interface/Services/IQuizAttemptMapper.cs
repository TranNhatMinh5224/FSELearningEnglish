using LearningEnglish.Application.DTOs;
using LearningEnglish.Domain.Entities;

namespace LearningEnglish.Application.Interface.Services;


public interface IQuizAttemptMapper


{
    
    List<AttemptQuizSectionDto> ShuffleQuizForAttempt(Quiz quiz, int attemptId);

    QuestionDto MapToQuestionDto(Question question, int attemptId, bool shuffleAnswers);

   
    QuizItemDto MapToStandaloneQuestionItemDto(Question question, int attemptId, bool shuffleAnswers);

    
    List<AnswerOptionDto> MapToOptionDtos(Question question, int attemptId, bool shuffleAnswers);
}
