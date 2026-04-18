using LearningEnglish.Application.Interface.Repositories;
using LearningEnglish.Domain.Entities;
using LearningEnglish.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Pgvector.EntityFrameworkCore;

namespace LearningEnglish.Infrastructure.Repositories;

public class PolicyKnowledgeRepository : IPolicyKnowledgeRepository
{
    private readonly AppDbContext _context;

    public PolicyKnowledgeRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PolicyKnowledge?> GetByPolicyIdAsync(int policyId)
    {
        return await _context.PolicyKnowledges
            .FirstOrDefaultAsync(k => k.PolicyId == policyId);
    }

    public async Task AddAsync(PolicyKnowledge policyKnowledge)
    {
        await _context.PolicyKnowledges.AddAsync(policyKnowledge);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(PolicyKnowledge policyKnowledge)
    {
        _context.PolicyKnowledges.Update(policyKnowledge);
        await _context.SaveChangesAsync();
    }

    public async Task<List<PolicyKnowledge>> GetAllAsync()
    {
        return await _context.PolicyKnowledges.ToListAsync();
    }

    public async Task<List<PolicyKnowledge>> GetByListPolicyIdAsync(List<int> policyIds)
    {
        return await _context.PolicyKnowledges
            .Where(k => policyIds.Contains(k.PolicyId))
            .ToListAsync();
    }

    public async Task DeleteAsync(int policyId)
    {
        var knowledge = await GetByPolicyIdAsync(policyId);
        if (knowledge != null)
        {
            _context.PolicyKnowledges.Remove(knowledge);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<PolicyKnowledge>> SearchSimilarAsync(float[] queryVector, int limit = 5)
    {
        var vector = new Pgvector.Vector(queryVector);
        return await _context.PolicyKnowledges
            .OrderBy(pk => pk.Embedding.CosineDistance(vector))
            .Take(limit)
            .ToListAsync();
    }
}
