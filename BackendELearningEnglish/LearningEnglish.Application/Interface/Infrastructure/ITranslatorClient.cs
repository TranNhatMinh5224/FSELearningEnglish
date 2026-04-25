using System.Threading.Tasks;
using LearningEnglish.Application.Common;

namespace LearningEnglish.Application.Interface.Infrastructure
{
    public interface ITranslatorClient
    {
        Task<ServiceResponse<string>> TranslateTextAsync(string text, string targetLanguage = "vi");
    }
}
