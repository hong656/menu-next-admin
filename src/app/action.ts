'use server';
import {cookies} from 'next/headers';

export async function setLocale(l: string) {
  (await cookies()).set('admin_lang', ['en','kh', 'ch'].includes(l) ? l : 'en', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === 'production'
  });
}