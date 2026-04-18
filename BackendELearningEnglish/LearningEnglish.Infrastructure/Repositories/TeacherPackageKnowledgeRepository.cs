using LearningEnglish.Application.Interface.Repositories;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Pgvector.EntityFrameworkCore;

namespace LearningEnglish.Infrastructure.Repositories;

public class TeacherPackageKnowledgeRepository : ITeacherPackageKnowledgeRepository
{
    private readonly AppDbContext _context;

    public TeacherPackageKnowledgeRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TeacherPackageKnowledge?> GetByPackageIdAsync(int packageId)
    {
        return await _context.TeacherPackageKnowledges
            .FirstOrDefaultAsync(k => k.TeacherPackageId == packageId);
    }

    public async Task AddAsync(TeacherPackageKnowledge teacherPackageKnowledge)
    {
        await _context.TeacherPackageKnowledges.AddAsync(teacherPackageKnowledge);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(TeacherPackageKnowledge teacherPackageKnowledge)
    {
        _context.TeacherPackageKnowledges.Update(teacherPackageKnowledge);
        await _context.SaveChangesAsync();
    }

    public async Task<List<TeacherPackageKnowledge>> GetAllAsync()
    {
        return await _context.TeacherPackageKnowledges.ToListAsync();
    }

    public async Task<List<TeacherPackageKnowledge>> GetByListPackageIdAsync(List<int> packageIds)
    {
        return await _context.TeacherPackageKnowledges
            .Where(k => packageIds.Contains(k.TeacherPackageId))
            .ToListAsync();
    }

    public async Task DeleteAsync(int packageId)
    {
        var knowledge = await GetByPackageIdAsync(packageId);
        if (knowledge != null)
        {
            _context.TeacherPackageKnowledges.Remove(knowledge);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<TeacherPackageKnowledge>> SearchSimilarAsync(float[] queryVector, int limit = 5)
    {
        var vector = new Pgvector.Vector(queryVector);
        return await _context.TeacherPackageKnowledges
            .OrderBy(pk => pk.Embedding.CosineDistance(vector))
            .Take(limit)
            .ToListAsync();
    }
}
