import { Request, Response } from 'express';
import { UserService } from '@/business/services/UserService';
import { Logger } from '@/shared/utils/Logger';
import { CreateUserDTO, UpdateUserDTO } from '@/presentation/dtos/CreateUserDTO';

export class UserController {
  private logger = new Logger('UserController');

  constructor(private userService: UserService) {}

  // GET /api/v1/users
  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({
          error: 'Invalid pagination parameters',
          message: 'Page must be >= 1 and limit must be between 1 and 100',
        });
        return;
      }

      const users = await this.userService.getAllUsers(page, limit);
      const totalUsers = await this.userService.getUserCount();
      const totalPages = Math.ceil(totalUsers / limit);

      res.json({
        data: users.map(user => user.toSafeObject()),
        pagination: {
          page,
          limit,
          total: totalUsers,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });

      this.logger.info(`Retrieved ${users.length} users for page ${page}`);
    } catch (error) {
      this.logger.error('Error getting all users:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve users',
      });
    }
  };

  // GET /api/v1/users/:id
  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'User ID is required',
        });
        return;
      }

      const user = await this.userService.getUserById(id);

      if (!user) {
        res.status(404).json({
          error: 'User not found',
          message: `User with ID ${id} does not exist`,
        });
        return;
      }

      res.json({
        data: user.toSafeObject(),
      });

      this.logger.info(`Retrieved user: ${user.email}`);
    } catch (error) {
      this.logger.error('Error getting user by ID:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve user',
      });
    }
  };

  // POST /api/v1/users
  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body using DTO
      const createUserDTO = CreateUserDTO.parse(req.body);

      const user = await this.userService.createUser(createUserDTO);

      res.status(201).json({
        data: user.toSafeObject(),
        message: 'User created successfully',
      });

      this.logger.info(`User created: ${user.email}`);
    } catch (error) {
      this.logger.error('Error creating user:', error);

      if (error instanceof Error) {
        if (error.message.includes('Validation failed')) {
          res.status(400).json({
            error: 'Validation error',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('already exists')) {
          res.status(409).json({
            error: 'Conflict',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create user',
      });
    }
  };

  // PUT /api/v1/users/:id
  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'User ID is required',
        });
        return;
      }

      // Validate request body using DTO
      const updateUserDTO = UpdateUserDTO.parse(req.body);

      const user = await this.userService.updateUser(id, updateUserDTO);

      res.json({
        data: user.toSafeObject(),
        message: 'User updated successfully',
      });

      this.logger.info(`User updated: ${user.email}`);
    } catch (error) {
      this.logger.error('Error updating user:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'User not found',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('Validation failed')) {
          res.status(400).json({
            error: 'Validation error',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update user',
      });
    }
  };

  // DELETE /api/v1/users/:id
  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'User ID is required',
        });
        return;
      }

      await this.userService.deleteUser(id);

      res.json({
        message: 'User deleted successfully',
      });

      this.logger.info(`User deleted: ${id}`);
    } catch (error) {
      this.logger.error('Error deleting user:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'User not found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete user',
      });
    }
  };

  // POST /api/v1/users/:id/activate
  activateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'User ID is required',
        });
        return;
      }

      const user = await this.userService.activateUser(id);

      res.json({
        data: user.toSafeObject(),
        message: 'User activated successfully',
      });

      this.logger.info(`User activated: ${user.email}`);
    } catch (error) {
      this.logger.error('Error activating user:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'User not found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to activate user',
      });
    }
  };

  // POST /api/v1/users/:id/deactivate
  deactivateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'User ID is required',
        });
        return;
      }

      const user = await this.userService.deactivateUser(id);

      res.json({
        data: user.toSafeObject(),
        message: 'User deactivated successfully',
      });

      this.logger.info(`User deactivated: ${user.email}`);
    } catch (error) {
      this.logger.error('Error deactivating user:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          error: 'User not found',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to deactivate user',
      });
    }
  };
}