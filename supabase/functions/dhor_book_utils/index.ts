
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Get the request body
  const { action, params } = await req.json()

  try {
    let result
    
    if (action === 'get_difficult_ayahs') {
      const { student_id } = params
      const { data, error } = await supabase
        .from('difficult_ayahs')
        .select('*')
        .eq('student_id', student_id)
        .order('date_added', { ascending: false })
      
      if (error) throw error
      result = data
    }
    else if (action === 'mark_ayah_resolved') {
      const { ayah_id } = params
      const { data, error } = await supabase
        .from('difficult_ayahs')
        .update({ status: 'resolved' })
        .eq('id', ayah_id)
        .select()
      
      if (error) throw error
      result = data
    }
    else if (action === 'get_revision_schedule') {
      const { student_id } = params
      const { data, error } = await supabase
        .from('revision_schedule')
        .select('*')
        .eq('student_id', student_id)
        .order('scheduled_date', { ascending: true })
      
      if (error) throw error
      result = data
    }
    else if (action === 'mark_revision_completed') {
      const { item_id } = params
      const { data, error } = await supabase
        .from('revision_schedule')
        .update({ status: 'completed' })
        .eq('id', item_id)
        .select()
      
      if (error) throw error
      result = data
    }
    else {
      throw new Error('Invalid action')
    }

    return new Response(
      JSON.stringify({ data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
