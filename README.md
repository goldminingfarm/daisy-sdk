![Alt text](/.github/logo.svg)

Daisy's software enables businesses to accept cryptocurrency for purchases, subscriptions, usage fees and other payments. Now that revenue can come from anywhere, manage it in one place.

# Daisy SDK

Daisy SDK is a library for interacting with all aspects of the Daisy product in both a browser and Node environment. This guide will go through using the library to sign up for a new subscription, access a subscription's current state and subscriber data, approve tokens for an existing subscription, and cancel an existing subscription.

It is also possible to create Payment Invoices for one-time purchases.

## Install

Begin by adding the `@daisypayments/daisy-sdk` package to your project:

```sh
# Required dependency with npm
npm install --save @daisypayments/daisy-sdk

# Optional dependencies with npm
npm install --save fetch ethers web3@1.2.6
```

```sh
# Required dependency with yarn
yarn add @daisypayments/daisy-sdk

# Optional dependencies with yarn
yarn add fetch ethers web3@1.2.6
```

---

## Payment Invoices

Start by creating a new Payment Group on [Daisy](https://app.daisypayments.com/):

* Mainnet: The main Ethereum chain where value is real.
* Rinkeby: Test net for development purposes.

![create-new-payment-group](/.github/dashboard-create-pg.png)

Get the API keys from the created instance:

![payment-group-settings](/.github/dashboard-pg-settings.png)

In this case we are going to store them as environment variables. We recommend [`dotenv`](https://github.com/motdotla/dotenv) to manage them.

```txt
DAISY_OTP_PUBLIC=my-e-commerce-invoices-509-f1215f5742cf07dd
DAISY_OTP_SECRET=af3exxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx96b2
```

### ERC20 Token

To create an invoice for a **ERC20 Token** it is really easy:

```js
const DaisySDK = require("@daisypayments/daisy-sdk/private");
const { parseUnits } = require("ethers/utils/units"); // See: https://docs.ethers.io/ethers.js/html/api-utils.html#ether-strings-and-wei
const { BigNumber } = require("ethers/utils/bignumber"); // See: https://docs.ethers.io/ethers.js/html/api-utils.html#big-numbers
const fetch = require("node-fetch");

require("dotenv").config(); // load environment variables

async function main() {
  const payments = new DaisySDK.ServerPayments({
    manager: {
      identifier: process.env.DAISY_OTP_PUBLIC,
      secretKey: process.env.DAISY_OTP_SECRET,
    },
    withGlobals: { fetch },
  });

  /**
   * Most ERC20 tokens like DAI have 18 decimals.
   * See: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#decimals
   */
  const decimals = 18;

  const invoice = await payments.createInvoice({
    tokenAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI address
    walletAddress: "0x98aDCa769FC6C7628d087dAf69E332Ed27804775", // Your wallet address
    invoicedPrice: parseUnits("1299.9", decimals), // 1299.9 USD === 1299900000000000000000 DAI (units)
    invoicedEmail: "example@email.com", // Daisy will send an email to this address
  })

  const href = invoice["shareURL"];
  console.log(href);
}

main().catch(err => console.error(err));
```

#### Test token

Since there is no DAI on Rinkeby we have a custom ERC20 Token called `DSY` with address:

```txt
0x6FB3222E6134892a622D3990E3C94D75FF772b18
```

It has *18 decimals* and you can mint it in the settings page of your organization at https://app.daisypayments.com/.

> View it on Etherscan.io: https://rinkeby.etherscan.io/address/0x6FB3222E6134892a622D3990E3C94D75FF772b18

### ETH invoice

To create an invoice for a **Eth** it very similar:

```js
const DaisySDK = require("@daisypayments/daisy-sdk/private");
const { parseEther } = require("ethers/utils/units"); // parseEther is an alias of parseUnits(value, 18)
const { BigNumber } = require("ethers/utils/bignumber"); // See: https://docs.ethers.io/ethers.js/html/api-utils.html#big-numbers
const fetch = require("node-fetch");

require("dotenv").config(); // load environment variables

async function main() {
  const payments = new DaisySDK.ServerPayments({
    manager: {
      identifier: process.env.DAISY_OTP_PUBLIC,
      secretKey: process.env.DAISY_OTP_SECRET,
    },
    withGlobals: { fetch },
  });

  /**
   * Use this address to ask for Eth instead of a token.
   */
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  const invoice = await payments.createInvoice({
    tokenAddress: ZERO_ADDRESS,
    walletAddress: "0x98aDCa769FC6C7628d087dAf69E332Ed27804775", // Your wallet address
    invoicedPrice: parseEther("0.42"), // 0.42 ETH === 420000000000000000 WEI
    invoicedEmail: "example@email.com", // Daisy will send an email to this address
  })

  const href = invoice["shareURL"];
  console.log(href);
}

main().catch(err => console.error(err));
```

### Testing ETH

You can use Rinkeby native ETH. Ask for some test ETH here: https://www.rinkeby.io/#faucet

## Line items

It is possible to have a table of line-items and add a breakdown of the final price including tax and shipping costs.

```js
const { parseUnits } = require("ethers/utils/units"); // See: https://docs.ethers.io/ethers.js/html/api-utils.html#ether-strings-and-wei

const decimals = 18; // DAI, ETH and popular tokens

const invoice = await payments.createInvoice({
  tokenAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI address
  walletAddress: "0x98aDCa769FC6C7628d087dAf69E332Ed27804775", // Your wallet address
  invoicedEmail: "example@email.com", // Daisy will send an email to this address
  items: [
    {
      sku: "MM178", // optional
      description: "Professional turntable TT-7700",
      image: { // optional
        URL: "https://source.unsplash.com/300x300/?turntable",
      },
      quantity: 1, // by default is 1
      amount: parseUnits("749.9", decimals),
    },
    {
      description: "Vinyl record",
      quantity: 12,
      amount: parseUnits("15.6", decimals), // price per unit
    },
    {
      type: "TAX", // default type is "SKU" for normal items
      amount: parseUnits("7.33", decimals),
    }
    {
      type: "SHIPPING", // default type is "SKU" for normal items
      amount: parseUnits("4.50", decimals),
    }
  ]
});

const href = invoice["shareURL"];
console.log(href);
```

## Real integration and automation

### Creating invoices

```js
const express = require("express");
const bodyParser = require("body-parser");
const DaisySDK = require("@daisypayments/daisy-sdk/private");
const { parseEther } = require("ethers/utils/units");
const fetch = require("node-fetch");

require("dotenv").config(); // load environment variables

const { Users, Items } = require("./models");

const payments = new DaisySDK.ServerPayments({
  manager: {
    identifier: process.env.DAISY_OTP_PUBLIC,
    secretKey: process.env.DAISY_OTP_SECRET,
  },
  withGlobals: { fetch },
});

const app = express();
app.use(bodyParser.json());

app.post("/checkout/", async (req, res, next) => {
  try {
    const { user, cart } = req.session;

    // Get items from DB (assuming cart is an array of ids)
    const items = await Items.find().where('_id').in(cart).exec();

    // Generate invoice
    const invoice = await payments.createInvoice({
      tokenAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI address
      walletAddress: "0x98aDCa769FC6C7628d087dAf69E332Ed27804775", // Your wallet address
      invoicedEmail: user.email,
      invoicedName: user.name,
      items: items.map(item => ({
        sku: item._id, // or your own identifier
        description: item.name,
        quantity: 1,
        // Assuming price is in USD (1 USD = 1 DAI)
        amount: parseUnits(String(item.price), decimals),
      })),
    });

    // Save invoice to current user orders
    await Users
      .update({ _id: user._id }, { $push: { daisyOrders: invoice["address"] } })
      .exec();

    // Redirect the user to Daisy checkout flow
    return res.redirect(invoice["shareURL"]);
  } catch (err) {
    return next(err);
  }
});

app.listen(3000, () => {
  console.log("App listening on port 3000");
});
```

### Retrieving invoice status via SDK

```js
const updated = await payments.getInvoice({
  address: invoice["address"],
});
```

### Webhooks

It is possible (and recommended) to have real-time updates via webhooks. To enable webhooks go to the "API Integration" tab and scroll down to the "Webhooks settings" section:

![webhooks](/.github/dashboard-pg-webhooks.png)

* Webhook method: select the HTTP method. `POST` is recommended and the standard.
* Webhook URL: you server URL. **HTTPS is enforced**.

> Running a localhost development environment? Use a tunnel like https://ngrok.com/ or https://www.tunnelbear.com/.

Webhook events are JSON payloads you can read from your server. Here is the Webhook schema in Typescript:

```ts
interface WebhookEventSpec {
  /**
   * Webhook unique id
   */
  id: string;
  /**
   * Semver format
   * @see: https://semver.org/
   */
  version: string;
  /**
   * Always uppercase. Use a switch() over this value.
   */
  action: string;
  /**
   * Arbitrary JSON object
   */
  payload: object | undefined | null;
  meta: {
    type: string;
    identifier: string
  };
}
```

The following is an example of how to deal with incoming webhook requests:

```js
app.post("/webhooks-daisy/", async (req, res, next) => {
  try {
    const webhook = req.body;

    switch (webhook["action"]) {
      case "PAYMENT_PAID": {
        const address = webhook["payload"]["address"];
        // Mark order as paid.
        return res.status(200); // return any success status code
      }
      default: {
        return next();
      }
    }
  } catch (err) {
    next(err);
  }
});
```

To verify the authenticity of webhook requests you can use the RSA Public key from the dashboard and compare the signature digest from the HTTP Headers:

![alt](/.github/dashboard-pg-rsa.png)

There is a helper function included in DaisySDK package to make verifying easier. Import it from:

```js
const webhooks = require("@daisypayments/daisy-sdk/private/webhooks");
```

Example code:

```js
const webhooks = require("@daisypayments/daisy-sdk/private/webhooks");
const dedent = require("dedent");

app.post("/webhooks-daisy/", async (req, res, next) => {
  try {
    const webhook = req.body;
    const digest = req.get("X-DAISY-SIGNATURE");

    const isAuthentic = webhooks.verify({
      digest,
      message: webhook,
      publicKey: dedent`
        -----BEGIN PUBLIC KEY-----
        MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8Bs4flCwzob2h/sLUFfc
        LyLJbiLnsTKH3S2BD8yswzIAwI4dB44+B3KSl++TE6Yxsa7SxGLI/P6flhb7nAl6
        IPMsWxvspfJ2nUB4wp0UFCGX88LmCEdljKjUl1qq0H8lDf+hrVUq9neOGUg5BBvp
        z6Gxom7Xn03toOO00BOV+UzSsLq8asXrTRa6VPSeufEpAsjdlvtzEUitVR5LvUhW
        f/nIjgBHKqiuN/+Jcn1EaZgonP0BvcLTy4I/dRMdEkNB1TvcbABLWN+6/Y6vysxK
        HAuSO+HAxxaP98wEHwFVuZRtmMZmXsQBVUIp7krSS2P1/ZZpUvThjt3pXQdtLSJq
        CwIDAQAB
        -----END PUBLIC KEY-----
      `,
    });
    if (!isAuthentic) {
      throw new Error("Not valid signature");
    }

    switch (webhook["action"]) {
      case "PAYMENT_PAID": {
        const address = webhook["payload"]["address"];
        // Mark order as paid.
        return res.status(200); // return any success status code
      }
      default: {
        return next();
      }
    }
  } catch (err) {
    next(err);
  }
});
```

#### List of webhooks events

##### `PAYMENT_PAID`

```ts
interface PAYMENT_PAID {
  /**
   * Invoice unique address
   */
  address: string;
}
```

---

## Subscriptions

Create and deploy a Daisy Subscription service:

![daisy-dashboard](/.github/dashboard.png)

After deploying a Subscription Product to the blockchain go to the *API Integration* tab and grab the API from the settings page:

![daisy-dashboard-settings](/.github/dashboard-ss-settings.png)

In this case we are going to store them as environment variables. We recommend [`dotenv`](https://github.com/motdotla/dotenv) to manage them.

```txt
DAISY_PUBLIC=recurring-payments-730-e511c7d9e5f63ae1
DAISY_SECRET=b121xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx4c2f
```

#### 1.2 Integration in the server

Create an instance of `ServerSubscriptions` from the `@daisypayments/daisy-sdk/private` sub-module.
It is extremely important to keep `DAISY_SECRET_KEY` **private**.

```js
const { ServerSubscriptions } = require("@daisypayments/daisy-sdk/private");
const fetch = require("node-fetch");

ServerSubscriptions.fetch = fetch;
const subscriptions = new ServerSubscriptions({
  manager: {
    identifier: process.env.DAISY_ID,
    secretKey: process.env.DAISY_SECRET_KEY,
  },
  withGlobals: { fetch },
});
```

> Server instances requires an instance of `fetch`. We recommend [node-fetch](https://www.npmjs.com/package/node-fetch).

Create and endpoint to retrieve information from your servers back to the frontend.
Here is an example using Express.js:

```js
const express = require("express");
const h = require("express-async-handler");

const app = express();

// GET /api/plans/ -> Fetch plans from the frontend
app.get("/api/plans/", h(async (req, res) => {
  const { plans } = await subscriptions.getData();
  res.json({ plans });
}));

// POST /api/plan/:pid/subscriptions/ -> Submit a subscription to Daisy
app.post("/api/plan/:pid/subscriptions/", h(async (req, res) => {
  const user = req.session;
  const { agreement, signature } = req.body;

  const { plans } = await subscriptions.getData();
  const plan = plans.find(p => p["id"] === req.params["pid"]);
  if (!plan) {
    throw new Error("Plan not found");
  }

  const { data: subscription } = await subscriptions.submit({
    agreement,
    authSignature,
    signature,
  });

  // Save and associate DaisyID from `subscription["daisyId"]` to an user.
  const daisyId = subscription["daisyId"];
  await user.patch({ daisyId });

  res.send("ok");
}));
```

##### 1.2.1 Get plans from the frontend (not recommended)

This will only expose `private: false` plans.

```js
import DaisySDK from "@daisypayments/daisy-sdk";

const daisy = await DaisySDK.initSubscriptions({
  manager: { identifier: "margarita" },
  withGlobals: { web3 },
});

const { plans } = await daisy.getData();
```

#### 1.3 Approving tokens

It is required to approve tokens before signing the subscription agreement.

```js
const daisy = await DaisySDK.initSubscriptions({
  manager: { identifier: "margarita" },
  withGlobals: { web3 },
});

const approvalAmount = "9000000000000000";
const account = "0x..." // from MetaMask.

const eventemitter = daisy
  .with(plan)
  .approve(approvalAmount, { from: account });

const eventemitter
  .on("transactionHash", handleApprove_transactionHash)
  .on("confirmation", handleApprove_confirmation)
  .on("receipt", handleApprove_receipt)
  .on("error", handleApprove_error);

function handleApprove_transactionHash(transactionHash) {
  // ...
};
function handleApprove_confirmation(confirmationNumber, receipt) {
  // ...
};
function handleApprove_receipt(receipt) {
  // Here you can assume this task is complete.
  // If you want to resume this transaction, save the `receipt` object.
};
function handleApprove_error(error) {
  // ...
};
```

#### 1.4 Signing subscription agreement

```js
const daisy = await DaisySDK.initSubscriptions({
  manager: { identifier: "margarita" },
  withGlobals: { web3 },
});

const { signature, agreement } = await daisy
  .with(plan)
  .sign({ account, plan });

// Send `signature` and `agreement` back to the server
// TODO: replace `:pid` with Plan ID.
const response = await fetch("/api/plan/:pid/subscriptions/", {
  method: "post",
  credentials: "same-origin",
  body: JSON.stringify({ signature, agreement }),
});

const data = await response.json();
```

##### 1.4.1 Submit subscription from the frontend (only for public plans) (not recommended)

```js
const { data: subscription } = await daisy.submit({
  agreement,
  signature,
});
```

#### 1.5 Verify Daisy subscription state

Verify subscription state with:

```js
const sub = await subscriptions.getSubscription({
  id: daisyID,
});
console.log(sub["state"]);

const subs = await subscriptions.getSubscriptions({
  account: "0x...",
});
```

### 2. Invitations

> This feature has been reworked and the documentation still in progress.

## Usage: Payments invoices

### 1. Creating invoices with Daisy SDK

#### 1.1 Create an Invitation

The first step is going to the Daisy Dashboard and setup an Invitation product. After setting this go to the API Integration and grab the `DAISY_ID` and `DAISY_SECRET_KEY`.

```txt
# Example values
DAISY_OTP_ID=plantae
DAISY_OTP_SECRET_KEY=key
```

#### 1.2 Server integration

Create an instance of `ServerPayments` from the `@daisypayments/daisy-sdk/private` sub-module.
It is extremely important to keep `DAISY_OTP_SECRET_KEY` **private**.

```js
const DaisySDK = require("@daisypayments/daisy-sdk/private");
const fetch = require("node-fetch");

const payments = new DaisySDK.ServerPayments({
  manager: {
    identifier: process.env.DAISY_OTP_ID,
    secretKey: process.env.DAISY_OTP_SECRET_KEY,
  },
  withGlobals: { fetch },
});
```

> Server instances requires an instance of `fetch`. We recommend [node-fetch](https://www.npmjs.com/package/node-fetch).

Let's say we want to sell an access pass for 20 USD or equivalent in DAI.

```js
const express = require("express");
const h = require("express-async-handler");

const app = express();

app.get("/api/checkout/invoice/", h(async (req, res) => {
  const user = req.session;

  // Create an invoice using Daisy SDK
  const invoice = await payments.createInvoice({
    invoicedPrice: 20, // required
    invoicedEmail: user.email, // optional
    invoicedName: user.name, // optional
    invoicedDetail: "Paid Access", // optional
  });

  // Save and associate invoice to user
  await user.update({ invoiceId: invoice["id"]} );

  // Use this object in the frontend to start the transaction.
  res.json({ invoice });
});
```

The `invoice` object looks like this using TypeScript notation:

```ts
interface PaymentInvoice {
  id: string;
  identifier: string;
  state: PaymentInvoiceState;
  amountPaid: string | BigNumber;
  paidAt?: string;
  address: string;
  tokenAddress: string;
  walletAddress: string;
  invoicedPrice: string;
  invoicedEmail?: string;
  invoicedName?: string;
  invoicedDetail?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export enum PaymentInvoiceState {
  Pending = "PENDING",
  UnderPaid = "UNDER_PAID",
  Paid = "PAID",
  OverPaid = "OVER_PAID",
}
```

Since any transaction sending money to the invoice address can fulfill the requested amount, one way to know the state of the payment is to ask Daisy via polling.

```js
app.get("/api/checkout/state/", h(async (req, res) => {
  const user = req.session;

  try {
    const invoice = await payments.getInvoice({
      identifier: user.invoiceId,
    });
    const success = ["PAID", "OVER_PAID"].includes(invoice["state"]);

    res.json({ invoice });
  } catch (error) {
    //
  }
});
```

To get the receipts from any Invoice:

```js
const receipts = await payments.getReceipts({
  identifier: user.invoiceId,
});
```

Receipt object shape:

```ts
interface PaymentReceipt {
  id: string;
  txHash: string;
  account: string;
  amount: string | BigNumber;
  onChainCreatedAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}
```
