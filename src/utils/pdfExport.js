import jsPDF from 'jspdf';

export const generateEmargementPDF = (event, caseData, tenantData) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(204, 109, 62); // primary color
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("Feuille d'Émargement", 105, 25, { align: 'center' });
    
    // Details
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    let y = 60;
    doc.text(`Événement : ${event.title}`, 20, y); y += 10;
    doc.text(`Date : ${new Date(event.event_date).toLocaleDateString('fr-FR')}`, 20, y); y += 10;
    doc.text(`Horaires : ${event.actual_start_time || 'N/A'} - ${event.actual_end_time || 'N/A'}`, 20, y); y += 10;
    if (caseData?.tenants?.name) {
        doc.text(`Client : ${caseData.tenants.name}`, 20, y); y += 10;
    }
    
    y += 20;
    
    // Consultant Signature
    doc.setFillColor(245, 245, 245);
    doc.rect(20, y, 80, 80, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text("Émargement Consultant", 60, y + 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    if (event.consultant_signature) {
        doc.text(`Nom: ${event.consultant_signature_name || 'Consultant'}`, 25, y + 20);
        doc.text(`Le: ${new Date(event.consultant_signature_date).toLocaleDateString('fr-FR')}`, 25, y + 28);
        doc.addImage(event.consultant_signature, 'PNG', 25, y + 35, 70, 35);
    } else {
        doc.text("Non émargé", 60, y + 45, { align: 'center' });
    }
    
    // Client Signature
    doc.setFillColor(245, 245, 245);
    doc.rect(110, y, 80, 80, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text("Émargement Bénéficiaire", 150, y + 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    if (event.client_signature) {
        doc.text(`Nom: ${event.client_signature_name || 'Bénéficiaire'}`, 115, y + 20);
        doc.text(`Le: ${new Date(event.client_signature_date).toLocaleDateString('fr-FR')}`, 115, y + 28);
        doc.addImage(event.client_signature, 'PNG', 115, y + 35, 70, 35);
    } else {
        doc.text("Non émargé", 150, y + 45, { align: 'center' });
    }
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Généré par EasyQual - Le logiciel de gestion Qualiopi", 105, 280, { align: 'center' });
    
    doc.save(`Emargement_${event.title.replace(/\s+/g, '_')}.pdf`);
};
