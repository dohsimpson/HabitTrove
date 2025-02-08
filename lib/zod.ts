import { object, string } from "zod"
 
export const signInSchema = object({
  username: string({ required_error: "Username is required" })
    .min(1, "Username is required")
    .regex(/^[a-zA-Z0-9]+$/, "Username must be alphanumeric"),
  password: string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(4, "Password must be more than 4 characters")
    .max(32, "Password must be less than 32 characters"),
})