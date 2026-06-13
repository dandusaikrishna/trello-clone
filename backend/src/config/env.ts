import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  CORS_ORIGIN: z
    .string()
    .default('["http://localhost:5173"]')
    .transform((value, ctx) => {
      let parsed: unknown;

      try {
        parsed = JSON.parse(value);
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "CORS_ORIGIN must be a valid JSON array of origin strings",
        });
        return z.NEVER;
      }

      const result = z.array(z.string().min(1)).safeParse(parsed);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          message: "CORS_ORIGIN must be a JSON array of origin strings",
        });
        return z.NEVER;
      }

      return result.data;
    }),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
