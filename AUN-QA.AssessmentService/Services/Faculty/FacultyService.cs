using AUN_QA.AssessmentService.DTOs.Base;
using AUN_QA.AssessmentService.DTOs.CoreFeature.Faculty.Dtos;
using AUN_QA.AssessmentService.DTOs.CoreFeature.Faculty.Requests;
using AUN_QA.AssessmentService.Infrastructure.Data;
using AutoDependencyRegistration.Attributes;
using AutoMapper;

namespace AUN_QA.AssessmentService.Services.Faculty
{
    [RegisterClassAsTransient]
    public class FacultyService : IFacultyService
    {
        private readonly AssessmentContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;

        public FacultyService(
            AssessmentContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
        }

        public ModelFaculty GetById(GetByIdRequest request)
        {
            var data = _context.Faculties.Find(request.Id);
            if (data == null)
            {
                throw new Exception("Not found");
            }

            var result = _mapper.Map<ModelFaculty>(data);

            return result;
        }

        public ModelFaculty Insert(FacultyRequest request)
        {
            var data = _context.Faculties.Where(x =>
                (x.Code == request.Code || x.Name == request.Name)
                && !x.IsDeleted
            );

            if (data.Any())
            {
                throw new Exception("Dữ liệu đã tồn tại");
            }

            var add = _mapper.Map<Entities.Faculty>(request);
            add.Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id;
            add.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            add.CreatedAt = DateTime.Now;

            _context.Faculties.Add(add);
            _context.SaveChanges();

            return _mapper.Map<ModelFaculty>(add);
        }

        public ModelFaculty Update(FacultyRequest request)
        {
            var data = _context.Faculties.Where(x =>
                (x.Code == request.Code || x.Name == request.Name)
                && !x.IsDeleted && x.Id != request.Id);

            if (data.Any())
            {
                throw new Exception("Dữ liệu đã tồn tại");
            }

            var update = _context.Faculties.Find(request.Id);
            if (update == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            _mapper.Map(request, update);

            update.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            update.UpdatedAt = DateTime.Now;

            _context.Faculties.Update(update);
            _context.SaveChanges();

            return _mapper.Map<ModelFaculty>(update);
        }

        public string DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = _context.Faculties.Find(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                delete.UpdatedAt = DateTime.Now;

                _context.Faculties.Update(delete);
            }

            _context.SaveChanges();
            return String.Join(',', request.Ids);
        }

        public Task<GetListPagingResponse<ModelFaculty>> GetList(GetListPagingRequest request)
        {
            throw new NotImplementedException();
        }
    }
}
