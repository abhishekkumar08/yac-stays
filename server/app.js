import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { AppError } from "./bookings.js";
import { SESSION_COOKIE, userForToken } from "./auth.js";
import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";
import bookingRoutes from "./routes/bookings.js";
import experienceRoutes from "./routes/experiences.js";
import wishlistRoutes from "./routes/wishlists.js";
import reviewRoutes from "./routes/reviews.js";
import messageRoutes from "./routes/messages.js";
import hostRoutes from "./routes/host.js";
import photoRoutes from "./routes/photos.js";


export function buildApp({ db, photosDir, now = () => Date.now() }) {
  const app = Fastify({ logger: false, bodyLimit: 8 * 1024 * 1024 });
  app.register(cookie);
  app.decorateRequest("user", null);

  app.addHook("preHandler", async (req) => {
    if (req.method === "POST" && !String(req.headers["content-type"]).startsWith("application/json")) {
      throw new AppError(415, "json_required");
    }
    req.user = userForToken(db, req.cookies[SESSION_COOKIE], now());
  });

  app.addContentTypeParser("*", (req, payload, done) => done(new AppError(415, "json_required")));

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof AppError) return reply.code(err.status).send({ error: err.code });
    if (err.validation) return reply.code(400).send({ error: "invalid_input", detail: err.message });
    if (err.statusCode && err.statusCode < 500) return reply.code(err.statusCode).send({ error: err.code ?? "bad_request" });
    req.log.error(err);
    return reply.code(500).send({ error: "server_error" });
  });

  const ctx = { db, now, photosDir };
  for (const routes of [authRoutes, listingRoutes, bookingRoutes, experienceRoutes, wishlistRoutes, reviewRoutes, messageRoutes, hostRoutes, photoRoutes]) {
    app.register(async (scope) => routes(scope, ctx));
  }
  return app;
}
