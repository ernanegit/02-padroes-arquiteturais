import { Router } from 'express';
import { AuthController } from '@/presentation/controllers/AuthController';
import { Container } from '@/infrastructure/container/Container';
import { ValidationMiddleware } from '@/presentation/middlewares/ValidationMiddleware';
import { AuthMiddleware } from '@/presentation/middlewares/AuthMiddleware';
import { 
  LoginDTO, 
  RefreshTokenDTO, 
  VerifyTokenDTO, 
  ChangePasswordDTO 
} from '@/presentation/dtos/LoginDTO'; // Corrigido: importar do arquivo correto

export class AuthRoutes {
  public router: Router;
  private authController: AuthController;

  constructor(private container: Container) {
    this.router = Router();
    this.authController = this.container.resolve<AuthController>('AuthController');
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Public routes
    this.router.post(
      '/login',
      ValidationMiddleware.validate(LoginDTO),
      this.authController.login
    );

    this.router.post(
      '/refresh',
      ValidationMiddleware.validate(RefreshTokenDTO),
      this.authController.refreshToken
    );

    this.router.post(
      '/verify-token',
      ValidationMiddleware.validate(VerifyTokenDTO),
      this.authController.verifyToken
    );

    // Protected routes - require authentication
    this.router.post(
      '/logout',
      AuthMiddleware.authenticate,
      this.authController.logout
    );

    this.router.get(
      '/me',
      AuthMiddleware.authenticate,
      this.authController.getCurrentUser
    );

    this.router.post(
      '/change-password',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validate(ChangePasswordDTO),
      this.authController.changePassword
    );
  }
}