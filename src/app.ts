import cors from 'cors';
import express, { type Request, type Response } from 'express';

type GenderizeResponse = {
  name: string;
  gender: string | null;
  probability: number;
  count: number;
};

type SuccessPayload = {
  status: 'success';
  data: {
    name: string;
    gender: string | null;
    probability: number;
    sample_size: number;
    is_confident: boolean;
    processed_at: string;
  };
};

type ErrorPayload = {
  status: 'error';
  message: string;
};

const GENDERIZE_URL = 'https://api.genderize.io';

export const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get(
  '/api/classify',
  async (req: Request, res: Response<SuccessPayload | ErrorPayload>) => {
    const { name } = req.query;

    if (name === undefined) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Missing name parameter' });
    }

    if (Array.isArray(name) || typeof name !== 'string') {
      return res
        .status(422)
        .json({ status: 'error', message: 'name is not a string' });
    }

    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Missing name parameter' });
    }

    try {
      const upstreamUrl = new URL(GENDERIZE_URL);
      upstreamUrl.searchParams.set('name', trimmedName);

      const upstreamResponse = await fetch(upstreamUrl);

      if (!upstreamResponse.ok) {
        return res
          .status(502)
          .json({ status: 'error', message: 'Upstream service error' });
      }

      const payload = (await upstreamResponse.json()) as GenderizeResponse;

      if (payload.gender === null || payload.count === 0) {
        return res.status(200).json({
          status: 'error',
          message: 'No prediction available for the provided name',
        });
      }

      const sample_size = payload.count;
      const probability = payload.probability;

      return res.status(200).json({
        status: 'success',
        data: {
          name: trimmedName,
          gender: payload.gender,
          probability,
          sample_size,
          is_confident: probability >= 0.7 && sample_size >= 100,
          processed_at: new Date().toISOString(),
        },
      });
    } catch {
      return res.status(500).json({ status: 'error', message: 'Server error' });
    }
  },
);

app.use((_: Request, res: Response<ErrorPayload>) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

export default app;
