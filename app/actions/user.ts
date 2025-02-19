"use server"

import { signIn as signInNextAuth, signOut as signOutNextAuth } from '@/auth';

export async function signIn(username: string, password: string) {
  try {
    const result = await signInNextAuth("credentials", {
      username,
      password,
      redirect: false, // This needs to be passed as an option, not as form data
    });
    
    return result;
  } catch (error) {
    throw new Error("Invalid credentials");
  }
}

export async function signOut() {
  try {
    const result = await signOutNextAuth({
        redirect: false,
    })
  } catch (error) {
    throw new Error("Failed to sign out");
  }
}
