/**
 * @param {Partial<import('rollup').RollupOptions>} rollupConfig
 * @returns {import('rollup').RollupOptions}
 */
module.exports = (rollupConfig) => {
  const workspaceRoot = process.env.WORKSPACE_ROOT;

  if (!workspaceRoot) {
    throw new Error(
      "@tooling/rollup-config/recommended: WORKSPACE_ROOT not defined, cannot infer recommended Rollup configuration!"
    );
  }

  return require("./config.esbuild")(workspaceRoot, rollupConfig);
};
