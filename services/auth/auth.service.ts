import type { User } from "../../entities/user.model";
import { AppError } from "../../instance/errors/app-error";
import { verifyPassword } from "../../utility/pass-hash";
import type { UserService } from "../user/user.service";
import AuthErrors from "./auth.error";
import type { LoginDto } from "./dto/login-request.dto";

export class AuthService {
  constructor(private readonly userService: UserService) { }

  async getUserByEmailAndPassword(loginDto: LoginDto): Promise<User> {
    const user = await this.userService.getUserByEmailOrThrow(loginDto.email);
    if (!user) throw new AppError(AuthErrors.UserNotFound);
    if (!(await verifyPassword(loginDto.password, user.password)))
      throw new AppError(AuthErrors.InvalidCredentials);

    return user;
  }
}
