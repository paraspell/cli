const toError = (error: unknown): Error =>
  error instanceof Error
    ? error
    : error instanceof ErrorEvent
      ? new Error(error.message)
      : new Error("An unknown error occurred");
