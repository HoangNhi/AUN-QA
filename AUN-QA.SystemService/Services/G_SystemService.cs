using AUN_QA.SystemService.Protos;
using Grpc.Core;
using Newtonsoft.Json;

namespace AUN_QA.SystemService.Services
{
    public class G_SystemService : SystemProto.SystemProtoBase
    {
        public override Task<CheckActionResponse> CheckAction(CheckActionRequest request, ServerCallContext context)
        {
            Console.WriteLine(JsonConvert.SerializeObject(request));
            return Task.FromResult(new CheckActionResponse
            {
                Result = true
            });
        }
    }
}
