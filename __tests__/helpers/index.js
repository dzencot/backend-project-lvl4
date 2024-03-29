// @ts-check

import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';

import encrypt from '../../server/lib/secure.cjs';

// TODO: использовать для фикстур https://github.com/viglucci/simple-knex-fixtures

const getFixturePath = (filename) => path.join('..', '..', '__fixtures__', filename);
const readFixture = (filename) => fs.readFileSync(new URL(getFixturePath(filename), import.meta.url), 'utf-8').trim();
const getFixtureData = (filename) => JSON.parse(readFixture(filename));

const createRandomUser = () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
});

const createRandomUserData = () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  passwordDigest: encrypt(faker.internet.password()),
});

const getTestData = () => getFixtureData('testData.json');

const prepareData = (app, data) => {
  const { knex } = app.objection;

  const tables = Object.keys(data);
  return Promise.all(tables.map((tableName) => knex(tableName).insert(data[tableName])));
};

const getRandomUsers = (count = 10) => {
  const users = [];
  for (let i = 0; i < count; i += 1) {
    users.push(createRandomUserData());
  }

  return users;
};

const createRandomStatusData = () => {
  const statusName = faker.word.adjective();
  return {
    name: statusName,
  };
};

const createRandomStatus = createRandomStatusData;

const getRandomStatuses = (count = 10) => {
  faker.helpers.unique(faker.word.adjective);
  const statuses = [];
  for (let i = 0; i < count; i += 1) {
    statuses.push(createRandomStatusData());
  }

  return statuses;
};

export {
  getTestData,
  prepareData,
  createRandomUser,
  createRandomUserData,
  getRandomUsers,
  createRandomStatus,
  getRandomStatuses,
};
