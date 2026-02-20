namespace AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Dtos
{
    public class ModelEvidenceCycleMapGetListPaging : ModelEvidenceCycleMap
    {
        public string? Evidence_Name { get; set; }

        public string? Evidence_Code { get; set; }

        public int? Evidence_Status { get; set; }

        public string? CycleName { get; set; }

        public Guid? Evidence_FileTypeId { get; set; }
    }
}
