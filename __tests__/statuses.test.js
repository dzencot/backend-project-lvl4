// @ts-check

import fastify from 'fastify';

import init from '../server/plugin.js';
import {
  createRandomStatus,
  getRandomStatuses,
  prepareData,
} from './helpers/index.js';

describe('test statuses CRUD', () => {
  let app;
  let knex;
  let models;
  // const testData = getTestData();
  const statuses = getRandomStatuses();

  beforeAll(async () => {
    app = fastify({ logger: { prettyPrint: true } });
    await init(app);
    knex = app.objection.knex;
    models = app.objection.models;

    // TODO: пока один раз перед тестами
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app, { statuses });
  });

  beforeEach(async () => {
  });

  it('index', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newStatus'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const newStatus = createRandomStatus();
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      payload: {
        data: newStatus,
      },
    });

    expect(response.statusCode).toBe(302);
    const status = await models.status.query().findOne({ name: newStatus.name });
    expect(status).toMatchObject(newStatus);
  });

  it('edit', async () => {
    const currentStatus = await models.status.query().findOne({ name: statuses[0].name });
    const editedStatus = {
      ...currentStatus,
      name: 'editedName',
    };
    const response = await app.inject({
      method: 'PATCH',
      url: `/statuses/${currentStatus.id}`,
      payload: {
        data: editedStatus,
      },
    });

    expect(response.statusCode).toBe(302);
    const status = await models.status.query().findOne({ id: currentStatus.id });
    expect(status).toMatchObject(editedStatus);
  });

  it('delete', async () => {
    const currentStatus = await models.status.query().findOne({ name: statuses[1].name });
    app.log.info(currentStatus);
    const response = await app.inject({
      method: 'DELETE',
      url: `/statuses/${currentStatus.id}`,
    });

    expect(response.statusCode).toBe(302);
    const status = await models.status.query().findOne({ name: currentStatus.name });
    expect(status).toBeUndefined();
  });

  afterEach(async () => {
    // Пока Segmentation fault: 11
    // после каждого теста откатываем миграции
    // await knex.migrate.rollback();
  });

  afterAll(async () => {
    await app.close();
  });
});
