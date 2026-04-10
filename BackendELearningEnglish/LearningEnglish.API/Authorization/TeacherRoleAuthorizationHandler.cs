using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using LearningEnglish.Application.Interface;
using Microsoft.Extensions.Logging;
using LearningEnglish.Application.Common.Constants;

namespace LearningEnglish.API.Authorization
{

    public class TeacherRoleAuthorizationHandler : AuthorizationHandler<TeacherRoleRequirement>
    {
        private readonly IUserRepository _userRepository;
        private readonly ILogger<TeacherRoleAuthorizationHandler> _logger;

        public TeacherRoleAuthorizationHandler(
            IUserRepository userRepository,
            ILogger<TeacherRoleAuthorizationHandler> logger)
        {
            _userRepository = userRepository;
            _logger = logger;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            TeacherRoleRequirement requirement)
        {
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                _logger.LogWarning("User chưa authenticated");
                return;
            }

            // Admin roles (SuperAdmin/ContentAdmin/FinanceAdmin) are always allowed to access teacher endpoints.
            var roles = context.User.FindAll(ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList();

            if (roles.Any(RoleConstants.IsAdminRole))
            {
                _logger.LogInformation("✅ User có role Admin ({Roles}) - Cho phép truy cập teacher endpoints", string.Join(", ", roles));
                context.Succeed(requirement);
                return;
            }

            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? context.User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                _logger.LogWarning("❌ Không tìm thấy userId trong claims. Claims: {Claims}", 
                    string.Join(", ", context.User.Claims.Select(c => $"{c.Type}={c.Value}")));
                return;
            }

            _logger.LogInformation("🔍 Checking Teacher role for UserId: {UserId} (from database)", userId);

          
            var hasTeacherRole = await _userRepository.HasTeacherRoleAsync(userId);
            
            if (hasTeacherRole)
            {
                _logger.LogInformation("✅ User {UserId} có role Teacher trong database - Cho phép truy cập", userId);
                context.Succeed(requirement);
            }
            else
            {
                _logger.LogWarning("❌ User {UserId} KHÔNG CÓ role Teacher trong database - Từ chối truy cập", userId);
            }
        }
    }

    // Requirement cho Teacher role authorization
    public class TeacherRoleRequirement : IAuthorizationRequirement
    {
        public TeacherRoleRequirement()
        {
            // Không cần tham số, chỉ cần check role Teacher
        }
    }
}

