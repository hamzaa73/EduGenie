import * as pdfjs from 'pdfjs-dist';

// Use the explicit ESM worker path from esm.sh to match the library version
pdfjs.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Simplified getDocument call which is more resilient in ESM environments
    const loadingTask = pdfjs.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => {
          // Safety check: items can be TextItem or TextMark; only TextItem has the 'str' property
          if (item && typeof item === 'object' && 'str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ');
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }
    return fullText.trim();
  } catch (error) {
    console.error("PDF extraction error details:", error);
    throw new Error("عذراً، فشل قراءة ملف PDF. تأكد من أن الملف سليم وغير محمي.");
  }
};