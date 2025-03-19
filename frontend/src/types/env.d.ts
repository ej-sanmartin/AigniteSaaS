// Remove the entire file if it was just created
// Or remove these lines if the file has other type definitions
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_MAX_TOKEN_RETRY_ATTEMPTS?: string;
      // ... other env vars
    }
  }
}

export {} 