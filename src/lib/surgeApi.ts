// Supabase-backed replacement for the old convex/_generated/api surface.
// Function names/shapes deliberately mirror the old Convex functions so
// consuming hooks/components need minimal changes beyond the import path.
import { supabase } from './supabaseClient';
import { rightNowExpiry } from './rightNow';

// ── helpers ──────────────────────────────────────────────────────────
function nowIso() {
  return new Date().toISOString();
}

function coarseCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

export function haversineFeet(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radiusFeet = 20_902_231;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(radiusFeet * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function assertCoordinates(lat: number, lng: number) {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error('Invalid latitude');
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new Error('Invalid longitude');
}

async function requireAuthUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Unauthenticated');
  return data.user.id;
}

async function requireMyProfile(): Promise<any> {
  const authId = await requireAuthUserId();
  const { data, error } = await supabase
    .from('surge_users')
    .select('*')
    .eq('auth_id', authId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Profile required');
  return data;
}

// Strips fields that must never leave the server for a profile that isn't
// the caller's own — mirrors convex/security.ts toPublicProfile().
// Referral codes, referrer links, emails and reward counters are private to
// the viewer's own row and must NEVER appear in public selects.
const PUBLIC_USER_COLUMNS =
  'id, username, display_name, age, bio, gender, orientation, lifestyle, position, height, weight, body_type, ethnicity, health_status, looking_for, kinks, tags, fantasies, photo_url, photo_urls, lat, lng, last_seen, is_online, is_anonymous, is_verified, is_premium, premium_until, free_trial_until, right_now_until, boost_expires_at, badges, is_demo, profile_views, show_distance, show_on_map, created_at';

function toPublicProfile(user: any, distanceFeet?: number) {
  const pub: any = { ...user };
  delete pub.auth_id;
  delete pub.auth_email;
  delete pub.safe_contact_name;
  delete pub.safe_contact_info;
  delete pub.blocked_users;
  delete pub.favorite_users;
  delete pub.role;
  pub.lat = coarseCoordinate(user.lat ?? 0);
  pub.lng = coarseCoordinate(user.lng ?? 0);
  if (user.show_distance && distanceFeet !== undefined) pub.distance = distanceFeet;
  return pub;
}

// ── users ────────────────────────────────────────────────────────────
export const users = {
  async viewer() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    const { data: profile, error: profileError } = await supabase
      .from('surge_users')
      .select('*')
      .eq('auth_id', data.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return null;
    return { ...profile, id: profile.id };
  },

  async getById(args: { id: string }) {
    await requireMyProfile();
    const { data, error } = await supabase
      .from('surge_users')
      .select(PUBLIC_USER_COLUMNS)
      .eq('id', args.id)
      .maybeSingle();
    if (error) throw error;
    return data ? toPublicProfile(data) : null;
  },

  async getNearby(args: {
    radius?: number;
    onlineOnly?: boolean;
    minAge?: number;
    maxAge?: number;
  }) {
    const me = await requireMyProfile();
    assertCoordinates(me.lat, me.lng);
    const radius = Math.min(Math.max(args.radius ?? 0.15, 0.005), 1);

    let query = supabase
      .from('surge_users')
      .select(PUBLIC_USER_COLUMNS)
      .eq('show_on_map', true)
      .gt('lat', me.lat - radius)
      .lt('lat', me.lat + radius)
      .gt('lng', me.lng - radius)
      .lt('lng', me.lng + radius)
      .neq('id', me.id)
      .limit(200);

    if (args.onlineOnly) query = query.eq('is_online', true);
    if (args.minAge !== undefined) query = query.gte('age', args.minAge);
    if (args.maxAge !== undefined) query = query.lte('age', args.maxAge);

    const { data, error } = await query;
    if (error) throw error;
    const blocked: string[] = me.blocked_users || [];
    return (data || [])
      .filter((u: any) => !blocked.includes(u.id))
      .map((u: any) => toPublicProfile(u, haversineFeet(me.lat, me.lng, u.lat, u.lng)));
  },

  async checkUsername(args: { username: string }) {
    const username = String(args.username || '').trim().toLowerCase();
    if (!/^[a-z0-9_]{3,32}$/.test(username)) {
      return { available: false, reason: 'invalid' };
    }
    const { data } = await supabase
      .from('surge_users')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    return { available: !data };
  },

  async create(args: Record<string, any>) {
    const authId = await requireAuthUserId();
    const { data: existing } = await supabase
      .from('surge_users')
      .select('id')
      .eq('auth_id', authId)
      .maybeSingle();
    if (existing) throw new Error('Profile already exists');

    const username = String(args.username || '').trim().toLowerCase();
    if (!/^[a-z0-9_]{3,32}$/.test(username)) throw new Error('Invalid username');
    if (args.age < 18 || args.age > 99) throw new Error('Invalid age');

    const { data: taken } = await supabase
      .from('surge_users')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (taken) throw new Error('Username already in use');

    const { data: authUser } = await supabase.auth.getUser();

    // Location is opt-in: 0,0 + show_on_map=false means "skip, set later".
    let lat = 0;
    let lng = 0;
    if (Number.isFinite(args.lat) && Number.isFinite(args.lng)) {
      assertCoordinates(args.lat, args.lng);
      lat = args.lat;
      lng = args.lng;
    }
    const showOnMap = args.show_on_map === true && (lat !== 0 || lng !== 0);

    // A friend's referral code is consumed server-side after the profile
    // exists; it must never be written to the users row itself.
    const referralCode = String(args.referral_code || '').trim().toLowerCase();
    const { auth_id: _a, auth_email: _b, lat: _lat, lng: _lng, show_on_map: _som, referral_code: _rc, ...profileFields } = args;
    const insertRow = {
      ...profileFields,
      username,
      auth_id: authId,
      auth_email: authUser?.user?.email ?? null,
      email_confirmed_at: authUser?.user?.email_confirmed_at ?? null,
      lat,
      lng,
      last_seen: nowIso(),
      is_online: true,
      is_anonymous: false,
      is_verified: false,
      role: 'user',
      is_premium: false,
      blocked_users: [],
      favorite_users: [],
      profile_views: 0,
      show_distance: true,
      show_on_map: showOnMap,
    };

    const { data, error } = await supabase.from('surge_users').insert(insertRow).select('*').single();
    if (error) throw error;

    // Apply the friend's referral code — best-effort, never blocks signup.
    let referralGranted = false;
    if (referralCode) {
      try {
        const { data: referralResult, error: referralError } = await supabase.rpc(
          'surge_handle_referral_signup',
          { p_code: referralCode }
        );
        if (!referralError && referralResult?.ok) referralGranted = true;
      } catch {
        // Non-fatal: the profile is live either way.
      }
    }

    return { ...data, id: data.id, referral_granted: referralGranted };
  },

  async update(args: { id: string } & Record<string, any>) {
    if (args.age !== undefined && (args.age < 18 || args.age > 99)) throw new Error('Invalid age');
    const { id, ...patch } = args;
    Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);
    if (Object.keys(patch).length === 0) {
      const { data } = await supabase.from('surge_users').select('*').eq('id', id).single();
      return { ...data, id: data.id };
    }
    const { data, error } = await supabase
      .from('surge_users')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return { ...data, id: data.id };
  },

  async updateLocation(args: { id: string; lat: number; lng: number }) {
    assertCoordinates(args.lat, args.lng);
    const { error } = await supabase
      .from('surge_users')
      .update({ lat: args.lat, lng: args.lng, is_online: true, last_seen: nowIso() })
      .eq('id', args.id);
    if (error) throw error;
  },

  async setRightNow(args: { id: string; active: boolean }) {
    const me = await requireMyProfile();
    if (me.id !== args.id) throw new Error('Not authorized');
    const patch = args.active
      ? { right_now_until: rightNowExpiry() }
      : { right_now_until: null };
    const { error } = await supabase
      .from('surge_users')
      .update(patch)
      .eq('id', args.id);
    if (error) throw error;
  },

  async incrementViews(args: { id: string }) {
    const viewer = await requireMyProfile();
    if (viewer.id === args.id) return;
    const { data: target, error: fetchErr } = await supabase
      .from('surge_users')
      .select('id, profile_views, display_name, username')
      .eq('id', args.id)
      .maybeSingle();
    if (fetchErr || !target) return;
    await supabase
      .from('surge_users')
      .update({ profile_views: (target.profile_views ?? 0) + 1 })
      .eq('id', args.id);
    await supabase.from('surge_notifications').insert({
      user_id: target.id,
      type: 'profile_view',
      title: 'Someone checked you out',
      body: `${viewer.display_name || viewer.username} viewed your profile`,
      from_user_id: viewer.id,
      is_read: false,
      created_at: nowIso(),
    });
    // Feed the "Who viewed you" surface (premium gating lands in Phase 4).
    try {
      await supabase.from('surge_profile_views').insert({
        viewer_id: viewer.id,
        viewed_id: args.id,
      });
    } catch {
      // Best-effort history recording.
    }
  },
};

// ── messages ─────────────────────────────────────────────────────────
function expectedConversationId(a: string, b: string) {
  return [a, b].sort().join('_');
}

export const messages = {
  async getByConversation(args: { conversation_id: string; limit?: number }) {
    const { data, error } = await supabase
      .from('surge_messages')
      .select('*')
      .eq('conversation_id', args.conversation_id)
      .order('created_date', { ascending: true })
      .limit(Math.min(args.limit ?? 200, 200));
    if (error) throw error;
    return (data || []).map((m: any) => ({ ...m, id: m.id }));
  },

  async send(args: {
    conversation_id: string;
    receiver_id: string;
    text: string;
    media_url?: string;
    media_type?: string;
    reply_to_id?: string;
  }) {
    const me = await requireMyProfile();
    if (!args.receiver_id || args.receiver_id === me.id) throw new Error('Invalid receiver');
    if (args.conversation_id !== expectedConversationId(me.id, args.receiver_id)) {
      throw new Error('Invalid conversation');
    }
    const text = (args.text || '').trim();
    if (!text && !args.media_url) throw new Error('Message is empty');
    if (text.length > 5000) throw new Error('Message is too long');

    const { data, error } = await supabase
      .from('surge_messages')
      .insert({
        conversation_id: args.conversation_id,
        sender_id: me.id,
        receiver_id: args.receiver_id,
        text,
        media_url: args.media_url,
        media_type: args.media_type,
        status: 'sent',
        is_deleted: false,
        reply_to_id: args.reply_to_id,
        created_date: nowIso(),
      })
      .select('*')
      .single();
    if (error) throw error;

    if (!args.receiver_id.startsWith('bot_')) {
      await supabase.from('surge_notifications').insert({
        user_id: args.receiver_id,
        type: 'message',
        title: `Message from ${me.display_name || me.username}`,
        body: args.media_url ? (args.media_type === 'video' ? 'Sent a video' : 'Sent a photo') : text.slice(0, 60),
        from_user_id: me.id,
        entity_id: args.conversation_id,
        is_read: false,
        created_at: nowIso(),
      });
    }
    return { ...data, id: data.id };
  },

  async markRead(args: { id: string }) {
    const { error } = await supabase.from('surge_messages').update({ status: 'read' }).eq('id', args.id);
    if (error) throw error;
  },

  async getUnreadCount() {
    const me = await requireMyProfile();
    const { count, error } = await supabase
      .from('surge_messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', me.id)
      .eq('status', 'sent');
    if (error) throw error;
    return count ?? 0;
  },

  async getConversations() {
    const me = await requireMyProfile();
    const { data, error } = await supabase
      .from('surge_messages')
      .select('*')
      .or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`)
      .order('created_date', { ascending: false });
    if (error) throw error;

    const conversationMap = new Map<string, { lastMessage: any; otherUserId: string; unread: number }>();
    for (const message of data || []) {
      const otherId = message.sender_id === me.id ? message.receiver_id : message.sender_id;
      const existing = conversationMap.get(message.conversation_id);
      const unreadIncrement = message.receiver_id === me.id && message.status !== 'read' ? 1 : 0;
      if (!existing) {
        conversationMap.set(message.conversation_id, { lastMessage: message, otherUserId: otherId, unread: unreadIncrement });
        continue;
      }
      existing.unread += unreadIncrement;
      if (message.created_date > existing.lastMessage.created_date) existing.lastMessage = message;
    }
    return Array.from(conversationMap.entries()).map(([conversationId, d]) => ({
      id: conversationId,
      other_user_id: d.otherUserId,
      last_message: { ...d.lastMessage, id: d.lastMessage.id },
      unread_count: d.unread,
    }));
  },
};

// ── notifications ────────────────────────────────────────────────────
export const notifications = {
  async list(args: { limit?: number } = {}) {
    const me = await requireMyProfile();
    const { data, error } = await supabase
      .from('surge_notifications')
      .select('*')
      .eq('user_id', me.id)
      .order('created_at', { ascending: false })
      .limit(Math.min(args.limit ?? 50, 100));
    if (error) throw error;
    return (data || []).map((n: any) => ({ ...n, id: n.id }));
  },

  async unreadCount() {
    const me = await requireMyProfile();
    const { count, error } = await supabase
      .from('surge_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', me.id)
      .eq('is_read', false);
    if (error) throw error;
    return count ?? 0;
  },

  async markRead(args: { id: string }) {
    const { error } = await supabase.from('surge_notifications').update({ is_read: true }).eq('id', args.id);
    if (error) throw error;
  },

  async markAllRead() {
    const me = await requireMyProfile();
    const { error } = await supabase
      .from('surge_notifications')
      .update({ is_read: true })
      .eq('user_id', me.id)
      .eq('is_read', false);
    if (error) throw error;
  },
};

// ── spots ────────────────────────────────────────────────────────────
export const spots = {
  async listApproved() {
    const { data, error } = await supabase.from('surge_spots').select('*').eq('is_approved', true);
    if (error) throw error;
    return (data || []).map((s: any) => ({ ...s, id: s.id }));
  },

  async create(args: { name: string; description?: string; category: string; address: string; lat: number; lng: number }) {
    const me = await requireMyProfile();
    assertCoordinates(args.lat, args.lng);
    const name = args.name.trim();
    const address = args.address.trim();
    if (!name || name.length > 150) throw new Error('Invalid spot name');
    if (!address || address.length > 500) throw new Error('Invalid spot address');
    const { error } = await supabase.from('surge_spots').insert({
      name,
      description: args.description?.trim() || null,
      category: args.category,
      address,
      lat: args.lat,
      lng: args.lng,
      submitted_by: me.id,
      active_users: 0,
      is_approved: false,
    });
    if (error) throw error;
  },

  async getEvents(args: { spot_id: string }) {
    const { data, error } = await supabase.from('surge_spot_events').select('*').eq('spot_id', args.spot_id);
    if (error) throw error;
    return (data || []).map((e: any) => ({ ...e, id: e.id }));
  },

  async rsvp(args: { event_id: string }) {
    const me = await requireMyProfile();
    const { data: existing } = await supabase
      .from('surge_spot_rsvps')
      .select('id')
      .eq('user_id', me.id)
      .eq('event_id', args.event_id)
      .maybeSingle();

    const { data: event, error: eventErr } = await supabase
      .from('surge_spot_events')
      .select('*')
      .eq('id', args.event_id)
      .single();
    if (eventErr || !event) throw new Error('Event not found');

    if (existing) {
      await supabase.from('surge_spot_rsvps').delete().eq('id', existing.id);
      await supabase
        .from('surge_spot_events')
        .update({ attendee_count: Math.max(0, event.attendee_count - 1) })
        .eq('id', args.event_id);
      return { action: 'removed' };
    }
    if (event.max_attendees && event.attendee_count >= event.max_attendees) throw new Error('Event is full');
    await supabase.from('surge_spot_rsvps').insert({ event_id: args.event_id, user_id: me.id });
    await supabase
      .from('surge_spot_events')
      .update({ attendee_count: event.attendee_count + 1 })
      .eq('id', args.event_id);
    return { action: 'added' };
  },

  async getSpotMessages(args: { spot_id: string }) {
    const { data, error } = await supabase.from('surge_spot_messages').select('*').eq('spot_id', args.spot_id);
    if (error) throw error;
    return (data || []).map((m: any) => ({ ...m, id: m.id }));
  },

  async sendSpotMessage(args: { spot_id: string; text: string }) {
    const me = await requireMyProfile();
    const text = args.text.trim();
    if (!text || text.length > 2000) throw new Error('Invalid message');
    const { data: spot } = await supabase.from('surge_spots').select('is_approved').eq('id', args.spot_id).single();
    if (!spot || !spot.is_approved) throw new Error('Spot is not available');
    const { error } = await supabase.from('surge_spot_messages').insert({ spot_id: args.spot_id, user_id: me.id, text });
    if (error) throw error;
  },
};

// ── ratings ──────────────────────────────────────────────────────────
export const ratings = {
  async upsert(args: {
    rated_user_id: string;
    meetup_happened: boolean;
    reliability_score: number;
    vibe_score?: number;
    tags: string[];
    comment?: string;
  }) {
    const me = await requireMyProfile();
    if (!args.rated_user_id || args.rated_user_id === me.id) throw new Error('Invalid rated user');
    if (args.reliability_score < 1 || args.reliability_score > 5) throw new Error('Reliability score must be 1-5');
    if (args.vibe_score !== undefined && (args.vibe_score < 1 || args.vibe_score > 5)) throw new Error('Vibe score must be 1-5');
    if (args.comment && args.comment.length > 2000) throw new Error('Comment is too long');

    const payload = {
      rater_id: me.id,
      rated_user_id: args.rated_user_id,
      meetup_happened: args.meetup_happened,
      reliability_score: args.reliability_score,
      vibe_score: args.vibe_score ?? null,
      tags: args.tags.slice(0, 20),
      comment: args.comment?.trim() || null,
    };
    const { data: existing } = await supabase
      .from('surge_ratings')
      .select('id')
      .eq('rated_user_id', args.rated_user_id)
      .eq('rater_id', me.id)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase.from('surge_ratings').update(payload).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('surge_ratings').insert(payload);
      if (error) throw error;
    }
  },

  async getStats(args: { user_id: string }) {
    const { data: ratingsData, error } = await supabase
      .from('surge_ratings')
      .select('*')
      .eq('rated_user_id', args.user_id);
    if (error) throw error;
    const list = ratingsData || [];
    if (list.length === 0) return { reliability_avg: 0, total_ratings: 0, showed_up_pct: 0 };

    const reliabilitySum = list.reduce((s: number, r: any) => s + r.reliability_score, 0);
    const vibeRatings = list.filter((r: any) => r.vibe_score != null);
    const vibeSum = vibeRatings.reduce((s: number, r: any) => s + (r.vibe_score ?? 0), 0);
    const showedUp = list.filter((r: any) => (r.tags || []).includes('showed_up')).length;
    const average = reliabilitySum / list.length;
    let badge: string | undefined;
    if (average >= 4.5) badge = 'Solid';
    else if (average >= 3.5) badge = 'Reliable';
    else if (average >= 2) badge = 'Flaky';
    else badge = 'Ghost';

    return {
      reliability_avg: Math.round(average * 10) / 10,
      vibe_avg: vibeRatings.length ? Math.round((vibeSum / vibeRatings.length) * 10) / 10 : undefined,
      total_ratings: list.length,
      showed_up_pct: Math.round((showedUp / list.length) * 100),
      badge,
    };
  },
};

// ── reports ──────────────────────────────────────────────────────────
export const reports = {
  async create(args: { reported_id: string; reason: string; details?: string }) {
    const me = await requireMyProfile();
    if (!args.reported_id || args.reported_id === me.id) throw new Error('Invalid reported user');
    const reason = args.reason.trim();
    if (!reason || reason.length > 500) throw new Error('Invalid reason');
    if (args.details && args.details.length > 5000) throw new Error('Report details are too long');
    const { error } = await supabase.from('surge_reports').insert({
      reporter_id: me.id,
      reported_id: args.reported_id,
      reason,
      details: args.details?.trim() || null,
      status: 'pending',
    });
    if (error) throw error;
  },
};

// ── media (Supabase Storage bucket: 'surge-media') ──────────────────
const MEDIA_BUCKET = 'surge-media';

export const media = {
  async uploadFile(file: File, userId: string): Promise<{ path: string; url: string }> {
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return { path, url: data.publicUrl };
  },

  async saveMedia(args: {
    storage_id: string;
    url: string;
    type: string;
    filename?: string;
    size?: number;
    is_profile_photo: boolean;
    album_id?: string;
    sort_order?: number;
  }) {
    const me = await requireMyProfile();
    if (args.type !== 'image' && args.type !== 'video') throw new Error('Unsupported media type');

    if (args.album_id) {
      const { data: album } = await supabase.from('surge_albums').select('user_id').eq('id', args.album_id).single();
      if (!album || album.user_id !== me.id) throw new Error('Not authorized');
    }

    if (args.is_profile_photo) {
      await supabase
        .from('surge_media')
        .update({ is_profile_photo: false })
        .eq('user_id', me.id)
        .eq('is_profile_photo', true);
    }

    let sortOrder = args.sort_order;
    if (sortOrder === undefined && args.album_id) {
      const { count } = await supabase
        .from('surge_media')
        .select('id', { count: 'exact', head: true })
        .eq('album_id', args.album_id);
      sortOrder = count ?? 0;
    }

    const { data: mediaRow, error } = await supabase
      .from('surge_media')
      .insert({
        user_id: me.id,
        storage_id: args.storage_id,
        url: args.url,
        type: args.type,
        filename: args.filename,
        size: args.size,
        is_profile_photo: args.is_profile_photo,
        album_id: args.album_id || null,
        sort_order: sortOrder ?? 0,
        created_at: nowIso(),
      })
      .select('*')
      .single();
    if (error) throw error;

    if (args.is_profile_photo) {
      await supabase.from('surge_users').update({ photo_url: args.url }).eq('id', me.id);
    }
    if (args.album_id) {
      const { data: album } = await supabase.from('surge_albums').select('*').eq('id', args.album_id).single();
      if (album) {
        const patch =
          args.type === 'image' ? { photo_count: album.photo_count + 1 } : { video_count: album.video_count + 1 };
        await supabase.from('surge_albums').update(patch).eq('id', args.album_id);
      }
    }
    return { mediaId: mediaRow.id, url: args.url };
  },

  async getByAlbum(args: { album_id: string }) {
    const { data, error } = await supabase.from('surge_media').select('*').eq('album_id', args.album_id).order('sort_order');
    if (error) throw error;
    return data || [];
  },

  async getAlbums(args: { user_id: string }) {
    const { data, error } = await supabase
      .from('surge_albums')
      .select('*')
      .eq('user_id', args.user_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((a: any) => ({ ...a, coverUrl: null }));
  },

  async createAlbum(args: { name: string; description?: string; is_private: boolean }) {
    const me = await requireMyProfile();
    const name = args.name.trim();
    if (!name || name.length > 100) throw new Error('Invalid album name');
    const { data, error } = await supabase
      .from('surge_albums')
      .insert({
        user_id: me.id,
        name,
        description: args.description?.trim() || null,
        photo_count: 0,
        video_count: 0,
        is_private: args.is_private,
        created_at: nowIso(),
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  },

  async deleteAlbum(args: { album_id: string }) {
    const { data: mediaRows } = await supabase.from('surge_media').select('storage_id').eq('album_id', args.album_id);
    for (const m of mediaRows || []) {
      if (m.storage_id) await supabase.storage.from(MEDIA_BUCKET).remove([m.storage_id]);
    }
    await supabase.from('surge_media').delete().eq('album_id', args.album_id);
    const { error } = await supabase.from('surge_albums').delete().eq('id', args.album_id);
    if (error) throw error;
  },

  async deleteMedia(args: { media_id: string }) {
    const { data: mediaRow } = await supabase.from('surge_media').select('*').eq('id', args.media_id).single();
    if (!mediaRow) throw new Error('Media not found');
    if (mediaRow.storage_id) await supabase.storage.from(MEDIA_BUCKET).remove([mediaRow.storage_id]);
    if (mediaRow.album_id) {
      const { data: album } = await supabase.from('surge_albums').select('*').eq('id', mediaRow.album_id).single();
      if (album) {
        const patch =
          mediaRow.type === 'image'
            ? { photo_count: Math.max(0, album.photo_count - 1) }
            : { video_count: Math.max(0, album.video_count - 1) };
        await supabase.from('surge_albums').update(patch).eq('id', mediaRow.album_id);
      }
    }
    const { error } = await supabase.from('surge_media').delete().eq('id', args.media_id);
    if (error) throw error;
  },

  async sendMediaMessage(args: { conversation_id: string; receiver_id: string; url: string; media_type: string }) {
    const me = await requireMyProfile();
    if (args.receiver_id === me.id) throw new Error('Invalid receiver');
    if (args.conversation_id !== [me.id, args.receiver_id].sort().join('_')) throw new Error('Invalid conversation');
    const { data, error } = await supabase
      .from('surge_messages')
      .insert({
        conversation_id: args.conversation_id,
        sender_id: me.id,
        receiver_id: args.receiver_id,
        text: args.media_type === 'video' ? 'Video' : 'Photo',
        media_url: args.url,
        media_type: args.media_type,
        status: 'sent',
        is_deleted: false,
        created_date: nowIso(),
      })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
};

// ── moderation (admin/moderator only — RLS-enforced) ────────────────
export const moderation = {
  async listReports(args: { status?: string } = {}) {
    let query = supabase.from('surge_reports').select('*').order('created_at', { ascending: false });
    if (args.status) query = query.eq('status', args.status);
    const { data, error } = await query;
    if (error) throw error;
    const rows = data || [];
    const ids = Array.from(new Set(rows.flatMap((r: any) => [r.reporter_id, r.reported_id])));
    let profileById = new Map<string, any>();
    if (ids.length) {
      const { data: profiles } = await supabase
        .from('surge_users')
        .select('id, display_name, username, photo_url')
        .in('id', ids);
      profileById = new Map((profiles || []).map((p: any) => [p.id, p]));
    }
    return rows.map((r: any) => {
      const reporter = profileById.get(r.reporter_id);
      const reported = profileById.get(r.reported_id);
      return {
        ...r,
        id: r.id,
        reporter_name: reporter?.display_name ?? 'Unknown',
        reporter_username: reporter?.username ?? '?',
        reported_name: reported?.display_name ?? 'Unknown',
        reported_username: reported?.username ?? '?',
        reported_photo: reported?.photo_url ?? '',
      };
    });
  },
  async resolveReport(args: { report_id: string; status: 'resolved' | 'dismissed' }) {
    const { error } = await supabase.from('surge_reports').update({ status: args.status }).eq('id', args.report_id);
    if (error) throw error;
  },
  async issueStrike(args: { user_id: string; reason: string; report_id?: string; is_ban: boolean; expires_at?: string }) {
    const me = await requireMyProfile();
    const reason = args.reason.trim();
    if (!reason || reason.length > 1000) throw new Error('Invalid reason');
    const { error } = await supabase.from('surge_strikes').insert({
      user_id: args.user_id,
      issued_by: me.id,
      reason,
      report_id: args.report_id,
      is_ban: args.is_ban,
      expires_at: args.expires_at,
      created_at: nowIso(),
    });
    if (error) throw error;
    if (args.is_ban) {
      await supabase.from('surge_users').update({ show_on_map: false, is_online: false }).eq('id', args.user_id);
    }
    await supabase.from('surge_notifications').insert({
      user_id: args.user_id,
      type: args.is_ban ? 'ban' : 'strike',
      title: args.is_ban ? 'Account suspended' : 'Account warning',
      body: args.is_ban ? `Your account has been suspended: ${reason}` : `You received a warning: ${reason}`,
      is_read: false,
      created_at: nowIso(),
    });
  },
  async listPendingSpots() {
    const { data, error } = await supabase.from('surge_spots').select('*').eq('is_approved', false);
    if (error) throw error;
    return (data || []).map((s: any) => ({ ...s, id: s.id }));
  },
  async reviewSpot(args: { spot_id: string; approved: boolean }) {
    if (args.approved) {
      const { error } = await supabase.from('surge_spots').update({ is_approved: true }).eq('id', args.spot_id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('surge_spots').delete().eq('id', args.spot_id);
      if (error) throw error;
    }
  },
  async getStats() {
    const [{ data: usersData }, { data: reportsData }, { data: spotsData }, { data: strikesData }] = await Promise.all([
      supabase.from('surge_users').select('id, is_online'),
      supabase.from('surge_reports').select('id, status'),
      supabase.from('surge_spots').select('id, is_approved'),
      supabase.from('surge_strikes').select('id, is_ban'),
    ]);
    return {
      total_users: usersData?.length ?? 0,
      online_users: usersData?.filter((u: any) => u.is_online).length ?? 0,
      pending_reports: reportsData?.filter((r: any) => r.status === 'pending').length ?? 0,
      pending_spots: spotsData?.filter((s: any) => !s.is_approved).length ?? 0,
      active_bans: strikesData?.filter((s: any) => s.is_ban).length ?? 0,
      total_strikes: strikesData?.length ?? 0,
    };
  },
};

// ── account ──────────────────────────────────────────────────────────
export const account = {
  async deleteAccount() {
    const me = await requireMyProfile();
    await supabase.from('surge_media').delete().eq('user_id', me.id);
    await supabase.from('surge_albums').delete().eq('user_id', me.id);
    await supabase.from('surge_messages').delete().or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`);
    await supabase.from('surge_notifications').delete().eq('user_id', me.id);
    await supabase.from('surge_ratings').delete().eq('rater_id', me.id);
    await supabase.from('surge_spot_rsvps').delete().eq('user_id', me.id);
    await supabase.from('surge_users').delete().eq('id', me.id);
    // Note: this cannot delete the underlying Supabase Auth identity itself —
    // that requires the service_role key (server-side only). The app-level
    // profile and all owned data are fully removed; sign the user out so the
    // now-profile-less auth session doesn't linger client-side.
    await supabase.auth.signOut();
  },
};

