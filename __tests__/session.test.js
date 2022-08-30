// @ts-check

import fastify from 'fastify';
import init from '../server/plugin.js';
import { prepareData, createRandomUser } from './helpers/index.js';

import encrypt from '../server/lib/secure.cjs';
import _ from 'lodash';

describe('test session', () => {
  let app;
  let knex;
  const users = [];

  beforeAll(async () => {
    app = fastify({ logger: { prettyPrint: true } });
    await init(app);
    knex = app.objection.knex;
    await knex.migrate.latest();

    const preparedUsers = [];
    for (let i = 0; i < 10; i += 1) {
      const user = createRandomUser();
      const preparedUser = {
        ..._.omit(user, 'password'),
        passwordDigest: encrypt(user.password),
      }
      users.push(user);
      preparedUsers.push(preparedUser);
    }

    await prepareData(app, { users: preparedUsers });
  });

  it('test sign in / sign out', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newSession'),
    });

    expect(response.statusCode).toBe(200);

    const signInData = {
      email: users[0].email,
      password: users[0].password,
    };

    const responseSignIn = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: {
        data: signInData,
      },
    });

    expect(responseSignIn.statusCode).toBe(302);
    // после успешной аутентификации получаем куки из ответа,
    // они понадобятся для выполнения запросов на маршруты требующие
    // предварительную аутентификацию
    const [sessionCookie] = responseSignIn.cookies;
    const { name, value } = sessionCookie;
    const cookie = { [name]: value };

    const responseSignOut = await app.inject({
      method: 'DELETE',
      url: app.reverse('session'),
      // используем полученные ранее куки
      cookies: cookie,
    });

    expect(responseSignOut.statusCode).toBe(302);
  });

  afterAll(async () => {
    // await knex.migrate.rollback();
    await app.close();
  });
});
