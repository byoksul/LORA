using System.Threading.RateLimiting;
using LoraCoffee.API.Middleware;
using LoraCoffee.Application;
using LoraCoffee.Infrastructure;
using LoraCoffee.Infrastructure.Hubs;
using LoraCoffee.Infrastructure.Persistence;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException("Jwt:Key yapılandırması eksik. JWT__Key ortam değişkenini ayarlayın.");

if (jwtKey.Length < 32)
    throw new InvalidOperationException("Jwt:Key en az 32 karakter olmalıdır.");

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection yapılandırması eksik.");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString, name: "postgresql")
    .AddDbContextCheck<ApplicationDbContext>(name: "efcore");

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("login", limiter =>
    {
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.PermitLimit = 10;
        limiter.QueueLimit = 0;
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });
});

var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
if (corsOrigins.Length == 0)
{
    var corsEnv = builder.Configuration["CORS__Origins"];
    if (!string.IsNullOrWhiteSpace(corsEnv))
        corsOrigins = corsEnv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (corsOrigins.Length > 0)
            policy.WithOrigins(corsOrigins);
        else if (builder.Environment.IsDevelopment())
            policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000");
        else
            throw new InvalidOperationException("Cors:Origins yapılandırması eksik. CORS__Origins ortam değişkenini ayarlayın.");

        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<OrderHub>("/hubs/orders").RequireAuthorization();
app.MapHealthChecks("/health");

await DataSeeder.SeedAsync(app.Services);

app.Run();
