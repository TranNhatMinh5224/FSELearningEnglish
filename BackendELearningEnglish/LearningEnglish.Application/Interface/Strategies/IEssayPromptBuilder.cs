using LearningEnglish.Domain.Entities;

namespace LearningEnglish.Application.Interface.Strategies;

[Obsolete("AI essay grading has been removed from the system.")]
public interface IEssayPromptBuilder
{
    string BuildGradingPrompt(Essay essay, string studentEssayContent, decimal maxScore);
}
