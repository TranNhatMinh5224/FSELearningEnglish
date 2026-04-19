using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;
using LearningEnglish.Application.Interface.Strategies;
using LearningEnglish.Application.Common.Helpers;

namespace LearningEnglish.Application.Strategies.Scoring
{
    public class OrderingScoringStrategy : IScoringStrategy
    {
        public QuestionType Type => QuestionType.Ordering;

        public decimal CalculateScore(Question question, object? userAnswer)
        {
            if (userAnswer == null) return 0m;

            // Normalize user answer to List<int> (list of Option IDs)
            var userOrder = AnswerNormalizer.NormalizeToListInt(userAnswer);
            if (userOrder == null || userOrder.Count == 0) return 0m;

            // Correct order from JSON (list of texts) mapped to list of Option IDs
            var correctOrder = ScoringHelper.ParseCorrectOrder(question.CorrectAnswersJson, question.Options);
            
            if (correctOrder == null || correctOrder.Count == 0) return 0m;

            // Compare sequence
            if (userOrder.SequenceEqual(correctOrder))
                return question.Points;

            return 0m;
        }
    }
}
