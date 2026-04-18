using LearningEnglish.Application.Interface.Repositories;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Pgvector.EntityFrameworkCore;

namespace LearningEnglish.Infrastructure.Repositories;

public class CourseKnowledgeRepository : ICourseKnowledgeRepository
{
    private readonly AppDbContext _context;

    public CourseKnowledgeRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<CourseKnowledge?> GetByCourseIdAsync(int courseId)
    {
        return await _context.CourseKnowledges
            .FirstOrDefaultAsync(k => k.CourseId == courseId);
    }

    public async Task AddAsync(CourseKnowledge courseKnowledge)
    {
        await _context.CourseKnowledges.AddAsync(courseKnowledge);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(CourseKnowledge courseKnowledge)
    {
        _context.CourseKnowledges.Update(courseKnowledge);
        await _context.SaveChangesAsync();
    }

    public async Task<List<CourseKnowledge>> GetAllAsync()
    {
        return await _context.CourseKnowledges.ToListAsync();
    }

    public async Task<List<CourseKnowledge>> GetByListCourseIdAsync(List<int> courseIds)
    {
        return await _context.CourseKnowledges
            .Where(k => courseIds.Contains(k.CourseId))
            .ToListAsync();
    }

    public async Task DeleteAsync(int courseId)
    {
        var knowledge = await GetByCourseIdAsync(courseId);
        if (knowledge != null)
        {
            _context.CourseKnowledges.Remove(knowledge);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<CourseKnowledge>> SearchSimilarAsync(float[] queryVector, int limit = 5)
    {
        var vector = new Pgvector.Vector(queryVector);
        return await _context.CourseKnowledges
            .OrderBy(ck => ck.Embedding.CosineDistance(vector))
            .Take(limit)
            .ToListAsync();
    }
}
