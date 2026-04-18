using LearningEnglish.Application.DTOs.Admin;
using LearningEnglish.Application.Interface.Services.AdminManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearningEnglish.API.Controller.Admin;

[Route("api/admin/policy")]
[ApiController]
[Authorize(Roles = "SuperAdmin")] // Chỉ SuperAdmin mới có quyền quản lý chính sách
public class AdminPolicyController : ControllerBase
{
    private readonly IAdminPolicyService _adminPolicyService;

    public AdminPolicyController(IAdminPolicyService adminPolicyService)
    {
        _adminPolicyService = adminPolicyService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _adminPolicyService.GetAllPoliciesAsync();
        return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _adminPolicyService.GetPolicyByIdAsync(id);
        return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminCreatePolicyRequestDto request)
    {
        var result = await _adminPolicyService.CreatePolicyAsync(request);
        return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] AdminUpdatePolicyRequestDto request)
    {
        var result = await _adminPolicyService.UpdatePolicyAsync(id, request);
        return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _adminPolicyService.DeletePolicyAsync(id);
        return result.Success ? Ok(result) : StatusCode(result.StatusCode, result);
    }

}
