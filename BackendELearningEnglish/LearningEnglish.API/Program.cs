using LearningEnglish.API.Extensions;
using LearningEnglish.Infrastructure.Common.Helpers;
using LearningEnglish.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;



var builder = WebApplication.CreateBuilder(args);


var frontendUrl = builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";
var conn = builder.Configuration.GetConnectionString("DefaultConnection");
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

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


BuildPublicUrl.Configure(builder.Configuration); // 

// Build app
var app = builder.Build();

// Middleware pipeline

app.UseSwagger();
app.UseSwaggerUI();

app.UseRouting();
app.UseCors("AllowFrontend");
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