// ── referrals ────────────────────────────────────────────────────────
const APP_ORIGIN = window.location.origin;

function functionsBaseUrl(): string {
  const viteUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string | undefined;
  if (viteUrl) return viteUrl.replace(/\/$/, '');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return `${supabaseUrl ?? ''}/functions/v1`.replace(/\/$/, '');
}

async function rpcJson<T = any>(fn: string, params: Record<string, any> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) throw error;
  return data as T;
}

export const referrals = {
  /** The user's own referral code — lazily generated server-side if absent. */
  async myCode(): Promise<string> {
    const me = await requireMyProfile();
    if (me.referral_code) return me.referral_code as string;
    return String(await rpcJson('surge_ensure_referral_code'));
  },

  /** Full hub payload: codes, counters, milestones, recent rewards. */
  async stats(): Promise<any> {
    return rpcJson<any>('surge_referral_stats', {});
  },

  /** Redeem a friend's code — server-credited (+7 days both sides). */
  async applyRefCode(code: string): Promise<{ ok: boolean; days?: number; reason?: string }> {
    return rpcJson<{ ok: boolean; days?: number; reason?: string }>(
      'surge_handle_referral_signup',
      { p_code: code }
    );
  },

  /**
   * Record a share-channel invite (copy / SMS / WhatsApp / mailto / email).
   * Server enforces the 10/day cap and grants +1 day per invite.
   */
  async recordInviteSent(channel: 'share' | 'sms' | 'whatsapp' | 'mailto' | 'email'): Promise<{ ok: boolean; days?: number; reason?: string }> {
    return rpcJson<{ ok: boolean; days?: number; reason?: string }>(
      'surge_record_invite',
      { p_channel: channel }
    );
  },

  /** Send a branded email invite via the `send-invite` edge function. */
  async sendEmailInvite(args: { email: string; message?: string }): Promise<{ ok: boolean; days?: number; ref_url?: string }> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('Not signed in');
    const response = await fetch(`${functionsBaseUrl()}/send-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({ recipient_email: args.email, message: args.message }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Invite send failed');
    return body;
  },

  /** Latest "who viewed you" entries — premium gating lands in Phase 4. */
  async getMyViewers(limit = 30): Promise<{ viewed_at: string; viewer_id: string }[]> {
    return rpcJson<{ viewed_at: string; viewer_id: string }[]>('surge_get_views', { p_limit: limit });
  },

  /** Share text + link with a ref code. */
  buildShare({ code, message }: { code: string; message?: string }): { text: string; url: string } {
    const url = `${APP_ORIGIN}/?ref=${encodeURIComponent(code)}`;
    const text = message ||
      'Join me on SURGE — real people, real close. Use my code for 7 free Premium days ⚡';
    return { text, url };
  },

  /** Per-channel deep links. */
  buildChannelLinks({ code, text }: { code: string; text: string }): {
    share: string;
    sms: string;
    whatsapp: string;
    mailto: string;
  } {
    const { url } = referrals.buildShare({ code });
    const encodedText = encodeURIComponent(`${text}\n${url}`);
    return {
      share: url,
      sms: `sms:?&body=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}`,
      mailto: `mailto:?subject=${encodeURIComponent(`You're invited to SURGE ⚡`)}&body=${encodedText}`,
    };
  },
};

// ── premium ─────────────────────────────────────────────────────────
export const premium = {
  /** Current premium state — self row only. */
  async status(): Promise<{ active: boolean; until?: string }> {
    const me = await requireMyProfile();
    const until = me.premium_until as string | null;
    return { active: !!me.is_premium, until: until || undefined };
  },

  /**
   * Server-guarded grant for a reward type. The DB only honors types with
   * one-shot semantics (verified_email, profile_complete, streak) and the
   * ledger keeps grants idempotent — safe to call repeatedly.
   */
  async grant(args: { days: number; type: 'verified_email' | 'profile_complete' | 'streak'; reason?: string }): Promise<{ ok: boolean; days: number }> {
    return rpcJson<{ ok: boolean; days: number }>('surge_grant_premium', {
      p_days: args.days,
      p_type: args.type,
      p_reason: args.reason ?? null,
    });
  },

  /** Daily activity ping — powers streaks (extended in Phase 4). */
  async touchActivity(): Promise<{ ok: boolean; streak?: number }> {
    return rpcJson<{ ok: boolean; streak?: number }>('surge_record_streak');
  },
};
