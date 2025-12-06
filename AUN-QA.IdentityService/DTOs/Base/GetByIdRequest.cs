namespace AUN_QA.IdentityService.DTOs.Base
{
    public class GetByIdRequest
    {
        public Guid? Id { get; set; }
    }

    //public class GetByIdDeleteRequestValidator : AbstractValidator<GetByIdRequest>
    //{
    //    public GetByIdDeleteRequestValidator()
    //    {
    //        RuleFor(r => r.Id).NotNull().WithMessage("Id cannot leave blank");
    //    }
    //}
}
