using LearningEnglish.Domain.Entities;

namespace LearningEnglish.Application.Common.Helpers
{
    /// <summary>
    /// Helper class để tính toán điểm số cho Quiz
    /// </summary>
    public static class QuizScoreCalculator
    {
        /// <summary>
        /// Tính tổng điểm tối đa của Quiz dựa trên tất cả Questions
        /// </summary>
        /// <param name="quiz">Quiz entity với QuizSections, QuizGroups, Questions đã load</param>
        /// <returns>Tổng điểm tối đa</returns>
        public static decimal CalculateTotalPossibleScore(Quiz quiz)
        {
            if (quiz == null) return 0m;

            decimal maxScore = 0m;

            // 1. Sum scores from all groups in all sections
            if (quiz.QuizSections != null)
            {
                foreach (var section in quiz.QuizSections)
                {
                    if (section.QuizGroups != null)
                    {
                        foreach (var group in section.QuizGroups)
                        {
                            if (group.Questions != null)
                            {
                                maxScore += group.Questions.Sum(q => q.Points);
                            }
                        }
                    }

                    // 2. Sum scores from standalone questions (not in any group)
                    // We check QuizGroupId == null or QuizGroupId == 0 to be safe
                    if (section.Questions != null)
                    {
                        maxScore += section.Questions
                            .Where(q => q.QuizGroupId == null || q.QuizGroupId == 0)
                            .Sum(q => q.Points);
                    }
                }
            }

            return maxScore;
        }

    }
}
