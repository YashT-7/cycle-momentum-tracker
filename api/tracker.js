import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, org_id } = req.query;

  try {
    // 1. Get Organization Details
    if (req.method === 'GET' && action === 'getOrg') {
      const { data, error } = await supabase
        .from('organizations')
        .select('name, cycle_svg')
        .eq('id', org_id)
        .single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // 2. Get Members (PIN excluded from response for security)
    if (req.method === 'GET' && action === 'getMembers') {
      const { data, error } = await supabase
        .from('members')
        .select('id, name')
        .eq('org_id', org_id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // 3. Get Pushes
    if (req.method === 'GET' && action === 'getPushes') {
      const { data, error } = await supabase
        .from('pushes')
        .select('*, members(color_code)')
        .eq('org_id', org_id)
        .order('created_at', { ascending: true });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // 4. Submit Push (PIN validation done securely on server)
    if (req.method === 'POST' && action === 'submitPush') {
      const { org_id: pushOrgId, member_id, pin, note } = req.body;

      // Validate PIN on server
      const { data: member, error: memErr } = await supabase
        .from('members')
        .select('pin')
        .eq('id', member_id)
        .single();

      if (memErr || !member || member.pin !== pin) {
        return res.status(401).json({ error: 'Invalid PIN or member' });
      }

      const { data, error } = await supabase
        .from('pushes')
        .insert([{ org_id: pushOrgId, member_id, note: note || null }])
        .select();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}