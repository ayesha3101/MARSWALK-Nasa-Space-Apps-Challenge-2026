/**
 * NASA EVA Flight Plan & Manifest PDF Exporter
 * Generates official mission documentation for EVA-1
 */

import { jsPDF } from 'jspdf';
import { MissionManifest, SolvedRoute } from '../types/mission';

export function generateMissionPDF(
  manifest: MissionManifest,
  solvedRoute: SolvedRoute | null
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryRust = [226, 87, 43];
  const darkNavy = [12, 17, 24];

  // Header Banner
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(0, 0, 210, 28, 'F');

  // Accent Line
  doc.setFillColor(primaryRust[0], primaryRust[1], primaryRust[2]);
  doc.rect(0, 28, 210, 1.5, 'F');

  // Document Title
  doc.setTextColor(240, 240, 240);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MARSWALK // EVA FLIGHT MANIFEST & TACTICAL PLAN', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(79, 209, 197);
  doc.text('NASA SPACE APPS 2026 // EXPEDITION-1 // GALE CRATER QUAD', 14, 20);

  // Metadata Panel
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. MISSION OVERVIEW', 14, 38);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mission Name: ${manifest.missionName}`, 14, 45);
  doc.text('Site: Gale Crater / Mount Sharp Lower Boxwork (-4.72° S, 137.38° E)', 14, 51);
  doc.text(`Astronaut Crew: ${manifest.astronauts.map(a => `${a.name} (${a.id})`).join(' | ')}`, 14, 57);
  doc.text(`Rover Support: ${manifest.rover.name} [Rendezvous at Stop 2]`, 14, 63);

  // Route Statistics Box
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(200, 205, 215);
  doc.roundedRect(14, 68, 182, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.text('TRAVERSE TELEMETRY SUMMARY', 20, 75);

  doc.setFont('helvetica', 'normal');
  if (solvedRoute) {
    const km = (solvedRoute.totalDistanceMeters / 1000).toFixed(2);
    const hours = Math.floor(solvedRoute.totalTimeSeconds / 3600);
    const mins = Math.round((solvedRoute.totalTimeSeconds % 3600) / 60);

    doc.text(`Total Distance: ${km} km`, 20, 83);
    doc.text(`Estimated Duration: ${hours}h ${mins}m (incl. stop dwell)`, 20, 89);
    doc.text(`Max Slope Encountered: ${solvedRoute.maxSlopeDeg}° (Suit limit: 20°)`, 20, 95);

    doc.text(`Projected O2 Depletion: ${solvedRoute.totalO2UsedLiters} L`, 110, 83);
    doc.text(`Cumulative RAD Dose: ${solvedRoute.totalRadDoseUSv} µSv`, 110, 89);
    doc.text('Suit Status: 100% NOMINAL DEPLOYMENT', 110, 95);
  } else {
    doc.text('Traverse metrics calculating...', 20, 85);
  }

  // Waypoints Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. TACTICAL WAYPOINT CHAIN & SCIENCE DIRECTIVES', 14, 112);

  let y = 120;
  doc.setFillColor(230, 235, 242);
  doc.rect(14, y - 5, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('STOP', 16, y);
  doc.text('COORDINATES', 55, y);
  doc.text('DWELL', 95, y);
  doc.text('OBJECTIVES & HAZARD CAUTIONS', 120, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  manifest.waypoints.forEach((wp, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${idx + 1}. ${wp.name}`, 16, y);

    doc.setFont('helvetica', 'normal');
    doc.text(`${wp.coordinates[0].toFixed(4)}°E, ${wp.coordinates[1].toFixed(4)}°S`, 55, y);
    doc.text(`${wp.stayDurationMin} min`, 95, y);

    const descLines = doc.splitTextToSize(wp.science || wp.desc, 70);
    doc.text(descLines, 120, y);

    y += Math.max(12, descLines.length * 4.5 + 4);
  });

  // Emergency & Contingency Protocol
  y = Math.max(y + 6, 230);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(226, 87, 43);
  doc.text('3. EMERGENCY RETURN PROTOCOL ("ABORT TO HAB")', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  y += 5;
  doc.text('• In the event of suit puncture, telemetry loss, or solar particle event, press "ABORT TO HAB".', 14, y);
  y += 4.5;
  doc.text('• Direct vector path strictly avoids slopes > 15° to prevent slip/fall injury during rapid egress.', 14, y);
  y += 4.5;
  doc.text('• Secondary life support provides 45 minutes emergency pressurized buffer.', 14, y);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text('MARSWALK 2026 // NASA SPACE APPS // VERIFIED OPERATIONAL DIRECTIVE // FLIGHT COPY', 14, 287);

  // Save PDF
  doc.save(`MARSWALK_EVA1_MANIFEST_SOL001.pdf`);
}
