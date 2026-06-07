'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Check if user is admin
async function isAdmin(userId: string) {
  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .single();
  return !!data;
}

// Generate voucher
export async function generateVoucher(
  credits: number,
  maxUses: number = 1,
  expiresAt?: Date
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const admin = await isAdmin(userId);
  if (!admin) throw new Error('Admin access required');

  const code = crypto.randomBytes(6).toString('hex').toUpperCase();

  const { data, error } = await supabase
    .from('vouchers')
    .insert({
      code,
      credits,
      max_uses: maxUses,
      used_count: 0,
      created_by: userId,
      expires_at: expiresAt || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all vouchers
export async function getVouchers() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const admin = await isAdmin(userId);
  if (!admin) throw new Error('Admin access required');

  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Redeem voucher (client-facing)
export async function redeemVoucher(code: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Get voucher
  const { data: voucher, error: voucherError } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (voucherError || !voucher) throw new Error('Invalid voucher code');

  // Check expiry
  if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
    throw new Error('Voucher expired');
  }

  // Check max uses
  if (voucher.used_count >= voucher.max_uses) {
    throw new Error('Voucher fully redeemed');
  }

  // Check if user already used this voucher
  const { data: existingUse } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('reference_id', voucher.id)
    .single();

  if (existingUse) {
    throw new Error('You already redeemed this voucher');
  }

  // Add credits
  const { error: updateError } = await supabase
    .from('users')
    .update({
      credits: supabase.raw('credits + ?', [voucher.credits]),
      total_credits_earned: supabase.raw('total_credits_earned + ?', [voucher.credits]),
    })
    .eq('id', userId);

  if (updateError) throw updateError;

  // Log transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: voucher.credits,
    type: 'voucher_redeem',
    description: `Redeemed voucher: ${code}`,
    reference_id: voucher.id,
  });

  // Increment used count
  await supabase
    .from('vouchers')
    .update({ used_count: voucher.used_count + 1 })
    .eq('id', voucher.id);

  return { success: true, creditsAdded: voucher.credits };
}

// Top-up user credits (admin only)
export async function topUpUserCredits(userId: string, amount: number, reason: string) {
  const { userId: adminId } = await auth();
  if (!adminId) throw new Error('Unauthorized');

  const admin = await isAdmin(adminId);
  if (!admin) throw new Error('Admin access required');

  // Add credits
  const { error: updateError } = await supabase
    .from('users')
    .update({
      credits: supabase.raw('credits + ?', [amount]),
      total_credits_earned: supabase.raw('total_credits_earned + ?', [amount]),
    })
    .eq('id', userId);

  if (updateError) throw updateError;

  // Log transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount,
    type: 'admin_topup',
    description: `Admin top-up: ${reason}`,
  });

  return { success: true };
}

// Search users
export async function searchUsers(query: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const admin = await isAdmin(userId);
  if (!admin) throw new Error('Admin access required');

  const { data, error } = await supabase
    .from('users')
    .select('id, email, credits, total_credits_earned, created_at')
    .ilike('email', `%${query}%`)
    .limit(20);

  if (error) throw error;
  return data;
}

// Get user details
export async function getUserDetails(userId: string) {
  const { userId: adminId } = await auth();
  if (!adminId) throw new Error('Unauthorized');

  const admin = await isAdmin(adminId);
  if (!admin) throw new Error('Admin access required');

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError) throw userError;

  const { data: transactions, error: txError } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (txError) throw txError;

  return { user, transactions };
}

// Make user admin
export async function makeUserAdmin(userId: string) {
  const { userId: adminId } = await auth();
  if (!adminId) throw new Error('Unauthorized');

  const admin = await isAdmin(adminId);
  if (!admin) throw new Error('Admin access required');

  const { error } = await supabase
    .from('admin_users')
    .insert({ id: userId, role: 'admin' })
    .on('CONFLICT', (query) => query.do_nothing());

  if (error) throw error;
  return { success: true };
}

// Remove admin
export async function removeAdminStatus(userId: string) {
  const { userId: adminId } = await auth();
  if (!adminId) throw new Error('Unauthorized');

  const admin = await isAdmin(adminId);
  if (!admin) throw new Error('Admin access required');

  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
  return { success: true };
}

// Get all admins
export async function getAdmins() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const admin = await isAdmin(userId);
  if (!admin) throw new Error('Admin access required');

  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
