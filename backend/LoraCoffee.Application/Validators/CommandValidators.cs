using FluentValidation;
using LoraCoffee.Application.Features.Auth.Commands;
using LoraCoffee.Application.Features.Orders.Commands;

namespace LoraCoffee.Application.Validators;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Username).NotEmpty().WithMessage("Kullanıcı adı gerekli.");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).WithMessage("Şifre en az 6 karakter olmalıdır.");
    }
}

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.Request.Items)
            .NotEmpty().WithMessage("Sipariş en az bir ürün içermelidir.");

        RuleForEach(x => x.Request.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId).NotEmpty().WithMessage("Ürün ID gerekli.");
            item.RuleFor(i => i.Quantity).GreaterThan(0).WithMessage("Ürün adedi sıfırdan büyük olmalıdır.");
        });

        RuleFor(x => x.Request.Payments)
            .NotEmpty().WithMessage("En az bir ödeme bilgisi gerekli.");

        RuleForEach(x => x.Request.Payments).ChildRules(payment =>
        {
            payment.RuleFor(p => p.PaymentType).NotEmpty().WithMessage("Ödeme tipi gerekli.");
            payment.RuleFor(p => p.Amount).GreaterThan(0).WithMessage("Ödeme tutarı sıfırdan büyük olmalıdır.");
        });
    }
}

public class UpdateOrderStatusCommandValidator : AbstractValidator<UpdateOrderStatusCommand>
{
    public UpdateOrderStatusCommandValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty().WithMessage("Sipariş ID gerekli.");
        RuleFor(x => x.Status).NotEmpty().WithMessage("Sipariş durumu gerekli.");
    }
}
