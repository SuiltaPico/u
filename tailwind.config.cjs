const colors = require('tailwindcss/colors')

function color_to_int(color) {
  return parseInt(color.slice(1), 16)
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,vue}"],
  theme: {
    extend: {
      minWidth: {
        '4': '1rem',
        '32': '8rem',
        "full": "100%",
        "50": "50%",
        "75": "75%",
        "100": "100%",
      },
      maxWidth: {
        "160": "40rem /** 640px */",
        "50": "50%",
        "75": "75%",
        "100": "100%",
      },
      colors: {
        zinc: {
          150: "#" + ((
            color_to_int(colors.zinc[100]) + color_to_int(colors.zinc[200])
          ) / 2).toString(16)
        },
        neutral: {
          125: "#" + (
            color_to_int(colors.neutral[100]) / 4 * 3
            + color_to_int(colors.neutral[200]) / 4
          ).toString(16),
          150: "#" + ((
            color_to_int(colors.neutral[100]) + color_to_int(colors.neutral[200])
          ) / 2).toString(16)
        },
        'blue-neutral': {
          200: "#" + Math.round((
            color_to_int(colors.blue[300]) + color_to_int(colors.neutral[200])
          ) / 2).toString(16)
        }
      }
    },
  },
  plugins: [
    'tailwindcss/nesting'
  ],
}
