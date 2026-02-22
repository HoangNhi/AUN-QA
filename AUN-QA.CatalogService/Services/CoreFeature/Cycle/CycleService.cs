using AUN_QA.Shared.DTOs.Base;
using AUN_QA.CatalogService.DTOs.Common;
using AUN_QA.CatalogService.DTOs.CoreFeature.Council.Requests;
using AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.CatalogService.DTOs.CoreFeature.EvaluationSchedule.Requests;
using AUN_QA.CatalogService.Infrastructure.Data;
using AUN_QA.CatalogService.Protos;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Google.Protobuf.WellKnownTypes;
using Microsoft.EntityFrameworkCore;
using System.Runtime.CompilerServices;
using System.Text.Json;

namespace AUN_QA.CatalogService.Services.CoreFeature.Cycle
{
    [RegisterClassAsTransient]
    public class CycleService : ICycleService
    {
        private readonly CatalogContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;

        public CycleService(
            CatalogContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
        }

        #region Chá»©c nÄƒng chÃ­nh
        public async Task<ModelCycle> GetById(GetByIdRequest request)
        {
            var data = await _context.Cycles.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.Id);
            if (data == null)
            {
                throw new Exception("KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u");
            }

            var result = _mapper.Map<ModelCycle>(data);

            // List Council
            var listCouncil = _context.Councils.AsNoTracking().Where(x => x.CycleId == result.Id && !x.IsDeleted && x.IsActived).OrderBy(x => x.RoleId);
            result.ListCouncil = _mapper.Map<List<CouncilRequest>>(listCouncil);

            // List 
            var listEvaluationSchedule = _context.EvaluationSchedules.AsNoTracking().Where(x => x.CycleId == result.Id && !x.IsDeleted && x.IsActived);
            result.ListEvaluationSchedule = _mapper.Map<List<EvaluationScheduleRequest>>(listEvaluationSchedule);

            return result;
        }

        public async Task Insert(CycleRequest request)
        {
            var data = _context.Cycles.Where(x =>
                x.Name == request.Name
                && !x.IsDeleted
            );

            if (data.Any())
            {
                throw new Exception("TÃªn chu ká»³ Ä‘Ã£ tá»“n táº¡i");
            }

            var add = _mapper.Map<Entities.Cycle>(request);
            add.Id = Guid.NewGuid();
            add.Status = (int)CycleStatus.Plan; // Láº­p káº¿ hoáº¡ch â€” always draft on creation
            add.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
            add.CreatedAt = DateTime.Now;
            add.IsActived = request.IsActived;

            await _context.Cycles.AddAsync(add);

            #region Council
            if (request.ListCouncil != null && request.ListCouncil.Count > 0)
            {
                if (request.ListCouncil.Count() > 1 && request.ListCouncil.GroupBy(x => x.UserId).Any(g => g.Count() > 1))
                {
                    throw new Exception("ThÃ nh viÃªn trong há»™i Ä‘á»“ng Ä‘Ã¡nh giÃ¡ khÃ´ng Ä‘Æ°á»£c trÃ¹ng nhau");
                }

                if (request.ListCouncil.Count(x => x.RoleId == ((int)CouncilRole.HeadOfCouncil)) != 1)
                {
                    throw new Exception("Há»™i Ä‘á»“ng pháº£i cÃ³ 1 trÆ°á»Ÿng nhÃ³m");
                }

                // Blueprint Ä15.k1: HÄ pháº£i cÃ³ tá»‘i thiá»ƒu 9 thÃ nh viÃªn
                if (request.ListCouncil.Count < 9)
                {
                    throw new Exception("Há»™i Ä‘á»“ng pháº£i cÃ³ tá»‘i thiá»ƒu 9 thÃ nh viÃªn (Ä15.k1)");
                }

                foreach (var council in request.ListCouncil)
                {
                    var addCouncil = _mapper.Map<Entities.Council>(council);
                    addCouncil.Id = Guid.NewGuid();
                    addCouncil.CycleId = add.Id;
                    addCouncil.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    addCouncil.CreatedAt = DateTime.Now;
                    addCouncil.IsActived = true;
                    await _context.Councils.AddAsync(addCouncil);
                }
            }
            #endregion

            #region EvaluationSchedule
            if (request.ListEvaluationSchedule != null && request.ListEvaluationSchedule.Count > 0)
            {
                foreach (var schedule in request.ListEvaluationSchedule)
                {
                    var addSchedule = _mapper.Map<Entities.EvaluationSchedule>(schedule);
                    addSchedule.Id = Guid.NewGuid();
                    addSchedule.CycleId = add.Id;
                    addSchedule.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    addSchedule.CreatedAt = DateTime.Now;
                    addSchedule.IsActived = true;
                    await _context.EvaluationSchedules.AddAsync(addSchedule);
                }
            }
            #endregion

            await _context.SaveChangesAsync();
        }

