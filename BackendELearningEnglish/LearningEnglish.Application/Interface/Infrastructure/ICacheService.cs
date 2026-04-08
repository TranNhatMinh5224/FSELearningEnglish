namespace LearningEnglish.Application.Interface.Infrastructure;


public interface ICacheService
{
    
    Task<T?> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null);

  
    void Remove(string key);

   
    void RemoveByPrefix(string prefix);
}
