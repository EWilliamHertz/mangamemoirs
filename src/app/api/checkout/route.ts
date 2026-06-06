import { NextResponse } from 'next/server';

// Payments not yet configured — return a helpful message
// To add payments later, integrate Gumroad, Ko-fi, or any processor here
export async function POST() {
  return NextResponse.json({
    error: null,
    message: 'To top up credits, email contact@ouriye.com with your account email and desired credit pack.',
    contactEmail: 'ewilliamhe@gmail.com',
  });
}
