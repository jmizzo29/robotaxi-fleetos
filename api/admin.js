import feedbackHandler from './feedback.js';

export default async function handler(req, res) {
  const feedbackReq = { ...req, method: 'GET' };
  const feedbackResult = await new Promise((resolve) => {
    const mockRes = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ statusCode: this.statusCode, payload });
      },
      setHeader() {},
    };
    feedbackHandler(feedbackReq, mockRes);
  });

  const feedback = feedbackResult.payload?.feedback || [];
  res.status(200).json({
    postgres: Boolean(process.env.DATABASE_URL),
    feedbackCount: feedback.length,
    latestFeedback: feedback.slice(0, 10),
    generatedAt: new Date().toISOString(),
  });
}
