using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateQuestion.Requests;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.TemplateCategory.Requests
{
    public class TemplateCategoryRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid TopicId { get; set; }

        public string Name { get; set; } = null!;

        public int Sort { get; set; }

        public List<TemplateQuestionRequest> ListQuestion { get; set; } = new();
    }

    public class TemplateCategoryRequestValidator : AbstractValidator<TemplateCategoryRequest>
    {
        public TemplateCategoryRequestValidator()
        {
            RuleFor(x => x.TopicId).NotEmpty().WithMessage("Chủ đề không được để trống");
            RuleFor(x => x.Name).NotEmpty().WithMessage("Tên danh mục không được để trống");
            RuleFor(x => x.Sort).GreaterThanOrEqualTo(0).WithMessage("Thứ tự sắp xếp không được nhỏ hơn 0");

            RuleForEach(x => x.ListQuestion).SetValidator(new TemplateQuestionRequestValidator());
        }
    }
}
