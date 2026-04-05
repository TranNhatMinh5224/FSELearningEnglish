using FluentValidation;
using LearningEnglish.Application.DTOs.ChatBotAI;

namespace LearningEnglish.Application.Validators.ChatBotValidators;

public class ChatBotConsultRequestDtoValidator : AbstractValidator<ChatBotConsultRequestDto>
{
    public ChatBotConsultRequestDtoValidator()
    {
        RuleFor(x => x.Prompt)
            .NotEmpty().WithMessage("Prompt is required.")
            .MaximumLength(1000).WithMessage("Prompt must not exceed 1000 characters.");
    }
}
