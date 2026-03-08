import type { Collection } from "mongodb";
import {
  createUserId,
  UserSchema,
  type User,
  type UserId,
} from "../../entities/user.model";
import type { UserCreateDto } from "./dto/user-create.dto";
import UserError from "./user.error";
import { AppError } from "../../instance/errors/app-error";
import { hashPassword } from "../../utility/pass-hash";
import type { UserUpdateDto } from "./dto/user-update.dto";
import {
  UserBasicResponseDtoSchema,
  type UserBasicResponseDto,
} from "./dto/user-response.dto";

export class UserService {
  constructor(private readonly userCollection: Collection<User>) { }

  async createUser(dto: UserCreateDto): Promise<User> {
    const existingUser =
      (await this.userCollection.countDocuments({
        email: dto.email,
      })) > 0;

    if (existingUser) throw new AppError(UserError.UserAlreadyExists);

    const usernameTaken =
      (await this.userCollection.countDocuments({
        username: dto.username,
      })) > 0;

    if (usernameTaken) throw new AppError(UserError.UsernameTaken);

    const newUserObject = UserSchema.parse({
      ...dto,
      _id: createUserId(),
      emailVerified: false,
      password: await hashPassword(dto.password),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const newUser = await this.userCollection.insertOne(newUserObject);
    if (!newUser.acknowledged) throw new AppError(UserError.UserCreationFailed);

    return newUserObject;
  }

  async updateBasicInfo(
    id: UserId,
    dto: UserUpdateDto,
  ): Promise<UserBasicResponseDto> {
    const updatedUser = await this.userCollection.updateOne(
      { _id: id },
      { $set: { ...dto, updatedAt: new Date() } },
    );
    if (updatedUser.matchedCount === 0)
      throw new AppError(UserError.UserNotFound);
    return UserBasicResponseDtoSchema.parse(updatedUser);
  }

  async getUserBasicInfoById(id: UserId): Promise<UserBasicResponseDto> {
    const user = await this.userCollection.findOne({ _id: id });
    if (!user) throw new AppError(UserError.UserNotFound);
    return UserBasicResponseDtoSchema.parse(user);
  }

  async getUserBasicInfoByUsername(
    username: string,
  ): Promise<UserBasicResponseDto> {
    const user = await this.userCollection.findOne({ username });
    if (!user) throw new AppError(UserError.UserNotFound);
    return UserBasicResponseDtoSchema.parse(user);
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const isAvailable =
      (await this.userCollection.countDocuments({ username })) === 0;
    if (!isAvailable) throw new AppError(UserError.UsernameTaken);
    return true;
  }

  async getUserByEmailOrThrow(email: string): Promise<User> {
    const user = await this.userCollection.findOne({ email });
    if (!user) throw new AppError(UserError.UserNotFound);
    return user;
  }

  async getUserByUsernameOrThrow(username: string): Promise<User> {
    const user = await this.userCollection.findOne({ username });
    if (!user) throw new AppError(UserError.UserNotFound);
    return user;
  }

  async getUserByIdOrThrow(id: UserId): Promise<User> {
    const user = await this.userCollection.findOne({ _id: id });
    if (!user) throw new AppError(UserError.UserNotFound);
    return user;
  }

  async updateUserProfileImage(id: UserId, publicPath: string): Promise<void> {
    await this.userCollection.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          profileImage: publicPath,
        },
      },
    );
  }
}
