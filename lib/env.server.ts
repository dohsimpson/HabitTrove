import { z } from "zod"

const zodEnv = z.object({
  AUTH_SECRET: z.string(),
  NEXT_PUBLIC_DEMO: z.string().optional(),
})

declare global {
  interface ProcessEnv extends z.TypeOf<typeof zodEnv> {
    AUTH_SECRET: string;
    NEXT_PUBLIC_DEMO?: string;
  }
}

try {
  zodEnv.parse(process.env)
} catch (err) {
  if (err instanceof z.ZodError) {
    const { fieldErrors } = err.flatten()
    const errorMessage = Object.entries(fieldErrors)
      .map(([field, errors]) =>
        errors ? `${field}: ${errors.join(", ")}` : field,
      )
      .join("\n ")
    
    console.error(
      `Missing environment variables:\n ${errorMessage}`,
    )
    process.exit(1)
  }
}
