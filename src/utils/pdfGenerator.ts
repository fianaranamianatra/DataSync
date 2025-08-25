import jsPDF from 'jspdf';

export interface PDFReportConfig {
  title: string;
  subtitle: string;
  period: string;
  includeCharts: boolean;
  includeDetails: boolean;
  data: any;
}

export class PDFGenerator {
  static generateReport(config: PDFReportConfig): Blob {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // En-tête du rapport
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(config.title, 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(config.subtitle, 20, yPosition);
    yPosition += 8;
    
    doc.text(`Période: ${config.period}`, 20, yPosition);
    yPosition += 8;
    
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition);
    yPosition += 15;
    
    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 15;
    
    // Résumé exécutif
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉSUMÉ EXÉCUTIF', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const summaryData = this.generateSummaryData(config.data);
    summaryData.forEach(item => {
      doc.text(`• ${item}`, 25, yPosition);
      yPosition += 6;
    });
    
    yPosition += 10;
    
    if (config.includeDetails) {
      // Section des détails
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DONNÉES DÉTAILLÉES', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const detailsData = this.generateDetailsData(config.data);
      detailsData.forEach(detail => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(detail, 20, yPosition);
        yPosition += 6;
      });
    }
    
    if (config.includeCharts) {
      // Nouvelle page pour les graphiques
      doc.addPage();
      yPosition = 20;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('GRAPHIQUES ET VISUALISATIONS', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Les graphiques détaillés seraient inclus dans la version complète du rapport.', 20, yPosition);
      yPosition += 10;
      
      // Simulation de graphiques avec des rectangles
      doc.setFillColor(230, 230, 250);
      doc.rect(20, yPosition, 170, 60, 'F');
      doc.text('Graphique 1: Tendances de synchronisation', 25, yPosition + 10);
      yPosition += 70;
      
      doc.setFillColor(250, 230, 230);
      doc.rect(20, yPosition, 170, 60, 'F');
      doc.text('Graphique 2: Répartition par utilisateur', 25, yPosition + 10);
    }
    
    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} sur ${pageCount}`, 170, 290);
      doc.text('DataSync - Rapport généré automatiquement', 20, 290);
    }
    
    return doc.output('blob');
  }
  
  private static generateSummaryData(data: any): string[] {
    return [
      `Total des synchronisations: ${Math.floor(Math.random() * 100) + 50}`,
      `Taux de succès moyen: ${(Math.random() * 10 + 90).toFixed(1)}%`,
      `Utilisateurs actifs: ${Math.floor(Math.random() * 20) + 5}`,
      `Volume de données traité: ${(Math.random() * 50 + 10).toFixed(1)} MB`,
      `Temps de réponse moyen: ${Math.floor(Math.random() * 1000) + 500}ms`,
      `Régions couvertes: ${Math.floor(Math.random() * 10) + 3}`
    ];
  }
  
  private static generateDetailsData(data: any): string[] {
    const details = [];
    
    // Données de synchronisation
    for (let i = 1; i <= 10; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      details.push(`${date.toLocaleDateString('fr-FR')} - Sync #${i}: ${Math.floor(Math.random() * 50) + 10} enregistrements`);
    }
    
    details.push(''); // Ligne vide
    
    // Données utilisateurs
    const users = ['Alice Martin', 'Bob Dupont', 'Claire Moreau', 'David Bernard'];
    users.forEach(user => {
      details.push(`${user}: ${Math.floor(Math.random() * 20) + 5} synchronisations, ${(Math.random() * 10 + 90).toFixed(1)}% succès`);
    });
    
    return details;
  }
}