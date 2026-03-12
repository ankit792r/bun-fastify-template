import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import z from "zod";
import { UserBasicResponseDtoSchema } from "../../services/user/dto/user-response.dto";
import { UsernameCheckDtoSchema } from "../../services/user/dto/username-check.dto";
import { ErrorResponseDtoSchema } from "../errors/error-dto";
import {
  ImageExtensionMime,
  parseFormFileToBuffer,
} from "../../modules/upload-handler";
import { createProfileImageId } from "../../modules/blob-id";

export default async function(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>();
  server.addHook("onRequest", fastify.authenticate);

  server.route({
    method: "GET",
    url: "/users/me",
    schema: {
      tags: ["Users"],
      summary: "Get user info",
      security: [{ bearerAuth: [] }],
      response: {
        200: UserBasicResponseDtoSchema,
        default: ErrorResponseDtoSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await fastify.userService.getUserBasicInfoById(
        request.getUserOrThrow().sub,
      );
      return reply.send(result);
    },
  });

  server.route({
    method: "POST",
    url: "/users/me/update-profile",
    handler: async (request, reply) => {
      const uploadedFile = await parseFormFileToBuffer(request, {
        allowedExtensions: [
          ImageExtensionMime.PNG.ext,
          ImageExtensionMime.JPEG.ext,
        ],
        allowedMimeTypes: [
          ImageExtensionMime.JPEG.mime,
          ImageExtensionMime.PNG.mime,
        ],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        multipleFile: true,
      });

      const profileImageId = createProfileImageId();
      const filePath = `${profileImageId}${uploadedFile.fileExtension}`;

      await fastify.profileBlobStorage.upload(
        filePath,
        uploadedFile.buffer,
        uploadedFile.mimetype,
      );

      const publicUrl = fastify.profileBlobStorage.getPublicUrl(filePath);
      await fastify.userService.updateUserProfileImage(
        request.getUserOrThrow().sub,
        publicUrl,
      );
      return reply.send(publicUrl);
    },
  });

  server.route({
    method: "POST",
    url: "/users/username-availability",
    config: { public: true },
    schema: {
      tags: ["Users"],
      summary: "Check username availability",
      body: UsernameCheckDtoSchema,
      response: {
        204: z.null(),
        default: ErrorResponseDtoSchema,
      },
    },
    handler: async (request, reply) => {
      await fastify.userService.checkUsernameAvailability(
        request.body.username,
      );
      return reply.status(204).send(null);
    },
  });
}
