/** @type {import('tailwindcss').Config} */
const toScale = (name) =>
  [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].reduce((acc, step) => {
    acc[step] = `rgb(var(--color-${name}-${step})/<alpha-value>)`;
    return acc;
  }, {});

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: toScale('primary'),
        secondary: toScale('secondary'),
        typography: toScale('typography'),
        outline: toScale('outline'),
        background: toScale('background'),
        error: toScale('error'),
        success: toScale('success'),
        warning: toScale('warning'),
        info: toScale('info'),
        indicator: {
          primary: 'rgb(var(--color-indicator-primary)/<alpha-value>)',
          info: 'rgb(var(--color-indicator-info)/<alpha-value>)',
          error: 'rgb(var(--color-indicator-error)/<alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
