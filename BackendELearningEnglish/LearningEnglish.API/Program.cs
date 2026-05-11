using Microsoft.AspNetCore.HttpOverrides;
using LearningEnglish.API.Extensions;
using LearningEnglish.Application.Common;
using LearningEnglish.Infrastructure.Common.Helpers;
using LearningEnglish.Infrastructure.Data;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;



var builder = WebApplication.CreateBuilder(args);

BuildPublicUrl.Configure(builder.Configuration);

var frontendUrl = builder.Configuration["Frontend:BaseUrl"];
var conn = builder.Configuration.GetConnectionString("DefaultConnection");
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(frontendUrl) || !Uri.TryCreate(frontendUrl, UriKind.Absolute, out _))
    throw new InvalidOperationException("Frontend:BaseUrl is missing or invalid absolute URL.");

if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Jwt:Key is missing or too short (>=32 chars).");
if (string.IsNullOrWhiteSpace(jwtIssuer))
    throw new InvalidOperationException("Jwt:Issuer is missing.");
if (string.IsNullOrWhiteSpace(jwtAudience))
    throw new InvalidOperationException("Jwt:Audience is missing.");
if (string.IsNullOrWhiteSpace(conn))
    throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection.");

// Đăng ký dịch vụ theo module để Program.cs ngắn và dễ tìm
builder.Services
    .AddApiCore(builder.Configuration, frontendUrl) // Controllers, CORS, Swagger 
    .AddDataAndSecurity(conn, jwtKey, jwtIssuer, jwtAudience) // DbContext, Identity, Auth, Authorization
    .AddInfrastructureServices(builder.Configuration)
    .AddApplicationServices(builder.Configuration) // SK Kernel + all app services
    .AddBackgroundServices();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.OnRejected = async (context, cancellationToken) =>
    {
        // Try to include a Retry-After header when provided by the limiter
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            var seconds = (int)Math.Ceiling(retryAfter.TotalSeconds);
            context.HttpContext.Response.Headers.RetryAfter = seconds.ToString();
        }

        context.HttpContext.Response.ContentType = "application/json";

        // Keep response shape consistent with the rest of the API
        var payload = new ServiceResponse<object>
        {
            Success = false,
            StatusCode = StatusCodes.Status429TooManyRequests,
            Message = "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau.",
            Data = null
        };

        await context.HttpContext.Response.WriteAsJsonAsync(payload, cancellationToken);
    };

    options.AddFixedWindowLimiter("JoinClassCodePolicy", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
});


// Configuration moved to startup

// Build app
var app = builder.Build();

// Middleware pipeline
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

app.UseSwagger();
app.UseSwaggerUI();

app.UseRouting();
app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();



// AUTO-APPLY MIGRATIONS ON STARTUP (Development/Docker environments)

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        // Always run migration on startup to ensure DB is up to date
        logger.LogInformation("Applying database migrations...");
        await dbContext.Database.MigrateAsync();
        logger.LogInformation("Database migrations completed successfully");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error applying database migrations");
        throw;
    }
}

app.Run();
