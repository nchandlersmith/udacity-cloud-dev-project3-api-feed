import axios from 'axios'
import {FeedItem} from "../models/FeedItem";
import {Sequelize} from "sequelize-typescript";
import {config} from "../../../../config/config";
import {toBeNotEmptyString} from "../../../../test-utils/ExpectExtensions";
import {testConfig} from "../../../../test-utils/TestConfig";

expect.extend({
  toBeNotEmptyString
})

describe('feed router', () => {
  const host = `${testConfig.host}:${testConfig.port}`
  const feedRoute = '/api/v0/feed'
  const buildUrl = (endpoint: string) => `${host}${feedRoute}${endpoint}`
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
    sequelize.addModels([FeedItem])
  })

  afterAll(() => {
    sequelize.close()
  })

  const findAllWithCaption = async (caption: string): Promise<FeedItem[]> =>  {
    return await FeedItem.findAll({
      where: {
        caption
      }
    });
  }

  const teardownFeedItem = async (): Promise<void> => {
    await FeedItem.destroy({
      where: {
        url: 'https://happy.com'
      }
    })
  }

  describe('get /',() => {
    it('should return all feed items', async () => {
      const result = await axios.get(buildUrl('/'))
      expect(result.status).toEqual(200)
      expect(result.data.count).toBeGreaterThan(0)
      expect(result.data.rows[0].caption).toBeNotEmptyString()
      expect(result.data.rows[0].createdAt).toBeNotEmptyString()
      expect(result.data.rows[0].updatedAt).toBeNotEmptyString()
      expect(result.data.rows[0].url).toContain('https://udagram-')
      expect(result.data.rows[0].id).not.toBeNull()
      expect(result.headers['access-control-allow-origin']).toEqual('*')
      expect(result.headers['connection']).toEqual('close')
      expect(result.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
  })

  // TODO: handle out of range
  describe('get /1', () => {
    it('should return feed item with id = 1', async () => {
      const result = await axios.get(buildUrl('/1'))
      expect(result.status).toEqual(200)
      expect(result.data.caption).toEqual('Hello')
      expect(result.data.createdAt).toBeNotEmptyString()
      expect(result.data.updatedAt).toBeNotEmptyString()
      expect(result.data.url).toContain('test.jpg')
      expect(result.data.id).toEqual(1)
      expect(result.headers['access-control-allow-origin']).toEqual('*')
      expect(result.headers['connection']).toEqual('close')
      expect(result.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
  })

  describe('get signed-url/:filename', () => {
    it('should return unauthorized when headers are missing',async () => {
      const result = await axios.get(buildUrl('/signed-url/test.jpg'))
        .catch(error => error)
      expect(result.response.status).toEqual(401)
      expect(result.response.data.message).toEqual('No authorization headers.')
    })

    it('should return unauthorized when authorization headers are empty',async () => {
      const headers = {authorization: ''}
      const result = await axios.get(buildUrl('/signed-url/test.jpg'), {headers})
        .catch(error => error)
      expect(result.response.status).toEqual(401)
      expect(result.response.data.message).toEqual('No authorization headers.')
    })

    it('should return error malformed token when auth token malformed',async () => {
      const headers = {authorization: 'foo'}
      const result = await axios.get(buildUrl('/signed-url/test.jpg'), {headers})
        .catch(error => error)
      expect(result.response.status).toEqual(401)
      expect(result.response.data.message).toEqual('Malformed token.')
    })

    it('should return server error when authorization header fails to authenticate',async () => {
      const headers = {authorization: 'Bearer foo'}
      const result = await axios.get(buildUrl('/signed-url/test.jpg'), {headers})
        .catch(error => error)
      expect(result.response.status).toEqual(500)
      expect(result.response.data.message).toEqual('Failed to authenticate.')
      expect(result.response.data.auth).toEqual(false)
    })

    it('should return signed url to file',async () => {
      const headers = {authorization: `Bearer ${testConfig.token}`}
      const result = await axios.get(buildUrl('/signed-url/test.jpg'), {headers})
      expect(result.status).toEqual(201)
      expect(result.data.url).toContain('https://udagram-')
      expect(result.headers['access-control-allow-origin']).toEqual('*')
      expect(result.headers['connection']).toEqual('close')
      expect(result.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
  })

  describe('post /', () => {
    it('should return unauthorized when headers are missing',async () => {
      const result = await axios.post(buildUrl('/'), {})
        .catch(error => error)
      expect(result.response.status).toEqual(401)
      expect(result.response.data.message).toEqual('No authorization headers.')
    })

    it('should return unauthorized when authorization headers are empty',async () => {
      const headers = {authorization: ''}
      const result = await axios.post(buildUrl('/'), {}, {headers})
        .catch(error => error)
      expect(result.response.status).toEqual(401)
      expect(result.response.data.message).toEqual('No authorization headers.')
    })

    it('should return error malformed token when auth token malformed',async () => {
      const headers = {authorization: 'foo'}
      const result = await axios.post(buildUrl('/'), {}, {headers})
        .catch(error => error)
      expect(result.response.status).toEqual(401)
      expect(result.response.data.message).toEqual('Malformed token.')
    })

    it('should return server error when authorization header fails to authenticate',async () => {
      const headers = {authorization: 'Bearer foo'}
      const result = await axios.post(buildUrl('/'), {}, {headers})
        .catch(error => error)
      expect(result.response.status).toEqual(500)
      expect(result.response.data.message).toEqual('Failed to authenticate.')
      expect(result.response.data.auth).toEqual(false)
    })

    it('should return bad request when caption missing',async () => {
      const headers = {authorization: `Bearer ${testConfig.token}`}
      const requestBody = {fileName: 'happy.png'}

      const result = await axios.post(buildUrl('/'), requestBody, {headers})
        .catch(error => error)

      expect(result.response.status).toEqual(400)
      expect(result.response.data.message).toEqual('Caption is required or malformed.')
    })

    it('should return bad request when file name is missing',async () => {
      const headers = {authorization: `Bearer ${testConfig.token}`}
      const requestBody = {caption: 'I\'m so happy!'}

      const result = await axios.post(buildUrl('/'), requestBody, {headers})
        .catch(error => error)

      expect(result.response.status).toEqual(400)
      expect(result.response.data.message).toEqual('File url is required.')
    })

    it('should add item to feed and return it',async () => {
      const headers = {authorization: `Bearer ${testConfig.token}`}
      const caption = 'I\'m so happy!'
      const url = 'https://happy.com'
      const requestBody = {caption, url}
      const initialNumberOfItems = await FeedItem.count()

      const result = await axios.post(buildUrl('/'), requestBody, {headers})

      const finalNumberOfItems = await FeedItem.count()
      const itemsWithCaption = await findAllWithCaption(caption)
      await teardownFeedItem();
      expect(result.status).toEqual(201)
      expect(result.data.caption).toEqual(caption)
      expect(result.data.url).toContain('https://udagram-')
      expect(finalNumberOfItems).toEqual(initialNumberOfItems + 1)
      expect(itemsWithCaption.length).toEqual(1)
      expect(itemsWithCaption[0].caption).toEqual(caption)
      expect(itemsWithCaption[0].url).toEqual(url)
      expect(result.headers['access-control-allow-origin']).toEqual('*')
      expect(result.headers['connection']).toEqual('close')
      expect(result.headers['content-type']).toEqual('application/json; charset=utf-8')
    })
  })
})
