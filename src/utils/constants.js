const membershipAmount = (plan) => {
  switch (plan) {
    case "plus":
      return 299;
    case "pro":
      return 499;
    default:
      return 0;
  }
};
module.exports = { membershipAmount };
