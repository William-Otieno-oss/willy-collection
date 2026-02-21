const Vibrant = require("node-vibrant");
const path = require("path");

async function extractColors() {
  const logoPath = path.join(
    __dirname,
    "frontend",
    "logo",
    "willy collection.png",
  );
  try {
    const palette = await Vibrant.from(logoPath).getPalette();
    console.log("Logo Color Palette:");
    console.log(
      JSON.stringify(
        {
          Vibrant: palette.Vibrant ? palette.Vibrant.getHex() : null,
          Muted: palette.Muted ? palette.Muted.getHex() : null,
          DarkVibrant: palette.DarkVibrant
            ? palette.DarkVibrant.getHex()
            : null,
          LightVibrant: palette.LightVibrant
            ? palette.LightVibrant.getHex()
            : null,
          DarkMuted: palette.DarkMuted ? palette.DarkMuted.getHex() : null,
        },
        null,
        2,
      ),
    );
  } catch (err) {
    console.error("Error:", err);
  }
}

extractColors();
