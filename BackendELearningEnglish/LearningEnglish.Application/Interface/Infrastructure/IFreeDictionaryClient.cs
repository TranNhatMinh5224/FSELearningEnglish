using System.Threading.Tasks;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs;

namespace LearningEnglish.Application.Interface.Infrastructure
{
    public interface IFreeDictionaryClient
    {
        Task<ServiceResponse<DictionaryLookupResultDto>> LookupWordAsync(string word);
    }
}
