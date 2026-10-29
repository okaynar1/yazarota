import { PublishedWork } from '../types';

/**
 * Downloads a clean, valid Microsoft Word DOCX/HTML document for a story
 */
export function exportStoryToDocx(work: PublishedWork): void {
  const genreLabels: Record<string, string> = {
    hikaye: 'Hikâye (Öykü)',
    masal: 'Masal',
    bilim_kurgu: 'Bilim Kurgu',
    polisiye: 'Polisiye',
    ani: 'Anı',
    gunluk: 'Günlük',
    siir: 'Şiir',
    fabl: 'Fabl',
  };

  const formattedDate = new Date(work.publishedAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const contentParagraphs = work.content
    .split(/\n\n+/)
    .map((p) => `<p style="margin-bottom: 12pt; text-indent: 18pt; line-height: 1.6; font-size: 11pt;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const wordDocumentHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word" 
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${work.title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4 portrait;
      margin: 2.5cm 2.5cm 2.5cm 2.5cm;
      mso-header-margin: 36pt;
      mso-footer-margin: 36pt;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #111827;
      background-color: #ffffff;
      padding: 0;
      margin: 0;
    }
    .magazine-header {
      text-align: center;
      border-bottom: 2pt solid #0d9488;
      padding-bottom: 12pt;
      margin-bottom: 24pt;
    }
    .magazine-title {
      font-size: 16pt;
      font-weight: bold;
      color: #0f766e;
      letter-spacing: 2pt;
      margin: 0;
      text-transform: uppercase;
    }
    .magazine-subtitle {
      font-size: 9pt;
      color: #64748b;
      margin-top: 4pt;
    }
    .story-title {
      font-size: 22pt;
      font-weight: bold;
      color: #0f172a;
      text-align: center;
      margin-top: 18pt;
      margin-bottom: 8pt;
    }
    .story-meta {
      text-align: center;
      font-size: 10pt;
      color: #475569;
      font-style: italic;
      margin-bottom: 20pt;
    }
    .story-cards {
      background-color: #f8fafc;
      border: 1pt solid #cbd5e1;
      padding: 10pt;
      margin-bottom: 20pt;
      font-size: 9.5pt;
      color: #334155;
    }
    .card-item {
      margin-bottom: 4pt;
    }
    .editor-note {
      border-left: 3pt solid #0d9488;
      background-color: #f0fdfa;
      padding: 8pt 12pt;
      margin-top: 24pt;
      font-size: 9.5pt;
      color: #134e4a;
      font-style: italic;
    }
    .footer {
      margin-top: 36pt;
      text-align: center;
      font-size: 8.5pt;
      color: #94a3b8;
      border-top: 1pt solid #e2e8f0;
      padding-top: 8pt;
    }
  </style>
</head>
<body>
  <div class="magazine-header">
    <div class="magazine-title">GENÇ KALEMLER DİJİTAL OKUL DERGİSİ</div>
    <div class="magazine-subtitle">YAZAROTA Yaratıcı Yazma Platformu Seçkisi • Sayı ${work.issueNumber || 1} • ${formattedDate}</div>
  </div>

  <div class="story-title">${work.title}</div>
  <div class="story-meta">
    Yazar: <strong>${work.authorDisplayName}</strong> &nbsp;|&nbsp; 
    Tür: <strong>${genreLabels[work.genre] || work.genre}</strong> &nbsp;|&nbsp; 
    Kelime: <strong>${work.wordCount}</strong>
  </div>

  <div class="story-cards">
    <div class="card-item"><strong>Mekân:</strong> ${work.place || 'Serbest'}</div>
    <div class="card-item"><strong>Zaman:</strong> ${work.time || 'Serbest'}</div>
    <div class="card-item"><strong>Karakter:</strong> ${work.character || 'Serbest'}</div>
    <div class="card-item"><strong>Sürpriz Kart:</strong> ${work.surpriseCard || 'Serbest'}</div>
  </div>

  <div class="story-body">
    ${contentParagraphs}
  </div>

  ${
    work.teacherEditorNotes
      ? `<div class="editor-note">
           <strong>Yayın Kurulu & Öğretmen Notu:</strong><br/>
           ${work.teacherEditorNotes}
         </div>`
      : ''
  }

  <div class="footer">
    YAZAROTA — “Rastgelelikten Hikâyeye, Denemeden Gelişime” • Bu belge dijital olarak üretilmiştir.
  </div>
</body>
</html>
`;

  const blob = new Blob(['\ufeff', wordDocumentHtml], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const sanitizedTitle = work.title.replace(/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ\s_-]/g, '').trim() || 'genc_kalemler_eser';
  anchor.download = `${sanitizedTitle}_Genc_Kalemler.doc`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Triggers clean print / PDF view for a published work
 */
export function printPublishedWork(work: PublishedWork): void {
  const genreLabels: Record<string, string> = {
    hikaye: 'Hikâye (Öykü)',
    masal: 'Masal',
    bilim_kurgu: 'Bilim Kurgu',
    polisiye: 'Polisiye',
    ani: 'Anı',
    gunluk: 'Günlük',
    siir: 'Şiir',
    fabl: 'Fabl',
  };

  const formattedDate = new Date(work.publishedAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Lütfen yazdırma penceresine izin veriniz.');
    return;
  }

  const contentParagraphs = work.content
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>${work.title} — Genç Kalemler</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 2cm;
    }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      color: #1e293b;
      line-height: 1.7;
      padding: 0;
      margin: 0;
      background: #fff;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0d9488;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #0f766e;
      margin: 0;
    }
    .header p {
      font-size: 11px;
      color: #64748b;
      margin: 4px 0 0;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0 8px;
      color: #0f172a;
    }
    .meta {
      text-align: center;
      font-size: 12px;
      color: #475569;
      font-style: italic;
      margin-bottom: 24px;
    }
    .cards-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 11px;
      color: #334155;
      margin-bottom: 24px;
    }
    .cards-box div {
      margin-bottom: 4px;
    }
    .content p {
      font-size: 13px;
      margin-bottom: 14px;
      text-indent: 24px;
      text-align: justify;
    }
    .editor-note {
      border-left: 3px solid #0d9488;
      background: #f0fdfa;
      padding: 10px 14px;
      margin-top: 24px;
      font-size: 11px;
      color: #134e4a;
      font-style: italic;
    }
    .footer {
      margin-top: 40px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Genç Kalemler Dijital Okul Dergisi</h1>
    <p>YAZAROTA Platformu Seçkisi • Sayı ${work.issueNumber || 1} • ${formattedDate}</p>
  </div>

  <div class="title">${work.title}</div>
  <div class="meta">
    Yazar: <strong>${work.authorDisplayName}</strong> &nbsp;|&nbsp; 
    Tür: <strong>${genreLabels[work.genre] || work.genre}</strong> &nbsp;|&nbsp; 
    ${work.wordCount} Kelime
  </div>

  <div class="cards-box">
    <div><strong>Mekân:</strong> ${work.place || 'Serbest'}</div>
    <div><strong>Zaman:</strong> ${work.time || 'Serbest'}</div>
    <div><strong>Karakter:</strong> ${work.character || 'Serbest'}</div>
    <div><strong>Sürpriz Kart:</strong> ${work.surpriseCard || 'Serbest'}</div>
  </div>

  <div class="content">
    ${contentParagraphs}
  </div>

  ${
    work.teacherEditorNotes
      ? `<div class="editor-note">
           <strong>Yayın Kurulu Değerlendirmesi:</strong><br/>
           ${work.teacherEditorNotes}
         </div>`
      : ''
  }

  <div class="footer">
    YAZAROTA — Yapay Zekâ Destekli Yaratıcı Yazma Uygulaması
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`);
  printWindow.document.close();
}
