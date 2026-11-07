CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_host INTEGER NOT NULL DEFAULT 0,
  about TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  avatar_hue INTEGER NOT NULL DEFAULT 200,
  languages TEXT NOT NULL DEFAULT '["English"]',
  work TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY,
  host_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  property_type TEXT NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('entire', 'private', 'shared')),
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  state TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  max_guests INTEGER NOT NULL CHECK (max_guests > 0),
  bedrooms INTEGER NOT NULL,
  beds INTEGER NOT NULL,
  bathrooms REAL NOT NULL,
  nightly INTEGER NOT NULL CHECK (nightly > 0),
  cleaning_fee INTEGER NOT NULL DEFAULT 0,
  weekly_discount_pct INTEGER NOT NULL DEFAULT 0 CHECK (weekly_discount_pct BETWEEN 0 AND 90),
  monthly_discount_pct INTEGER NOT NULL DEFAULT 0 CHECK (monthly_discount_pct BETWEEN 0 AND 90),
  min_nights INTEGER NOT NULL DEFAULT 1 CHECK (min_nights > 0),
  instant_book INTEGER NOT NULL DEFAULT 0,
  cancellation_policy TEXT NOT NULL DEFAULT 'moderate' CHECK (cancellation_policy IN ('flexible', 'moderate', 'strict')),
  house_rules TEXT NOT NULL DEFAULT '',
  highlights TEXT NOT NULL DEFAULT '[]',
  sleeping TEXT NOT NULL DEFAULT '[]',
  luxe INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'listed' CHECK (status IN ('listed', 'unlisted')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listing_photos (
  id INTEGER PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  file TEXT NOT NULL,
  room TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS listing_amenities (
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  amenity TEXT NOT NULL,
  PRIMARY KEY (listing_id, amenity)
);

CREATE TABLE IF NOT EXISTS blocked_nights (
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  night TEXT NOT NULL,
  PRIMARY KEY (listing_id, night)
);

CREATE TABLE IF NOT EXISTS night_prices (
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  night TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  PRIMARY KEY (listing_id, night)
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  guest_id INTEGER NOT NULL REFERENCES users(id),
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  guests INTEGER NOT NULL,
  nightly INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL,
  cleaning_fee INTEGER NOT NULL,
  service_fee INTEGER NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'declined', 'expired', 'cancelled_by_guest', 'cancelled_by_host')),
  refund INTEGER NOT NULL DEFAULT 0,
  paid_with TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  CHECK (check_out > check_in)
);
CREATE INDEX IF NOT EXISTS bookings_listing_dates ON bookings (listing_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS bookings_guest ON bookings (guest_id);

CREATE TABLE IF NOT EXISTS experiences (
  id INTEGER PRIMARY KEY,
  host_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL DEFAULT 'experience' CHECK (kind IN ('experience', 'service')),
  provided_at TEXT NOT NULL DEFAULT '',
  qualifications TEXT NOT NULL DEFAULT '[]',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  duration_min INTEGER NOT NULL,
  price_per_guest INTEGER NOT NULL CHECK (price_per_guest > 0),
  max_guests INTEGER NOT NULL CHECK (max_guests > 0),
  meeting_point TEXT NOT NULL DEFAULT '',
  what_to_bring TEXT NOT NULL DEFAULT '',
  activity_level TEXT NOT NULL DEFAULT '',
  guest_requirements TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'listed' CHECK (status IN ('listed', 'unlisted')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS experience_photos (
  id INTEGER PRIMARY KEY,
  experience_id INTEGER NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  file TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS experience_steps (
  id INTEGER PRIMARY KEY,
  experience_id INTEGER NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS experience_offerings (
  id INTEGER PRIMARY KEY,
  experience_id INTEGER NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_per_guest INTEGER NOT NULL CHECK (price_per_guest > 0),
  duration_min INTEGER NOT NULL,
  photo TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS experience_slots (
  id INTEGER PRIMARY KEY,
  experience_id INTEGER NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0)
);
CREATE INDEX IF NOT EXISTS slots_experience ON experience_slots (experience_id, starts_at);

CREATE TABLE IF NOT EXISTS experience_bookings (
  id INTEGER PRIMARY KEY,
  slot_id INTEGER NOT NULL REFERENCES experience_slots(id),
  offering_id INTEGER REFERENCES experience_offerings(id),
  guest_id INTEGER NOT NULL REFERENCES users(id),
  guests INTEGER NOT NULL CHECK (guests > 0),
  subtotal INTEGER NOT NULL,
  service_fee INTEGER NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled')),
  refund INTEGER NOT NULL DEFAULT 0,
  paid_with TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS exp_bookings_slot ON experience_bookings (slot_id);

CREATE TABLE IF NOT EXISTS wishlists (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  wishlist_id INTEGER NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('listing', 'experience')),
  item_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (wishlist_id, kind, item_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('listing', 'experience')),
  item_id INTEGER NOT NULL,
  booking_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id),
  overall INTEGER NOT NULL CHECK (overall BETWEEN 1 AND 5),
  cleanliness INTEGER CHECK (cleanliness BETWEEN 1 AND 5),
  accuracy INTEGER CHECK (accuracy BETWEEN 1 AND 5),
  checkin INTEGER CHECK (checkin BETWEEN 1 AND 5),
  communication INTEGER CHECK (communication BETWEEN 1 AND 5),
  location INTEGER CHECK (location BETWEEN 1 AND 5),
  value INTEGER CHECK (value BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (kind, booking_id)
);
CREATE INDEX IF NOT EXISTS reviews_item ON reviews (kind, item_id);

CREATE TABLE IF NOT EXISTS threads (
  id INTEGER PRIMARY KEY,
  guest_id INTEGER NOT NULL REFERENCES users(id),
  host_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK (kind IN ('listing', 'experience')),
  item_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (guest_id, host_id, kind, item_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS messages_thread ON messages (thread_id, id);

CREATE INDEX IF NOT EXISTS listing_photos_listing ON listing_photos (listing_id, position, id);
CREATE INDEX IF NOT EXISTS experience_photos_experience ON experience_photos (experience_id, position, id);
CREATE INDEX IF NOT EXISTS experience_steps_experience ON experience_steps (experience_id, position);

CREATE TABLE IF NOT EXISTS recently_viewed (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id INTEGER REFERENCES users(id),
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (listing_id, reporter_id)
);
