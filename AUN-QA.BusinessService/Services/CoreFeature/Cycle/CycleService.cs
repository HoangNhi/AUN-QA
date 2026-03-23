using AUN_QA.Shared.DTOs.Base;
using AUN_QA.Shared.Exceptions;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Council.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvaluationSchedule.Requests;
using AUN_QA.BusinessService.Infrastructure.Data;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AUN_QA.BusinessService.Services.CoreFeature.Cycle
{
    [RegisterClassAsTransient]
    public class CycleService : ICycleService
    {
        private readonly BusinessContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;

        public CycleService(
            BusinessContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
        }

        #region Chức năng chính
        public async Task<ModelCycle> GetById(GetByIdRequest request)
        {
            var data = await _context.Cycles.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.Id);
            if (data == null)
            {
                throw new BusinessException("Không tìm thấy dữ liệu");
            }

            var result = _mapper.Map<ModelCycle>(data);

            // List Council
            var listCouncil = _context.Councils.AsNoTracking()
                .Where(x => x.CycleId == result.Id && !x.IsDeleted && x.IsActived)
                .OrderBy(x => x.RoleId);
            result.ListCouncil = _mapper.Map<List<CouncilRequest>>(listCouncil);

            // List EvaluationSchedule
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
                throw new BusinessException("Tên chu kỳ đã tồn tại");
            }

            var add = _mapper.Map<Entities.Cycle>(request);
            add.Id = Guid.NewGuid();
            add.Status = (int)CycleStatus.Plan; // Lập kế hoạch — always draft on creation
            add.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
            add.CreatedAt = DateTime.UtcNow;
            add.IsActived = request.IsActived;

            await _context.Cycles.AddAsync(add);

            #region Council
            if (request.ListCouncil != null && request.ListCouncil.Count > 0)
            {
                if (request.ListCouncil.Count() > 1 && request.ListCouncil.GroupBy(x => x.UserId).Any(g => g.Count() > 1))
                {
                    throw new BusinessException("Thành viên trong hội đồng đánh giá không được trùng nhau");
                }

                if (request.ListCouncil.Count(x => x.RoleId == ((int)CouncilRole.HeadOfCouncil)) != 1)
                {
                    throw new BusinessException("Hội đồng phải có 1 trưởng nhóm");
                }

                // Blueprint Đ15.k1: HĐ phải có tối thiểu 9 thành viên
                if (request.ListCouncil.Count < 9)
                {
                    throw new BusinessException("Hội đồng phải có tối thiểu 9 thành viên (Đ15.k1)");
                }

                foreach (var council in request.ListCouncil)
                {
                    var addCouncil = _mapper.Map<Entities.Council>(council);
                    addCouncil.Id = Guid.NewGuid();
                    addCouncil.CycleId = add.Id;
                    addCouncil.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    addCouncil.CreatedAt = DateTime.UtcNow;
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
                    addSchedule.CreatedAt = DateTime.UtcNow;
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
                throw new BusinessException("Tên chu kỳ đã tồn tại");
            }

            var update = await _context.Cycles.FindAsync(request.Id);
            if (update == null)
            {
                throw new BusinessException("Dữ liệu không tồn tại");
            }

            if (update.Status >= (int)CycleStatus.Finish)
            {
                throw new BusinessException("Chu kỳ đã kết thúc, không thể cập nhật");
            }

            _mapper.Map(request, update);

            update.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
            update.UpdatedAt = DateTime.UtcNow;

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
                    item.UpdatedAt = DateTime.UtcNow;
                    item.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    _context.Councils.Update(item);
                }
            }

            if (request.ListCouncil != null && request.ListCouncil.Count > 0)
            {
                if (request.ListCouncil.Count() > 1 && request.ListCouncil.GroupBy(x => x.UserId).Any(g => g.Count() > 1))
                {
                    throw new BusinessException("Thành viên trong hội đồng đánh giá không được trùng nhau");
                }

                if (request.ListCouncil.Count(x => x.RoleId == ((int)CouncilRole.HeadOfCouncil)) != 1)
                {
                    throw new BusinessException("Hội đồng phải có 1 trưởng nhóm");
                }

                // Blueprint Đ15.k1: HĐ phải có tối thiểu 9 thành viên
                if (request.ListCouncil.Count < 9)
                {
                    throw new BusinessException("Hội đồng phải có tối thiểu 9 thành viên (Đ15.k1)");
                }

                foreach (var item in request.ListCouncil)
                {
                    var updateCouncil = ListCouncilHienTai.Find(x => x.Id == item.Id && !x.IsDeleted);
                    if (updateCouncil != null)
                    {
                        updateCouncil.UpdatedAt = DateTime.UtcNow;
                        updateCouncil.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                        _context.Councils.Update(updateCouncil);
                    }
                    else
                    {
                        var addCouncil = _mapper.Map<Entities.Council>(item);
                        addCouncil.Id = Guid.NewGuid();
                        addCouncil.CycleId = update.Id;
                        addCouncil.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                        addCouncil.CreatedAt = DateTime.UtcNow;
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
                    item.UpdatedAt = DateTime.UtcNow;
                    item.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    _context.EvaluationSchedules.Update(item);
                }
            }
            foreach (var item in request.ListEvaluationSchedule)
            {
                var updateSchedule = ListScheduleHienTai.Find(x => x.Id == item.Id && !x.IsDeleted);
                if (updateSchedule != null)
                {
                    updateSchedule.UpdatedAt = DateTime.UtcNow;
                    updateSchedule.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    _context.EvaluationSchedules.Update(updateSchedule);
                }
                else
                {
                    var addSchedule = _mapper.Map<Entities.EvaluationSchedule>(item);
                    addSchedule.Id = Guid.NewGuid();
                    addSchedule.CycleId = update.Id;
                    addSchedule.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    addSchedule.CreatedAt = DateTime.UtcNow;
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
                    throw new BusinessException("Dữ liệu không tồn tại");
                }

                if (delete.Status != (int)CycleStatus.Plan)
                {
                    var userIdString = _contextAccessor.HttpContext?.User?.Claims
                        .FirstOrDefault(x => x.Type == "name")?.Value;

                    var allowed = !string.IsNullOrEmpty(userIdString) && await CanUserDoActionInPdcaAsync(new PdcaActionCheckRequest
                    {
                        CycleId = delete.Id,
                        UserId = Guid.Parse(userIdString),
                        AllowedRoles = new List<int> { (int)CouncilRole.HeadOfCouncil }
                    });

                    if (!allowed)
                        throw new BusinessException($"Chu kỳ '{delete.Name}' đang ở trạng thái thực hiện, chỉ Chủ tịch Hội đồng mới có quyền xóa");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";

                _context.Cycles.Update(delete);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<GetListPagingResponse<ModelCycleGetListPaging>> GetList(CycleGetListPagingRequest request)
        {
            var query = _context.Cycles.Where(x => !x.IsDeleted).AsQueryable();

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x => x.Name.Contains(request.TextSearch.Trim()));
            }

            if (request.Status.HasValue)
            {
                query = query.Where(x => x.Status == request.Status);
            }

            if (request.Year.HasValue)
            {
                query = query.Where(x => x.Year == request.Year);
            }

            if (request.Scope.HasValue)
            {
                query = query.Where(x => x.Scope == request.Scope);
            }

            if (request.StandardSetId.HasValue)
            {
                query = query.Where(x => x.StandardSetId == request.StandardSetId);
            }

            // === Role-based visibility filter ===
            var username = _contextAccessor.HttpContext.User.Identity.Name;
            var roleClaim = _contextAccessor.HttpContext.User.Claims.FirstOrDefault(x => x.Type == System.Security.Claims.ClaimTypes.Role)?.Value;

            var privilegedRoleIds = new[]
            {
                "5493e3b6-abbc-4ba2-a54f-3e5a35e82219", // HeadOfCouncil
                "90fbf8b5-74b2-420f-a9a8-029ae32a2a83"  // Secretary
            };

            bool isAdmin = string.Equals(username, "admin", StringComparison.OrdinalIgnoreCase);
            bool isPrivilegedRole = roleClaim != null && privilegedRoleIds.Contains(roleClaim, StringComparer.OrdinalIgnoreCase);

            if (!isAdmin && !isPrivilegedRole)
            {
                var userIdString = _contextAccessor.HttpContext.User.Claims.FirstOrDefault(x => x.Type == "name")?.Value;
                if (!string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out var userId))
                {
                    var userCycleIds = _context.Councils
                        .Where(c => c.UserId == userId && !c.IsDeleted && c.IsActived)
                        .Select(c => c.CycleId);

                    query = query.Where(x => userCycleIds.Contains(x.Id));
                }
                else
                {
                    return new GetListPagingResponse<ModelCycleGetListPaging>
                    {
                        PageIndex = request.PageIndex,
                        PageSize = request.PageSize,
                        TotalRow = 0,
                        Data = new List<ModelCycleGetListPaging>()
                    };
                }
            }
            // === END: Role-based visibility filter ===

            var totalRow = await query.CountAsync();

            var data = await query
                .OrderByDescending(x => x.UpdatedAt.HasValue ? x.UpdatedAt : x.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var result = data.Select(x =>
            {
                var res = _mapper.Map<ModelCycleGetListPaging>(x);
                res.StatusName = x.Status switch
                {
                    (int)CycleStatus.Plan => "Lập kế hoạch",
                    (int)CycleStatus.Do => "Thực hiện",
                    (int)CycleStatus.Check => "Kiểm tra",
                    (int)CycleStatus.Act => "Cải tiến",
                    (int)CycleStatus.Finish => "Kết thúc",
                    _ => "Không xác định"
                };
                // StandardSet display not available in BusinessService — populated by frontend via separate lookup
                res.StandardSet = null;

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
                throw new BusinessException("Dữ liệu không tồn tại");

            var userId = _contextAccessor.HttpContext.User.Claims.FirstOrDefault(x => x.Type == "name").Value;

            var checkPermissionInPDCA = await CanUserDoActionInPdcaAsync(new PdcaActionCheckRequest
            {
                CycleId = cycle.Id,
                UserId = Guid.Parse(userId),
                AllowedRoles = new List<int>
                {
                    (int)CouncilRole.HeadOfCouncil,
                    ((int)CouncilRole.ViceChairman)
                }
            });

            if (!checkPermissionInPDCA)
            {
                throw new BusinessException("Chỉ Chủ tịch hoặc Phó chủ tịch Hội đồng mới có quyền chuyển trạng thái chu kỳ");
            }

            if (cycle.Status >= (int)CycleStatus.Finish)
                throw new BusinessException("Chu kỳ đã kết thúc, không thể chuyển trạng thái");

            cycle.Status += 1;
            cycle.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
            cycle.UpdatedAt = DateTime.UtcNow;

            _context.Cycles.Update(cycle);
            await _context.SaveChangesAsync();
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

            return true;
        }

        public async Task<bool> IsUserInRoleAsync(Guid cycleId, Guid userId, int role)
        {
            return await _context.Councils.AnyAsync(c =>
                c.CycleId == cycleId
                && c.UserId == userId
                && c.RoleId == role
                && !c.IsDeleted
                && c.IsActived);
        }

        public async Task<int?> GetUserRoleAsync(Guid cycleId, Guid userId)
        {
            var council = await _context.Councils.AsNoTracking().FirstOrDefaultAsync(c =>
                c.CycleId == cycleId
                && c.UserId == userId
                && !c.IsDeleted
                && c.IsActived);
            return council?.RoleId;
        }

        public async Task<List<Guid>> GetCycleIdsByUserAsync(Guid userId)
        {
            return await _context.Councils
                .Where(c => c.UserId == userId && !c.IsDeleted && c.IsActived)
                .Select(c => c.CycleId)
                .Distinct()
                .ToListAsync();
        }

        public async Task<(bool Found, int Status)> GetCycleStatusAsync(Guid cycleId)
        {
            var cycle = await _context.Cycles.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == cycleId && !c.IsDeleted && c.IsActived);

            if (cycle == null)
                return (false, 0);

            return (true, cycle.Status);
        }

        private static bool IsDelegationActive(Entities.Council council)
        {
            if (!council.IsDelegated)
                return false;

            if (council.DelegatedUntil.HasValue && council.DelegatedUntil.Value <= DateTime.UtcNow)
                return false;

            return true;
        }

        private static bool IsInScope(string? assignedStandardsJson, Guid? standardId)
        {
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
                return false;
            }
        }

        #endregion
    }
}
