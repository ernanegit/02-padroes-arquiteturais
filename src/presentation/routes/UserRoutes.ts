import { Router } from 'express';
import { UserController } from '@/presentation/controllers/UserController';
import { Container } from '@/infrastructure/container/Container';
import { ValidationMiddleware } from '@/presentation/middlewares/ValidationMiddleware';
import { AuthMiddleware } from '@/presentation/middlewares/AuthMiddleware';
import { CreateUserDTO, UpdateUserDTO, UserQueryDTO } from '@/presentation/dtos/CreateUserDTO';

export class UserRoutes {
  public router: Router;
  private userController: UserController;

  constructor(private container: Container) {
    this.router = Router();
    this.userController = this.container.resolve<UserController>('UserController');
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Public routes
    this.router.post(
      '/',
      ValidationMiddleware.validate(CreateUserDTO),
      this.userController.createUser
    );

    // Protected routes - require authentication
    this.router.get(
      '/',
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(['ADMIN', 'MODERATOR']),
      ValidationMiddleware.validateQuery(UserQueryDTO),
      this.userController.getAllUsers
    );

    this.router.get(
      '/:id',
      AuthMiddleware.authenticate,
      this.userController.getUserById
    );

    this.router.put(
      '/:id',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validate(UpdateUserDTO),
      this.userController.updateUser
    );

    this.router.delete(
      '/:id',
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(['ADMIN']),
      this.userController.deleteUser
    );

    this.router.post(
      '/:id/activate',
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(['ADMIN', 'MODERATOR']),
      this.userController.activateUser
    );

    this.router.post(
      '/:id/deactivate',
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize(['ADMIN', 'MODERATOR']),
      this.userController.deactivateUser
    );
  }
}