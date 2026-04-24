using LearningEnglish.Application.DTOs;
using FluentValidation;

namespace LearningEnglish.Application.Validators.Payment
{
    public class RequestPaymentValidator : AbstractValidator<requestPayment>
    {
        public RequestPaymentValidator()
        {
            RuleFor(x => x.ProductId)
                .GreaterThan(0).WithMessage("ProductId must be greater than 0");

            RuleFor(x => x.typeproduct)
                .IsInEnum().WithMessage("Invalid TypeProduct");

            RuleFor(x => x.IdempotencyKey)
                .MaximumLength(100).WithMessage("IdempotencyKey cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.IdempotencyKey));
        }
    }

}
