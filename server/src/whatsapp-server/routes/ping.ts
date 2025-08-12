import express from "express";

const router = express.Router();

router.get('/', (_, res) => {
  res.json({ ok: true, message: "Pong GET!" });
});

export default router;