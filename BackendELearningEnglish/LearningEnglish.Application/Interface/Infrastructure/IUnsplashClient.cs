using System.IO;
using System.Threading.Tasks;

namespace LearningEnglish.Application.Interface.Infrastructure
{
    public interface IUnsplashClient
    {
        Task<Stream?> SearchAndDownloadImageAsync(string word);
    }
}
