using Scriban;
using LearningEnglish.Application.Interface.Services.Markdown;
using LearningEnglish.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace LearningEnglish.Application.Service.MarkdownService;

public class MarkdownForWikiService : IMarkdownForWikiService
{
    private readonly string _frontendBaseUrl;

    public MarkdownForWikiService(IConfiguration configuration)
    {
        _frontendBaseUrl = configuration["Frontend:BaseUrl"] ?? "https://learning-eng.hocnghiepvu.com";
    }
    public async Task<string> GenCourseMarkdown(Course course)
    {
        var templateSource = @"
# Khóa học: {{ title }}
- **Mô tả ngắn:** {{ description_markdown }}
- **Giá:** {{ price | math.format ""N0"" }} VNĐ
- **Sức chứa:** {{ max_student }} học viên
- **Link khóa học:** {{ course_url }}
{{ if is_featured }}- *Đây là khóa học nổi bật của hệ thống.*{{ end }}

## Nội dung khóa học
{{ if modules.size > 0 }}
{{ for module in modules }}
### Chương {{ for.index + 1 }}: {{ module.title }}
{{ module.description }}
{{ end }}
{{ else }}
(Đang cập nhật lộ trình chi tiết)
{{ end }}

---
*Thông tin này dùng để AI làm căn cứ tư vấn chính xác cho học viên.*
        ";

        var template = Template.Parse(templateSource);
        return await template.RenderAsync(new
        {
            title = course.Title,
            description_markdown = course.DescriptionMarkdown,
            price = course.Price,
            teacher_name = course.Teacher != null ? $"{course.Teacher.FirstName} {course.Teacher.LastName}" : "Hệ thống",
            max_student = course.MaxStudent,
            is_featured = course.IsFeatured,
            course_url = $"{_frontendBaseUrl.TrimEnd('/')}/course/{course.CourseId}",
            modules = course.Lessons ?? new List<Lesson>()
        });
    }

    public async Task<string> GenTeacherPackageMarkdown(LearningEnglish.Domain.Entities.TeacherPackage teacherPackage)
    {
        var templateSource = @"
# Gói giảng viên: {{ package_name }}
- **Mô tả:** {{ description }}
- **Giá:** {{ price | math.format ""N0"" }} VNĐ
- **Thời hạn:** {{ duration_months }} tháng

## Quyền lợi
- Số học viên tối đa: {{ max_students }}
- Số khóa học tối đa: {{ max_courses }}

---
*Thông tin dùng để tư vấn cho giáo viên về các gói hợp tác.*
        ";

        var template = Template.Parse(templateSource);
        return await template.RenderAsync(new
        {
            package_name = teacherPackage.PackageName,
            description = teacherPackage.PackageName, // Sử dụng PackageName tạm thời nếu ko có field Description
            price = teacherPackage.Price,
            duration_months = teacherPackage.DurationMonths,
            max_students = teacherPackage.MaxStudents,
            max_courses = teacherPackage.MaxCourses
        });
    }

    public async Task<string> GenPolicyMarkdown(Policy policy)
    {
        var templateSource = @"
# Chính sách: {{ title }}
## Nội dung chi tiết
{{ content }}

---
*Thông tin chính thức về quy định của LearningEnglish.*
        ";

        var template = Template.Parse(templateSource);
        return await template.RenderAsync(new
        {
            title = policy.Title,
            content = policy.ContentMarkdown
        });
    }
}
