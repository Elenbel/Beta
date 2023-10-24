const userName = document.getElementById("name");
const userN = document.getElementById("id");
const CertificateID = document.getElementById("IdC");
const submitBtn = document.getElementById("submitBtn");
const { PDFDocument, rgb } = PDFLib;

const capitalize = (str, lower = false) =>
  (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) =>
    match.toUpperCase()
  );

submitBtn.addEventListener("click", () => {
  const nameVal = capitalize(userName.value);
  const idVal = capitalize(userN.value);

  if (nameVal.trim() !== "" && idVal.trim() !== "" && userName.checkValidity() && userN.checkValidity()) {
    const currentTime = new Date().toLocaleString();
    generatePDF(nameVal, idVal, currentTime);
  } else {
    userName.reportValidity();
    userN.reportValidity();
  }
});

const generatePDF = async (name, id, currentTime) => {
  const fileName = `${name.replace(/\s/g, " ")}.pdf`;
  const existingPdfBytes = await fetch("./Certificado.pdf").then((res) => res.arrayBuffer());

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await fetch("./CenturyGothic.ttf").then((res) => res.arrayBuffer());
  const CenturyGothic = await pdfDoc.embedFont(fontBytes);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  const textSize = 30;
  const pageWidth = firstPage.getWidth();
  const pageHeight = firstPage.getHeight();

  const nameTextWidth = CenturyGothic.widthOfTextAtSize(name, textSize);
  const nameTextHeight = CenturyGothic.widthOfTextAtSize(name, textSize);
  const idTextWidth = CenturyGothic.widthOfTextAtSize(id, textSize);
  const idTextHeight = CenturyGothic.widthOfTextAtSize(id, textSize);

  const IdC = generateUniqueIdC();
  const idCTextWidth = CenturyGothic.widthOfTextAtSize(IdC, textSize);

  const totalTextWidth = Math.max(nameTextWidth, idTextWidth);
  const totalTextHeight = Math.max(nameTextHeight, idTextHeight);
  const centerX = (pageWidth - totalTextWidth) / 2;
  const centerY = (pageHeight - totalTextHeight) / 2;

  firstPage.drawText(name, {
    x: centerX,
    y: 280,
    size: textSize,
  });

  firstPage.drawText(id, {
    x: 330,
    y: 245,
    size: 15,
  });

  firstPage.drawText(IdC, {
    x: 48,
    y: 75,
    size: 10,
    color: rgb(68/255, 124/255, 66/255), 
  });

  firstPage.drawText(currentTime, {
    x: 48, 
    y: 90,
    size: 10,
    color: rgb(68/255, 124/255, 66/255), 
  });

  const qrCodeData = `Certificado de:${name}\nCon número de CC: ${id}\nFecha: ${currentTime}\n${IdC}\n`;
  const qrCode = await generateQR(qrCodeData);

  const qrCodeImage = await pdfDoc.embedPng(qrCode);
  const qrCodeWidth = 80; 
  const qrCodeHeight = 80; 

  firstPage.drawImage(qrCodeImage, {
    x: 48, 
    y: 105, 
    width: qrCodeWidth,
    height: qrCodeHeight,
  });

  const pdfBytes = await pdfDoc.save();

  console.log("Certificado Creado");
  var file = new File([pdfBytes], fileName, {
    type: "application/pdf;charset=utf-8",
  });

  saveAs(file);
};

const generateQR = async (data) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(data)}`;
  const qrCodeResponse = await fetch(qrCodeUrl);
  const qrCodeBlob = await qrCodeResponse.blob();
  return new Uint8Array(await qrCodeBlob.arrayBuffer());
};
const generateUniqueIdC = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const idLength = 20;
  let id = "ID único del certificado: ";
  for (let i = 0; i < idLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    id += characters[randomIndex];
  }
  return id;
};
