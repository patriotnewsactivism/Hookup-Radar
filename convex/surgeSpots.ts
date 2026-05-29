import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listApproved = query({
  handler: async (ctx) => {
    const spots = await ctx.db
      .query("surge_spots")
      .withIndex("by_approved", (q) => q.eq("is_approved", true))
      .collect();
    return spots.map((s) => ({ ...s, id: s._id }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    address: v.string(),
    lat: v.number(),
    lng: v.number(),
    submitted_by: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("surge_spots", {
      ...args,
      active_users: 0,
      is_approved: false,
    });
  },
});

export const getEvents = query({
  args: { spot_id: v.id("surge_spots") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("surge_spot_events")
      .withIndex("by_spot", (q) => q.eq("spot_id", args.spot_id))
      .collect();
    return events.map((e) => ({ ...e, id: e._id }));
  },
});

export const createEvent = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("surge_spot_events", {
      ...args,
      attendee_count: 0,
    });
  },
});

export const rsvp = mutation({
  args: {
    event_id: v.id("surge_spot_events"),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("surge_spot_rsvps")
      .withIndex("by_user_event", (q) =>
        q.eq("user_id", args.user_id).eq("event_id", args.event_id)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      const event = await ctx.db.get(args.event_id);
      if (event) {
        await ctx.db.patch(args.event_id, {
          attendee_count: Math.max(0, event.attendee_count - 1),
        });
      }
      return { action: "removed" };
    }
    await ctx.db.insert("surge_spot_rsvps", args);
    const event = await ctx.db.get(args.event_id);
    if (event) {
      await ctx.db.patch(args.event_id, {
        attendee_count: event.attendee_count + 1,
      });
    }
    return { action: "added" };
  },
});

export const getSpotMessages = query({
  args: { spot_id: v.id("surge_spots") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("surge_spot_messages")
      .withIndex("by_spot", (q) => q.eq("spot_id", args.spot_id))
      .collect();
    return messages.map((m) => ({ ...m, id: m._id }));
  },
});

export const sendSpotMessage = mutation({
  args: {
    spot_id: v.id("surge_spots"),
    user_id: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("surge_spot_messages", args);
  },
});

export const seed = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("surge_spots").first();
    if (existing) return "Already seeded";
    const spots = [
      { name: "Piedmont Park – Oak Hill", description: "Wooded area near the east side. Active evenings.", category: "park", address: "Piedmont Park, Atlanta, GA", lat: 33.7835, lng: -84.3733, active_users: 12, is_approved: true },
      { name: "The Baths", description: "Popular men-only sauna. Lockers and private rooms.", category: "sauna", address: "1763 Cheshire Bridge Rd, Atlanta, GA", lat: 33.809, lng: -84.3448, active_users: 8, is_approved: true },
      { name: "Cheshire Bridge Books", description: "Adult store with video booths in the back.", category: "bookstore", address: "2273 Cheshire Bridge Rd, Atlanta, GA", lat: 33.8102, lng: -84.3465, active_users: 5, is_approved: true },
      { name: "Blake's Patio", description: "Iconic Midtown gay bar. Cruisy patio on weekends.", category: "bar", address: "227 10th St NE, Atlanta, GA", lat: 33.7786, lng: -84.3814, active_users: 3, is_approved: true },
      { name: "Blackburn Park Trail", description: "Wooded trail off Ashford-Dunwoody. Afternoon action.", category: "park", address: "Blackburn Park, Brookhaven, GA", lat: 33.8568, lng: -84.3436, active_users: 7, is_approved: true },
    ];
    for (const s of spots) {
      await ctx.db.insert("surge_spots", s);
    }
    return `Seeded ${spots.length} spots`;
  },
});
