import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SlotData {
  id: string;
  subjectId: string | null;
  day: number;
  period: number;
  subjectName: string | null;
  teacherName: string | null;
  isLab: boolean;
  color: string | null;
}

interface TimetableData {
  config: {
    periodsPerDay: number;
    lunchBreakPeriod: number;
    startTime: string;
    periodDuration: number;
  };
  days: string[];
  periods: number[];
  slots: SlotData[];
}

function hexToRgb(color: string): [number, number, number] {
  // Handle HSL colors - convert to approximate RGB
  if (color.startsWith('hsl')) {
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const h = parseInt(match[1]) / 360;
      const s = parseInt(match[2]) / 100;
      const l = parseInt(match[3]) / 100;
      
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      return [
        Math.round(hue2rgb(p, q, h + 1/3) * 255),
        Math.round(hue2rgb(p, q, h) * 255),
        Math.round(hue2rgb(p, q, h - 1/3) * 255)
      ];
    }
  }
  return [220, 220, 220]; // Default gray
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const timetableData: TimetableData = await req.json();
    
    console.log('Generating PDF for timetable');

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const headerHeight = 25;
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('College Timetable', pageWidth / 2, margin + 5, { align: 'center' });
    
    // Calculate table dimensions
    const tableTop = margin + headerHeight;
    const tableWidth = pageWidth - (margin * 2);
    const tableHeight = pageHeight - tableTop - margin;
    
    const colWidth = tableWidth / (timetableData.days.length + 1); // +1 for time column
    const rowHeight = tableHeight / (timetableData.config.periodsPerDay + 2); // +2 for header and lunch

    // Draw header row
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, tableTop, tableWidth, rowHeight, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Time', margin + colWidth / 2, tableTop + rowHeight / 2 + 3, { align: 'center' });
    
    timetableData.days.forEach((day, i) => {
      doc.text(day, margin + colWidth * (i + 1) + colWidth / 2, tableTop + rowHeight / 2 + 3, { align: 'center' });
    });

    // Draw grid lines
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);

    // Helper to get time for period
    const getTimeForPeriod = (period: number): string => {
      const [hours, minutes] = timetableData.config.startTime.split(':').map(Number);
      let totalMinutes = hours * 60 + minutes;
      
      for (let i = 0; i < period; i++) {
        totalMinutes += timetableData.config.periodDuration;
        if (i === timetableData.config.lunchBreakPeriod - 1) {
          totalMinutes += 30;
        }
      }
      
      const startHour = Math.floor(totalMinutes / 60);
      const startMin = totalMinutes % 60;
      
      return `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
    };

    let currentY = tableTop + rowHeight;
    
    for (let period = 0; period < timetableData.config.periodsPerDay; period++) {
      // Time column
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, currentY, colWidth, rowHeight, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`P${period + 1}`, margin + colWidth / 2, currentY + rowHeight / 2, { align: 'center' });
      doc.text(getTimeForPeriod(period), margin + colWidth / 2, currentY + rowHeight / 2 + 4, { align: 'center' });

      // Subject cells
      for (let day = 0; day < timetableData.days.length; day++) {
        const slot = timetableData.slots.find(s => s.day === day && s.period === period);
        const x = margin + colWidth * (day + 1);
        
        if (slot?.subjectName) {
          const rgb = slot.color ? hexToRgb(slot.color) : [220, 220, 220];
          doc.setFillColor(rgb[0], rgb[1], rgb[2]);
          doc.rect(x, currentY, colWidth, rowHeight, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(50, 50, 50);
          doc.text(slot.subjectName, x + colWidth / 2, currentY + rowHeight / 2 - 1, { align: 'center' });
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.text(slot.teacherName || '', x + colWidth / 2, currentY + rowHeight / 2 + 3, { align: 'center' });
          
          if (slot.isLab) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5);
            doc.setTextColor(100, 100, 200);
            doc.text('LAB', x + colWidth / 2, currentY + rowHeight / 2 + 6, { align: 'center' });
          }
        }
        
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, currentY, colWidth, rowHeight);
      }
      
      currentY += rowHeight;
      
      // Add lunch break row after specified period
      if (period === timetableData.config.lunchBreakPeriod - 1) {
        doc.setFillColor(245, 245, 220);
        doc.rect(margin, currentY, tableWidth, rowHeight * 0.6, 'F');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('🍴 Lunch Break', pageWidth / 2, currentY + rowHeight * 0.3 + 2, { align: 'center' });
        currentY += rowHeight * 0.6;
      }
    }

    // Draw outer border
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.rect(margin, tableTop, tableWidth, currentY - tableTop);

    // Generate PDF as base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    return new Response(
      JSON.stringify({ pdf: pdfBase64 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate PDF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
