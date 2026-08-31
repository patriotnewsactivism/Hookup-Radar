import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertCoordinates, profileId, requireAdmin, requireSurgeUser } from "./security";

export const listApproved = query({
  args: {},
  handler: async (ctx) => {
    await requireSurgeUser(ctx);
    const spots = await ctx.db
      .query("surge_spots")
      .withIndex("by_approved", (q) => q.eq("is_approved", true))
      .collect();
    return spots.map((spot) => ({ ...spot, id: spot._id }));
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
    // Retained for client compatibility; ignored.
    submitted_by: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    assertCoordinates(args.lat, args.lng);
    const name = args.name.trim();
    const address = args.address.trim();
    if (!name || name.length > 150) throw new Error("Invalid spot name");
    if (!address || address.length > 500) throw new Error("Invalid spot address");

    await ctx.db.insert("surge_spots", {
      name,
      description: args.description?.trim() || undefined,
      category: args.category,
      address,
      lat: args.lat,
      lng: args.lng,
      submitted_by: profileId(me),
      active_users: 0,
      is_approved: false,
    });
  },
});

export const getEvents = query({
  args: { spot_id: v.id("surge_spots") },
  handler: async (ctx, args) => {
    await requireSurgeUser(ctx);
    const events = await ctx.db
      .query("surge_spot_events")
      .withIndex("by_spot", (q) => q.eq("spot_id", args.spot_id))
      .collect();
    return events.map((event) => ({ ...event, id: event._id }));
  },
});

export const createEvent = mutation({
  args: {
    spot_id: v.id("surge_spots"),
    // Retained for client compatibility; ignored.
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
    const me = await requireSurgeUser(ctx);
    const spot = await ctx.db.get(args.spot_id);
    if (!spot || !spot.is_approved) throw new Error("Spot is not available");
    if (!args.title.trim() || args.title.length > 200) throw new Error("Invalid title");
    if (new Date(args.ends_at).getTime() <= new Date(args.starts_at).getTime()) {
      throw new Error("Event end must be after start");
    }

    await ctx.db.insert("surge_spot_events", {
      spot_id: args.spot_id,
      host_id: profileId(me),
      event_type: args.event_type,
      title: args.title.trim(),
      description: args.description?.trim() || undefined,
      starts_at: args.starts_at,
      ends_at: args.ends_at,
      max_attendees: args.max_attendees,
      requirements: args.requirements,
      is_private: args.is_private,
      attendee_count: 0,
    });
  },
});

export const rsvp = mutation({
  args: {
    event_id: v.id("surge_spot_events"),
    // Retained for client compatibility; ignored.
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const userId = profileId(me);
    const event = await ctx.db.get(args.event_id);
    if (!event) throw new Error("Event not found");

    const existing = await ctx.db
      .query("surge_spot_rsvps")
      .withIndex("by_user_event", (q) =>
        q.eq("user_id", userId).eq("event_id", args.event_id),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.event_id, {
        attendee_count: Math.max(0, event.attendee_count - 1),
      });
      return { action: "removed" };
    }

    if (event.max_attendees && event.attendee_count >= event.max_attendees) {
      throw new Error("Event is full");
    }
    await ctx.db.insert("surge_spot_rsvps", {
      event_id: args.event_id,
      user_id: userId,
    });
    await ctx.db.patch(args.event_id, { attendee_count: event.attendee_count + 1 });
    return { action: "added" };
  },
});

export const getSpotMessages = query({
  args: { spot_id: v.id("surge_spots") },
  handler: async (ctx, args) => {
    await requireSurgeUser(ctx);
    const messages = await ctx.db
      .query("surge_spot_messages")
      .withIndex("by_spot", (q) => q.eq("spot_id", args.spot_id))
      .collect();
    return messages.map((message) => ({ ...message, id: message._id }));
  },
});

export const sendSpotMessage = mutation({
  args: {
    spot_id: v.id("surge_spots"),
    // Retained for client compatibility; ignored.
    user_id: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await requireSurgeUser(ctx);
    const text = args.text.trim();
    if (!text || text.length > 2000) throw new Error("Invalid message");
    const spot = await ctx.db.get(args.spot_id);
    if (!spot || !spot.is_approved) throw new Error("Spot is not available");
    await ctx.db.insert("surge_spot_messages", {
      spot_id: args.spot_id,
      user_id: profileId(me),
      text,
    });
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("surge_spots").first();
    if (existing) return "Already seeded";

    const spots = [
      { name: "Piedmont Park – Oak Hill", description: "Wooded area near the east side. Active evenings.", category: "park", address: "Piedmont Park, Atlanta, GA", lat: 33.7835, lng: -84.3733, active_users: 12, is_approved: true },
      { name: "The Baths", description: "Popular men-only sauna. Lockers and private rooms.", category: "sauna", address: "1763 Cheshire Bridge Rd, Atlanta, GA", lat: 33.809, lng: -84.3448, active_users: 8, is_approved: true },
      { name: "Cheshire Bridge Books", description: "Adult store with video booths in the back.", category: "bookstore", address: "2273 Cheshire Bridge Rd, Atlanta, GA", lat: 33.8102, lng: -84.3465, active_users: 5, is_approved: true },
      { name: "Blake's Patio", description: "Iconic Midtown gay bar. Cruisy patio on weekends.", category: "bar", address: "227 10th St NE, Atlanta, GA", lat: 33.7786, lng: -84.3814, active_users: 3, is_approved: true },
      { name: "Blackburn Park Trail", description: "Wooded trail off Ashford-Dunwoody. Afternoon action.", category: "park", address: "Blackburn Park, Brookhaven, GA", lat: 33.8568, lng: -84.3436, active_users: 7, is_approved: true },
    ];
    for (const spot of spots) await ctx.db.insert("surge_spots", spot);
    return `Seeded ${spots.length} spots`;
  },
});
