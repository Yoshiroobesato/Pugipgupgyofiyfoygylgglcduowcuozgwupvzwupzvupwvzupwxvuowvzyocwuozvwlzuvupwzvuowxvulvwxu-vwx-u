const https = require("https");

// Función auxiliar para realizar solicitudes HTTPS
function fetchPlaybackURL(targetURL, callback) {
  const regex = /var playbackURL = "(.*?)";/;

  https.get(targetURL, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      const match = data.match(regex);
      if (match && match[1]) {
        callback(null, match[1]);
      } else {
        callback("playbackURL not found");
      }
    });
  }).on("error", (err) => {
    callback(err.message);
  });
}

export default function handler(req, res) {
  if (req.method === "GET") {
    const { url } = req.query;

    if (!url) {
      res.status(400).json({ error: "Missing 'url' query parameter" });
      return;
    }

    fetchPlaybackURL(url, (err, playbackURL) => {
      if (err) {
        res.status(500).json({ error: err });
      } else {
        res.status(200).json({ playbackURL });
      }
    });
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
