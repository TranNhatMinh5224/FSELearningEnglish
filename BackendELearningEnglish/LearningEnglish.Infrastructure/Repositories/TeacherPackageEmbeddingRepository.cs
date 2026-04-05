using LearningEnglish.Application.Interface;
using LearningEnglish.Application.DTOs.ChatBotAI;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Domain.Enums;
using LearningEnglish.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace LearningEnglish.Infrastructure.Repositories;

public class TeacherPackageEmbeddingRepository : ITeacherPackageEmbeddingRepository
{
    private readonly AppDbContext _context;

    public TeacherPackageEmbeddingRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<TeacherPackageEmbedding>> GetByTeacherPackageIdAsync(
        int teacherPackageId,
        CancellationToken cancellationToken = default)
    {
        return await _context.TeacherPackageEmbeddings
            .Where(x => x.TeacherPackageId == teacherPackageId)
            .OrderBy(x => x.PartType)
            .ThenByDescending(x => x.LastUpdatedEmbeddingAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<TeacherPackageEmbedding?> GetByTeacherPackageAndPartTypeAsync(
        int teacherPackageId,
        EmbeddingPartType partType,
        CancellationToken cancellationToken = default)
    {
        return await _context.TeacherPackageEmbeddings
            .FirstOrDefaultAsync(
                x => x.TeacherPackageId == teacherPackageId && x.PartType == partType,
                cancellationToken);
    }

    public async Task<bool> ExistsByContentHashAsync(
        int teacherPackageId,
        EmbeddingPartType partType,
        string contentHash,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(contentHash))
            return false;

        var normalizedHash = contentHash.Trim();

        return await _context.TeacherPackageEmbeddings
            .AnyAsync(
                x => x.TeacherPackageId == teacherPackageId &&
                     x.PartType == partType &&
                     x.ContentHash == normalizedHash,
                cancellationToken);
    }

    public async Task<TeacherPackageEmbedding> UpsertAsync(
        TeacherPackageEmbedding teacherPackageEmbedding,
        CancellationToken cancellationToken = default)
    {
        var existing = await _context.TeacherPackageEmbeddings
            .FirstOrDefaultAsync(
                x => x.TeacherPackageId == teacherPackageEmbedding.TeacherPackageId &&
                     x.PartType == teacherPackageEmbedding.PartType,
                cancellationToken);

        if (existing == null)
        {
            if (teacherPackageEmbedding.LastUpdatedEmbeddingAt == null)
                teacherPackageEmbedding.LastUpdatedEmbeddingAt = DateTime.UtcNow;

            await _context.TeacherPackageEmbeddings.AddAsync(teacherPackageEmbedding, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return teacherPackageEmbedding;
        }

        existing.PackageName = teacherPackageEmbedding.PackageName;
        existing.EmbeddingModel = teacherPackageEmbedding.EmbeddingModel;
        existing.EmbeddingDimension = teacherPackageEmbedding.EmbeddingDimension;
        existing.ContentHash = teacherPackageEmbedding.ContentHash;
        existing.SourceData = teacherPackageEmbedding.SourceData;
        existing.EmbeddingVector = teacherPackageEmbedding.EmbeddingVector;
        existing.LastUpdatedEmbeddingAt = teacherPackageEmbedding.LastUpdatedEmbeddingAt ?? DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<int> DeleteByTeacherPackageIdAsync(int teacherPackageId, CancellationToken cancellationToken = default)
    {
        var rows = await _context.TeacherPackageEmbeddings
            .Where(x => x.TeacherPackageId == teacherPackageId)
            .ToListAsync(cancellationToken);

        if (rows.Count == 0)
            return 0;

        _context.TeacherPackageEmbeddings.RemoveRange(rows);
        await _context.SaveChangesAsync(cancellationToken);

        return rows.Count;
    }

    public async Task<IReadOnlyList<TeacherPackageRecommendationDto>> SearchTopKTeacherPackagesAsync(
        float[] queryEmbedding,
        int topK,
        CancellationToken cancellationToken = default)
    {
        if (queryEmbedding.Length == 0 || topK <= 0)
            return [];

        var vectorLiteral = ToVectorLiteral(queryEmbedding);
        var sql = @"
SELECT
    p.""TeacherPackageId"",
    p.""PackageName"",
    CAST(p.""Level"" AS text) AS ""Level"",
    p.""Price"",
    p.""DurationMonths"",
    p.""MaxCourses"",
    p.""MaxLessons"",
    p.""MaxStudents"",
    (1 - (e.""EmbeddingVector"" <=> CAST({0} AS vector))) AS ""SimilarityScore""
FROM ""TeacherPackageEmbeddings"" e
JOIN ""TeacherPackages"" p ON p.""TeacherPackageId"" = e.""TeacherPackageId""
WHERE e.""PartType"" = {1}
ORDER BY e.""EmbeddingVector"" <=> CAST({0} AS vector)
LIMIT {2};";

        var results = await _context.Database
            .SqlQueryRaw<TeacherPackageRecommendationDto>(
                sql,
                vectorLiteral,
                (int)EmbeddingPartType.FullContent,
                topK)
            .ToListAsync(cancellationToken);

        return results;
    }

    private static string ToVectorLiteral(float[] vector)
    {
        return "[" + string.Join(",", vector.Select(v => v.ToString(CultureInfo.InvariantCulture))) + "]";
    }
}
