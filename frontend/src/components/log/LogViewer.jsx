import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import LogSheet from './LogSheet';
import { formatDate } from '../../constants/hos';

/**
 * LogViewer Component
 * Displays ELD log sheets with day navigation tabs and PDF export
 */
const LogViewer = ({ schedule, tripInfo, driverInfo }) => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const logSheetRef = useRef(null);

  if (!schedule || schedule.length === 0) {
    return null;
  }

  const currentDaySchedule = schedule.find((s) => s.day === selectedDay) || schedule[0];

  // Convert SVG to high-quality image data
  const svgToImage = async (svgElement) => {
    // Get SVG dimensions from viewBox (900x500)
    const viewBox = svgElement.getAttribute('viewBox');
    let svgWidth = 900;
    let svgHeight = 500;

    if (viewBox) {
      const parts = viewBox.split(' ');
      if (parts.length === 4) {
        svgWidth = parseFloat(parts[2]);
        svgHeight = parseFloat(parts[3]);
      }
    }

    // Clone SVG and set explicit dimensions for proper rendering
    const clonedSvg = svgElement.cloneNode(true);
    clonedSvg.setAttribute('width', svgWidth);
    clonedSvg.setAttribute('height', svgHeight);

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    // Use scale=4 for print-quality resolution
    const canvas = document.createElement('canvas');
    const scale = 4;
    canvas.width = svgWidth * scale;
    canvas.height = svgHeight * scale;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

    URL.revokeObjectURL(url);

    return {
      dataUrl: canvas.toDataURL('image/png', 1.0),
      width: svgWidth,
      height: svgHeight,
    };
  };

  // Export current day to PDF
  const handleExportCurrentDay = async () => {
    if (!logSheetRef.current) return;

    setIsExporting(true);
    try {
      const svg = logSheetRef.current.querySelector('svg');
      if (!svg) return;

      const imgResult = await svgToImage(svg);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate dimensions to fit complete log with margins
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      // Calculate aspect ratio and fit to page
      const aspectRatio = imgResult.width / imgResult.height;
      let imgWidth = maxWidth;
      let imgHeight = imgWidth / aspectRatio;

      // If too tall, scale by height instead
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = imgHeight * aspectRatio;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgResult.dataUrl, 'PNG', x, y, imgWidth, imgHeight);

      const date = currentDaySchedule.date
        ? new Date(currentDaySchedule.date).toISOString().split('T')[0]
        : 'log';
      pdf.save(`eld-log-day${selectedDay}-${date}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Export all days to PDF (exports current view, one day at a time)
  const handleExportAllDays = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate dimensions to fit complete log with margins
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      for (let i = 0; i < schedule.length; i++) {
        // Switch to this day
        setSelectedDay(schedule[i].day);

        // Wait for render
        await new Promise((r) => setTimeout(r, 150));

        const svg = logSheetRef.current?.querySelector('svg');
        if (!svg) continue;

        if (i > 0) pdf.addPage();

        const imgResult = await svgToImage(svg);

        // Calculate aspect ratio and fit to page
        const aspectRatio = imgResult.width / imgResult.height;
        let imgWidth = maxWidth;
        let imgHeight = imgWidth / aspectRatio;

        // If too tall, scale by height instead
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = imgHeight * aspectRatio;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(imgResult.dataUrl, 'PNG', x, y, imgWidth, imgHeight);
      }

      const startDate = schedule[0]?.date
        ? new Date(schedule[0].date).toISOString().split('T')[0]
        : 'trip';
      pdf.save(`eld-logs-${startDate}-${schedule.length}days.pdf`);

      // Return to first day
      setSelectedDay(1);
    } catch (error) {
      console.error('Error exporting all days:', error);
      alert('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 md:px-6 md:py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ELD Log Sheets</h2>
            <p className="text-sm text-gray-600">Official driver's daily log format</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {schedule.length} {schedule.length === 1 ? 'day' : 'days'} total
            </span>
            {/* Export Buttons */}
            <button
              onClick={handleExportCurrentDay}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 min-h-[36px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isExporting ? 'Exporting...' : 'Export Day'}
            </button>
            {schedule.length > 1 && (
              <button
                onClick={handleExportAllDays}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 min-h-[36px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isExporting ? 'Exporting...' : 'Export All'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-white px-2 md:px-4">
        {schedule.map((day) => (
          <button
            key={day.day}
            onClick={() => setSelectedDay(day.day)}
            className={`
              flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors
              border-b-2 -mb-[2px] min-h-[48px]
              ${selectedDay === day.day
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex flex-col items-center">
              <span>Day {day.day}</span>
              <span className="text-xs text-gray-500 mt-0.5">
                {formatDate(day.date)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Log Sheet */}
      <div className="p-4 md:p-6">
        {/* Day Summary */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="bg-green-50 px-3 py-1.5 rounded-full">
            <span className="text-xs text-green-600 font-medium">
              Driving: {currentDaySchedule.driving_hours?.toFixed(1) || 0} hrs
            </span>
          </div>
          <div className="bg-yellow-50 px-3 py-1.5 rounded-full">
            <span className="text-xs text-yellow-600 font-medium">
              On Duty: {currentDaySchedule.on_duty_hours?.toFixed(1) || 0} hrs
            </span>
          </div>
          <div className="bg-purple-50 px-3 py-1.5 rounded-full">
            <span className="text-xs text-purple-600 font-medium">
              Sleeper: {currentDaySchedule.sleeper_hours?.toFixed(1) || 0} hrs
            </span>
          </div>
          <div className="bg-gray-100 px-3 py-1.5 rounded-full">
            <span className="text-xs text-gray-600 font-medium">
              Off Duty: {currentDaySchedule.off_duty_hours?.toFixed(1) || 0} hrs
            </span>
          </div>
        </div>

        {/* Log Sheet SVG */}
        <div ref={logSheetRef} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <LogSheet
            daySchedule={currentDaySchedule}
            tripInfo={tripInfo}
            driverInfo={driverInfo}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
            disabled={selectedDay === 1}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-colors min-h-[44px]
              ${selectedDay === 1
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous Day
          </button>

          <span className="text-sm text-gray-500">
            Day {selectedDay} of {schedule.length}
          </span>

          <button
            onClick={() => setSelectedDay(Math.min(schedule.length, selectedDay + 1))}
            disabled={selectedDay === schedule.length}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-colors min-h-[44px]
              ${selectedDay === schedule.length
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }
            `}
          >
            Next Day
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
