using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Requests;
using AUN_QA.SystemService.Helpers;
using AUN_QA.SystemService.Infrastructure.Data;
using AutoDependencyRegistration.Attributes;
using AutoMapper;

namespace AUN_QA.SystemService.Services.Auth
{
    [RegisterClassAsTransient]
    public class AuthService : IAuthService
    {
        private readonly SystemContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly IConfiguration _config;

        public AuthService(
            SystemContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor,
            IConfiguration config)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
            _config = config;
        }

        public LoginResponse Login(LoginRequest request)
        {
            var user = _context.Users.Where(x => x.Username == request.Username).FirstOrDefault();
            if (user == null)
            {
                throw new Exception("Tài khoản không tồn tại");
            }

            if (!user.IsActived)
            {
                throw new Exception("Tài khoản đã bị vô hiệu");
            }

            var pass = Encrypt_DecryptHelper.EncodePassword(request.Password, user.PasswordSalt);
            if (!pass.Equals(user.Password))
            {
                throw new Exception("Tài khoản hoặc mật khẩu không đúng");
            }

            var data = _mapper.Map<LoginResponse>(user);
            var token = JWTHelper.GenerateJwtToken(data, _config);
            //// Generate Refresh Token
            //var refreshToken = GenerateRefreshToken(ipAddress);
            //refreshToken.UserId = user.Id;
            //// Save Refresh Token
            //_context.RefreshTokens.Add(refreshToken);
            //_context.SaveChanges();

            //data.RefreshToken = refreshToken.Token.ToString();
            data.AccessToken = token;

            return data;
        }
    }
}
