# HNG14 Stage 0 TASK

A small TypeScript and Express.js API that classifies a name using the Genderize API.

## Endpoint

`GET /api/classify?name={name}`

## Response

Success:

```json
{
  "status": "success",
  "data": {
    "name": "john",
    "gender": "male",
    "probability": 0.99,
    "sample_size": 1234,
    "is_confident": true,
    "processed_at": "2026-04-01T12:00:00Z"
  }
}
```

Error:

```json
{
  "status": "error",
  "message": "<error message>"
}
```

## Rules

- `sample_size` is mapped from the Genderize `count` field.
- `is_confident` is `true` only when `probability >= 0.7` and `sample_size >= 100`.
- `processed_at` is generated on every request in UTC ISO 8601 format.
- CORS is enabled for all origins.

## Error cases

- `400 Bad Request` for missing or empty `name`
- `422 Unprocessable Entity` when `name` is not a string
- `502 Bad Gateway` when the upstream API fails
- `500 Internal Server Error` for unexpected server failures
- If Genderize returns `gender: null` or `count: 0`, the API returns:

```json
{
  "status": "error",
  "message": "No prediction available for the provided name"
}
```

## Run locally

```bash
npm install
npm run dev
```

The server starts on port `3000` by default, or the value of `PORT` if it is set.
