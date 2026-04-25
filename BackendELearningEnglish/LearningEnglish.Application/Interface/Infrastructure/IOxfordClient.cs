using System.Threading.Tasks;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs;

namespace LearningEnglish.Application.Interface.Infrastructure
{
    public interface IOxfordClient
    {
        Task<ServiceResponse<DictionaryLookupResultDto>> LookupWordAsync(string word);
        Task<string?> ExtractAudioUrlAsync(string word);
    }
}
