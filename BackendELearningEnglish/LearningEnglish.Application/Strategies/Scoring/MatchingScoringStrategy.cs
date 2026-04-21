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

            // Tính điểm từng phần (Partial Credit)
            int correctCount = 0;
            foreach (var pair in correctMatches)
            {
                if (userMatches.TryGetValue(pair.Key, out var userRight) && userRight == pair.Value)
                {
                    correctCount++;
                }
            }

            // Điểm = (Số câu đúng / Tổng câu) * Tổng điểm câu hỏi
            decimal partialScore = ((decimal)correctCount / correctMatches.Count) * question.Points;

            return Math.Round(partialScore, 2);
        }
    }
}
