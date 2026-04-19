using LearningEnglish.Application.Interface.Strategies;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;
using LearningEnglish.Application.Common.Helpers;

namespace LearningEnglish.Application.Strategies.Scoring
{
    // chấm điểm cho câu hỏi ghép nối (Matching)
    public class MatchingScoringStrategy : IScoringStrategy
    {
        public QuestionType Type => QuestionType.Matching;

        public decimal CalculateScore(Question question, object? userAnswer)
        {
            if (userAnswer == null) return 0m;

            // Normalize answer về Dictionary<int, int> {leftOptionId: rightOptionId}
            var userMatches = AnswerNormalizer.NormalizeToDictionaryIntInt(userAnswer);
            if (userMatches == null || userMatches.Count == 0) return 0m;

            var correctMatches = ScoringHelper.ParseCorrectMatches(question.CorrectAnswersJson, question.MetadataJson, question.Options);
            if (correctMatches == null || correctMatches.Count == 0) return 0m;

            // Phải đủ số cặp (không thừa, không thiếu)
            if (userMatches.Count != correctMatches.Count) return 0m;

            // Kiểm tra từng cặp đúng (so sánh từ correctMatches để không bỏ sót)
            foreach (var pair in correctMatches)
            {
                if (!userMatches.TryGetValue(pair.Key, out var userRight) || userRight != pair.Value)
                    return 0m;  // Sai cặp hoặc thiếu → 0 điểm
            }

            return question.Points;  // Tất cả đúng → full điểm
        }
    }
}
