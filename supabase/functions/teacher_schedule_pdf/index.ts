import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import { autoTable } from "https://esm.sh/jspdf-autotable@3.5.28";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teacher_id } = await req.json();

    if (!teacher_id) {
      return new Response(
        JSON.stringify({ error: "teacher_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    // Fetch teacher details
    const { data: teacherData, error: teacherError } = await supabaseClient
      .from("teachers")
      .select("name, subject")
      .eq("id", teacher_id)
      .single();

    if (teacherError || !teacherData) {
      return new Response(
        JSON.stringify({ error: "Teacher not found", details: teacherError }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch schedule data
    const { data: scheduleData, error: scheduleError } = await supabaseClient
      .from("schedules")
      .select("*")
      .eq("teacher_id", teacher_id)
      .order("day_of_week", { ascending: true });

    if (scheduleError) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch schedule",
          details: scheduleError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create PDF document
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text(`Teacher Schedule: ${teacherData.name}`, 105, 20, {
      align: "center",
    });
    doc.setFontSize(12);
    doc.text(`Subject: ${teacherData.subject}`, 105, 30, { align: "center" });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 40, {
      align: "center",
    });

    // Group schedules by day of week
    const schedulesByDay = scheduleData.reduce((acc, schedule) => {
      if (!acc[schedule.day_of_week]) {
        acc[schedule.day_of_week] = [];
      }
      acc[schedule.day_of_week].push(schedule);
      return acc;
    }, {});

    // Order of days for sorting
    const dayOrder = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    // Create table
    const tableData = [];

    dayOrder.forEach((day) => {
      if (schedulesByDay[day]) {
        // Add day header
        tableData.push([{
          content: day,
          colSpan: 4,
          styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
        }]);

        // Add schedule rows for this day
        schedulesByDay[day].forEach((schedule) => {
          tableData.push([
            schedule.time_slot,
            schedule.class_name,
            schedule.room || "N/A",
            `${schedule.current_students}/${schedule.capacity}`,
          ]);
        });

        // Add empty row for spacing
        tableData.push([{ content: "", colSpan: 4 }]);
      }
    });

    // Generate table
    autoTable(doc, {
      startY: 50,
      head: [["Time", "Class", "Room", "Students"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: "bold",
      },
      margin: { top: 50 },
    });

    // Generate PDF as base64
    const pdfBase64 = doc.output("datauristring");

    return new Response(
      JSON.stringify({
        success: true,
        pdf: pdfBase64,
        teacher_name: teacherData.name,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
