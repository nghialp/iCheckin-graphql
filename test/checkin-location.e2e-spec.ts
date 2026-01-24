import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';

describe('Checkin Location Queries (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GraphQL Schema Validation', () => {
    it('should have myCheckinsByNearLocation query defined', async () => {
      const response = await request.default(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            {
              __type(name: "Query") {
                fields {
                  name
                }
              }
            }
          `,
        });

      const fieldNames = response.body.data.__type.fields.map((f: any) => f.name);
      expect(fieldNames).toContain('myCheckinsByNearLocation');
    });

    it('should have allCheckinsByNearByLocation query defined', async () => {
      const response = await request.default(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            {
              __type(name: "Query") {
                fields {
                  name
                }
              }
            }
          `,
        });

      const fieldNames = response.body.data.__type.fields.map((f: any) => f.name);
      expect(fieldNames).toContain('allCheckinsByNearByLocation');
    });

    it('should have myFriendsCheckins query defined', async () => {
      const response = await request.default(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            {
              __type(name: "Query") {
                fields {
                  name
                }
              }
            }
          `,
        });

      const fieldNames = response.body.data.__type.fields.map((f: any) => f.name);
      expect(fieldNames).toContain('myFriendsCheckins');
    });

    it('should have myFriendCheckinsByLocation query defined', async () => {
      const response = await request.default(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            {
              __type(name: "Query") {
                fields {
                  name
                }
              }
            }
          `,
        });

      const fieldNames = response.body.data.__type.fields.map((f: any) => f.name);
      expect(fieldNames).toContain('myFriendCheckinsByLocation');
    });
  });

  describe('Query Parameters Validation', () => {
    it('myCheckinsByNearLocation should have lat, lng parameters', async () => {
      const response = await request.default(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            {
              __type(name: "Query") {
                fields(includeDeprecated: false) {
                  name
                  args {
                    name
                  }
                }
              }
            }
          `,
        });

      const myCheckinsField = response.body.data.__type.fields
        .find((f: any) => f.name === 'myCheckinsByNearLocation');

      expect(myCheckinsField).toBeDefined();
      const argNames = myCheckinsField.args.map((a: any) => a.name);
      expect(argNames).toContain('lat');
      expect(argNames).toContain('lng');
    });

    it('allCheckinsByNearByLocation should have lat, lng parameters', async () => {
      const response = await request.default(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            {
              __type(name: "Query") {
                fields(includeDeprecated: false) {
                  name
                  args {
                    name
                  }
                }
              }
            }
          `,
        });

      const allCheckinsField = response.body.data.__type.fields
        .find((f: any) => f.name === 'allCheckinsByNearByLocation');

      expect(allCheckinsField).toBeDefined();
      const argNames = allCheckinsField.args.map((a: any) => a.name);
      expect(argNames).toContain('lat');
      expect(argNames).toContain('lng');
    });

    it('myFriendCheckinsByLocation should have lat, lng parameters', async () => {
      const response = await request.default(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            {
              __type(name: "Query") {
                fields(includeDeprecated: false) {
                  name
                  args {
                    name
                  }
                }
              }
            }
          `,
        });

      const friendCheckinsField = response.body.data.__type.fields
        .find((f: any) => f.name === 'myFriendCheckinsByLocation');

      expect(friendCheckinsField).toBeDefined();
      const argNames = friendCheckinsField.args.map((a: any) => a.name);
      expect(argNames).toContain('lat');
      expect(argNames).toContain('lng');
    });
  });

  describe('Authentication Requirements', () => {
    it('should require authentication for myCheckinsByNearLocation', async () => {
      const response = await request.default(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              myCheckinsByNearLocation(lat: 10.7769, lng: 106.7009) {
                id
              }
            }
          `,
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should require authentication for myFriendsCheckins', async () => {
      const response = await request.default(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              myFriendsCheckins {
                id
              }
            }
          `,
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should require authentication for myFriendCheckinsByLocation', async () => {
      const response = await request.default(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              myFriendCheckinsByLocation(lat: 10.7769, lng: 106.7009) {
                id
              }
            }
          `,
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    it('GraphQL endpoint should be accessible', async () => {
      const response = await request.default(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            {
              __typename
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should return valid schema for Query type', async () => {
      const response = await request.default(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            {
              __type(name: "Query") {
                name
                kind
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.__type.name).toBe('Query');
      expect(response.body.data.__type.kind).toBe('OBJECT');
    });
  });
});
