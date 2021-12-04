const { assert } = require('chai');

const { objectLoop } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = objectLoop(testUsers, "user@example.com")
    const expectedOutput = "userRandomID";

    assert.strictEqual(user, expectedOutput)
  });
  it('should return a user with valid email - test2', function() {
    const user = objectLoop(testUsers, "user2@example.com")
    const expectedOutput = "user2RandomID";

    assert.strictEqual(user, expectedOutput)
});
it('assert false test', ()=> {
  const user = objectLoop(testUsers, 'a@email.com');
  console.log(user);
  assert.isUndefined(user);
})
})
