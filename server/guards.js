import { AppError } from "./bookings.js";

export function requireUser(req) {
  if (!req.user) throw new AppError(401, "auth_required");
  return req.user;
}

export function requireHost(req) {
  const user = requireUser(req);
  if (!user.is_host) throw new AppError(403, "host_only");
  return user;
}

export const idParam = {
  type: "object",
  properties: { id: { type: "integer", minimum: 1 } },
  required: ["id"],
};

export const body = (properties, required = Object.keys(properties)) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required,
});

export const isoDate = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" };
export const text = (maxLength, minLength = 0) => ({ type: "string", minLength, maxLength });
export const int = (minimum, maximum) => ({ type: "integer", minimum, maximum });
