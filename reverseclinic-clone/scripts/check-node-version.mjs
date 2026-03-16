const requiredMajor = 20;
const recommendedVersion = "20.18.0";
const currentVersion = process.versions.node;
const currentMajor = Number(currentVersion.split(".")[0]);

if (currentMajor === requiredMajor) {
  process.exit(0);
}

console.error(
  [
    `Unsupported Node.js version: ${currentVersion}`,
    `This project should be run with Node.js ${recommendedVersion} (20.x).`,
    "Run `nvm use 20.18.0` and then retry the npm command.",
  ].join("\n"),
);

process.exit(1);
