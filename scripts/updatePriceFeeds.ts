import hre from "hardhat";
import { validatePriceFeeds } from "./validatePriceFeedsUtils";
import { getFrameSigner } from "../utils/signer";

const expectedTimelockMethods = ["signalSetRealtimeFeed", "setRealtimeFeedAfterSignal"];

async function main() {
  await validatePriceFeeds();

  const signer = await getFrameSigner();
  const timelock = await hre.ethers.getContract("Timelock", signer);

  const realtimeFeedConfig = [];

  const multicallWriteParams = [];

  const timelockMethod = process.env.TIMELOCK_METHOD;
  if (!expectedTimelockMethods.includes(timelockMethod)) {
    throw new Error(`Unexpected TIMELOCK_METHOD: ${timelockMethod}`);
  }

  for (const { token, feedId, realtimeFeedMultiplier } of realtimeFeedConfig) {
    multicallWriteParams.push(
      timelock.interface.encodeFunctionData(timelockMethod, [token, feedId, realtimeFeedMultiplier])
    );
  }

  console.log(`updating ${multicallWriteParams.length} roles`);
  console.log("multicallWriteParams", multicallWriteParams);

  if (process.env.WRITE === "true") {
    await timelock.multicall(multicallWriteParams);
  } else {
    console.log("NOTE: executed in read-only mode, no transactions were sent");
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((ex) => {
    console.error(ex);
    process.exit(1);
  });
