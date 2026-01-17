import jsPDF from 'jspdf';

/**
 * Export an SVG element to PDF
 * @param {HTMLElement} container - Container with SVG element
 * @param {string} filename - The filename for the PDF
 */
export const exportToPDF = async (container, filename = 'eld-log.pdf') => {
  if (!container) {
    console.error('No container provided for PDF export');
    return false;
  }

  try {
    const svg = container.querySelector('svg');
    if (!svg) {
      console.error('No SVG found in container');
      return false;
    }

    // Get SVG dimensions
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Create image from SVG
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    // Create canvas and draw image
    const canvas = document.createElement('canvas');
    const scale = 2; // Higher quality
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);

    // Clean up
    URL.revokeObjectURL(url);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 280;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;

    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(filename);

    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return false;
  }
};

/**
 * Export multiple SVGs to a single PDF
 * @param {Function} renderDay - Function that returns SVG string for a day
 * @param {number} totalDays - Number of days
 * @param {string} filename - The filename for the PDF
 */
export const exportMultipleToPDF = async (svgStrings, filename = 'eld-logs.pdf') => {
  if (!svgStrings || svgStrings.length === 0) {
    console.error('No SVG strings provided');
    return false;
  }

  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < svgStrings.length; i++) {
      if (i > 0) pdf.addPage();

      const svgString = svgStrings[i];
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      URL.revokeObjectURL(url);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 280;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error exporting multiple pages:', error);
    return false;
  }
};

export default { exportToPDF, exportMultipleToPDF };
