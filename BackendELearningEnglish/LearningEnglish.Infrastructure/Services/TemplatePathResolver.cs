using LearningEnglish.Application.Interface;

namespace LearningEnglish.Infrastructure.Services
{
    public class TemplatePathResolver : ITemplatePathResolver
    {
        private readonly string _basePath;

        public TemplatePathResolver()
        {
            // basePath là đường dẫn đến thư mục Templates trong project LearningEnglish.Infrastructure
            _basePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "LearningEnglish.Infrastructure", "Templates");
            // Nếu không tìm thấy thư mục Templates, sẽ lấy đường dẫn hiện tại
            if (!Directory.Exists(_basePath))
            {
                _basePath = Path.Combine(Directory.GetCurrentDirectory(), "Templates");
            }
        }

        public string GetTemplatePath(string templateName)
        {
            return Path.Combine(_basePath, templateName);
        }

        public bool TemplateExists(string templateName)
        {
            return File.Exists(GetTemplatePath(templateName));
        }
    }
}
