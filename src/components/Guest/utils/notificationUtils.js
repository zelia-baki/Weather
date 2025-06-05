import axiosInstance from '../../../axiosInstance';

export const sendEmailWithPdf = async (email, reportType, pdfBlob) => {
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const binary = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
  const base64data = btoa(binary);

  return axiosInstance.post('/api/notifications/email', {
    to_email: email,
    report_type: reportType,
    pdf_base64: base64data
  });
};

export const sendSmsNotification = (phone, message) => {
  return axiosInstance.post('/api/notifications/sms', { phone, message });
};


const sendPdfByEmail = async (inputName, email) => {
    console.log(`📤 Génération du PDF pour ${inputName.toUpperCase()}...`);

    try {
      const pdfBlob = await generatePdfBlob(inputName);
      console.log("📄 PDF généré, préparation du base64...");

      const reader = new FileReader();
      reader.readAsArrayBuffer(pdfBlob);

      reader.onloadend = async () => {
        console.log("🧠 Conversion du blob en base64...");

        const arrayBuffer = reader.result;
        const uint8Array = new Uint8Array(arrayBuffer);
        const binary = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
        const base64data = btoa(binary);

        try {
          console.log("📡 Envoi via axiosInstance vers /api/notifications/email...");
          await axiosInstance.post('/api/notifications/email', {
            to_email: email,
            report_type: inputName.toUpperCase(),
            pdf_base64: base64data
          });

          console.log('✅ Email envoyé avec succès via backend Flask');
        } catch (error) {
          console.error('❌ Erreur lors de l’envoi de l’email :', error);
        }
      };

      reader.onerror = (err) => {
        console.error("❌ Erreur lors de la lecture du PDF :", err);
      };

    } catch (err) {
      console.error("❌ Erreur lors de la génération du PDF :", err);
    }
  };


    const handleReportReady = async (featureName) => {
    const file = files[featureName === 'reporteudrguest' ? 'eudr' : 'carbon'];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axiosInstance.post(
        `/api/gfw/Geojson/${featureName === 'reportcarbonguest' ? 'CarbonReportFromFile' : 'ReportFromFile'}`,
        formData,
        {
          headers: {
            'X-Guest-ID': localStorage.getItem('guest_id'),
            'X-Guest-Phone': userInfo.phone
          }
        }
      );

      const key = featureName === 'reporteudrguest' ? 'eudr' : 'carbon';
      setReports(prev => ({ ...prev, [key]: res.data.report }));
      setStep(4);

      // ✅ Envoi Email automatique avec PDF
      console.log('📨 Appel à sendPdfByEmail avec :', key, userInfo.email);
      await sendPdfByEmail(key, userInfo.email);

      // ✅ Envoi SMS résumé
      await axiosInstance.post('/api/notifications/sms', {
        phone: userInfo.phone,
        message: `✅ ✅ Your ${key.toUpperCase()} report has been prepared. Check your email (${userInfo.email}) for the PDF.`
      });


    } catch (err) {
      setErrors(prev => ({ ...prev, [featureName]: 'Error generating report.' }));
    }
  };