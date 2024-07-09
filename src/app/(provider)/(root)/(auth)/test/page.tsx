import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function PrivatePage() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();
  console.log(data?.user?.user_metadata);
  if (error || !data?.user) {
    redirect('/login');
  }

  return <p>Hello {data.user.email}</p>;
}
