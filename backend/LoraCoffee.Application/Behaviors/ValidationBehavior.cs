using FluentValidation;
using LoraCoffee.Application.DTOs;
using MediatR;

namespace LoraCoffee.Application.Behaviors;

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators) => _validators = validators;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
            return await next();

        var context = new ValidationContext<TRequest>(request);
        var failures = _validators
            .Select(v => v.Validate(context))
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .ToList();

        if (failures.Count == 0)
            return await next();

        var message = string.Join("; ", failures.Select(f => f.ErrorMessage));

        if (typeof(TResponse).IsGenericType &&
            typeof(TResponse).GetGenericTypeDefinition() == typeof(ApiResponse<>))
        {
            var dataType = typeof(TResponse).GetGenericArguments()[0];
            var responseType = typeof(ApiResponse<>).MakeGenericType(dataType);
            var response = Activator.CreateInstance(responseType, false, null, message);
            return (TResponse)response!;
        }

        throw new ValidationException(failures);
    }
}
