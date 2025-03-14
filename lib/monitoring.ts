export function logError(error: Error, context: Record<string, any> = {}) {
  console.error("Application error:", {
    message: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString(),
  })

  // In production, you might want to send this to a logging service
  // like AWS CloudWatch, Sentry, or LogRocket
}

// Performance monitoring
export function measurePerformance<T>(fn: () => Promise<T>, operationName: string): Promise<T> {
  const startTime = performance.now()

  return fn()
    .then((result) => {
      const duration = performance.now() - startTime
      console.log(`Operation ${operationName} completed in ${duration.toFixed(2)}ms`)

      // For slow operations, you might want to log them differently
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`)
      }

      return result
    })
    .catch((error) => {
      const duration = performance.now() - startTime
      logError(error, {
        operationName,
        duration: `${duration.toFixed(2)}ms`,
        status: "failed",
      })
      throw error
    })
}

