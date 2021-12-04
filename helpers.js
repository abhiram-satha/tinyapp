const objectLoop = function (objectToLoop, email){
  for (const key in objectToLoop) {
    if (objectToLoop[key]["email"] === email) {
      return key;
    }
  }
  return undefined;
};

const generateRandomString = function(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYXabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
//Received function from https://www.programiz.com/javascript/examples/generate-random-strings



const loginLoop = function(objectToLoop, email, password){
  for (const key in objectToLoop) {
    if (objectToLoop[key]["email"] === email) {
      if (bcrypt.compareSync(password, objectToLoop[key]["password"])) {
        return false;
      }
    }
  }
  return true;
};

module.exports = {
  objectLoop,
  generateRandomString,
  loginLoop
}