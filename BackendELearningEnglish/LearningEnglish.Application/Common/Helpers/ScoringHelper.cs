using System.Text.Json;
using LearningEnglish.Domain.Entities;

namespace LearningEnglish.Application.Strategies.Scoring
{
    public static class ScoringHelper
    {
        // Parse CorrectAnswersJson thành List<int> (cho Ordering)
        public static List<int>? ParseCorrectOrder(string? json, List<AnswerOption> options)
        {
            if (string.IsNullOrEmpty(json) || options == null) return null;
            try
            {
                // Try to parse as list of IDs first
                try
                {
                    var idList = JsonSerializer.Deserialize<List<int>>(json);
                    if (idList != null && idList.Count > 0 && idList.All(id => options.Any(o => o.AnswerOptionId == id)))
                    {
                        return idList;
                    }
                }
                catch { /* Ignore and try strings */ }

                // Parse correctAnswersJson as list of strings: ["Wake up", "Brush teeth", ...]
                var correctOrderStrings = JsonSerializer.Deserialize<List<string>>(json);
                if (correctOrderStrings == null) return null;

                // Process strings and match with options
                // To handle duplicate texts, we maintain a list of available options
                var availableOptions = options.ToList();
                var result = new List<int>();

                foreach (var text in correctOrderStrings)
                {
                    var option = availableOptions.FirstOrDefault(o => o.Text == text);
                    if (option != null)
                    {
                        result.Add(option.AnswerOptionId);
                        availableOptions.Remove(option); // Ensure we don't pick the same option twice if it's used once in key
                    }
                }

                return result;
            }
            catch (JsonException)
            {
                return null;  // Invalid JSON
            }
        }

        // Parse CorrectAnswersJson thành Dictionary<int, int> (cho Matching)
        public static Dictionary<int, int>? ParseCorrectMatches(string? json, string? metadataJson, List<AnswerOption> options)
        {
            if (string.IsNullOrEmpty(json) || string.IsNullOrEmpty(metadataJson) || options == null)
                return null;

            try
            {
                // Parse correctAnswersJson: {"hello": "a greeting", "book": "something to read"}
                var correctMatches = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
                if (correctMatches == null) return null;

                // Parse metadataJson: {"left": ["hello", "book"], "right": ["a greeting", "something to read"]}
                var metadata = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(metadataJson);
                if (metadata == null || !metadata.TryGetValue("left", out List<string>? leftTexts) || !metadata.TryGetValue("right", out List<string>? rightTexts))
                    return null;

                // Tạo mapping từ left text sang right text index
                var textToRightIndex = new Dictionary<string, int>();
                for (int i = 0; i < rightTexts.Count; i++)
                {
                    textToRightIndex[rightTexts[i]] = i;
                }

                // Tạo mapping từ left option ID sang right option ID
                var result = new Dictionary<int, int>();
                var availableOptions = options.ToList(); // Dùng list để handle trùng text

                foreach (var leftText in leftTexts)
                {
                    if (correctMatches.TryGetValue(leftText, out var rightText))
                    {
                        // Tìm option ID cho left text (đúng vế và đúng text)
                        var leftOption = availableOptions.FirstOrDefault(o => 
                            (o.Text == leftText) && (o.IsCorrect == true));
                        if (leftOption == null) continue;
                        availableOptions.Remove(leftOption);

                        // Tìm option ID cho right text (đúng vế và đúng text)
                        var rightOption = availableOptions.FirstOrDefault(o => 
                            (o.Text == rightText) && (o.IsCorrect == false));
                        if (rightOption == null) continue;
                        // Note: Cùng 1 right option có thể được nối bởi nhiều left option? 
                        // Thường thì Matching là 1-1, nhưng nếu 1-nhiều thì không nên remove rightOption.
                        // Trong hệ thống này ta coi là 1-1.
                        availableOptions.Remove(rightOption);

                        result[leftOption.AnswerOptionId] = rightOption.AnswerOptionId;
                    }
                }

                return result;
            }
            catch (JsonException)
            {
                return null;  // Invalid JSON
            }
        }

        // Có thể thêm methods khác cho FillBlank, etc.
    }
}
