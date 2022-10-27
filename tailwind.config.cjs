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
        }
      }
    },
  },
  plugins: [],
}