        public async Task Update(CycleRequest request)
        {
            var data = _context.Cycles.Where(x =>
                x.Name == request.Name
                && !x.IsDeleted && x.Id != request.Id);

            if (data.Any())
            {
                throw new Exception("TÃªn chu ká»³ Ä‘Ã£ tá»“n táº¡i");
            }

            var update = await _context.Cycles.FindAsync(request.Id);
            if (update == null)
            {
                throw new Exception("Dá»¯ liá»‡u khÃ´ng tá»“n táº¡i");
            }

            if (update.Status >= (int)CycleStatus.Finish)
            {
                throw new Exception("Chu ká»³ Ä‘Ã£ káº¿t thÃºc, khÃ´ng thá»ƒ cáº­p nháº­t");
            }

            _mapper.Map(request, update);

            update.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
            update.UpdatedAt = DateTime.Now;

            _context.Cycles.Update(update);

            #region Council
            var ListCouncilHienTai = _context.Councils.Where(x => x.CycleId == update.Id && !x.IsDeleted).ToList();
            var ListCouncilId = request.ListCouncil.Select(x => x.Id).ToList();
            var ListCouncilCanXoa = ListCouncilHienTai.Where(x => !ListCouncilId.Contains(x.CycleId)).ToList();
            if (ListCouncilCanXoa.Count() > 0)
            {
                foreach (var item in ListCouncilCanXoa)
                {
                    item.IsDeleted = true;
                    item.UpdatedAt = DateTime.Now;
                    item.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    _context.Councils.Update(item);
                }
            }

            if (request.ListCouncil != null && request.ListCouncil.Count > 0)
            {
                if (request.ListCouncil.Count() > 1 && request.ListCouncil.GroupBy(x => x.UserId).Any(g => g.Count() > 1))
                {
                    throw new Exception("ThÃ nh viÃªn trong há»™i Ä‘á»“ng Ä‘Ã¡nh giÃ¡ khÃ´ng Ä‘Æ°á»£c trÃ¹ng nhau");
                }

                if (request.ListCouncil.Count(x => x.RoleId == ((int)CouncilRole.HeadOfCouncil)) != 1)
                {
                    throw new Exception("Há»™i Ä‘á»“ng pháº£i cÃ³ 1 trÆ°á»Ÿng nhÃ³m");
                }

                // Blueprint Ä15.k1: HÄ pháº£i cÃ³ tá»‘i thiá»ƒu 9 thÃ nh viÃªn
                if (request.ListCouncil.Count < 9)
                {
                    throw new Exception("Há»™i Ä‘á»“ng pháº£i cÃ³ tá»‘i thiá»ƒu 9 thÃ nh viÃªn (Ä15.k1)");
                }

                foreach (var item in request.ListCouncil)
                {
                    var updateCouncil = ListCouncilHienTai.Find(x => x.Id == item.Id && !x.IsDeleted);
                    if (updateCouncil != null)
                    {
                        updateCouncil.UpdatedAt = DateTime.Now;
                        updateCouncil.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                        _context.Councils.Update(updateCouncil);
                    }
                    else
                    {
                        var addCouncil = _mapper.Map<Entities.Council>(item);
                        addCouncil.Id = Guid.NewGuid();
                        addCouncil.CycleId = update.Id;
                        addCouncil.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                        addCouncil.CreatedAt = DateTime.Now;
                        addCouncil.IsActived = true;
                        await _context.Councils.AddAsync(addCouncil);
                    }
                }
            }
            #endregion

            #region EvaluationSchedule
            var ListScheduleHienTai = _context.EvaluationSchedules.Where(x => x.CycleId == update.Id && !x.IsDeleted).ToList();
            var ListScheduleId = request.ListEvaluationSchedule.Select(x => x.Id).ToList();
            var ListScheduleCanXoa = ListScheduleHienTai.Where(x => !ListScheduleId.Contains(x.CycleId)).ToList();
            if (ListScheduleCanXoa.Count() > 0)
            {
                foreach (var item in ListScheduleCanXoa)
                {
                    item.IsDeleted = true;
                    item.UpdatedAt = DateTime.Now;
                    item.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    _context.EvaluationSchedules.Update(item);
                }
            }
            foreach (var item in request.ListEvaluationSchedule)
            {
                var updateSchedule = ListScheduleHienTai.Find(x => x.Id == item.Id && !x.IsDeleted);
                if (updateSchedule != null)
                {
                    updateSchedule.UpdatedAt = DateTime.Now;
                    updateSchedule.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    _context.EvaluationSchedules.Update(updateSchedule);
                }
                else
                {
                    var addSchedule = _mapper.Map<Entities.EvaluationSchedule>(item);
                    addSchedule.Id = Guid.NewGuid();
                    addSchedule.CycleId = update.Id;
                    addSchedule.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    addSchedule.CreatedAt = DateTime.Now;
                    addSchedule.IsActived = true;
                    await _context.EvaluationSchedules.AddAsync(addSchedule);
                }
            }
            #endregion

            await _context.SaveChangesAsync();
        }

