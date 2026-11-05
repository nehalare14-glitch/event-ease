const express = require("express");

const app = express();

const port = Number(process.env.PORT || 10000);

app.disable("x-powered-by");

app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.json({
    name: "Event Ease Backend",
    status: "running",
    message: "Welcome to the Event Ease API"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "event-ease-backend"
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Event Ease backend listening on port ${port}`);
});
