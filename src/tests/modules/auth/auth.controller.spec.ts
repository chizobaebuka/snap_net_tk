
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../modules/auth/auth.controller';
import { AuthService } from '../../../modules/auth/auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return a token for valid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'password' };
      const user = { id: '1', email: 'test@example.com', role: 'EMPLOYEE' };
      const result = { access_token: 'jwt_token' };

      jest.spyOn(service, 'validateUser').mockResolvedValue(user);
      jest.spyOn(service, 'login').mockResolvedValue(result);

      expect(await controller.login(loginDto)).toBe(result);
      expect(service.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(service.login).toHaveBeenCalledWith(user);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrong_password' };
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if email or password missing', async () => {
      await expect(controller.login({})).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('AuthController instance', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

});
