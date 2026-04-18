using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Embeddings;
using Microsoft.SemanticKernel.Connectors.Google;
using System;
using System.Threading.Tasks;

#pragma warning disable SKEXP0070

public class Program
{
    public static async Task Main(string[] args)
    {
        string apiKey = "AIzaSyBHU3dtFUEdMnP-9aUoaFNISYzGKhzSSBk";
        
        try 
        {
            var embedService = new GoogleAITextEmbeddingGenerationService("gemini-embedding-2-preview", apiKey);
            var result = await embedService.GenerateEmbeddingAsync("Hello");
            Console.WriteLine("EMBED-2-PREVIEW SUCCESS: " + result.Length + " dimensions");
        }
        catch (Exception ex) { Console.WriteLine("EMBED-2-PREVIEW ERROR: " + ex.Message); }
}
}
