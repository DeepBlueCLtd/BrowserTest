/** @type { import('@storybook/web-components-vite').StorybookConfig } */
const config = {
  stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook'
  ],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  docs: {},
  core: {
    disableTelemetry: true,
  },
  async viteFinal(config) {
    // Remove vite-plugin-dts from Storybook builds to prevent errors
    config.plugins = config.plugins?.filter(
      (plugin) => plugin && plugin.name !== 'vite:dts'
    ) || [];
    return config;
  },
};

export default config;
