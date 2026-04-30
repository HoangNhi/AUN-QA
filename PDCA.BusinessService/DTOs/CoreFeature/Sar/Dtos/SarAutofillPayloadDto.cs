using System;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Dtos
{
    public class SarAutofillPayloadDto
    {
        public Guid CycleId { get; set; }
        public string Payload { get; set; } = string.Empty;
    }
}