using System;
using System.Collections.Generic;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;

namespace LearningEnglish.Application.Common.Helpers
{
    public static class QuizShuffleHelper
    {
        // Shuffle answers với seed unique cho mỗi question
        public static void ShuffleAnswers(List<AnswerOptionDto> options, int attemptId, int questionId)
        {
            var seed = attemptId * 10000 + questionId;  // Unique seed cho mỗi question
            var random = new Random(seed);
            FisherYatesShuffle(options, random);
        }

        // Kiểm tra xem question type có nên shuffle answers không
        public static bool ShouldShuffleAnswers(QuestionType type)
        {
            return type switch
            {
                QuestionType.MultipleChoice => true,
                QuestionType.MultipleAnswers => true,
                QuestionType.Matching => true,
                QuestionType.Ordering => true,
                QuestionType.TrueFalse => false,
                QuestionType.FillBlank => false,
                _ => false
            };
        }

        // Fisher-Yates Shuffle - Public để dùng trong QuizAttemptService
        public static void FisherYatesShuffle<T>(List<T> list, Random random)
        {
            for (int i = list.Count - 1; i > 0; i--)
            {
                int j = random.Next(i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }
    }
}
