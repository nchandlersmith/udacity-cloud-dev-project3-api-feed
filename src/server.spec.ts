import axios from 'axios'
import {testConfig} from "./test-utils/TestConfig";

describe('root endpoints', () => {
  const host = `${testConfig.host}:${testConfig.port}`

  describe('/', () => {
    // TODO: should return valid JSON
    it('should return 200', async () => {
      const result = await axios.get(`${host}/`)
      expect(result.status).toEqual(200)
      expect(result.data).toEqual('Nothing here.')
    })
  })

  describe('/health', () => {
    it('should return 200', async () => {
      const result = await axios.get(`${host}/health`)
      expect(result.status).toEqual(200)
      expect(result.data.message).toEqual('App is healthy.')
    })
  })
})

