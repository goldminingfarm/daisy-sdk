/** @module common */

const querystring = require("querystring");

const Client = require("./Client");

/**
 * @typedef {Object} Plan - Daisy's Plan object. Can be retrieved using {@link module:common~SubscriptionProductClient#getData}.
 * @property {string} id - Daisy ID.
 * @property {string} name - Plan name.
 * @property {string} onChainId - Plan ID in the Ethereum blockchain (internal use of the SDK).
 * @property {string} description - Plan description.
 * @property {string} price - Plan price in tokens.
 * @property {number} period - Number of periods in `periodUnit` between bill cycles.
 * @property {string} periodUnit - Period unit: DAYS, WEEKS, MONTHS, YEARS.
 * @property {string} maxExecutions - How many times the Plan is executed.
 * @property {boolean} private - If a Plan is private it requires a signature (with a private key) from the `authorizer` defined in the Subscription Manager.
 * @property {string} active - Is the plan enabled for subscriptions or disabled?.
 * @property {string} state - Enum: `DRAFT`, `PENDING`, `DEPLOYED`, `FAILED`.
 * @property {string} txHash - Transaction hash when it was deployed.
 * @property {Date|string} createdAt - Timestamp.
 * @property {Date|string} updatedAt - Timestamp.
 */

/**
 * @typedef {Object} Subscription
 * @property {string} id - Daisy ID.
 * @property {string} state - Current subscription state. Options: NOT_STARTED PENDING CREATED ACTIVE ACTIVE_CANCELLED CANCELLED EXPIRED INVALID NOT_ENOUGH_FUNDS FAILED
 * @property {string} subscriptionHash - Identifier in the blockchain.
 */

/**
 * @typedef {Object} Receipt
 * @property {string} id - Daisy ID.
 * @property {string} txHash - Transaction hash.
 * @property {string} action - What happened in this billing cycle.
 * @property {?string} nextPayment - When is the next billing cycle.
 * @property {?string} reason - If failed, this is the error message.
 * @property {Date} createdAt - When was executed.
 */

/**
 * @typedef {Object} SubscriptionManager
 * @property {string} name - Name.
 * @property {string} wallet - Where the billed tokens are transferer.
 * @property {string} publisher - Ethereum address of the publisher of this contract (can edit data and plans).
 * @property {string} tokenAddress - ERC20 Token address.
 * @property {Date|string} deployedAt - When the contract was deployed.
 * @property {string} address - Contract address.
 * @property {string} authorizer - Ethereum address of the manager of this contract.
 * @property {string} txHash - Transaction hash when it was deployed.
 * @property {string} state - Enum: `DRAFT`, `PENDING`, `DEPLOYED`, `FAILED`.
 * @property {string} identifier - DAISY_ID.
 * @property {string} secretKey - DAISY_SECRET_LEY.
 * @property {Date|string} createdAt - Timestamp.
 * @property {Date|string} updatedAt - Timestamp.
 
 * @property {module:common~Plan[]} plans - Plans related to this manager.
 */

/**
 * Create a instance of a Subscription manager based on the contract deployed at the Daisy Dashboard.
 * The important data here is the `DAISY_ID`.
 * @extends module:common~Client
 */
class SubscriptionProductClient extends Client {
  /**
   * Create an instance.
   * @param {Object} manager - Object can be taken from `const manager = await instance.getData()` but only the `identifier` is the real important.
   * @param {string} manager.identifier - Get it from the Daisy Dashboard as `DAISY_ID`.
   * @param {string} manager.secretKey - Get it from the Daisy Dashboard as `DAISY_SECRET_KEY`. THIS SHOULD ONLY BE KEEP SECRET ON A SERVER. DO NOT USE ON BROWSERS.
   * @param {Object} override - Override `axios` config. This is intended for development purposes.
   */
  constructor(manager, override) {
    const { identifier, secretKey } = manager;
    super({
      ...Client.DEFAULT_CONFIG,
      auth: {
        username: identifier,
        password: secretKey,
      },
      ...override,
    });
  }

  /**
   * Get Subscription Manager data and plans.
   * @async
   * @returns {Promise<SubscriptionManager>} - Subscription Manager and Plans given the manager in the constructor.
   *
   * @example
   *
   * const subscriptionProduct = new SubscriptionProductClient({
   *   identifier: process.env.DAISY_ID,
   * });
   * const { plans, ...manager } = await subscriptionProduct.getData();
   */
  getData() {
    return this.request({
      method: "get",
      url: "/",
    }).then(({ data: body }) => body.data);
  }

