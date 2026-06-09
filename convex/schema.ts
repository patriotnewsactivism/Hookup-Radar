// convex/schema.ts  —  Full updated schema for Surge / Hookup-Radar
// Adds: surge_notifications, surge_strikes
// All existing tables are preserved exactly as before.

import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // ── Existing tables (unchanged) ────────────────────────────

  surge_users: defineTable({
    auth_id:           v.string(),
    auth_email:        v.optional(v.string()),
    username:          v.string(),
    display_name:      v.string(),
    age:               v.number(),
    bio:               v.string(),
    gender:            v.string(),
    orientation:       v.string(),
    lifestyle:         v.string(),
    position:          v.string(),
    height:            v.string(),
    weight:            v.string(),
    body_type:         v.string(),
    ethnicity:         v.string(),
    health_status:     v.string(),
    looking_for:       v.array(v.string()),
    kinks:             v.array(v.string()),
    tags:              v.array(v.string()),
    fantasies:         v.string(),
    photo_url:         v.string(),
    photo_urls:        v.array(v.string()),
    lat:               v.number(),
    lng:               v.number(),
    last_seen:         v.string(),
    is_online:         v.boolean(),
    is_anonymous:      v.boolean(),
    is_verified:       v.boolean(),
    is_premium:        v.boolean(),
    premium_until:     v.optional(v.string()),
    free_trial_until:  v.optional(v.string()),
    blocked_users:     v.array(v.string()),
    favorite_users:    v.array(v.string()),
    profile_views:     v.number(),
    show_distance:     v.boolean(),
    show_on_map:       v.boolean(),
    safe_contact_name: v.optional(v.string()),
    safe_contact_info: v.optional(v.string()),
  })
    .index("by_auth_id", ["auth_id"])
    .index("by_username", ["username"])
    .index("by_location", ["show_on_map", "lat", "lng"]),

  surge_messages: defineTable({
    conversation_id: v.string(),
    sender_id:       v.string(),
    receiver_id:     v.string(),
    text:            v.string(),
    media_url:       v.optional(v.string()),
    media_type:      v.optional(v.string()),
    status:          v.string(),
    is_deleted:      v.boolean(),
    reply_to_id:     v.optional(v.string()),
    created_date:    v.string(),
  })
    .index("by_conversation",    ["conversation_id", "created_date"])
    .index("by_receiver_status", ["receiver_id", "status"]),

  surge_reports: defineTable({
    reporter_id: v.string(),
    reported_id: v.string(),
    reason:      v.string(),
    details:     v.optional(v.string()),
    status:      v.string(),
  }),

  surge_ratings: defineTable({
    rater_id:         v.string(),
    rated_user_id:    v.string(),
    meetup_happened:  v.boolean(),
    reliability_score: v.number(),
    vibe_score:       v.optional(v.number()),
    tags:             v.array(v.string()),
    comment:          v.optional(v.string()),
  }).index("by_rated_user", ["rated_user_id"]),

  surge_spots: defineTable({
    name:         v.string(),
    description:  v.optional(v.string()),
    category:     v.string(),
    address:      v.string(),
    lat:          v.number(),
    lng:          v.number(),
    active_users: v.number(),
    submitted_by: v.optional(v.string()),
    is_approved:  v.boolean(),
  }).index("by_approved", ["is_approved"]),

  surge_spot_events: defineTable({
    spot_id:        v.id("surge_spots"),
    host_id:        v.string(),
    event_type:     v.string(),
    title:          v.string(),
    description:    v.optional(v.string()),
    starts_at:      v.string(),
    ends_at:        v.string(),
    max_attendees:  v.optional(v.number()),
    requirements:   v.array(v.string()),
    is_private:     v.boolean(),
    attendee_count: v.number(),
  }).index("by_spot", ["spot_id"]),

  surge_spot_rsvps: defineTable({
    event_id: v.id("surge_spot_events"),
    user_id:  v.string(),
  })
    .index("by_event",      ["event_id"])
    .index("by_user_event", ["user_id", "event_id"]),

  surge_spot_messages: defineTable({
    spot_id: v.id("surge_spots"),
    user_id: v.string(),
    text:    v.string(),
  }).index("by_spot", ["spot_id"]),

  surge_media: defineTable({
    user_id:          v.string(),
    storage_id:       v.id("_storage"),
    url:              v.string(),
    type:             v.string(),
    filename:         v.optional(v.string()),
    size:             v.optional(v.number()),
    is_profile_photo: v.boolean(),
    album_id:         v.optional(v.id("surge_albums")),
    sort_order:       v.number(),
    created_at:       v.string(),
  })
    .index("by_user",         ["user_id", "created_at"])
    .index("by_album",        ["album_id", "sort_order"])
    .index("by_user_profile", ["user_id", "is_profile_photo"]),

  surge_albums: defineTable({
    user_id:          v.string(),
    name:             v.string(),
    description:      v.optional(v.string()),
    cover_storage_id: v.optional(v.id("_storage")),
    photo_count:      v.number(),
    video_count:      v.number(),
    is_private:       v.boolean(),
    created_at:       v.string(),
  }).index("by_user", ["user_id", "created_at"]),

  surge_referral_codes: defineTable({
    user_id:                v.string(),
    code:                   v.string(),
    total_referrals:        v.number(),
    signed_up:              v.number(),
    stayed_30_days:         v.number(),
    total_free_days_earned: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_code", ["code"]),

  // ── NEW: Notifications ─────────────────────────────────────
  // Types: "message" | "profile_view" | "nearby" | "event" | "strike" | "ban"
  surge_notifications: defineTable({
    user_id:      v.string(),               // recipient surge_users._id string
    type:         v.string(),
    title:        v.string(),
    body:         v.string(),
    from_user_id: v.optional(v.string()),
    entity_id:    v.optional(v.string()),   // related message / event / spot id
    is_read:      v.boolean(),
    created_at:   v.string(),
  })
    .index("by_user",      ["user_id", "created_at"])
    .index("by_user_read", ["user_id", "is_read"]),

  // ── NEW: Strikes & Bans ────────────────────────────────────
  surge_strikes: defineTable({
    user_id:    v.string(),                 // target surge_users auth_id
    issued_by:  v.string(),                 // admin surge_users._id string
    reason:     v.string(),
    report_id:  v.optional(v.id("surge_reports")),
    is_ban:     v.boolean(),
    expires_at: v.optional(v.string()),     // undefined = permanent
    created_at: v.string(),
  }).index("by_user", ["user_id", "created_at"]),
});

export default schema;
