const { ServiceSubscriptions } = require("..");

function log(...args) {
  console.log(...args);
}

describe("ServiceSubscriptions", () => {
  function createInstance(
    credentials = { name: "margarita", secretKey: "key" }
  ) {
    return new ServiceSubscriptions(credentials);
  }
  // const subscriptionService = null;

  // beforeEach(() => {});

  test("Get plans and subscribe", async () => {
    const subscriptionService = createInstance();

    const { data: plans } = await subscriptionService.getPlans();
    log(plans);

    expect(plans).toBeInstanceOf(Array);
    for (const plan of plans) {
      expect(plan).toHaveProperty("id");
      expect(plan).toHaveProperty("name");
      expect(plan).toHaveProperty("period");
      expect(plan).toHaveProperty("price");
    }
  });
});
