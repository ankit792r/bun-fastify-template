import type z from "zod";
import { createIdFactoryFromIdSchema, idSchema } from "../entities/id-factory";

export const ProfileImageIdSchema = idSchema({
  brand: "ProfileImage",
  prefix: "pfp_",
});
export type ProfileImageId = z.infer<typeof ProfileImageIdSchema>;
export const createProfileImageId =
  createIdFactoryFromIdSchema(ProfileImageIdSchema);

// export const WallpaperIdSchema = idSchema({
//   brand: "Wallpaper",
//   prefix: "wp_",
// });
// export type WallpaperId = z.infer<typeof WallpaperIdSchema>;
// export const createWallpaperId = createIdFactoryFromIdSchema(WallpaperIdSchema);
