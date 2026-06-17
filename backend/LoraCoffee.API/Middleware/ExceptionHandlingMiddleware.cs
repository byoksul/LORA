using System.Net;
using System.Text.Json;
using LoraCoffee.Application.DTOs;

namespace LoraCoffee.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);

            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            var message = _environment.IsDevelopment()
                ? ex.Message
                : "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.";

            var response = new ApiResponse<object>(false, null, message);
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
