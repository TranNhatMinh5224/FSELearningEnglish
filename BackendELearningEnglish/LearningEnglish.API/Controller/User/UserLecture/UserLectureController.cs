using LearningEnglish.Application.Interface.Services.Lecture;
using LearningEnglish.API.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearningEnglish.API.Controller.User
{
    [Route("api/user/lectures")]
    [ApiController]
    [Authorize]
    public class UserLectureController : ControllerBase
    {
        private readonly IUserLectureService _lectureService;
        private readonly ILogger<UserLectureController> _logger;

        public UserLectureController(
            IUserLectureService lectureService,
            ILogger<UserLectureController> logger)
        {
            _lectureService = lectureService;
            _logger = logger;
        }

        [HttpGet("{lectureId}")]
        [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Client)]
        public async Task<IActionResult> GetLecture(int lectureId)
        {
            var userId = User.GetUserId();
            var result = await _lectureService.GetLectureByIdAsync(lectureId, userId);
            return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
        }

        [HttpGet("module/{moduleId}")]
        [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Client)]
        public async Task<IActionResult> GetLecturesByModule(int moduleId)
        {
            var userId = User.GetUserId();
            var result = await _lectureService.GetLecturesByModuleIdAsync(moduleId, userId);
            return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
        }

        [HttpGet("module/{moduleId}/tree")]
        [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Client)]
        public async Task<IActionResult> GetLectureTree(int moduleId)
        {
            var userId = User.GetUserId();
            var result = await _lectureService.GetLectureTreeByModuleIdAsync(moduleId, userId);
            return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
        }
    }
}
