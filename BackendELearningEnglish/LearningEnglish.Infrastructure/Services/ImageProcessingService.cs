using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Infrastructure.Services
{
    /// <summary>
    /// Xử lý ảnh trước khi upload: resize + nén + chuyển sang WebP
    /// </summary>
    public class ImageProcessingService
    {
        private readonly ILogger<ImageProcessingService> _logger;

        // Giới hạn kích thước tối đa (px) và chất lượng WebP
        private const int MaxWidth = 900;   // 300px hiển thị × 3x Retina = 900px
        private const int MaxHeight = 600;  // 200px hiển thị × 3x Retina = 600px
        private const int WebpQuality = 82; // 75-85 là điểm ngọt: chất lượng tốt, file nhỏ

        // Danh sách MIME type ảnh được phép xử lý
        private static readonly HashSet<string> SupportedImageTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/bmp"
        };

        public ImageProcessingService(ILogger<ImageProcessingService> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Kiểm tra xem file có phải ảnh được hỗ trợ không
        /// </summary>
        public bool IsImage(IFormFile file)
            => SupportedImageTypes.Contains(file.ContentType);

        /// <summary>
        /// Xử lý ảnh: resize về kích thước hợp lý + nén sang WebP
        /// Trả về (stream, contentType, extension) để upload lên MinIO
        /// </summary>
        public async Task<(MemoryStream ProcessedStream, string ContentType, string Extension)>
            ProcessImageAsync(IFormFile file, int maxWidth = MaxWidth, int maxHeight = MaxHeight, int quality = WebpQuality)
        {
            using var image = await Image.LoadAsync(file.OpenReadStream());

            var originalSize = $"{image.Width}x{image.Height}";

            // Chỉ resize nếu ảnh lớn hơn giới hạn
            // ResizeMode.Max: giữ tỉ lệ, không phóng to, chỉ thu nhỏ
            if (image.Width > maxWidth || image.Height > maxHeight)
            {
                image.Mutate(ctx => ctx.Resize(new ResizeOptions
                {
                    Size = new Size(maxWidth, maxHeight),
                    Mode = ResizeMode.Max,
                    Sampler = KnownResamplers.Lanczos3 // chất lượng resize tốt nhất
                }));
            }

            var outputStream = new MemoryStream();

            // Encode sang WebP với quality được cấu hình
            var encoder = new WebpEncoder
            {
                Quality = quality,
                Method = WebpEncodingMethod.BestQuality
            };

            await image.SaveAsync(outputStream, encoder);
            outputStream.Position = 0;

            _logger.LogInformation(
                "Image processed: {OriginalSize} → {NewSize}, {OriginalKb}KB → {NewKb}KB (WebP q={Quality})",
                originalSize,
                $"{image.Width}x{image.Height}",
                file.Length / 1024,
                outputStream.Length / 1024,
                quality
            );

            return (outputStream, "image/webp", ".webp");
        }
    }
}
