import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Teacher {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  teacherId: string;
  hoursPerWeek: number;
  isLab: boolean;
  labDuration: 2 | 3;
  color: string;
}

interface TimetableConfig {
  periodsPerDay: number;
  lunchBreakPeriod: number;
  startTime: string;
  periodDuration: number;
}

interface TimetableSlot {
  id: string;
  subjectId: string | null;
  day: number;
  period: number;
  isLunchBreak: boolean;
}

const DAYS = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teachers, subjects, config } = await req.json() as {
      teachers: Teacher[];
      subjects: Subject[];
      config: TimetableConfig;
    };

    console.log('Generating timetable for:', { 
      teacherCount: teachers.length, 
      subjectCount: subjects.length,
      config 
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build prompt for AI
    const prompt = `You are a college timetable scheduler. Generate an optimal timetable based on these constraints:

TEACHERS:
${teachers.map(t => `- ${t.name} (ID: ${t.id})`).join('\n')}

SUBJECTS:
${subjects.map(s => {
  const teacher = teachers.find(t => t.id === s.teacherId);
  return `- ${s.name} (ID: ${s.id}): ${s.hoursPerWeek} hours/week, Teacher: ${teacher?.name}${s.isLab ? `, LAB (${s.labDuration} consecutive periods)` : ''}`;
}).join('\n')}

CONFIGURATION:
- Days: Monday to Friday (0-4)
- Periods per day: ${config.periodsPerDay} (indexed 0-${config.periodsPerDay - 1})
- Lunch break after period: ${config.lunchBreakPeriod} (skip this period for scheduling)

CONSTRAINTS:
1. Each subject must be scheduled for exactly its specified hours per week
2. Labs must be scheduled as ${subjects.filter(s => s.isLab).map(s => s.labDuration).join(' or ')} consecutive periods
3. A teacher cannot teach two classes at the same time
4. Distribute subjects evenly across the week (avoid putting all hours on one day)
5. Avoid scheduling the same subject twice on the same day unless necessary

Return ONLY a valid JSON array of slot assignments. Each slot has:
- id: "{day}-{period}" format (e.g., "0-0" for Monday period 1)
- subjectId: the subject ID or null for empty
- day: 0-4
- period: 0-${config.periodsPerDay - 1}
- isLunchBreak: false

Example format:
[
  {"id": "0-0", "subjectId": "abc123", "day": 0, "period": 0, "isLunchBreak": false},
  {"id": "0-1", "subjectId": null, "day": 0, "period": 1, "isLunchBreak": false}
]

Generate ALL ${DAYS * config.periodsPerDay} slots for the complete timetable. Return ONLY the JSON array, no explanation.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a precise timetable scheduling algorithm. Output only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response:', content.substring(0, 500));

    // Extract JSON from response
    let slots: TimetableSlot[];
    try {
      // Try to parse directly first
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        slots = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      // Fallback: generate empty timetable
      slots = [];
      for (let day = 0; day < DAYS; day++) {
        for (let period = 0; period < config.periodsPerDay; period++) {
          slots.push({
            id: `${day}-${period}`,
            subjectId: null,
            day,
            period,
            isLunchBreak: false,
          });
        }
      }
    }

    // Validate and fix slot structure
    const validSlots = slots.map(slot => ({
      id: slot.id || `${slot.day}-${slot.period}`,
      subjectId: subjects.some(s => s.id === slot.subjectId) ? slot.subjectId : null,
      day: Number(slot.day),
      period: Number(slot.period),
      isLunchBreak: false,
    }));

    // Ensure all slots exist
    const slotMap = new Map(validSlots.map(s => [s.id, s]));
    const completeSlots: TimetableSlot[] = [];
    
    for (let day = 0; day < DAYS; day++) {
      for (let period = 0; period < config.periodsPerDay; period++) {
        const id = `${day}-${period}`;
        completeSlots.push(slotMap.get(id) || {
          id,
          subjectId: null,
          day,
          period,
          isLunchBreak: false,
        });
      }
    }

    console.log('Generated slots:', completeSlots.length);

    return new Response(
      JSON.stringify({ slots: completeSlots }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-timetable:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
