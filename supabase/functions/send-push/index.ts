import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webpush from "https://esm.sh/web-push";

// Initialize VAPID details
// You should set these in your Supabase project secrets:
// supabase secrets set VAPID_PUBLIC_KEY=xxx VAPID_PRIVATE_KEY=xxx
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";

webpush.setVapidDetails(
  'mailto:support@eous.ai', // Replace with your email
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      } 
    });
  }

  try {
    const { subscription, title, body, url } = await req.json();

    if (!subscription) {
      return new Response(JSON.stringify({ error: 'Subscription is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const payload = JSON.stringify({
      title: title || 'Eous AI Mentor',
      body: body || 'You have a new reminder!',
      url: url || '/'
    });

    await webpush.sendNotification(subscription, payload);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
