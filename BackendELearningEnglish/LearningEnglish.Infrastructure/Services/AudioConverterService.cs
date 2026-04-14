using LearningEnglish.Application.Interface;
using Microsoft.Extensions.Logging;
using Xabe.FFmpeg;

namespace LearningEnglish.Infrastructure.Services
{
    public class AudioConverterService : IAudioConverterService
    {
        private readonly ILogger<AudioConverterService> _logger;

        public AudioConverterService(ILogger<AudioConverterService> logger)
        {
            _logger = logger;

        }

        public string DetectAudioFormat(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".wav" => "wav",
                ".webm" => "webm",
                ".ogg" => "ogg",
                ".mp3" => "mp3",
                ".m4a" => "m4a",
                _ => "unknown"
            };
        }

        public async Task<byte[]> ConvertToWavAsync(byte[] inputBytes, string inputFormat)
        {
            _logger.LogInformation("Converting {Format} to WAV 16kHz Mono using FFmpeg (size: {Size} bytes)", inputFormat, inputBytes.Length);

            var tempDir = Path.Combine(Path.GetTempPath(), "pronunciation_temp");
            Directory.CreateDirectory(tempDir);

            var tempInput = Path.Combine(tempDir, $"input_{Guid.NewGuid()}{GetExtension(inputFormat)}");
            var tempOutput = Path.Combine(tempDir, $"output_{Guid.NewGuid()}.wav");

            try
            {
                await File.WriteAllBytesAsync(tempInput, inputBytes);

                // Use FFmpeg to convert to 16kHz, mono, 16-bit PCM WAV
                // -ar 16000: Set audio sampling frequency
                // -ac 1: Set audio channels to 1 (mono)
                // -sample_fmt s16: Set sample format to signed 16-bit
                var conversion = await FFmpeg.Conversions.New()
                    .AddParameter($"-i \"{tempInput}\"")
                    .AddParameter("-ar 16000")
                    .AddParameter("-ac 1")
                    .AddParameter("-sample_fmt s16")
                    .SetOutput(tempOutput)
                    .Start();

                if (!File.Exists(tempOutput))
                {
                    throw new Exception("FFmpeg failed to create output file.");
                }

                var wavBytes = await File.ReadAllBytesAsync(tempOutput);
                _logger.LogInformation("Conversion successful. Output size: {Size} bytes", wavBytes.Length);
                return wavBytes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FFmpeg audio conversion failed for format {Format}", inputFormat);
                throw new Exception($"Audio conversion failed: {ex.Message}", ex);
            }
            finally
            {
                CleanupFiles(tempInput, tempOutput);
            }
        }

        public async Task<byte[]> ValidateWavFormatAsync(byte[] wavBytes)
        {
            _logger.LogInformation("Validating/Resampling WAV format using FFmpeg (size: {Size} bytes)", wavBytes.Length);

            var tempDir = Path.Combine(Path.GetTempPath(), "pronunciation_temp");
            Directory.CreateDirectory(tempDir);

            var tempInput = Path.Combine(tempDir, $"validate_in_{Guid.NewGuid()}.wav");
            var tempOutput = Path.Combine(tempDir, $"validate_out_{Guid.NewGuid()}.wav");

            try
            {
                await File.WriteAllBytesAsync(tempInput, wavBytes);

                // Re-encode to ensure 16kHz Mono 16-bit
                await FFmpeg.Conversions.New()
                    .AddParameter($"-i \"{tempInput}\"")
                    .AddParameter("-ar 16000")
                    .AddParameter("-ac 1")
                    .AddParameter("-sample_fmt s16")
                    .SetOutput(tempOutput)
                    .Start();

                var convertedBytes = await File.ReadAllBytesAsync(tempOutput);
                _logger.LogInformation("WAV validation/resampling successful. Output size: {Size} bytes", convertedBytes.Length);
                return convertedBytes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FFmpeg WAV validation/resampling failed");
                throw new Exception($"WAV validation failed: {ex.Message}", ex);
            }
            finally
            {
                CleanupFiles(tempInput, tempOutput);
            }
        }

        private static string GetExtension(string format)
        {
            return format.ToLowerInvariant() switch
            {
                "webm" => ".webm",
                "ogg" => ".ogg",
                "mp3" => ".mp3",
                "wav" => ".wav",
                "m4a" => ".m4a",
                _ => ".tmp"
            };
        }

        private void CleanupFiles(params string[] files)
        {
            foreach (var file in files)
            {
                if (File.Exists(file))
                {
                    try { File.Delete(file); } catch { }
                }
            }
        }
    }
}
