import express, { Response } from "express";

const router = express.Router();

router.get('/', (_, res) => {
  res.json({ ok: true, message: "Pong GET!" });
});

router.post('/', async (_, res) => {
  res.json({ ok: true, message: "Pong! POST" });
});

export default router;