        public async Task DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = await _context.Cycles.FindAsync(id);
                if (delete == null)
                {
                    throw new Exception("Dá»¯ liá»‡u khÃ´ng tá»“n táº¡i");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";

                _context.Cycles.Update(delete);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<GetListPagingResponse<ModelCycleGetListPaging>> GetList(CycleGetListPagingRequest request)
        {
            var query = from cycle in _context.Cycles.Where(x => !x.IsDeleted)
                        join ss in _context.StandardSets.Where(x => !x.IsDeleted && x.IsActived)
                        on cycle.StandardSetId equals ss.Id into ssGroup
                        from ss in ssGroup.DefaultIfEmpty()
                        select new { Cycle = cycle, StandardSetName = ss != null ? ss.Code : null };

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x => x.Cycle.Name.Contains(request.TextSearch.Trim()));
            }

            if (request.Status.HasValue)
            {
                query = query.Where(x => x.Cycle.Status == request.Status);
            }

            if (request.Year.HasValue)
            {
                query = query.Where(x => x.Cycle.Year == request.Year);
            }

            if (request.Scope.HasValue)
            {
                query = query.Where(x => x.Cycle.Scope == request.Scope);
            }

            if (request.StandardSetId.HasValue)
            {
                query = query.Where(x => x.Cycle.StandardSetId == request.StandardSetId);
            }

            var totalRow = await query.CountAsync();

            var data = await query
                .OrderByDescending(x => x.Cycle.UpdatedAt.HasValue ? x.Cycle.UpdatedAt : x.Cycle.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var result = data.Select(x =>
            {
                var res = _mapper.Map<ModelCycleGetListPaging>(x.Cycle);
                res.StatusName = x.Cycle.Status switch
                {
                    (int)CycleStatus.Plan => "Láº­p káº¿ hoáº¡ch",
                    (int)CycleStatus.Do => "Thá»±c hiá»‡n",
                    (int)CycleStatus.Check => "Kiá»ƒm tra",
                    (int)CycleStatus.Act => "Cáº£i tiáº¿n",
                    (int)CycleStatus.Finish => "Káº¿t thÃºc",
                    _ => "KhÃ´ng xÃ¡c Ä‘á»‹nh"
                };
                res.StandardSet = x.StandardSetName;

                return res;
            }).ToList();

            return new GetListPagingResponse<ModelCycleGetListPaging>
            {
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                TotalRow = totalRow,
                Data = result
            };
        }

