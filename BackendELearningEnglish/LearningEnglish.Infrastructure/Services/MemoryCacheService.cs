using LearningEnglish.Application.Interface.Infrastructure;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using System.Threading;

namespace LearningEnglish.Infrastructure.Services;


public sealed class MemoryCacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<MemoryCacheService> _logger;

    // Prevent cache stampede: ensure only one factory runs per key at a time
    private readonly ConcurrentDictionary<string, Lazy<Task<object?>>> _inflight =
        new(StringComparer.OrdinalIgnoreCase);

    // Track all registered keys for prefix-based removal
    private readonly HashSet<string> _keys = [];
    private readonly object _lock = new();

    // Default TTL if none is specified
    private static readonly TimeSpan DefaultExpiry = TimeSpan.FromMinutes(30);

    public MemoryCacheService(IMemoryCache cache, ILogger<MemoryCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<T?> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null)
    {
        if (_cache.TryGetValue(key, out T? cached))
        {
            _logger.LogDebug("[Cache HIT] {Key}", key);
            return cached;
        }

        _logger.LogDebug("[Cache MISS] {Key} — fetching from source", key);

        var lazyFactory = _inflight.GetOrAdd(
            key,
            _ => new Lazy<Task<object?>>(async () => await factory(), LazyThreadSafetyMode.ExecutionAndPublication));

        object? boxedValue;
        try
        {
            boxedValue = await lazyFactory.Value;
        }
        finally
        {
            _inflight.TryRemove(key, out _);
        }

        var value = (T?)boxedValue;

        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiry ?? DefaultExpiry
        };

        options.RegisterPostEvictionCallback((evictedKey, _, _, _) =>
        {
            if (evictedKey is not string evictedStringKey)
            {
                return;
            }

            lock (_lock)
            {
                _keys.Remove(evictedStringKey);
            }
        });

        _cache.Set(key, value, options);

        lock (_lock) { _keys.Add(key); }

        return value;
    }

    public void Remove(string key)
    {
        _cache.Remove(key);
        lock (_lock) { _keys.Remove(key); }
        _logger.LogDebug("[Cache EVICT] {Key}", key);
    }

    public void RemoveByPrefix(string prefix)
    {
        List<string> toRemove;
        lock (_lock)
        {
            toRemove = _keys.Where(k => k.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        foreach (var key in toRemove)
        {
            _cache.Remove(key);
            lock (_lock) { _keys.Remove(key); }
        }

        _logger.LogDebug("[Cache EVICT PREFIX] '{Prefix}' → removed {Count} entries", prefix, toRemove.Count);
    }
}
