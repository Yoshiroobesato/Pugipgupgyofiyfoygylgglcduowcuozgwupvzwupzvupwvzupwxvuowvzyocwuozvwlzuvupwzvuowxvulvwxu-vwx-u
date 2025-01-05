import axios from "axios";
import cheerio from "cheerio";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { url } = req.query;

    // Verificar si se proporcionó la URL
    if (!url) {
      return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

    try {
      // Solicitar la página usando Axios
      const response = await axios.get(url);

      // Cargar el HTML en Cheerio
      const $ = cheerio.load(response.data);

      // Buscar el valor de playbackURL usando una expresión regular
      const scriptText = $("script")
        .map((i, el) => $(el).html())
        .get()
        .join(" ");
      const regex = /var playbackURL = "(.*?)";/;
      const match = scriptText.match(regex);

      if (match && match[1]) {
        return res.status(200).json({ playbackURL: match[1] });
      } else {
        return res.status(404).json({ error: "playbackURL not found" });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}
