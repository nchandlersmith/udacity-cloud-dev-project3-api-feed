interface TestConfig {
  host: string;
  port: string;
  token: string;
}

export const testConfig: TestConfig = {
  host: process.env.UDAGRAM_HOST,
  port: process.env.PORT,
  token: process.env.JWT_TEST_TOKEN
}
