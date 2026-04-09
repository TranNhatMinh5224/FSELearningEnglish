using FluentAssertions;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Interface.Services;
using LearningEnglish.Application.Interface.Strategies;
using LearningEnglish.Application.Service.PaymentService;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using AutoMapper;
using System.Threading;

namespace LearningEnglish.Tests.Application
{
    public class PaymentServiceTests
    {
        private readonly Mock<IPaymentRepository> _paymentRepositoryMock;
        private readonly Mock<IPayOSService> _payOSServiceMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IPaymentValidator> _paymentValidatorMock;
        private readonly Mock<IPaymentWebhookQueueRepository> _webhookQueueRepositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<ILogger<PaymentService>> _loggerMock;
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly List<IPaymentStrategy> _strategies;
        private readonly PaymentService _paymentService;

        public PaymentServiceTests()
        {
            _paymentRepositoryMock = new Mock<IPaymentRepository>();
            _payOSServiceMock = new Mock<IPayOSService>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _paymentValidatorMock = new Mock<IPaymentValidator>();
            _webhookQueueRepositoryMock = new Mock<IPaymentWebhookQueueRepository>();
            _mapperMock = new Mock<IMapper>();
            _loggerMock = new Mock<ILogger<PaymentService>>();
            _configurationMock = new Mock<IConfiguration>();

            var strategyMock = new Mock<IPaymentStrategy>();
            strategyMock.Setup(s => s.ProductType).Returns(ProductType.Course);
            strategyMock.Setup(s => s.GetProductNameAsync(It.IsAny<int>())).ReturnsAsync("Test Course");
            strategyMock.Setup(s => s.ValidateProductAsync(It.IsAny<int>())).ReturnsAsync(new ServiceResponse<decimal> { Data = 100000, Success = true });
            strategyMock.Setup(s => s.ProcessPostPaymentAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(new ServiceResponse<bool> { Success = true, Data = true });
            
            _strategies = new List<IPaymentStrategy> { strategyMock.Object };

            // Unit of Work defaults
            _unitOfWorkMock.Setup(u => u.BeginTransactionAsync()).Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.CommitAsync()).Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.RollbackAsync()).Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

            // Validator defaults
            _paymentValidatorMock.Setup(v => v.ValidateUserPaymentAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<ProductType>()))
                .ReturnsAsync(new ServiceResponse<bool> { Success = true });
            _paymentValidatorMock.Setup(v => v.ValidateProductAsync(It.IsAny<int>(), It.IsAny<ProductType>()))
                .ReturnsAsync(new ServiceResponse<decimal> { Success = true, Data = 100000 });

            _paymentService = new PaymentService(
                _paymentRepositoryMock.Object,
                _paymentValidatorMock.Object,
                _strategies,
                _mapperMock.Object,
                _loggerMock.Object,
                _unitOfWorkMock.Object,
                _payOSServiceMock.Object,
                _configurationMock.Object,
                _webhookQueueRepositoryMock.Object
            );
        }

        [Fact]
        public async Task ProcessPaymentAsync_WithValidRequest_ShouldReturnSuccess()
        {
            // Arrange
            var request = new requestPayment 
            { 
                ProductId = 1, 
                typeproduct = ProductType.Course, 
                IdempotencyKey = "unique-key"
            };

            _paymentRepositoryMock.Setup(r => r.GetPaymentByIdempotencyKeyAsync(It.IsAny<int>(), It.IsAny<string>()))
                .ReturnsAsync((Payment?)null);
            
            _paymentRepositoryMock.Setup(r => r.AddPaymentAsync(It.IsAny<Payment>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _paymentService.ProcessPaymentAsync(1, request);

            // Assert
            result.Success.Should().BeTrue();
            _paymentRepositoryMock.Verify(r => r.AddPaymentAsync(It.IsAny<Payment>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ProcessPaymentAsync_DuplicateIdempotencyKey_ShouldReturnExistingPayment()
        {
            // Arrange
            var request = new requestPayment 
            { 
                ProductId = 1, 
                typeproduct = ProductType.Course, 
                IdempotencyKey = "existing-key" 
            };
            var existingPayment = new Payment { PaymentId = 123, OrderCode = 456, ProductType = ProductType.Course, ProductId = 1, Amount = 100000 };

            _paymentRepositoryMock.Setup(r => r.GetPaymentByIdempotencyKeyAsync(It.IsAny<int>(), It.IsAny<string>()))
                .ReturnsAsync(existingPayment);

            // Act
            var result = await _paymentService.ProcessPaymentAsync(1, request);

            // Assert
            result.Success.Should().BeTrue();
            result.Data.PaymentId.Should().Be(existingPayment.PaymentId);
            _paymentRepositoryMock.Verify(r => r.AddPaymentAsync(It.IsAny<Payment>()), Times.Never);
        }

        [Fact]
        public async Task ProcessPayOSWebhookAsync_WithValidSignature_ShouldUpdatePaymentStatus()
        {
            // Arrange
            var webhookData = new PayOSWebhookDto 
            { 
                OrderCode = 12345,
                Signature = "valid-sig",
                Data = "{\"amount\": 100000, \"status\": \"PAID\"}",
                Code = "00",
                Status = "PAID"
            };
            var payment = new Payment { PaymentId = 1, OrderCode = 12345, Status = PaymentStatus.Pending, ProductType = ProductType.Course, ProductId = 1, Amount = 100000, UserId = 1 };

            _payOSServiceMock.Setup(s => s.VerifyWebhookSignature(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(true);
            _paymentRepositoryMock.Setup(r => r.GetPaymentByTransactionIdAsync(It.IsAny<string>())).ReturnsAsync(payment);
            _paymentRepositoryMock.Setup(r => r.GetPaymentByIdAsync(It.IsAny<int>())).ReturnsAsync(payment);
            _paymentRepositoryMock.Setup(r => r.UpdatePaymentStatusAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);
            _paymentRepositoryMock.Setup(r => r.GetSuccessfulPaymentByUserAndProductAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<ProductType>()))
                .ReturnsAsync((Payment?)null);

            // Act
            var result = await _paymentService.ProcessPayOSWebhookAsync(webhookData);

            // Assert
            result.Success.Should().BeTrue();
            payment.Status.Should().Be(PaymentStatus.Completed);
        }

        [Fact]
        public async Task ProcessPayOSWebhookAsync_WithInvalidSignature_ShouldReturnError()
        {
            // Arrange
            var webhookData = new PayOSWebhookDto { Signature = "invalid-sig", Data = "some-data" };
            _payOSServiceMock.Setup(s => s.VerifyWebhookSignature(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(false);

            // Act
            var result = await _paymentService.ProcessPayOSWebhookAsync(webhookData);

            // Assert
            result.Success.Should().BeFalse();
            result.Message.Should().Contain("Invalid signature");
        }
    }
}
