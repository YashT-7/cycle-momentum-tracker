import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // 1. Sign In
    if (req.method === 'POST' && action === 'signIn') {
      const { email, password } = req.body;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // 2. Sign Up
    if (req.method === 'POST' && action === 'signUp') {
      const { email, password } = req.body;
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // 3. Get Organizations for Admin
    if (req.method === 'GET' && action === 'getOrgs') {
      const { admin_id } = req.query;
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('admin_id', admin_id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // 4. Get Organization Details
    if (req.method === 'GET' && action === 'getOrgDetails') {
      const { org_id } = req.query;
      const { data, error } = await supabase
        .from('organizations')
        .select('name, cycle_svg')
        .eq('id', org_id)
        .single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // 5. Create Organization
    if (req.method === 'POST' && action === 'createOrg') {
      const { name, cycle_svg, admin_id } = req.body;
      const { data, error } = await supabase
        .from('organizations')
        .insert([{ name, cycle_svg, admin_id }])
        .select();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // 6. Update Organization Settings
    if (req.method === 'POST' && action === 'updateOrg') {
      const { org_id, name, cycle_svg } = req.body;
      const { error } = await supabase
        .from('organizations')
        .update({ name, cycle_svg })
        .eq('id', org_id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    // 7. Get Members with PINs (Admin only)
    if (req.method === 'GET' && action === 'getMembers') {
      const { org_id } = req.query;
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('org_id', org_id)
        .order('created_at', { ascending: true });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // 8. Add Member
    if (req.method === 'POST' && action === 'addMember') {
      const { org_id, name, pin, color_code } = req.body;
      const { error } = await supabase
        .from('members')
        .insert([{ org_id, name, pin, color_code }]);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    // 9. Save / Edit Member
    if (req.method === 'POST' && action === 'saveMember') {
      const { member_id, name, pin, color_code } = req.body;
      const { error } = await supabase
        .from('members')
        .update({ name, pin, color_code })
        .eq('id', member_id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    // 10. Delete Member
    if (req.method === 'POST' && action === 'deleteMember') {
      const { member_id } = req.body;
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', member_id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    // 11. Delete Admin Account & Cascade Orgs
    if (req.method === 'POST' && action === 'deleteAccount') {
      const { admin_id } = req.body;
      await supabase.from('organizations').delete().eq('admin_id', admin_id);
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Action not found' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}