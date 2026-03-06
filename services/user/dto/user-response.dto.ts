import z from "zod";
import { UserSchema } from "../../../entities/user.model";

export const UserFullResponseDtoSchema = UserSchema.pick({
  _id: true,
  name: true,
  username: true,
  email: true,
  emailVerified: true,
  profileImage: true,
  bio: true,
  createdAt: true,
  updatedAt: true,
});

export type UserFullResponseDto = z.infer<typeof UserFullResponseDtoSchema>;

export const UserBasicResponseDtoSchema = UserSchema.pick({
  _id: true,
  name: true,
  username: true,
  profileImage: true,
  bio: true,
});

export type UserBasicResponseDto = z.infer<typeof UserBasicResponseDtoSchema>;
