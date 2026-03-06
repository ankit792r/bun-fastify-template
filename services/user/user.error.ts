import type { AppErrorParams } from "../../instance/errors/app-error";

const UserError = {
  UserCreationFailed: {
    code: "user_creation_failed",
    message: "User creation failed",
    statusCode: 500,
  },
  UserAlreadyExists: {
    code: "user_already_exists",
    message: "User already exists",
    statusCode: 400,
  },
  UsernameTaken: {
    code: "username_taken",
    message: "Username already taken",
    statusCode: 400,
  },
  UserNotFound: {
    code: "user_not_found",
    message: "User not found",
    statusCode: 404,
  },
  UserInvalidCredentials: {
    code: "user_invalid_credentials",
    message: "Invalid credentials",
    statusCode: 401,
  },
  UserInvalidPassword: {
    code: "user_invalid_password",
    message: "Invalid password",
    statusCode: 401,
  },
  UserInvalidEmail: {
    code: "user_invalid_email",
    message: "Invalid email",
    statusCode: 400,
  },
  UserInvalidUsername: {
    code: "user_invalid_username",
    message: "Invalid username",
    statusCode: 400,
  },
} as const satisfies Record<string, AppErrorParams>;

export type UserErrorCodes = (typeof UserError)[keyof typeof UserError]["code"];

export default UserError;
