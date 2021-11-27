import axios from "axios";
import {testConfig} from "../../../../test-utils/TestConfig";
import {toBeNotEmptyString} from "../../../../test-utils/ExpectExtensions";
import {Sequelize} from "sequelize-typescript";
import {config} from "../../../../config/config";
import {User} from "../models/User";

expect.extend({
  toBeNotEmptyString
})

describe('auth router', () => {
  const host = `${testConfig.host}:${testConfig.port}`
  const authRoute = '/api/v0/users/auth'
  const buildUrl = (endpoint: string) => `${host}${authRoute}${endpoint}`
  let sequelize: Sequelize

  beforeAll(() => {
    sequelize = new Sequelize({
      'username': config.username,
      'password': config.password,
      'database': config.database,
      'host': config.host,
      'dialect': config.dialect,
      'storage': ':memory:',
      'logging': false
    });
    sequelize.addModels([User])
  })

  afterAll(() => {
    sequelize.close()
  })

  async function deleteTestUser(email: string): Promise<any> {
    await User.destroy({
      where: {
        email
      }
    })
  }

  describe('get /verification', () => {
    const verificationEndpoint = '/verification';

    it('should return unauthorized when headers are missing',async () => {
      const result = await axios.get(buildUrl(verificationEndpoint))
        .catch(error => error)
      expect(result.response.status).toEqual(401)
      expect(result.response.data.message).toEqual('No authorization headers.')
    })

    it('should return unauthorized when authorization headers are empty',async () => {
      const headers = {authorization: ''}
      const result = await axios.get(buildUrl(verificationEndpoint), {headers})
        .catch(error => error)
      expect(result.response.status).toEqual(401)
      expect(result.response.data.message).toEqual('No authorization headers.')
    })

    it('should return error malformed token when auth token malformed',async () => {
      const headers = {authorization: 'foo'}
      const result = await axios.get(buildUrl(verificationEndpoint), {headers})
        .catch(error => error)
      expect(result.response.status).toEqual(401)
      expect(result.response.data.message).toEqual('Malformed token.')
    })

    it('should return server error when authorization header fails to authenticate',async () => {
      const headers = {authorization: 'Bearer foo'}
      const result = await axios.get(buildUrl(verificationEndpoint), {headers})
        .catch(error => error)
      expect(result.response.status).toEqual(500)
      expect(result.response.data.message).toEqual('Failed to authenticate.')
      expect(result.response.data.auth).toBeFalsy()
    })

    it('should verify authentication', async () => {
      const headers = {authorization: `Bearer ${testConfig.token}`}
      const result = await axios.get(buildUrl(verificationEndpoint), {headers})
      expect(result.status).toEqual(200)
      expect(result.data.message).toEqual('Authenticated.')
      expect(result.data.auth).toBeTruthy()
    })
  })

  describe('post /login', () => {
    const loginEndpoint = '/login'
    const email = 'fred@gmail.com'
    const password = '1234'

    it('should require email', async () => {
      const result = await axios.post(buildUrl(loginEndpoint), {password})
        .catch(error => error)
      expect(result.response.status).toEqual(400)
      expect(result.response.data.auth).toBeFalsy()
      expect(result.response.data.message).toEqual('Email is required or malformed.')
    })

    it('should validate email', async () => {
      const result = await axios.post(buildUrl(loginEndpoint), {eamil: 'borked', password})
        .catch(error => error)
      expect(result.response.status).toEqual(400)
      expect(result.response.data.auth).toBeFalsy()
      expect(result.response.data.message).toEqual('Email is required or malformed.')
    })

    it('should require password', async () => {
      const result = await axios.post(buildUrl(loginEndpoint), {email})
        .catch(error => error)
      expect(result.response.status).toEqual(400)
      expect(result.response.data.auth).toBeFalsy()
      expect(result.response.data.message).toEqual('Password is required.')
    })

    it('should verify user exists', async () => {
      const result = await axios.post(buildUrl(loginEndpoint), {email: 'ghostrider@test.com', password})
        .catch(error => error)
      expect(result.response.status).toEqual(401)
      expect(result.response.data.auth).toBeFalsy()
      expect(result.response.data.message).toEqual('User was not found..')
    })

    it('should refuse if password invalid', async () => {
      const result = await axios.post(buildUrl(loginEndpoint), {email, password: 'wrong password'})
        .catch(error => error)
      expect(result.response.status).toEqual(401)
      expect(result.response.data.auth).toBeFalsy()
      expect(result.response.data.message).toEqual('Password was invalid.')
    })

    it('should should succeed when valid user', async () => {
      const result = await axios.post(buildUrl(loginEndpoint), {email, password})
      expect(result.status).toEqual(200)
      expect(result.data.auth).toBeTruthy()
      expect(result.data.token).toBeNotEmptyString()
      expect(result.data.user.email).toBeNotEmptyString()
    })
  })

  describe('post /', () => {
    const addUserEndpoint = '/'
    const email = 'test@example.com'
    const password = 'my1P455w0rd15Gr347'

    it('should require email', async () => {
      const result = await axios.post(buildUrl(addUserEndpoint), {password})
        .catch(error => error)
      expect(result.response.status).toEqual(400)
      expect(result.response.data.auth).toBeFalsy()
      expect(result.response.data.message).toEqual('Email is missing or malformed.')
    })

    it('should validate email', async () => {
      const result = await axios.post(buildUrl(addUserEndpoint), {eamil: 'borked', password})
        .catch(error => error)
      expect(result.response.status).toEqual(400)
      expect(result.response.data.auth).toBeFalsy()
      expect(result.response.data.message).toEqual('Email is missing or malformed.')
    })

    it('should require password', async () => {
      const result = await axios.post(buildUrl(addUserEndpoint), {email})
        .catch(error => error)
      expect(result.response.status).toEqual(400)
      expect(result.response.data.auth).toBeFalsy()
      expect(result.response.data.message).toEqual('Password is required.')
    })

    it('should verify new user does not already exist', async () => {
      const result = await axios.post(buildUrl(addUserEndpoint), {email: 'hello@gmail.com', password})
        .catch(error => error)
      expect(result.response.status).toEqual(422)
      expect(result.response.data.auth).toBeFalsy()
      expect(result.response.data.message).toEqual('User already exists.')
    })

    it('should add new user', async () => {
      const result = await axios.post(buildUrl(addUserEndpoint), {email, password})
      expect(result.status).toEqual(201)
      expect(result.data.token).toBeNotEmptyString()
      expect(result.data.user.email).toEqual(email)
      await deleteTestUser(email);
    })
  })
})
