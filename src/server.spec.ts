import axios from 'axios'
import {testConfig} from "./test-utils/TestConfig";

describe('health check', () => {
  describe('GET /health', () => {
    it('should succeed', async () => {
      const result = await axios.get(`${testConfig.host}:${testConfig.port}/health`)
      expect(result.status).toEqual(200)
    })
  })
})
