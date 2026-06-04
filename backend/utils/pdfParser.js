import fs from "fs/promises";
import {PDFParse} from "pdf-parse";
import {textChunker} from "./textChunker.js";
import Document from "../models/Document.js";

/**
 * Extract text from PDF file
 * @param filePath - Path to PDF file
 * @returns {Promise<{text: *, numPages: *, info: *}>}
 */
const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = await fs.readFile(filePath);

        const parser = new PDFParse(new Uint8Array(dataBuffer));
        const data = await parser.getText();

        return {
            text: data.text,
            numPages: data.numpages,
            info: data.info,
        };
    } catch (error) {
        console.log("PDF parsing error:",error);
        throw new Error("Failed to extract text from PDF");
    }
};

const processPDF = async (documentId, filePath) => {
    try {
        const {text} = await extractTextFromPDF(filePath);

        const chunks = textChunker.chunkText(text, 500,50);

        await Document.findByIdAndUpdate(documentId, {
            extractedText: text,
            chunks: chunks,
            status: 'ready',
        });

        console.log(`Document ${documentId} processed successfully!`);

    } catch (error) {
        console.log(`Error processing document ${documentId}`, error);

        await Document.findByIdAndUpdate(documentId, {
            status: "failed"
        });
    }
}

export const PDFHelpers = {processPDF}