  /**
   * @deprecated Renamed to {@link module:common~SubscriptionProductClient#getData}.
   */
  getPlans() {
    // TODO: add deprecation warning.
    return this.getData();
  }

  /**
   * Get subscriptions.
   * @async
   * @param {Object} criteria - Filtering criteria.
   * @param {string} criteria.account - Filter by Ethereum address.
   * @returns {Promise<Subscription[]>} - Subscriptions based on the filtering criteria.
   *
   * @example
   *
   * const subscriptionProduct = new SubscriptionProductClient({
   *   identifier: process.env.DAISY_ID,
   * });
   * const subscriptions = await subscriptionProduct.getSubscriptions({ account: "0x0..." });
   */
  getSubscriptions({ account }) {
    const filter = { account };
    return this.request({
      method: "get",
      url: `/subscriptions/?${querystring.stringify(filter)}`,
    }).then(({ data: body }) => body.data);
  }

  /**
   * Get single subscription.
   * @async
   * @param {Object} criteria - Filtering criteria, only one field is required.
   * @param {string} criteria.id - Find Subscription based on a Daisy ID.
   * @param {string} criteria.subscriptionHash - Find Subscription based on a `subscriptionHash` in the blockchain.
   * @returns {Promise<?Subscription>} - Subscription found.
   *
   * @example
   *
   * const subscriptionProduct = new SubscriptionProductClient({
   *   identifier: process.env.DAISY_ID,
   * });
   * const subscription = await subscriptionProduct.getSubscription({ id: "" });
   */
  getSubscription({ id, subscriptionHash }) {
    if (id) {
      return this.request({
        method: "get",
        url: `/subscriptions/${id}/`,
      }).then(({ data: body }) => body.data);
    } else if (subscriptionHash) {
      return this.request({
        method: "get",
        url: `/subscriptions/hash/${subscriptionHash}/`,
      }).then(({ data: body }) => body.data);
    } else {
      throw new Error("Missing arguments");
    }
  }

  /**
   * Get receipts from single subscription.
   * @async
   * @param {Object} criteria - Filtering criteria, only one field is required.
   * @param {string} criteria.id - Find Subscription based on a Daisy ID.
   * @param {string} criteria.subscriptionHash - Find Subscription based on a `subscriptionHash` in the blockchain.
   * @returns {Promise<Receipt[]>} - Receipts.
   */
  getReceipts({ id, subscriptionHash }) {
    if (id) {
      return this.request({
        method: "get",
        url: `/subscriptions/${id}/receipts/`,
      }).then(({ data: body }) => body.data);
    } else if (subscriptionHash) {
      return this.request({
        method: "get",
        url: `/subscriptions/hash/${subscriptionHash}/receipts/`,
      }).then(({ data: body }) => body.data);
    } else {
      throw new Error("Missing arguments");
    }
  }

  /**
   * Get single subscription.
   * @async
   * @param {Object} input - Input arguments
   * @param {string} input.agreement - The `agreement` is the return of {@link module:browser.DaisySDKToken#sign}.
   * @param {string} input.receipt - The agreement is the return of {@link module:browser.DaisySDKToken#approve}.
   * @param {string} input.signature - The agreement is the return of {@link module:browser.DaisySDKToken#sign}.
   * @param {string} input.authSignature - Signature for private plans created from {@link module:private~ServiceSubscriptions#authorize}.
   * @returns {Promise<Subscription>} - Created {@link module:common~Subscription}, its {@link module:common~Subscription#state} will be `PENDING`.
   *
   * @example
   *
   * const subscriptionProduct = new SubscriptionProductClient({
   *   identifier: process.env.DAISY_ID,
   * });
   * const subscription = await subscriptionProduct.submit({ });
   */
  submit({ agreement, receipt, signature, authSignature }) {
    return this.getData()
      .then(({ plans }) => {
        const plan = plans.find(p => p["onChainId"] === agreement["plan"]);
        if (!plan) {
          throw new Error("Plan not found");
        }
        return this.request({
          method: "post",
          url: "/subscriptions/",
          data: {
            agreement,
            receipt,
            authSignature,
            signature,
          },
        });
      })
      .then(({ data: body }) => {
        return body;
      });
  }
}

SubscriptionProductClient.ZERO_ADDRESS = "0x00000000000000000000";

module.exports = SubscriptionProductClient;