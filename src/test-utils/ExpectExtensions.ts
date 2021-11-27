declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeNotEmptyString(): R;
    }
  }
}

export function toBeNotEmptyString(received: string): jest.CustomMatcherResult {
  const pass = received !== undefined && received !== null && received !== ''
  if (pass) {
    return {
      message: () => `expected ${received} to be null, undefined, or empty string`,
      pass: true
    }
  } else {
    return {
      message: () => `expected ${received} to not be null, undefined, or empty string`,
      pass: false
    }
  }
}
