const fs = require("fs");
const Generator = require("./generator");
const { configPath } = require("../envs");

/**
 * Throws error and exists process
 * @param {string} erorr to log
 */
function throwErrorAndExit(error) {
  console.error(error);
  process.exit(1);
}
(async () => {
  var _a;
  // Check if config exists
  if (!fs.existsSync(configPath)) {
    throwErrorAndExit("Missing config.json. Please add.");
  }
  // Read config
  const configFile = await fs.readFileSync(configPath);
  const configData = JSON.parse(configFile.toString());
  // Check if config contains airdrop key
  if (configData["airdrop"] === undefined) {
    throwErrorAndExit("Missing airdrop param in config. Please add.");
  }
  // Collect config
  const decimals =
    (_a = configData.decimals) !== null && _a !== void 0 ? _a : 18;
  const airdrop = configData.airdrop;
  // Initialize and call generator
  const generator = new Generator(decimals, airdrop);
  await generator.process();
})();