        public async Task<List<ModelCombobox>> GetComboboxByUser()
        {
            var userIdString = _contextAccessor.HttpContext.User.Claims.FirstOrDefault(x => x.Type == "name").Value;

            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return new List<ModelCombobox>();
            }
            var query = from cycle in _context.Cycles
                        join council in _context.Councils on cycle.Id equals council.CycleId
                        where !cycle.IsDeleted && cycle.IsActived
                           && !council.IsDeleted && council.IsActived
                           && council.UserId == userId
                        select new ModelCombobox
                        {
                            Text = cycle.Name,
                            Value = cycle.Id.ToString()
                        };

            return await query.Distinct().OrderBy(x => x.Text).ToListAsync();
        }

        public async Task ChangeStatusAsync(CycleChangeStatusRequest request)
        {
            var cycle = await _context.Cycles.FindAsync(request.Id);
            if (cycle == null)
                throw new Exception("Dá»¯ liá»‡u khÃ´ng tá»“n táº¡i");

            var userId = _contextAccessor.HttpContext.User.Claims.FirstOrDefault(x => x.Type == "name").Value;

            // PCT HÄ chá»‰ Ä‘Æ°á»£c chuyá»ƒn tráº¡ng thÃ¡i khi Ä‘ang Ä‘Æ°á»£c á»§y quyá»n há»£p lá»‡
            var councilRecord = await _context.Councils.AsNoTracking().FirstOrDefaultAsync(c =>
                c.CycleId == cycle.Id
                && c.UserId == Guid.Parse(userId)
                && !c.IsDeleted
                && c.IsActived);

            if (councilRecord != null
                && (CouncilRole)councilRecord.RoleId == CouncilRole.ViceChairman
                && !IsDelegationActive(councilRecord))
            {
                throw new Exception("PhÃ³ Chá»§ tá»‹ch Há»™i Ä‘á»“ng chá»‰ Ä‘Æ°á»£c chuyá»ƒn tráº¡ng thÃ¡i khi Ä‘ang Ä‘Æ°á»£c á»§y quyá»n há»£p lá»‡");
            }

            var checkPermissionInPDCA = await CanUserDoActionInPdcaAsync(new PdcaActionCheckRequest
            {
                CycleId = cycle.Id,
                UserId = Guid.Parse(userId),
                AllowedRoles = new List<int>
                {
                    (int)CouncilRole.HeadOfCouncil,
                    (int)CouncilRole.ViceChairman
                }
            });

            if (!checkPermissionInPDCA)
            {
                throw new Exception("Chá»‰ Chá»§ tá»‹ch Há»™i Ä‘á»“ng má»›i cÃ³ quyá»n chuyá»ƒn tráº¡ng thÃ¡i chu ká»³");
            }

            if (cycle.Status >= (int)CycleStatus.Finish)
                throw new Exception("Chu ká»³ Ä‘Ã£ káº¿t thÃºc, khÃ´ng thá»ƒ chuyá»ƒn tráº¡ng thÃ¡i");

            cycle.Status += 1;
            cycle.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
            cycle.UpdatedAt = DateTime.Now;

            _context.Cycles.Update(cycle);
            await _context.SaveChangesAsync();
        }
        #endregion

        #region GRPC Services
        public async IAsyncEnumerable<CycleInfo> GetCyclesStreamAsync(
            GetCyclesStreamRequest request,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var query = _context.Cycles.AsNoTracking();

            if (request.Year.HasValue)
            {
                query = query.Where(s => s.Year == request.Year.Value);
            }

            var dataStream = query
                .Where(x => x.IsActived && !x.IsDeleted)
                .AsAsyncEnumerable();
            await foreach (var s in dataStream.WithCancellation(cancellationToken))
            {
                yield return new CycleInfo
                {
                    Id = s.Id.ToString(),
                    Name = s.Name,
                    Year = s.Year,
                    StartDate = Timestamp.FromDateTime(DateTime.SpecifyKind(s.StartDate, DateTimeKind.Utc)),
                    EndDate = Timestamp.FromDateTime(DateTime.SpecifyKind(s.EndDate, DateTimeKind.Utc)),
                    Status = s.Status,
                    EvaluationPurpose = s.EvaluationPurpose,
                    Scope = s.Scope
                };
            }
        }

        public async Task<bool> IsUserInRoleAsync(IsUserInRoleRequest request)
        {
            return await _context.Councils.AnyAsync(c =>
                c.CycleId == Guid.Parse(request.CycleId)
                && c.UserId == Guid.Parse(request.UserId)
                && c.RoleId == request.Role
                && !c.IsDeleted
                && c.IsActived);
        }

        public async Task<int?> GetUserRoleAsync(GetUserRoleRequest request)
        {
            var council = await _context.Councils.AsNoTracking().FirstOrDefaultAsync(c =>
                c.CycleId == Guid.Parse(request.CycleId)
                && c.UserId == Guid.Parse(request.UserId)
                && !c.IsDeleted
                && c.IsActived);
            if (council == null)
                return null;
            return council.RoleId;
        }
        #endregion

        #region PDCA Permissions

        /// <inheritdoc/>
        public async Task<bool> CanUserDoActionInPdcaAsync(PdcaActionCheckRequest request)
        {
            var username = _contextAccessor.HttpContext.User.Identity.Name;
            if (string.Equals(username, "admin", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            var council = await _context.Councils.AsNoTracking().FirstOrDefaultAsync(c =>
                c.CycleId == request.CycleId
                && c.UserId == request.UserId
                && !c.IsDeleted
                && c.IsActived);

            if (council == null)
                return false;

            if (request.AllowedRoles != null && request.AllowedRoles.Count > 0)
                return request.AllowedRoles.Contains(council.RoleId);

            // KhÃ´ng giá»›i háº¡n vai trÃ²: báº¥t ká»³ thÃ nh viÃªn HÄ Ä‘ang hoáº¡t Ä‘á»™ng nÃ o cÅ©ng Ä‘Æ°á»£c phÃ©p
            return true;
        }

        /// <summary>
        /// Kiá»ƒm tra á»§y quyá»n cá»§a PCT HÄ cÃ²n hiá»‡u lá»±c hay khÃ´ng.
        /// Há»£p lá»‡ khi: IsDelegated = true VÃ€ (DelegatedUntil == null HOáº¶C chÆ°a háº¿t háº¡n).
        /// </summary>
        private static bool IsDelegationActive(Entities.Council council)
        {
            if (!council.IsDelegated)
                return false;

            if (council.DelegatedUntil.HasValue && council.DelegatedUntil.Value <= DateTime.UtcNow)
                return false;

            return true;
        }

        /// <summary>
        /// Kiá»ƒm tra pháº¡m vi tiÃªu chuáº©n phá»¥ trÃ¡ch.
        /// - Náº¿u standardId == null: khÃ´ng cáº§n lá»c pháº¡m vi â†’ true.
        /// - Náº¿u standardId cÃ³ giÃ¡ trá»‹: AssignedStandards JSON pháº£i chá»©a standardId Ä‘Ã³.
        /// - Náº¿u AssignedStandards rá»—ng/null: user chÆ°a Ä‘Æ°á»£c phÃ¢n cÃ´ng TC nÃ o â†’ false khi cÃ³ standardId.
        /// </summary>
        private static bool IsInScope(string? assignedStandardsJson, Guid? standardId)
        {
            // KhÃ´ng lá»c pháº¡m vi náº¿u khÃ´ng chá»‰ Ä‘á»‹nh TC cá»¥ thá»ƒ
            if (standardId == null)
                return true;

            if (string.IsNullOrWhiteSpace(assignedStandardsJson))
                return false;

            try
            {
                var assignedIds = JsonSerializer.Deserialize<List<Guid>>(assignedStandardsJson);
                return assignedIds != null && assignedIds.Contains(standardId.Value);
            }
            catch
            {
                // JSON khÃ´ng há»£p lá»‡ â†’ an toÃ n lÃ  tá»« chá»‘i
                return false;
            }
        }

        #endregion
    }
}
