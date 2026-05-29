import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  surge_users: defineTable({
    auth_id: v.string(),
    auth_email: v.optional(v.string()),
    username: v.string(),
    display_name: v.string(),
    age: v.number(),
    bio: v.string(),
    gender: v.string(),
    orientation: v.string(),
    lifestyle: v.string(),
    position: v.string(),
    height: v.string(),
    weight: v.string(),
    body_type: v.string(),
    ethnicity: v.string(),
    health_status: v.string(),
    looking_for: v.array(v.string()),
    kinks: v.array(v.string()),
    tags: v.array(v.string()),
    fantasies: v.string(),
    photo_url: v.string(),
    photo_urls: v.array(v.string()),
    lat: v.number(),
    lng: v.number(),
    last_seen: v.string(),
    is_online: v.boolean(),
    is_anonymous: v.boolean(),
    is_verified: v.boolean(),
    is_premium: v.boolean(),
    premium_until: v.optional(v.string()),
    free_trial_until: v.optional(v.string()),
    blocked_users: v.array(v.string()),
    favorite_users: v.array(v.string()),
    profile_views: v.number(),
    show_distance: v.boolean(),
    show_on_map: v.boolean(),
    safe_contact_name: v.optional(v.string()),
    safe_contact_info: v.optional(v.string()),
  })
    .index("by_auth_id", ["auth_id"])
    .index("by_username", ["username"])
    .index("by_location", ["show_on_map", "lat", "lng"]),

  surge_messages: defineTable({
    conversation_id: v.string(),
    sender_id: v.string(),
    receiver_id: v.string(),
    text: v.string(),
    media_url: v.optional(v.string()),
    media_type: v.optional(v.string()),
    status: v.string(),
    is_deleted: v.boolean(),
    reply_to_id: v.optional(v.string()),
    created_date: v.string(),
  })
    .index("by_conversation", ["conversation_id", "created_date"])
    .index("by_receiver_status", ["receiver_id", "status"]),

  surge_reports: defineTable({
    reporter_id: v.string(),
    reported_id: v.string(),
    reason: v.string(),
    details: v.optional(v.string()),
    status: v.string(),
  }),

  surge_ratings: defineTable({
    rater_id: v.string(),
    rated_user_id: v.string(),
    meetup_happened: v.boolean(),
    reliability_score: v.number(),
    vibe_score: v.optional(v.number()),
    tags: v.array(v.string()),
    comment: v.optional(v.string()),
  })
    .index("by_rated_user", ["rated_user_id"]),

  surge_spots: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    address: v.string(),
    lat: v.number(),
    lng: v.number(),
    active_users: v.number(),
    submitted_by: v.optional(v.string()),
    is_approved: v.boolean(),
  })
    .index("by_approved", ["is_approved"]),

  surge_spot_events: defineTable({
    spot_id: v.id("surge_spots"),
    host_id: v.string(),
    event_type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    starts_at: v.string(),
    ends_at: v.string(),
    max_attendees: v.optional(v.number()),
    requirements: v.array(v.string()),
    is_private: v.boolean(),
    attendee_count: v.number(),
  })
    .index("by_spot", ["spot_id"]),

  surge_spot_rsvps: defineTable({
    event_id: v.id("surge_spot_events"),
    user_id: v.string(),
  })
    .index("by_event", ["event_id"])
    .index("by_user_event", ["user_id", "event_id"]),

  surge_spot_messages: defineTable({
    spot_id: v.id("surge_spots"),
    user_id: v.string(),
    text: v.string(),
  })
    .index("by_spot", ["spot_id"]),

  surge_referral_codes: defineTable({
    user_id: v.string(),
    code: v.string(),
    total_referrals: v.number(),
    signed_up: v.number(),
    stayed_30_days: v.number(),
    total_free_days_earned: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_code", ["code"]),
});

export default schema;
