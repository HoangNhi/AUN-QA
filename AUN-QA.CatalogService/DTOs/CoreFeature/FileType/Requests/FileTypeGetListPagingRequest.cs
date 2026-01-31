using AUN_QA.CatalogService.DTOs.Base;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.FileType.Requests
{
    public class FileTypeGetListPagingRequest : GetListPagingRequest
    {
        public bool? IsActived { get; set; }
    }
}
