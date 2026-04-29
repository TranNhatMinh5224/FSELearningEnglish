using System;
using System.IO;
using LearningEnglish.Application.Interface;

namespace LearningEnglish.Infrastructure.Services
{
    public class TemplatePathResolver : ITemplatePathResolver
    {
        private readonly string _basePath;

        public TemplatePathResolver()
        {
            // First check in the application base directory (where they are copied during build/publish)
            _basePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Templates");

            // If not found (e.g. running from a different context in dev), check current directory
            if (!Directory.Exists(_basePath))
            {
                _basePath = Path.Combine(Directory.GetCurrentDirectory(), "Templates");
            }

            // Fallback for local development if running from bin folder and templates are NOT copied yet
            // but we are in the source tree
            if (!Directory.Exists(_basePath))
            {
                _basePath = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "LearningEnglish.Infrastructure", "Templates"));
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
