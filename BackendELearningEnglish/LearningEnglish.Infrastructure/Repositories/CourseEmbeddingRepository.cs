using LearningEnglish.Application.Interface;
using LearningEnglish.Application.DTOs.ChatBotAI;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;
using LearningEnglish.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace LearningEnglish.Infrastructure.Repositories;

public class CourseEmbeddingRepository : ICourseEmbeddingRepository
{
    private readonly AppDbContext _context;

    public CourseEmbeddingRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<CourseEmbedding>> GetByCourseIdAsync(int courseId, CancellationToken cancellationToken = default)
    {
        return await _context.CourseEmbeddings
            .Where(x => x.CourseId == courseId)
            .OrderBy(x => x.PartType)
            .ThenByDescending(x => x.LastUpdatedEmbeddingAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<CourseEmbedding?> GetByCourseAndPartTypeAsync(
        int courseId,
        EmbeddingPartType partType,
        CancellationToken cancellationToken = default)
    {
        return await _context.CourseEmbeddings
            .FirstOrDefaultAsync(
                x => x.CourseId == courseId && x.PartType == partType,
                cancellationToken);
    }

    public async Task<bool> ExistsByContentHashAsync(
        int courseId,
        EmbeddingPartType partType,
        string contentHash,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(contentHash))
            return false;

        var normalizedHash = contentHash.Trim();

        return await _context.CourseEmbeddings
            .AnyAsync(
                x => x.CourseId == courseId &&
                     x.PartType == partType &&
                     x.ContentHash == normalizedHash,
                cancellationToken);
    }

    public async Task<CourseEmbedding> UpsertAsync(CourseEmbedding courseEmbedding, CancellationToken cancellationToken = default)
    {
        var existing = await _context.CourseEmbeddings
            .FirstOrDefaultAsync(
                x => x.CourseId == courseEmbedding.CourseId &&
                     x.PartType == courseEmbedding.PartType,
                cancellationToken);

        if (existing == null)
        {
            if (courseEmbedding.LastUpdatedEmbeddingAt == null)
                courseEmbedding.LastUpdatedEmbeddingAt = DateTime.UtcNow;

            await _context.CourseEmbeddings.AddAsync(courseEmbedding, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return courseEmbedding;
        }

        existing.Title = courseEmbedding.Title;
        existing.EmbeddingModel = courseEmbedding.EmbeddingModel;
        existing.EmbeddingDimension = courseEmbedding.EmbeddingDimension;
        existing.ContentHash = courseEmbedding.ContentHash;
        existing.EmbeddingVector = courseEmbedding.EmbeddingVector;
        existing.LastUpdatedEmbeddingAt = courseEmbedding.LastUpdatedEmbeddingAt ?? DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<int> DeleteByCourseIdAsync(int courseId, CancellationToken cancellationToken = default)
    {
        var rows = await _context.CourseEmbeddings
            .Where(x => x.CourseId == courseId)
            .ToListAsync(cancellationToken);

        if (rows.Count == 0)
            return 0;

        _context.CourseEmbeddings.RemoveRange(rows);
        await _context.SaveChangesAsync(cancellationToken);

        return rows.Count;
    }

    public async Task<IReadOnlyList<CourseRecommendationDto>> SearchTopKSystemCoursesAsync(
        float[] queryEmbedding,
        int topK,
        CancellationToken cancellationToken = default)
    {
        if (queryEmbedding.Length == 0 || topK <= 0)
            return [];

        var vectorLiteral = ToVectorLiteral(queryEmbedding);
        var sql = @"
SELECT
    c.""CourseId"",
    c.""Title"",
    c.""DescriptionMarkdown"" AS ""Description"",
    c.""Price"",
    (1 - (ce.""EmbeddingVector"" <=> CAST({0} AS vector))) AS ""SimilarityScore""
FROM ""CourseEmbeddings"" ce
JOIN ""Courses"" c ON c.""CourseId"" = ce.""CourseId""
WHERE ce.""PartType"" = {1}
  AND c.""Type"" = {2}
  AND c.""Status"" = {3}
ORDER BY ce.""EmbeddingVector"" <=> CAST({0} AS vector)
LIMIT {4};";

        var results = await _context.Database
            .SqlQueryRaw<CourseRecommendationDto>(
                sql,
                vectorLiteral,
                (int)EmbeddingPartType.FullContent,
                (int)CourseType.System,
                (int)CourseStatus.Published,
                topK)
            .ToListAsync(cancellationToken);

        return results;
    }

    private static string ToVectorLiteral(float[] vector)
    {
        return "[" + string.Join(",", vector.Select(v => v.ToString(CultureInfo.InvariantCulture))) + "]";
    }
}
